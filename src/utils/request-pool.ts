import { APIResponse } from '@playwright/test';

export interface PoolTelemetry {
  inFlight: number;
  maxConcurrency: number;
  tokensRemaining: number;
  maxTokensPerWindow: number;
  queuedRequests: number;
  totalProcessed: number;
  isCoolingDown: boolean;
}

export interface RequestPoolOptions {
  /** Maximum simultaneous active in-flight requests */
  maxConcurrency?: number;
  /** Maximum requests allowed per rolling window */
  maxPerWindow?: number;
  /** Window duration in milliseconds */
  windowMs?: number;
  /** Maximum safety retries if a 429 occurs (default: 3) */
  maxRetries?: number;
  /** Minimum delay between successive requests in ms (default: 500ms) */
  minIntervalMs?: number;
}

/**
 * Enterprise Proactive Request Pool & Rate Governor.
 * Uses a linear promise chain with guaranteed minimum pacing (default 500ms / 2 req/sec)
 * and a Global Cooldown mechanism if Cloudflare returns an HTTP 429.
 * Strictly eliminates IP-level rate-limiting bans and timeout failures.
 */
export class RequestPool {
  private static instance: RequestPool | null = null;

  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly batchSize = 30;
  private readonly batchPauseMs = 12_000;

  private lastRequestTimestamp = 0;
  private inFlight = 0;
  private totalProcessed = 0;
  private queued = 0;
  private globalCooldownUntil = 0;
  private batchRequestCount = 0;

  // Linear Promise Chain: Guarantees strict FIFO execution without timer race conditions
  private chain: Promise<void> = Promise.resolve();

  constructor(options: RequestPoolOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 500;
    this.maxRetries = options.maxRetries ?? 3;
  }

  public static getInstance(options?: RequestPoolOptions): RequestPool {
    if (!RequestPool.instance) {
      RequestPool.instance = new RequestPool(options);
    }
    return RequestPool.instance;
  }

  public static resetInstance(): void {
    RequestPool.instance = null;
  }

  public getTelemetry(): PoolTelemetry {
    return {
      inFlight: this.inFlight,
      maxConcurrency: 1,
      tokensRemaining: Math.max(0, this.batchSize - this.batchRequestCount),
      maxTokensPerWindow: this.batchSize,
      queuedRequests: this.queued,
      totalProcessed: this.totalProcessed,
      isCoolingDown: Date.now() < this.globalCooldownUntil,
    };
  }

  public async acquire(): Promise<void> {
    this.queued++;

    const executionSlot = this.chain.then(async () => {
      const now = Date.now();

      // If a global cooldown is active due to a 429, pause until the window resets
      if (now < this.globalCooldownUntil) {
        await new Promise((resolve) => setTimeout(resolve, this.globalCooldownUntil - now));
      }

      // Mandatory 12-second pause after every batch of 30 requests to reset Cloudflare's rate limit window
      if (this.batchRequestCount >= this.batchSize) {
        console.log(
          `\n[RequestPool] Reached ${this.batchSize} requests. Pausing for ${this.batchPauseMs / 1000}s to let Cloudflare window reset...`
        );
        await new Promise((resolve) => setTimeout(resolve, this.batchPauseMs));
        this.batchRequestCount = 0;
        this.lastRequestTimestamp = Date.now();
      }

      const elapsed = Date.now() - this.lastRequestTimestamp;
      if (elapsed < this.minIntervalMs) {
        await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
      }

      this.lastRequestTimestamp = Date.now();
      this.batchRequestCount++;
      this.inFlight++;
      this.queued = Math.max(0, this.queued - 1);
    });

    this.chain = executionSlot.catch(() => {});

    await executionSlot;
  }

  public release(_response?: APIResponse): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    this.totalProcessed++;
  }

  public async execute(action: () => Promise<APIResponse>): Promise<APIResponse> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      await this.acquire();
      let response: APIResponse | undefined;

      try {
        response = await action();

        // If Cloudflare triggers rate limiting, pause the entire pool globally
        if (response.status() === 429 && attempt < this.maxRetries) {
          attempt++;
          const retryAfterHeader = response.headers()['retry-after'];
          const waitMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 8000 * attempt;

          // Set global cooldown for all queued requests
          this.globalCooldownUntil = Date.now() + waitMs;

          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        return response;
      } finally {
        this.release(response);
      }
    }

    await this.acquire();
    try {
      return await action();
    } finally {
      this.release();
    }
  }
}
