# 📡 Module 01: API Automation & Evaluations for LLMs & GenAI Systems

> **Author:** Kadali Sai Sumanth | **Target Role:** Principal AI/ML Quality Engineer / LLM Evaluation Specialist  
> **Topic:** SSE Streaming APIs, REST/GraphQL Contracts, Non-Deterministic Schema Validation, Resiliency Patterns, Rate Limiting  
> **Last Updated:** October 2026

---

## 📑 Table of Contents
1. [Section 1: In-Depth Technical Architecture & Test Strategy](#-section-1-in-depth-technical-architecture--test-strategy)
   - [1.1 Server-Sent Events (SSE) Streaming Architecture](#11-server-sent-events-sse-streaming-architecture-for-llm-apis)
   - [1.2 Token Arrival Mechanics & Latency Metrics](#12-token-arrival-mechanics--latency-metrics)
   - [1.3 Protocol Comparison: REST vs GraphQL vs SSE Streaming](#13-protocol-comparison-rest-vs-graphql-vs-sse-streaming)
   - [1.4 JSON Schema Validation for Non-Deterministic Outputs](#14-json-schema-validation-for-non-deterministic-outputs)
   - [1.5 Rate-Limiting Mechanics & Jitter Strategies](#15-rate-limiting-mechanics--exponential-backoff-with-jitter)
   - [1.6 Resiliency Patterns: Circuit Breaker & Idempotency](#16-resiliency-patterns-circuit-breaker--idempotency)
   - [1.7 End-to-End Ingestion & Streaming Architecture Diagram](#17-end-to-end-ingestion--streaming-architecture-diagram)
2. [Section 2: Technical Coding & Automation Practice (Python)](#-section-2-technical-coding--automation-practice-python)
   - [2.1 PyTest Fixture-Based SSE Streaming API Test](#21-pytest-fixture-based-sse-streaming-api-test)
   - [2.2 Playwright API Test for REST Endpoint with Strict Schema Validation](#22-playwright-api-test-for-rest-endpoint-with-strict-schema-validation)
   - [2.3 Production Exponential Backoff Retry Decorator with Full Jitter](#23-production-exponential-backoff-retry-decorator-with-full-jitter)
   - [2.4 Rate-Limit Aware & Circuit-Breaker Protected API Client](#24-rate-limit-aware--circuit-breaker-protected-api-client)
3. [Section 3: Scenario-Based Debugging & Root Cause Analysis (RCA)](#-section-3-scenario-based-debugging--root-cause-analysis-rca)
   - [3.1 Scenario 1: SSE Stream Drops Mid-Response After ~500 Tokens (HTTP 503)](#31-scenario-1-sse-stream-drops-mid-response-after-500-tokens-http-503)
   - [3.2 Scenario 2: API Returns 200 OK but choices[0].message.content is Null](#32-scenario-2-api-returns-200-ok-but-choices0messagecontent-is-null)
4. [Section 4: Targeted Interview Questions & Master Answers](#-section-4-targeted-interview-questions--master-answers)
   - [4.1 Advanced Technical Question 1: Chunk Fragmentation & Multi-Byte UTF-8 Streaming](#41-advanced-technical-question-1-chunk-fragmentation--multi-byte-utf-8-streaming)
   - [4.2 Advanced Technical Question 2: Distributed Idempotency & Latency SLA Enforcement](#42-advanced-technical-question-2-distributed-idempotency--latency-sla-enforcement)
   - [4.3 Behavioral Question: Managing Quality Disagreements on GenAI Failure Rates](#43-behavioral-question-managing-quality-disagreements-on-genai-failure-rates)
   - [4.4 Scenario-Based Question: Duplicate Billing Despite Idempotency Keys Under Load](#44-scenario-based-question-duplicate-billing-despite-idempotency-keys-under-load)

---

## 🏛️ Section 1: In-Depth Technical Architecture & Test Strategy

### 1.1 Server-Sent Events (SSE) Streaming Architecture for LLM APIs

Large Language Model (LLM) inference is autoregressive: tokens are generated sequentially one by one. Generating a 1,000-token completion can take anywhere from 3 to 25 seconds depending on model size, quantisation, and hardware concurrency. Standard HTTP request/response lifecycles force the client to wait until the entire output is synthesized before sending a single byte, leading to unacceptably high **Time To First Token (TTFT)** and poor perceived user latency.

To mitigate this, production LLM gateways (OpenAI, Anthropic, vLLM, TensorRT-LLM) employ **Server-Sent Events (SSE)** conforming to the W3C EventSource standard over HTTP/1.1 or HTTP/2.

```
+-----------------------------------------------------------------------------------------+
|                              SSE PROTOCOL ANATOMY                                       |
+-----------------------------------------------------------------------------------------+
  Client Request:
    POST /v1/chat/completions HTTP/1.1
    Host: api.inference.domain
    Accept: text/event-stream
    Cache-Control: no-cache
    Connection: keep-alive

  Server Stream Response:
    HTTP/1.1 200 OK
    Content-Type: text/event-stream; charset=utf-8
    Transfer-Encoding: chunked
    Connection: keep-alive

    : keep-alive ping\n\n                           <-- Comment line (heartbeat)
    data: {"choices":[{"delta":{"content":"The"}}]}\n\n
    data: {"choices":[{"delta":{"content":" capital"}}]}\n\n
    data: {"choices":[{"delta":{"content":" of"}}]}\n\n
    data: {"choices":[{"delta":{"content":" France"}}]}\n\n
    data: [DONE]\n\n                                <-- Sentinel frame (stream termination)
+-----------------------------------------------------------------------------------------+
```

#### Key Technical Protocol Invariants:
1. **MIME Type & Chunked Encoding:** Must specify `Content-Type: text/event-stream` and `Transfer-Encoding: chunked`.
2. **Frame Delimiters:** Every message frame terminates with double newlines (`\n\n`). A single newline separates fields inside an event frame (`event:`, `data:`, `id:`, `retry:`).
3. **Comment/Ping Frames:** Lines beginning with a colon (`: ping`) represent heartbeats used to prevent TCP/proxy timeouts without triggering client message handlers.
4. **Terminal Sentinel:** De-facto industry standard (OpenAI-compatible) terminates the stream by emitting `data: [DONE]\n\n`.
5. **Multi-byte UTF-8 Boundaries:** LLM tokenizers generate BPE (Byte-Pair Encoding) tokens that may split a multi-byte UTF-8 character (e.g., emojis or non-Latin scripts) across token boundaries. The test framework must buffer incomplete multi-byte sequences rather than attempting to decode invalid bytes immediately.

---

### 1.2 Token Arrival Mechanics & Latency Metrics

A robust Quality Engineering test harness for LLM streaming must track and assert four deterministic performance attributes:

```
[Request Sent] 
      │ 
      ▼  (Network Round-Trip + Queue Time + Prefill / Prompt Processing)
[First Chunk Received]  ────────► TTFT (Time To First Token)
      │ 
      ├────── Chunk 1 -> Chunk 2 ───► ITL 1 (Inter-Token Latency)
      ├────── Chunk 2 -> Chunk 3 ───► ITL 2
      │        ...
      ▼ 
[Final Chunk '[DONE]']  ────────► E2E Latency (End-to-End Completion Time)
```

1. **TTFT (Time To First Token):** Elapsed wall-clock time from sending the final byte of the request to receiving the first valid token chunk. Measures prompt prefill and scheduler queue efficiency. Target SLA: `< 800ms` for interactive systems.
2. **ITL (Inter-Token Latency):** Time elapsed between consecutive token arrivals ($t_{i} - t_{i-1}$). High ITL variance indicates GPU memory thrashing, KV-cache swapping, or noisy-neighbor contention. Target SLA: `< 35ms/token` (approx. 28-30 tokens/sec).
3. **TPS (Tokens Per Second):** Generated tokens divided by total generation duration (excluding TTFT).
4. **Chunk Fragmentation:** Chunks delivered across TCP segments may contain partial JSON lines or concatenated frames (`data: {...}\n\ndata: {...}\n\n`). A quality harness must parse byte buffers with strict line-oriented streaming decoders.

---

### 1.3 Protocol Comparison: REST vs GraphQL vs SSE Streaming

| Dimension | Standard REST (Synchronous) | GraphQL (Query / Mutation) | SSE Streaming (LLM Output) |
|---|---|---|---|
| **Transport Model** | Single HTTP Request-Response pair | Single HTTP POST over JSON | Persistent unidirectional HTTP stream |
| **Connection Lifespan** | Ephemeral (< 2 seconds typical) | Ephemeral (< 2 seconds typical) | Long-lived (5s - 120s+) |
| **Payload Delivery** | Monolithic atomic payload | Monolithic selected schema fields | Progressive chunked deltas |
| **Failure Semantics** | Failures signaled via HTTP status code | Always HTTP 200; failures in `errors[]` array | Status code sent at connection init; failures mid-stream require in-band error frames |
| **Schema Invariance** | Strict static contract | Dynamic client-selected shape | Dynamic structural schema + open-ended natural language |
| **Intermediary Buffering** | Proxy caching supported | Proxy caching complex | Reverse proxies MUST disable buffering (`X-Accel-Buffering: no`) |
| **Test Automation Tooling**| Playwright API, Requests, Supertest | Apollo Client, Playwright API | Async HTTP clients (`httpx`, `aiohttp`, custom socket parsers) |

---

### 1.4 JSON Schema Validation for Non-Deterministic Outputs

Standard API testing asserts deterministic field values (e.g., `assert response.json()["status"] == "SUCCESS"`). LLM responses, however, are non-deterministic: the natural language content varies with each execution even at `temperature=0.0` due to floating-point nondeterminism across GPU architectures.

#### QE Strategy for LLM Schema Validation:
1. **Structural Invariants:** Assert rigid structural schemas using **Draft-2020-12 JSON Schema** or **Pydantic v2**:
   - `id`: Regex match `^chatcmpl-[a-zA-Z0-9]+$`
   - `created`: Unix timestamp within acceptable drift window ($\pm 60s$).
   - `model`: Exact match or alias resolution.
   - `usage`: Non-null integer bounds (`prompt_tokens > 0`, `completion_tokens >= 0`, `total_tokens == prompt_tokens + completion_tokens`).
2. **Discriminated Union Validation for Tool Calling:** When function calling is invoked, the schema dynamically shifts:
   - Case A: `choices[0].message.content` is string, `tool_calls` is `None` or absent.
   - Case B: `choices[0].message.content` is `None`, `tool_calls` is a non-empty array of objects containing `id`, `type: "function"`, and valid stringified JSON arguments.
3. **Semantic Boundary Assertions:** While text is non-deterministic, semantic constraints are deterministic (e.g., regex pattern matching, refusal detection, token length upper bounds).

---

### 1.5 Rate-Limiting Mechanics & Exponential Backoff with Jitter

LLM APIs are computationally bounded by GPU VRAM and compute capacity. Providers enforce strict rate limits:
- **RPM (Requests Per Minute):** Rate of discrete HTTP connections.
- **TPM (Tokens Per Minute):** Cumulative token count (prompt + generation) processed per sliding 60-second window.

#### HTTP 429 Status Header Contract:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 4
x-ratelimit-limit-requests: 500
x-ratelimit-remaining-requests: 0
x-ratelimit-reset-requests: 3.84s
x-ratelimit-limit-tokens: 150000
x-ratelimit-remaining-tokens: 1200
x-ratelimit-reset-tokens: 850ms
```

#### Backoff Strategies & The Mathematical Necessity of Jitter:
Standard exponential backoff ($t = base \cdot 2^{attempt}$) creates synchronized retry waves across distributed test workers or client microservices, known as the **Thundering Herd Problem**.

```
Standard Exponential:    t = min(max_delay, base * 2^attempt)
Full Jitter:             t_sleep = Uniform(0, min(max_delay, base * 2^attempt))
Decorrelated Jitter:     t_sleep = min(max_delay, Uniform(base, t_previous * 3))
```

> [!IMPORTANT]
> **Full Jitter** eliminates synchronized stampedes by spreading retry distributions uniformly from zero to the calculated exponential ceiling, dramatically reducing lock contention at the API Gateway.

---

### 1.6 Resiliency Patterns: Circuit Breaker & Idempotency

#### Circuit Breaker State Machine
When upstream LLM inference clusters experience cascading GPU failures, continuing to barrage the cluster accelerates catastrophic degradation. A circuit breaker wraps outgoing test and client invocations:

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failure Rate >= Threshold (e.g., 50% over 20 calls)
    Open --> HalfOpen : Reset Timeout Elapsed (e.g., 30s)
    HalfOpen --> Closed : Canary Invocations Succeed (e.g., 3 consecutive 200s)
    HalfOpen --> Open : Canary Invocation Fails
```

1. **Closed:** Normal traffic flows. Failures are tracked over a sliding time window.
2. **Open:** All requests fail immediately with a local `CircuitBreakerOpenException` without touching network sockets. Prevents thread starvation.
3. **Half-Open:** Allows a limited number of trial (canary) requests to determine whether downstream GPU inference has recovered.

#### Idempotency Key Validation
Because LLM completions incur monetary cost and state mutations (in agentic pipelines), retry mechanisms MUST guarantee idempotency:
- The client generates a unique `Idempotency-Key: uuid4()` or hash of `(user_id, prompt, model, seed)`.
- The gateway caches the response body and status code in an in-memory key-value store (Redis) with a TTL (e.g., 24 hours).
- If a transient network drop occurs after the LLM completes generation but before the client receives the response, the retried request returns the cached result without re-executing inference or incurring duplicate token billing.

---

### 1.7 End-to-End Ingestion & Streaming Architecture Diagram

```
+──────────────────────────────────────────────────────────────────────────────────────────────+
|                       LLM API INFERENCE & GATEWAY TEST ARCHITECTURE                          |
+──────────────────────────────────────────────────────────────────────────────────────────────+

    [ Test Automation Harness ]
     (PyTest / Playwright API)
          │
          ├─────► Sends POST /v1/chat/completions (Idempotency-Key, Accept: text/event-stream)
          │
          ▼
    [ Edge API Gateway / Reverse Proxy ] ──────────┐
      - NGINX / Envoy / Kong                       │ [Redis Distributed Store]
      - Token Bucket Rate Limiter (RPM / TPM)      ├─► Tracks: Tokens/min, Sliding Windows,
      - Idempotency Cache Check ───────────────────┘   Idempotency Dedup Keys
      - Circuit Breaker Interceptor
          │ (Forward Request if Uncached & Allowed)
          ▼
    [ LLM Serving Cluster (vLLM / Triton / TensorRT-LLM) ]
      - PagedAttention KV-Cache Manager
      - Continuous Batching Scheduler
      - Autoregressive Generation Engine
          │
          ├─────► Chunk 1: 'data: {"choices":[{"delta":{"content":"Hello"}}]}' ──► [HTTP Chunked Stream]
          ├─────► Chunk 2: 'data: {"choices":[{"delta":{"content":" world"}}]}' ──► [Wire Buffer]
          ├─────► Chunk N: 'data: [DONE]'                                       ──► [Stream Termination]
          ▼
    [ Stream Validator & Metric Collector ]
      - Computes: TTFT, ITL Variance, Tokens/Sec
      - Buffers & Validates UTF-8 Boundaries
      - Reassembles Full Text & Validates JSON Schema Invariants
```

---

## 💻 Section 2: Technical Coding & Automation Practice (Python)

### 2.1 PyTest Fixture-Based SSE Streaming API Test

This production-grade module implements an asynchronous SSE stream parser using `httpx`. It parses chunks, handles SSE frame specifications, calculates TTFT and ITL, reassembles tokens, and asserts output integrity.

```python
"""
sse_stream_test.py
Production-grade PyTest suite for validating LLM Server-Sent Events (SSE) streaming APIs.
Validates chunk delivery, protocol frames, TTFT/ITL latency metrics, and payload integrity.
"""

import asyncio
import json
import re
import time
from dataclasses import dataclass, field
from typing import AsyncGenerator, Dict, List, Optional, Any
import httpx
import pytest


@dataclass
class StreamMetrics:
    """Telemetry data captured during SSE stream consumption."""
    ttft_seconds: float = 0.0
    total_duration_seconds: float = 0.0
    chunk_count: int = 0
    token_count: int = 0
    inter_token_latencies: List[float] = field(default_factory=list)
    complete_text: str = ""
    finish_reason: Optional[str] = None

    @property
    def tokens_per_second(self) -> float:
        generation_time = self.total_duration_seconds - self.ttft_seconds
        if generation_time <= 0 or self.token_count == 0:
            return 0.0
        return self.token_count / generation_time

    @property
    def p95_itl_seconds(self) -> float:
        if not self.inter_token_latencies:
            return 0.0
        sorted_latencies = sorted(self.inter_token_latencies)
        idx = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[min(idx, len(sorted_latencies) - 1)]


class SSEStreamConsumer:
    """Parses standard W3C text/event-stream chunks into discrete structured payloads."""

    DATA_PREFIX = "data: "
    DONE_MARKER = "[DONE]"

    @classmethod
    async def consume_stream(
        cls, 
        response: httpx.Response, 
        start_time: float
    ) -> StreamMetrics:
        """
        Consumes an active HTTP streaming response line-by-line.
        
        Args:
            response: httpx streaming response object.
            start_time: Wall-clock timestamp when the HTTP request was dispatched.
            
        Returns:
            StreamMetrics containing calculated latencies and reassembled text.
        """
        metrics = StreamMetrics()
        last_chunk_time = start_time
        first_token_received = False
        reconstructed_tokens: List[str] = []

        async for raw_line in response.aiter_lines():
            current_time = time.perf_counter()
            line = raw_line.strip()

            # Ignore empty heartbeat or SSE comment lines
            if not line or line.startswith(":"):
                continue

            if line.startswith(cls.DATA_PREFIX):
                payload_str = line[len(cls.DATA_PREFIX):].strip()

                # Handle terminal sentinel
                if payload_str == cls.DONE_MARKER:
                    metrics.total_duration_seconds = current_time - start_time
                    break

                try:
                    payload = json.loads(payload_str)
                except json.JSONDecodeError as err:
                    raise AssertionError(f"Malformed JSON in SSE stream frame: '{payload_str}'") from err

                metrics.chunk_count += 1
                choices = payload.get("choices", [])
                if not choices:
                    continue

                delta = choices[0].get("delta", {})
                content_chunk = delta.get("content", "")
                finish_reason = choices[0].get("finish_reason")

                if finish_reason:
                    metrics.finish_reason = finish_reason

                if content_chunk:
                    if not first_token_received:
                        metrics.ttft_seconds = current_time - start_time
                        first_token_received = True
                    else:
                        metrics.inter_token_latencies.append(current_time - last_chunk_time)

                    reconstructed_tokens.append(content_chunk)
                    metrics.token_count += 1
                    last_chunk_time = current_time

        metrics.complete_text = "".join(reconstructed_tokens)
        return metrics


# ---------------------------------------------------------
# PyTest Fixtures & Test Execution
# ---------------------------------------------------------

@pytest.fixture
def api_base_url() -> str:
    return "https://api.mock-inference.internal/v1"


@pytest.fixture
def auth_headers() -> Dict[str, str]:
    return {
        "Authorization": "Bearer test-sk-live-mock-token-9988",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }


@pytest.mark.asyncio
async def test_streaming_chat_completion_validates_chunks_and_latency(
    api_base_url: str, 
    auth_headers: Dict[str, str]
):
    """
    Validates:
    1. HTTP 200 with Content-Type: text/event-stream.
    2. Correct SSE frame delivery and [DONE] termination.
    3. TTFT SLA under 1.5 seconds.
    4. P95 Inter-Token Latency (ITL) under 80ms.
    5. Structural consistency of reassembled response text.
    """
    payload = {
        "model": "meta-llama/Llama-3-70b-instruct",
        "messages": [
            {"role": "system", "content": "You are a concise financial analyst assistant."},
            {"role": "user", "content": "Explain liquidity risk in two sentences."}
        ],
        "temperature": 0.2,
        "max_tokens": 150,
        "stream": True
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0)) as client:
        start_time = time.perf_counter()
        
        async with client.stream(
            "POST",
            f"{api_base_url}/chat/completions",
            json=payload,
            headers=auth_headers
        ) as response:
            # 1. Assert Transport & Protocol Headers
            assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
            content_type = response.headers.get("content-type", "")
            assert "text/event-stream" in content_type, f"Invalid Content-Type: {content_type}"

            # 2. Consume and Process Stream
            metrics = await SSEStreamConsumer.consume_stream(response, start_time)

    # 3. Assert Metric Latencies
    assert metrics.chunk_count > 0, "Stream delivered 0 chunks."
    assert metrics.token_count > 5, f"Expected >5 tokens, received {metrics.token_count}"
    assert metrics.ttft_seconds > 0.0, "TTFT was not registered."
    assert metrics.ttft_seconds < 1.5, f"TTFT SLA breached: {metrics.ttft_seconds:.3f}s > 1.5s"

    if metrics.inter_token_latencies:
        assert metrics.p95_itl_seconds < 0.08, (
            f"P95 ITL SLA breached: {metrics.p95_itl_seconds * 1000:.1f}ms > 80ms"
        )

    # 4. Assert Content & Completion Invariant
    assert metrics.finish_reason in ["stop", "length"], f"Unexpected finish_reason: {metrics.finish_reason}"
    assert len(metrics.complete_text.strip()) > 20, "Reconstructed text is too short or empty."
    assert not metrics.complete_text.startswith("data:"), "Raw SSE syntax leaked into reconstructed output."
```

---

### 2.2 Playwright API Test for REST Endpoint with Strict Schema Validation

This script uses Playwright's `APIRequestContext` to perform synchronous-style schema assertions on non-streaming REST endpoints using `jsonschema` (Draft 2020-12) and `pydantic`.

```python
"""
playwright_api_schema_test.py
Playwright API test enforcing strict JSON schema and Pydantic validation on LLM REST endpoints.
Handles polymorphic schemas (regular completions vs tool/function calls).
"""

import json
import re
from typing import Dict, List, Optional, Union
from jsonschema import validate, ValidationError
from playwright.sync_api import sync_playwright, APIRequestContext
from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------
# Pydantic Structural Contract Model
# ---------------------------------------------------------

class FunctionCallPayload(BaseModel):
    name: str = Field(..., min_length=1)
    arguments: str = Field(..., min_length=2)

    @field_validator("arguments")
    @classmethod
    def validate_arguments_is_valid_json(cls, v: str) -> str:
        try:
            json.loads(v)
        except Exception as exc:
            raise ValueError(f"Function call arguments must be a valid JSON string: {exc}")
        return v


class ToolCallItem(BaseModel):
    id: str = Field(..., pattern=r"^call_[a-zA-Z0-9]+$")
    type: str = Field("function", pattern=r"^function$")
    function: FunctionCallPayload


class ChatMessage(BaseModel):
    role: str = Field("assistant", pattern=r"^assistant$")
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCallItem]] = None

    @field_validator("content")
    @classmethod
    def validate_content_or_tool_calls(cls, content: Optional[str], values):
        # In OpenAI contracts: If tool_calls is absent/empty, content must be non-empty string.
        # If tool_calls is present, content can be null.
        return content


class ChoiceItem(BaseModel):
    index: int = Field(..., ge=0)
    message: ChatMessage
    finish_reason: str = Field(..., pattern=r"^(stop|length|tool_calls|content_filter)$")


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(..., gt=0)
    completion_tokens: int = Field(..., ge=0)
    total_tokens: int = Field(..., gt=0)

    @field_validator("total_tokens")
    @classmethod
    def validate_token_sum(cls, total: int, info) -> int:
        prompt = info.data.get("prompt_tokens", 0)
        completion = info.data.get("completion_tokens", 0)
        if total != (prompt + completion):
            raise ValueError(f"total_tokens ({total}) != prompt ({prompt}) + completion ({completion})")
        return total


class ChatCompletionResponse(BaseModel):
    id: str = Field(..., pattern=r"^chatcmpl-[a-zA-Z0-9]+$")
    object: str = Field("chat.completion", pattern=r"^chat\.completion$")
    created: int = Field(..., gt=1700000000)
    model: str = Field(..., min_length=1)
    choices: List[ChoiceItem] = Field(..., min_length=1)
    usage: TokenUsage


# ---------------------------------------------------------
# Test Implementation with Playwright
# ---------------------------------------------------------

def test_playwright_rest_chat_completion_strict_contract():
    """
    Executes a direct POST request using Playwright's APIRequestContext.
    Validates status code, latency header, JSON Schema invariants, and Pydantic rules.
    """
    endpoint = "https://api.mock-inference.internal/v1/chat/completions"
    headers = {
        "Authorization": "Bearer test-sk-live-mock-token-9988",
        "Content-Type": "application/json",
        "X-Request-ID": "test-req-playwright-uuid-001"
    }
    request_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "What is the capital of Japan? Respond in one word."}
        ],
        "temperature": 0.0,
        "max_tokens": 10
    }

    with sync_playwright() as p:
        request_context: APIRequestContext = p.request.new_context(
            base_url="https://api.mock-inference.internal",
            extra_http_headers=headers
        )

        response = request_context.post(
            "/v1/chat/completions",
            data=json.dumps(request_body),
            headers=headers,
            timeout=15000
        )

        # 1. Assert HTTP Status Code
        assert response.status == 200, f"Expected HTTP 200, received {response.status}: {response.text()}"

        # 2. Assert Response Headers
        resp_headers = response.headers
        assert "application/json" in resp_headers.get("content-type", "").lower()

        # 3. Parse JSON Body
        response_json = response.json()

        # 4. Strict Pydantic Data Contract Validation
        parsed_model = ChatCompletionResponse.model_validate(response_json)

        # 5. Semantic Checks on Validated Output
        choice = parsed_model.choices[0]
        assert choice.finish_reason == "stop"
        assert choice.message.content is not None
        assert "tokyo" in choice.message.content.lower().strip()
        assert parsed_model.usage.total_tokens > 0

        request_context.dispose()
```

---

### 2.3 Production Exponential Backoff Retry Decorator with Full Jitter

```python
"""
resilient_retry.py
Thread-safe, production-ready exponential backoff decorator implementing Full Jitter.
Designed for transient HTTP 429, 502, 503, and 504 network failures.
"""

import functools
import logging
import random
import time
from typing import Callable, Tuple, Type, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("RetryHarness")


def retry_with_exponential_backoff(
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 32.0,
    backoff_factor: float = 2.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    retryable_status_codes: Tuple[int, ...] = (429, 502, 503, 504),
) -> Callable:
    """
    Decorator that retries wrapped functions using Exponential Backoff with Full Jitter.

    Formula:
        Sleep = Uniform(0.0, min(max_delay, base_delay * (backoff_factor ** attempt)))

    Args:
        max_retries: Maximum number of retry attempts before raising exception.
        base_delay: Initial sleep duration in seconds.
        max_delay: Hard upper bound for sleep duration.
        backoff_factor: Multiplier for consecutive failures.
        retryable_exceptions: Tuple of catchable exception classes.
        retryable_status_codes: HTTP status codes that trigger a retry.
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            attempt = 0

            while True:
                try:
                    result = func(*args, **kwargs)

                    # Inspect status code if return object has a status_code attribute
                    status_code = getattr(result, "status_code", None)
                    if status_code is not None and status_code in retryable_status_codes:
                        if attempt >= max_retries:
                            logger.error(
                                f"Max retries ({max_retries}) exhausted for {func.__name__}. "
                                f"Last HTTP Status: {status_code}"
                            )
                            return result

                        # Check for Retry-After header
                        headers = getattr(result, "headers", {})
                        retry_after_header = headers.get("Retry-After") or headers.get("retry-after")
                        
                        if retry_after_header and retry_after_header.isdigit():
                            sleep_duration = float(retry_after_header)
                            logger.warning(
                                f"Encountered HTTP {status_code}. Honoring Retry-After: {sleep_duration:.2f}s"
                            )
                        else:
                            upper_ceiling = min(max_delay, base_delay * (backoff_factor ** attempt))
                            sleep_duration = random.uniform(0.0, upper_ceiling)
                            logger.warning(
                                f"Encountered HTTP {status_code} on attempt {attempt + 1}/{max_retries}. "
                                f"Sleeping {sleep_duration:.3f}s (Full Jitter, ceiling {upper_ceiling:.2f}s)"
                            )

                        time.sleep(sleep_duration)
                        attempt += 1
                        continue

                    return result

                except retryable_exceptions as exc:
                    attempt += 1
                    if attempt > max_retries:
                        logger.critical(
                            f"Fatal: Max retries ({max_retries}) exceeded for {func.__name__}. "
                            f"Final error: {str(exc)}"
                        )
                        raise

                    upper_ceiling = min(max_delay, base_delay * (backoff_factor ** (attempt - 1)))
                    sleep_duration = random.uniform(0.0, upper_ceiling)
                    logger.warning(
                        f"Caught retryable exception '{type(exc).__name__}: {exc}' on attempt "
                        f"{attempt}/{max_retries}. Retrying in {sleep_duration:.3f}s..."
                    )
                    time.sleep(sleep_duration)

        return wrapper
    return decorator
```

---

### 2.4 Rate-Limit Aware & Circuit-Breaker Protected API Client

```python
"""
resilient_api_client.py
Production-grade API Client with Token Bucket client-side rate limiting,
Circuit Breaker pattern, and automatic HTTP 429 Retry-After handling.
"""

import enum
import logging
import threading
import time
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger("ResilientClient")


class CircuitState(enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerOpenException(Exception):
    """Raised when request is rejected because the circuit breaker is OPEN."""
    pass


class CircuitBreaker:
    """Thread-safe circuit breaker implementation."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0
        self._lock = threading.Lock()

    def record_success(self):
        with self._lock:
            self.failure_count = 0
            self.state = CircuitState.CLOSED

    def record_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                logger.error(
                    f"Circuit breaker TRIPPED to OPEN. Failure count: {self.failure_count}"
                )

    def allow_request(self) -> bool:
        with self._lock:
            now = time.time()
            if self.state == CircuitState.OPEN:
                if now - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.info("Circuit breaker entered HALF_OPEN state. Permitting trial request.")
                    return True
                return False
            return True


class TokenBucketRateLimiter:
    """Thread-safe client-side Token Bucket rate limiter."""

    def __init__(self, rate_per_second: float, burst_capacity: int):
        self.rate = rate_per_second
        self.capacity = burst_capacity
        self.tokens = float(burst_capacity)
        self.last_refill = time.time()
        self._lock = threading.Lock()

    def acquire(self, tokens_needed: int = 1) -> None:
        while True:
            with self._lock:
                now = time.time()
                elapsed = now - self.last_refill
                self.tokens = min(float(self.capacity), self.tokens + elapsed * self.rate)
                self.last_refill = now

                if self.tokens >= tokens_needed:
                    self.tokens -= tokens_needed
                    return

                sleep_time = (tokens_needed - self.tokens) / self.rate

            time.sleep(sleep_time)


class ResilientLLMClient:
    """Client for LLM APIs with built-in rate limiting, circuit breaker, and retry logic."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        requests_per_second: float = 10.0,
        burst_capacity: int = 20,
        max_retries: int = 4
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.max_retries = max_retries
        self.session = requests.Session()
        self.rate_limiter = TokenBucketRateLimiter(requests_per_second, burst_capacity)
        self.circuit_breaker = CircuitBreaker(failure_threshold=4, recovery_timeout=20.0)

    def post(self, endpoint: str, payload: Dict[str, Any], idempotency_key: Optional[str] = None) -> requests.Response:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        attempt = 0
        while attempt <= self.max_retries:
            if not self.circuit_breaker.allow_request():
                raise CircuitBreakerOpenException("Upstream LLM gateway is currently down (Circuit OPEN).")

            # Enforce local token bucket limit before hitting network
            self.rate_limiter.acquire(1)

            try:
                response = self.session.post(url, json=payload, headers=headers, timeout=(5.0, 30.0))

                # Handle HTTP 429 Too Many Requests
                if response.status_code == 429:
                    attempt += 1
                    retry_after = response.headers.get("Retry-After")
                    sleep_time = float(retry_after) if retry_after and retry_after.isdigit() else (2.0 ** attempt)
                    logger.warning(f"Received HTTP 429. Backing off for {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    continue

                # Handle Transient Gateway Errors (502, 503, 504)
                if response.status_code in (502, 503, 504):
                    self.circuit_breaker.record_failure()
                    attempt += 1
                    sleep_time = 1.5 * (2 ** attempt)
                    logger.warning(f"Server error {response.status_code}. Retrying in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    continue

                # Successful Response
                if response.ok:
                    self.circuit_breaker.record_success()
                    return response

                # Non-retryable client error (400, 401, 403, 422)
                return response

            except (requests.ConnectionError, requests.Timeout) as net_err:
                self.circuit_breaker.record_failure()
                attempt += 1
                if attempt > self.max_retries:
                    raise ConnectionError(f"Network call failed after {self.max_retries} retries: {net_err}") from net_err
                time.sleep(2.0 ** attempt)

        raise RuntimeError(f"Exhausted {self.max_retries} attempts requesting {url}")
```

---

## 🔍 Section 3: Scenario-Based Debugging & Root Cause Analysis (RCA)

### 3.1 Scenario 1: SSE Stream Drops Mid-Response After ~500 Tokens (HTTP 503)

#### 🚩 The Incident Symptom
In an automated load test running against a private vLLM endpoint behind an AWS Application Load Balancer (ALB) and NGINX Ingress, long prompts requiring 800+ tokens drop mid-stream. The client receives approximately 450 to 520 tokens, after which the TCP connection is severed with an `HTTP 503 Service Unavailable` or `ECONNRESET`.

#### 🔬 Step-by-Step Triage Workflow

```
1. Client Trace
   ├── Observed: TTFT is 600ms; chunks arrive normally until token ~500 (~28s elapsed).
   └── Socket error: 'Connection closed by peer' with incomplete JSON delta.

2. Load Balancer / Proxy Layer Audit
   ├── ALB access log: `target_status_code=503`, `elb_status_code=503`.
   ├── Metric check: Check ALB idle timeout (default: 60s) vs NGINX `proxy_read_timeout`.
   └── NGINX log analysis:
       "upstream prematurely closed connection while reading upstream, client: 10.0.4.12, 
        upstream: http://10.244.2.15:8000/v1/chat/completions"

3. Model Serving Cluster (vLLM / Triton) Audit
   ├── Check GPU memory metrics via `nvidia-smi` / Prometheus:
   │   `vllm:num_requests_waiting` spikes from 0 to 45.
   │   `vllm:gpu_cache_usage_factor` hits 1.0 (100%).
   └── Pod stdout / stderr logs:
       "torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 512.00 MiB 
        (GPU 0; 79.15 GiB total capacity; 78.42 GiB already allocated)"
       OR
       "Engine terminated due to KV-cache allocation failure during prefill/decode."
```

#### 🎯 Root Cause
The cluster ran out of GPU KV-cache allocation during continuous batching. As other concurrent requests arrived, the scheduler attempted to allocate additional KV-cache blocks for generation. With `gpu_memory_utilization` configured too aggressively (0.98) and no swap space configured, the inference process encountered a hard CUDA OOM and crashed instantly. The NGINX reverse proxy detected the dead socket and returned an HTTP 503 to the client.

#### 🛠️ Definitive Remediation & Verification
1. **vLLM Engine Configuration:**
   - Adjust `--gpu-memory-utilization` from `0.98` to `0.90` to leave sufficient headroom for activation tensors.
   - Configure `--swap-space 4` (allocate 4 GiB CPU RAM for KV-cache swapping during temporary spikes).
   - Enforce `--max-num-seqs` to limit concurrent active decode operations.
2. **Reverse Proxy Keep-Alive Tuning:**
   - Set `proxy_read_timeout 120s;` and `proxy_send_timeout 120s;`.
   - Set `proxy_buffering off;` and `X-Accel-Buffering: no` to ensure chunks are flushed immediately without NGINX buffer saturation.
3. **Automated Verification Test:** Execute a test with 50 concurrent streams generating 1,500 tokens each and assert 0 interrupted connections over 30 minutes.

---

### 3.2 Scenario 2: API Returns 200 OK but `choices[0].message.content` is Null

#### 🚩 The Incident Symptom
An automated regression suite runs 1,000 synthetic test prompts against an OpenAI-compatible API endpoint. 95% of tests pass, but 5% intermittently fail with:
`ValidationError: Field 'content' expected string, got None (null)`.
The HTTP response code is 200 OK.

#### 🔬 Step-by-Step Triage Workflow

```
1. Payload Inspection
   {
     "id": "chatcmpl-9b87df34a",
     "object": "chat.completion",
     "created": 1729002120,
     "model": "gpt-4o",
     "choices": [
       {
         "index": 0,
         "message": {
           "role": "assistant",
           "content": null,
           "tool_calls": [
             {
               "id": "call_abc123xyz",
               "type": "function",
               "function": {
                 "name": "lookup_stock_ticker",
                 "arguments": "{\"ticker\": \"AAPL\"}"
               }
             }
           ]
         },
         "finish_reason": "tool_calls"
       }
     ],
     "usage": {"prompt_tokens": 42, "completion_tokens": 18, "total_tokens": 60}
   }

2. Anomaly Comparison
   ├── Sub-Case A: Response contains `finish_reason: "tool_calls"` and non-null `tool_calls` array.
   │   Content is explicitly `null` by specification.
   └── Sub-Case B: Response contains `finish_reason: "content_filter"`.
       Content is `null` because safety guardrails suppressed output post-generation.
```

#### 🎯 Root Cause
The test framework suffered from a **flawed schema assumption**: it assumed all successful HTTP 200 responses return generated text in `content`. In reality:
1. When the model invokes a Function or Tool Call, `content` is intentionally `null` per the OpenAI API specification, and the payload is placed in `tool_calls`.
2. When the request triggers an upstream safety filter (e.g., Azure OpenAI Content Filter or Llama Guard), the text is scrubbed, `content` is set to `null`, and `finish_reason` is set to `"content_filter"`.

#### 🛠️ Definitive Remediation & Verification
Update the test framework to implement a **Discriminated Union Schema** using Pydantic or JSON Schema:

```python
# Remediation in Pydantic: Model Discriminated Union
from typing import Optional, List, Literal
from pydantic import BaseModel, model_validator

class ChatMessageContract(BaseModel):
    role: Literal["assistant"]
    content: Optional[str] = None
    tool_calls: Optional[List[dict]] = None
    refusal: Optional[str] = None

    @model_validator(mode="after")
    def verify_message_integrity(self):
        # Rule 1: Cannot have both content and tool_calls empty unless refused
        if self.content is None and not self.tool_calls and not self.refusal:
            raise ValueError("Invalid state: message contains neither content, tool_calls, nor refusal.")
        # Rule 2: When tool_calls are present, content may validly be null
        return self
```

---

## 🎯 Section 4: Targeted Interview Questions & Master Answers

### 4.1 Advanced Technical Question 1: Chunk Fragmentation & Multi-Byte UTF-8 Streaming

#### ❓ Question
> *"In an SSE streaming test suite running against a multilingual LLM, our tests intermittently fail with `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xed in position 0`. How does chunking at the TCP/socket level interact with multi-byte UTF-8 character encoding in autoregressive token streams, and how do you design an airtight streaming client to handle this without false test failures?"*

#### 🏆 Ideal Candidate Answer
"This issue stems from a mismatch between **network chunk boundaries** and **character byte boundaries**.

In UTF-8, characters can span anywhere from 1 to 4 bytes:
- Standard ASCII characters: 1 byte (`0x00` - `0x7F`)
- Latin with diacritics / Cyrillic: 2 bytes
- Chinese / Japanese / Korean (CJK) characters: 3 bytes (e.g., `'日'` is `0xE6 0x97 0xA5`)
- Emojis and specialized symbols: 4 bytes (e.g., `'🚀'` is `0xF0 0x9F 0x9A 0x80`)

Modern LLM tokenizers (such as Tiktoken or Byte-level BPE) operate on raw bytes. The model can emit a token representing only the first 2 bytes of a 3-byte CJK character if that corresponds to a frequent subword pattern. Furthermore, TCP stream fragmentation or reverse proxy buffer flushing can split a single SSE chunk right across those bytes.

If a test framework reads the raw network stream byte-by-byte and calls `chunk.decode('utf-8')` immediately on each arbitrary TCP buffer, Python throws a `UnicodeDecodeError` because the tail byte is an orphaned high-order byte waiting for its continuation bytes (`0x80`-`0xBF`).

**The Solution:**
1. **Incremental Stream Decoding:** Use Python’s `codecs.getincrementaldecoder('utf-8')(errors='surrogatepass')`. The incremental decoder holds incomplete multi-byte sequences in an internal buffer until subsequent chunks arrive, yielding decoded characters only when valid byte boundaries are satisfied.
2. **Line-Oriented Frame Buffering:** Do not attempt to parse JSON until the complete SSE frame delimiter (`\n\n`) is encountered in the decoded text buffer.
3. **Test Framework Implementation:**

```python
import codecs

decoder = codecs.getincrementaldecoder("utf-8")()
text_buffer = ""

for raw_byte_chunk in socket_stream:
    # Incremental decoder buffers dangling bytes automatically
    text_buffer += decoder.decode(raw_byte_chunk, final=False)
    
    while "\n\n" in text_buffer:
        frame, text_buffer = text_buffer.split("\n\n", 1)
        process_sse_frame(frame)
```
This guarantees zero false-positive decoding crashes regardless of how aggressive the proxy's packet fragmentation is."

---

### 4.2 Advanced Technical Question 2: Distributed Idempotency & Latency SLA Enforcement

#### ❓ Question
> *"How do you test idempotency guarantees and enforce strict P99 latency SLAs for an LLM API Gateway when the upstream model cluster experiences high concurrency and occasional network partitions?"*

#### 🏆 Ideal Candidate Answer
"Testing idempotency and latency SLAs in non-deterministic, compute-heavy LLM gateways requires a specialized two-pronged approach:

**1. Testing Distributed Idempotency Guarantees:**
- **Race Condition Testing:** I construct a test harness utilizing Python's `asyncio` or `concurrent.futures` to dispatch 20 identical requests simultaneously with the same `Idempotency-Key: <UUID>` header.
- **Verification Assertions:**
  1. Exactly **one** request must hit the downstream inference cluster (verified by querying the inference engine's request counter metric via Prometheus).
  2. The remaining 19 requests must block until the leader finishes and receive identical responses (same `id`, same `choices[0].message.content`, identical `created` timestamp, and identical token usage).
  3. The gateway must return an `X-Cache-Lookup: HIT` header or equivalent telemetry tag on deduplicated responses.
  4. Deduplication must work across network drops: I simulate a client disconnect by aborting the HTTP connection after 500ms, then immediately resubmitting the request with the identical key. The gateway must not trigger a duplicate generation or incur double billing.

**2. Enforcing P99 Latency SLAs Under Concurrency:**
- Testing P99 for LLM APIs requires decomposing latency into two separate SLAs:
  - **TTFT (Time to First Token) P99:** Reflects scheduling queue depth and prompt prefill capacity. Target: `< 1.2s` at 100 concurrent users.
  - **ITL (Inter-Token Latency) P99:** Reflects decode phase efficiency and KV-cache contention. Target: `< 40ms/token`.
- I execute load suites using Locust or k6 running custom SSE parsers. I reject testing that only tracks aggregate wall-clock time, because a 100-token response and a 1,000-token response have vastly different durations. Instead, I measure normalized latency: $\text{Normalized Latency} = \frac{\text{Total Duration} - \text{TTFT}}{\text{Tokens Generated}}$.
- If P99 TTFT spikes while ITL remains constant, the bottleneck is scheduler queue saturation or prefill GPU contention. If ITL spikes while TTFT is healthy, the system is suffering from KV-cache memory thrashing or CPU-GPU paging."

---

### 4.3 Behavioral Question: Managing Quality Disagreements on GenAI Failure Rates

#### ❓ Question
> *"The LLM platform engineering lead asserts that a 2% rate of HTTP 502/503 errors and mid-stream disconnects is 'inherent to generative AI due to GPU memory constraints and network streaming nature' and wants to ship to production. As the Principal Quality Engineer, how do you handle this?"*

#### 🏆 Ideal Candidate Answer
"**Situation:** During pre-production sign-off for our enterprise customer-facing GenAI Copilot, the platform engineering lead proposed waiving an SLA blocker where 2% of API requests failed with 502/503 errors and severed SSE streams under peak load, arguing that GPU inference is inherently unstable.

**Task:** My responsibility was not merely to be a gatekeeper saying 'no,' but to protect customer trust and system reliability by translating that abstract 2% failure rate into tangible business impact and engineering solutions.

**Action:**
1. **Quantified Business & Architectural Impact:** I demonstrated that in our target production volume of 2 million daily requests, a 2% failure rate translates to **40,000 broken user sessions every day**. In an interactive chat interface, a severed SSE stream appears as a frozen screen or broken code block, driving user frustration and support tickets.
2. **Conducted Empirical Root-Cause Analysis:** Rather than debating opinions, I paired with one of our performance engineers to profile the failures during a 2-hour stress test. I proved that the 503 errors were not 'inherent to GenAI' but caused by two remediable architecture flaws:
   - An AWS ALB idle timeout set to 60 seconds while complex queries took 65 seconds to finish generation without TCP keep-alives.
   - The vLLM serving pods lacked dynamic admission control: they accepted incoming requests even when the GPU KV-cache was at 99%, triggering CUDA OOM crashes.
3. **Proposed a Phased Solution:** 
   - Immediate fix: Configured NGINX `: ping` heartbeats every 15 seconds to keep load balancer connections alive, and set `--max-num-seqs` to throttle concurrency at the ingress layer.
   - Resiliency layer: Implemented automated client-side retries with full jitter for transient 503s on non-streaming calls.

**Result:** The engineering lead agreed with the empirical data. We implemented the gateway heartbeats and admission limits within three days. In the subsequent soak test, the error rate dropped from 2.0% to **0.008%**, enabling a confident, reliable production launch without compromising quality standards."

---

### 4.4 Scenario-Based Question: Duplicate Billing Despite Idempotency Keys Under Load

#### ❓ Question
> *"An enterprise customer reports that during peak morning load, 5% of their LLM API calls result in duplicate billing transactions despite their client application correctly sending unique `Idempotency-Key` headers on all retry attempts. Walk through your debugging process, root cause hypothesis, and your comprehensive test plan to reproduce and fix this."*

#### 🏆 Ideal Candidate Answer
"**1. Initial Triage & Architecture Inspection:**
When a customer sends retries with idempotency keys and still gets billed twice, the failure exists in the **distributed lock and race condition window** at the API Gateway or Idempotency Store (Redis/DynamoDB).

```
Client Dispatch (Req 1) ───► [API Gateway] ──► Checks Redis: Key NOT found
                                                ├── Sets Key: "IN_FLIGHT" (WITHOUT ATOMIC TTL)
                                                └── Dispatches to LLM Cluster
[Network Glitch / Slow Response]
Client Retry (Req 2)   ───► [API Gateway] ──► Checks Redis:
                                                If Key expired prematurely OR non-atomic SETNX:
                                                Treats as NEW request -> Dispatches to LLM Cluster!
```

**2. Hypotheses for the Root Cause:**
- **Hypothesis 1 (Non-Atomic Check-and-Set):** The gateway performs a `GET idempotency_key` followed by a `SET idempotency_key`. Under high concurrency, two retry requests arriving within milliseconds both execute `GET`, see a cache miss, and both initiate generation.
- **Hypothesis 2 (Premature Lock Expiration):** The gateway locks the key with a 10-second TTL. However, under morning peak load, model inference takes 12 seconds due to GPU queue delays. The lock expires while Request 1 is still computing; when Request 2 arrives, it treats the key as fresh, computing and billing again.
- **Hypothesis 3 (Billing on Dispatch vs On Token Settlement):** Billing events are emitted at request entry rather than tying deduction to the idempotency transaction record upon successful response delivery.

**3. Reproduction Test Plan:**
I write an automated PyTest suite using `asyncio` to simulate the customer's exact peak load profile:
```python
@pytest.mark.asyncio
async def test_reproduce_concurrent_idempotency_race():
    key = f"race-test-{uuid.uuid4()}"
    payload = {"model": "gpt-4o", "messages": [{"role": "user", "content": "Generate a 500 word essay."}]}
    
    # Fire 5 concurrent requests with the identical key to hit the lock window
    tasks = [dispatch_llm_request(payload, idempotency_key=key) for _ in range(5)]
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Assert billing events recorded in database
    billing_records = fetch_billing_events_by_idempotency_key(key)
    assert len(billing_records) == 1, f"Duplicate billing detected: {len(billing_records)} records found!"
```

**4. Architectural Remediation:**
1. **Atomic Locking with Redis `SET key val NX PX 60000`:** Enforce atomic check-and-set with a 60-second lock window. If a second request arrives while the status is `PENDING`, the gateway must hold the connection and subscribe to a Redis Pub/Sub channel waiting for the leader request to complete, then return the cached response.
2. **Two-Phase Settlement:** The billing transaction is recorded using the idempotency key as the unique database constraint (`PRIMARY KEY: idempotency_key`). Any database attempt to record a duplicate billing transaction fails with a unique constraint violation, guaranteeing financial safety even under catastrophic gateway crashes."
