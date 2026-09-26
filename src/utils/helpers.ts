/**
 * Format a number as USD currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Parse a currency string like "$1,234.56" into a number.
 */
export function parseCurrency(currencyString: string): number {
  return Number(currencyString.replace(/[^0-9.-]+/g, ''));
}

/**
 * Wait for a condition to become true, polling at interval.
 */
export async function waitForCondition(
  conditionFn: () => Promise<boolean> | boolean,
  timeout: number = 5000,
  interval: number = 500,
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

/**
 * Retry an async action up to N times.
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  retries: number = 3,
  interval: number = 1000,
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await action();
    } catch (error) {
      attempt++;
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  throw new Error('Action failed after maximum retries');
}

/**
 * Get current ISO timestamp.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate a unique random ID string.
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15);
}

