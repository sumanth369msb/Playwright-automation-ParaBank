# 🎯 Comprehensive API Testing & Automation Interview Master Guide

> **Target Roles:** SDET-1 / SDET-2 / SDET-3 / Lead QA Automation Engineer  
> **Technologies:** REST, GraphQL, gRPC, Playwright (TypeScript), REST Assured (Java), Postman/Newman, Pact, WireMock, CI/CD  
> **Coverage:** Conceptual Fundamentals, Security & Auth, Test Design, Framework Architecture, Async/Microservices, Live Scenarios & Debugging.

---

## 📑 Table of Contents

1. [Section 1: HTTP Protocols & REST Architectural Fundamentals](#section-1-http-protocols--rest-architectural-fundamentals)
2. [Section 2: HTTP Status Codes & Header Deep Dive](#section-2-http-status-codes--header-deep-dive)
3. [Section 3: Authentication, Authorization & Security Testing](#section-3-authentication-authorization--security-testing)
4. [Section 4: API Test Strategy, Design Patterns & Edge Cases](#section-4-api-test-strategy-design-patterns--edge-cases)
5. [Section 5: API Automation Framework Design (Playwright & REST Assured)](#section-5-api-automation-framework-design-playwright--rest-assured)
6. [Section 6: Contract Testing, Mocking & Microservices](#section-6-contract-testing-mocking--microservices)
7. [Section 7: Asynchronous APIs, Webhooks, SSE & Event-Driven Systems](#section-7-asynchronous-apis-webhooks-sse--event-driven-systems)
8. [Section 8: GraphQL vs. REST vs. gRPC](#section-8-graphql-vs-rest-vs-grpc)
9. [Section 9: Real-World Scenarios, Root Cause Analysis (RCA) & Debugging](#section-9-real-world-scenarios-root-cause-analysis-rca--debugging)
10. [Section 10: Live Coding & Implementation Challenges](#section-10-live-coding--implementation-challenges)

---

## Section 1: HTTP Protocols & REST Architectural Fundamentals

### Q1: What makes an API "RESTful"? Explain the core REST constraints.
* **What Interviewers Are Looking For:** Not just quoting the acronym, but articulating Roy Fielding's architectural constraints that govern scalable distributed hypermedia systems.
* **Answer:** An API is RESTful if it adheres to the 6 core architectural constraints:
  1. **Client-Server Architecture:** Separation of user interface concerns from data storage concerns.
  2. **Statelessness:** Every request from client to server must contain all necessary context (credentials, parameters); server stores no client session context between requests.
  3. **Cacheability:** Responses must explicitly declare themselves cacheable or non-cacheable (`Cache-Control`, `ETag`) to prevent clients from reusing stale data.
  4. **Uniform Interface:** The fundamental differentiator:
     - *Resource Identification in Requests* (URIs).
     - *Resource Manipulation through Representations* (JSON/XML).
     - *Self-descriptive Messages* (MIME types, HTTP headers).
     - *HATEOAS (Hypermedia As The Engine Of Application State)*: Responses contain navigational links to next actions.
  5. **Layered System:** The client cannot tell whether it is connected directly to the end server or to an intermediary (API Gateway, reverse proxy, CDN).
  6. **Code on Demand (Optional):** Servers can temporarily extend client functionality by transferring executable code (e.g., JavaScript).
* **Pro Tip:** Mention the **Richardson Maturity Model (Levels 0–3)**. Most production APIs are at Level 2 (HTTP Verbs + URIs); true Level 3 includes HATEOAS.

---

### Q2: What is the difference between Idempotent and Safe HTTP methods?
* **What Interviewers Are Looking For:** Precise protocol semantics; vital for distributed retries and network failure recovery.
* **Answer:**
  * **Safe Methods:** Methods that do not alter the server's resource state (read-only).
    - `GET`, `HEAD`, `OPTIONS`, `TRACE`.
    - *Note:* All safe methods are inherently idempotent, but not all idempotent methods are safe.
  * **Idempotent Methods:** An operation where making multiple identical requests produces the exact same side-effect on the server as making a single request.
    - `GET`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`.
    - *Example:* `DELETE /api/v1/orders/101` returns `200` or `204` on the first call, and `404` or `204` on subsequent calls. The server state remains identical (order 101 does not exist).
  * **Non-Idempotent Methods:**
    - `POST`: Calling `POST /api/v1/orders` 5 times creates 5 distinct order records.
    - `PATCH`: Can be either. Replacing a field (`{"status": "ACTIVE"}`) is idempotent; an increment operation (`{"points": "+5"}`) is **non-idempotent**.
* **Interview Trap:** "If `DELETE` returns 200 the first time and 404 the second time, is it still idempotent?"  
  *Answer:* **Yes.** Idempotency applies to **server resource state**, not the HTTP status code returned to the client.

---

### Q3: Explain `PUT` vs `PATCH` vs `POST` with real-world examples.
* **What Interviewers Are Looking For:** Resource replacement vs. delta updates vs. resource creation.
* **Answer:**
  | Method | Semantic Action | Payload Requirement | Idempotent? |
  |---|---|---|---|
  | `POST` | Create a subordinate resource or trigger an unclassified processing action | Resource data or command | ❌ No |
  | `PUT` | Complete replacement of the resource at the target URI (or creation if client chooses URI) | Complete resource representation (all fields) | ✅ Yes |
  | `PATCH` | Partial modification / delta applied to existing resource | Only fields being updated (or JSON Patch operations RFC 6902) | ⚠️ Depends |
* **Example:**
  ```json
  // Initial user resource at /api/users/42:
  { "id": 42, "name": "John", "email": "john@corp.com", "role": "USER" }

  // PUT /api/users/42 with: { "name": "Johnny" }
  // Result: Replaces entire resource! "email" and "role" are wiped/nullified if omitted.

  // PATCH /api/users/42 with: { "name": "Johnny" }
  // Result: Updates only "name", preserving "email" and "role".
  ```

---

### Q4: What is Content Negotiation, and how is it tested?
* **What Interviewers Are Looking For:** Understanding `Accept` vs `Content-Type` headers and error handling (`406 Not Acceptable`, `415 Unsupported Media Type`).
* **Answer:**
  Content Negotiation allows a client and server to agree upon the best representation of a resource:
  - `Accept`: Client informs server what MIME types it can parse (e.g., `Accept: application/json, application/xml;q=0.9`).
  - `Content-Type`: Specifies the media type of the request body being sent or the response body returned.
* **Automation Scenarios:**
  1. **Success Path:** Send `Accept: application/json` -> Assert `Content-Type` is `application/json`.
  2. **Alternative Format:** Send `Accept: application/xml` -> Assert `Content-Type` is `application/xml` (e.g., ParaBank).
  3. **Unsupported Accept:** Send `Accept: application/x-custom-unknown` -> Expect `406 Not Acceptable`.
  4. **Unsupported Body Type:** Send `POST` with `Content-Type: text/plain` when JSON expected -> Expect `415 Unsupported Media Type`.

---

## Section 2: HTTP Status Codes & Header Deep Dive

### Q5: Explain the difference between common 4xx and 5xx status codes.
* **What Interviewers Are Looking For:** Diagnostic clarity without confusing client-side errors with gateway or server errors.
* **Answer Matrix:**
  | Code | Name | Root Cause |
  |---|---|---|
  | **400** | Bad Request | Syntax error, malformed JSON, invalid data types |
  | **401** | Unauthorized | Missing or invalid authentication credentials (Unauthenticated) |
  | **403** | Forbidden | Authenticated, but lacking permissions for the resource (Unauthorized) |
  | **404** | Not Found | Target URI / resource does not exist |
  | **405** | Method Not Allowed | Resource exists, but HTTP verb is disallowed (e.g., `POST` on read-only URI) |
  | **409** | Conflict | State conflict (e.g., duplicate email during registration, edit collisions) |
  | **422** | Unprocessable Entity | Payload is syntactically valid JSON, but violates business semantic rules |
  | **429** | Too Many Requests | Rate limit exceeded |
  | **500** | Internal Server Error | Unhandled runtime exception or null pointer on the backend |
  | **502** | Bad Gateway | Reverse proxy received an invalid response from upstream microservice |
  | **503** | Service Unavailable | Server overloaded, down for maintenance, or circuit breaker tripped |
  | **504** | Gateway Timeout | Upstream service failed to respond within reverse proxy timeout limit |

---

### Q6: What are Idempotency Keys, and how do payment APIs use them?
* **What Interviewers Are Looking For:** Advanced distributed transaction reliability (Stripe-style APIs).
* **Answer:**
  * When a client sends a `POST /charges` request over an unstable network, a network drop might occur before the client receives the response.
  * If the client blindly retries `POST /charges`, the customer might be billed twice.
  * **Solution:** The client passes a unique UUID in the header: `Idempotency-Key: 7b2e9a8f-8d91-4e4b`.
  * **Server Logic:**
    1. Check if the key exists in Redis/cache.
    2. If first seen, process the charge and cache the key + response payload.
    3. If seen again within 24 hours, bypass execution and replay the exact cached response.
* **Test Strategy:** Send initial `POST` with key `K1`, verify 200. Send identical second `POST` with same `K1`, assert response payload matches and underlying balance is deducted only **once**.

---

### Q7: What are Conditional Headers (`ETag`, `If-None-Match`, `If-Match`)?
* **What Interviewers Are Looking For:** Cache efficiency and optimistic concurrency control.
* **Answer:**
  - **Caching (Bandwidth Optimization):**
    - Client issues `GET /users/10`. Server returns data with `ETag: "v3a1b"`.
    - On next fetch, client sends `If-None-Match: "v3a1b"`.
    - If data is unchanged, server returns `304 Not Modified` with an empty body, saving network overhead.
  - **Concurrency Control (Preventing Lost Updates):**
    - Client A and Client B read the same record (`ETag: "v1"`).
    - Client A sends `PUT` with `If-Match: "v1"`. It succeeds; server updates ETag to `"v2"`.
    - Client B sends `PUT` with `If-Match: "v1"`. Server rejects with `412 Precondition Failed`, preventing Client B from silently overwriting Client A's changes.

---

## Section 3: Authentication, Authorization & Security Testing

### Q8: Explain the complete OAuth 2.0 Authorization Code Flow with PKCE.
* **What Interviewers Are Looking For:** Enterprise identity architecture knowledge.
* **Workflow:**
  ```mermaid
  sequenceDiagram
    autonumber
    actor User
    participant Client as Client App (SPA / Mobile)
    participant AuthServer as Authorization Server
    participant ResourceServer as API Resource Server

    User->>Client: Click "Sign in with SSO"
    Client->>Client: Generate code_verifier & code_challenge
    Client->>AuthServer: GET /authorize (response_type=code, code_challenge, client_id)
    AuthServer->>User: Display Login & Consent Prompt
    User->>AuthServer: Submits Credentials
    AuthServer->>Client: Redirects with Authorization Code
    Client->>AuthServer: POST /token (code, code_verifier, client_id)
    AuthServer->>AuthServer: Verify code & SHA256(code_verifier) == code_challenge
    AuthServer->>Client: Returns Access Token & Refresh Token
    Client->>ResourceServer: GET /api/data (Authorization: Bearer <Access Token>)
    ResourceServer->>Client: 200 OK + Data
  ```
* **Automation Perspective:** For machine-to-machine automation in CI/CD, bypass user UI prompts using **OAuth 2.0 Client Credentials Grant** or a programmatic API token generation endpoint.

---

### Q9: What are the OWASP API Security Top 10, and how do you test for them?
* **What Interviewers Are Looking For:** Quality engineers who test for vulnerabilities, not just functional paths.
* **Key Vulnerabilities & Automated Checks:**
  1. **API1:2023 - Broken Object Level Authorization (BOLA / IDOR):**
     - *Test:* User A logs in, gets JWT A. Attempt to access `GET /api/documents/{userB_documentId}` using JWT A. Must assert `403 Forbidden` or `404 Not Found`, never `200 OK`.
  2. **API2:2023 - Broken Authentication:**
     - *Test:* Token brute force, weak password policies, missing signature verification, expired tokens accepted.
  3. **API3:2023 - Broken Object Property Level Authorization (Mass Assignment):**
     - *Test:* During `POST /users` or `PATCH /profile`, inject extra administrative parameters like `{"role": "ADMIN", "isVerified": true}`. Assert server ignores or rejects unauthorized fields.
  4. **API4:2023 - Unrestricted Resource Consumption (Rate Limiting):**
     - *Test:* Execute 100 requests in 5 seconds in a loop; verify `429 Too Many Requests` is triggered along with `Retry-After` header.
  5. **API5:2023 - Broken Function Level Authorization (BFLA):**
     - *Test:* Standard customer token hitting administrative endpoints: `DELETE /api/admin/users/1`. Must return `403 Forbidden`.

---

### Q10: How do you validate and inspect a JWT (JSON Web Token)?
* **What Interviewers Are Looking For:** Token anatomy and security assertion techniques.
* **Answer:**
  - A JWT consists of 3 base64url-encoded parts separated by dots: `Header.Payload.Signature`.
  - **Header:** Algorithm & token type (e.g., `{"alg": "RS256", "typ": "JWT"}`).
  - **Payload:** Claims (e.g., `sub`, `iss`, `aud`, `exp`, `iat`, user roles).
  - **Signature:** Cryptographic hash verifying authenticity.
* **Test Assertions:**
  - Verify expiration: `exp` claim > current epoch time (`Math.floor(Date.now() / 1000)`).
  - Verify audience (`aud`) and issuer (`iss`).
  - **Security Edge Case:** Craft a forged token with `"alg": "none"` and no signature. Assert API rejects with `401 Unauthorized`.

---

## Section 4: API Test Strategy, Design Patterns & Edge Cases

### Q11: What is the 7-Layer API Assertion Checklist?
* **What Interviewers Are Looking For:** Thoroughness beyond just checking `response.status === 200`.
* **Answer:** Every robust API test must validate:
  1. **HTTP Status Code & Status Message:** `200 OK`, `201 Created`, `400 Bad Request`.
  2. **Response Latency / SLA:** Response time < 500ms (performance threshold).
  3. **HTTP Headers:** `Content-Type` charset, `Cache-Control: no-store`, security headers (`X-Content-Type-Options: nosniff`).
  4. **Schema Compliance:** Types, required keys, nullability, enum boundaries (JSON Schema / Zod).
  5. **Business Logic & Payload Data:** Exact property values, calculated totals, array counts.
  6. **Data Persistence / Database State:** Subsequent `GET` request or database query confirms data was written correctly.
  7. **Audit & Downstream Side-Effects:** Event published to Kafka/RabbitMQ or email notification queued.

---

### Q12: How do you design positive, negative, and destructive test cases for an endpoint?
* **Scenario:** `POST /api/v1/accounts/transfer`
* **Test Design Matrix:**
  ```
  POST /api/v1/accounts/transfer
  ├── Positive Tests (Happy Path)
  │   ├── Standard transfer between 2 valid accounts with sufficient balance
  │   ├── Decimal transfer ($10.50)
  │   └── Boundary balance transfer (transferring 100% of available funds)
  ├── Negative Business Logic Tests
  │   ├── Transfer amount > available balance (Insufficient funds -> 422/400)
  │   ├── Transfer to same source account (Source == Destination -> 400)
  │   ├── Transfer between frozen/closed accounts -> 403/422
  ├── Negative Input Validation Tests
  │   ├── Negative amount (-$50) -> 400
  │   ├── Zero amount ($0.00) -> 400
  │   ├── Exceeding scale ($10.5555) -> 400
  │   ├── Missing required fields (omit toAccountId) -> 400
  │   ├── Non-numeric account ID ("abc") -> 400
  │   └── Non-existent account ID (99999999) -> 404
  └── Security & Destructive Tests
      ├── SQL Injection in note field ("'; DROP TABLE accounts;--")
      ├── Cross-Site Scripting (XSS) in payee description ("<script>alert(1)</script>")
      ├── Race Condition (Two concurrent transfer requests emptying same $100)
      └── Header tampering (Invalid JWT -> 401, User B's JWT -> 403)
  ```

---

## Section 5: API Automation Framework Design (Playwright & REST Assured)

### Q13: How do you architect a scalable, enterprise-grade API automation framework?
* **What Interviewers Are Looking For:** Modularity, separation of concerns, CI/CD readiness.
* **Architectural Blueprint:**
  ```
  Framework Architecture
  ├── 1. Configuration Layer       (Environments: dev, staging, prod; base URLs, timeouts)
  ├── 2. Core HTTP Client Wrapper  (Singleton/Pooled RequestContext, retry interceptors, logging)
  ├── 3. Service Client Layer      (Domain-specific clients: UserAPI, PaymentAPI, OrderAPI)
  ├── 4. Data Models & Schemas     (TypeScript interfaces / Java POJOs, Zod/JSON Schemas)
  ├── 5. Test Data Factory         (Faker.js, DB fixtures, dynamic payload builders)
  ├── 6. Assertion Library         (Custom matchers, schema validators, soft assertions)
  └── 7. Reporting & Telemetry     (Allure, JUnit XML, Datadog/Slack webhooks)
  ```

---

### Q14: How does Playwright's `APIRequestContext` differ from REST Assured?
* **Comparison Matrix:**
  | Feature | Playwright (`APIRequestContext`) | REST Assured (Java) |
  |---|---|---|
  | **Language** | TypeScript / JavaScript / Python | Java / Kotlin |
  | **Primary Strength** | Blazing fast, unified with UI automation, native browser cookie sharing | Mature Java ecosystem, fluent BDD syntax, built-in Hamcrest matchers |
  | **State Sharing** | Share storage state (cookies/headers) seamlessly between UI and API tests | Requires manual cookie extraction and `RequestSpecification` injection |
  | **Schema Validation** | Uses Zod, AJV, or TypeScript type assertions | Uses `JsonSchemaFactory` and `matchesJsonSchemaInClasspath` |
  | **Execution Engine** | Playwright Test runner with built-in sharding and parallel worker isolation | TestNG / JUnit runner |

---

### Q15: How do you implement the Client/Service Pattern in API automation?
* **What Interviewers Are Looking For:** Avoiding raw `fetch` or `request.post` calls scattered inside test files.
* **TypeScript Implementation:**
  ```typescript
  // src/api/clients/AccountApiClient.ts
  import { APIRequestContext, APIResponse } from '@playwright/test';
  import { TransferRequest } from '../models/transfer.types';

  export class AccountApiClient {
    constructor(private request: APIRequestContext) {}

    async transferFunds(payload: TransferRequest): Promise<APIResponse> {
      return await this.request.post('/parabank/services/bank/transfer', {
        params: {
          fromAccountId: payload.fromAccountId,
          toAccountId: payload.toAccountId,
          amount: payload.amount,
        },
      });
    }

    async getAccountBalance(accountId: string): Promise<number> {
      const response = await this.request.get(`/parabank/services/bank/accounts/${accountId}`);
      const xml = await response.text();
      const match = xml.match(/<balance>(.*?)<\/balance>/);
      return match ? parseFloat(match[1]) : 0;
    }
  }
  ```

---

## Section 6: Contract Testing, Mocking & Microservices

### Q16: What is Consumer-Driven Contract Testing (Pact)? How does it differ from Schema Validation?
* **What Interviewers Are Looking For:** Microservices integration testing strategy without flaky E2E environments.
* **Answer:**
  * **Schema Validation:** Verifies that a response conforms to general type definitions (e.g., `id` is a string, `age` is a number). It does **not** verify whether the provider supports specific values or whether an API change breaks an existing consumer workflow.
  * **Consumer-Driven Contract Testing (Pact):**
    1. **Consumer creates the contract:** The consumer (e.g., Web UI or Mobile App) defines the exact expectations: *"When I send `GET /users/10`, I expect status 200 with `{ "userId": "10", "status": "ACTIVE" }`"*.
    2. The test generates a **Pact File** (JSON contract).
    3. **Provider verifies the contract:** In the provider's pipeline, Pact replays the consumer's expectations against the real provider service. If the provider renamed `userId` to `id`, the provider build fails before deploying to staging!
* **Key Benefit:** Eliminates the need for monolithic end-to-end integration environments; allows independent deployments.

---

### Q17: When do you use Mocking (WireMock) vs Real Endpoints?
* **What Interviewers Are Looking For:** Pragmatic test environment stability and cost management.
* **Answer:**
  - **Use Real Endpoints For:**
    - Smoke tests in staging/pre-production.
    - Testing database integration, real latency, and concurrency locks.
    - Verifying true network topology and gateway configurations.
  - **Use Mocking (WireMock / MSW) For:**
    - **Third-Party Gateways:** Simulating payment processors (Stripe, PayPal) or SMS gateways (Twilio) to prevent incurring financial charges.
    - **Error Simulation:** Hard-to-reproduce scenarios like network timeouts (delaying responses by 30 seconds), `500 Internal Server Errors`, or SSL handshake failures.
    - **Rate Limit Testing:** Simulating a `429 Too Many Requests` response from an upstream vendor.

---

## Section 7: Asynchronous APIs, Webhooks, SSE & Event-Driven Systems

### Q18: How do you automate tests for Asynchronous APIs returning `202 Accepted`?
* **What Interviewers Are Looking For:** Dealing with eventual consistency without hardcoded `sleep()`.
* **Answer Strategy:**
  1. **Trigger Action:** Send `POST /api/reports/generate`.
  2. **Verify Accepted State:** Assert status is `202 Accepted`, and extract `jobId` or the `Location` header (`/api/jobs/job_999`).
  3. **Polling with Exponential Backoff / Timeout:**
     - In Playwright, utilize `expect.poll()`:
     ```typescript
     await expect.poll(async () => {
       const res = await request.get(`/api/jobs/${jobId}`);
       const body = await res.json();
       return body.status;
     }, {
       message: 'Job failed to complete within timeout',
       intervals: [1000, 2000, 4000],
       timeout: 30000,
     }).toBe('COMPLETED');
     ```
     - In Java, utilize `Awaitility`:
     ```java
     await().atMost(30, SECONDS).pollInterval(2, SECONDS).until(() -> {
         Response res = given().get("/api/jobs/" + jobId);
         return res.jsonPath().getString("status").equals("COMPLETED");
     });
     ```
  4. **Final Assertion:** Retrieve the generated resource and assert data integrity.

---

### Q19: How do you test Webhooks and Server-Sent Events (SSE)?
* **Testing Webhooks:**
  1. Stand up a lightweight mock HTTP receiver (e.g., using an in-memory Express server, WireMock webhook listener, or services like Webhook.site API).
  2. Trigger the business action via the API under test.
  3. Assert that the webhook payload is delivered to the mock receiver within the SLA window, and verify HMAC signature headers (`X-Signature-SHA256`) to ensure message authenticity.
* **Testing Server-Sent Events (SSE):**
  - Connect to the streaming endpoint (`Accept: text/event-stream`).
  - Read stream chunks as they arrive; parse the `data: {...}` lines; assert event types and chronological ordering of streamed tokens/messages.

---

## Section 8: GraphQL vs. REST vs. gRPC

### Q20: Compare REST, GraphQL, and gRPC from a QA / Automation perspective.
* **What Interviewers Are Looking For:** Architectural breadth across modern protocols.
* **Deep Comparison:**
  | Dimension | REST | GraphQL | gRPC |
  |---|---|---|---|
  | **Protocol** | HTTP/1.1 or HTTP/2 | HTTP/1.1 or HTTP/2 | HTTP/2 (Strict) |
  | **Payload** | JSON, XML, Form-data | JSON (Query in request body) | Protocol Buffers (Binary) |
  | **Error Handling** | HTTP status codes (`400`, `404`, `500`) | **Always returns HTTP 200 OK!** Errors reside in `errors[]` array | gRPC Status Codes (`OK`, `NOT_FOUND`, `UNAVAILABLE`) |
  | **Over/Under-fetching** | Common (fixed endpoints) | Solved (client requests exact fields) | Solved (strictly typed proto contracts) |
  | **Tooling** | Postman, Playwright, REST Assured | Postman, Apollo Client, Playwright | BloomRPC, Postman gRPC, grpcurl, Protoc |
  | **Test Assertion Trap** | Checking `res.status === 200` is sufficient | **Must assert `body.errors === undefined`**, because status code is always 200! | Requires `.proto` schema file to serialize/deserialize binary stream |

---

## Section 9: Real-World Scenarios, Root Cause Analysis (RCA) & Debugging

### Q21: "An API returns intermittent 500 errors in production. Walk me through your debugging methodology."
* **What Interviewers Are Looking For:** Structured troubleshooting instincts, observability knowledge (APM, logs, distributed tracing).
* **Systematic 5-Step RCA Workflow:**
  1. **Capture & Reproduce:**
     - Extract the Correlation ID / Request ID (`X-Correlation-ID`) from response headers.
     - Isolate exact request payload, HTTP headers, and URL query params. Try to reproduce in staging via cURL or Postman.
  2. **Distributed Tracing & Logs:**
     - Trace the request in Datadog/Jaeger/Zipkin across microservices.
     - Search logs (Splunk/ELK) using the correlation ID. Pinpoint the exact stack trace (e.g., `NullPointerException`, DB connection pool exhaustion).
  3. **Dependency Analysis:**
     - Did a downstream service or third-party API timeout? Did a circuit breaker (Resilience4j) trip?
  4. **Data & State Inspection:**
     - Is the failure data-dependent (e.g., special unicode characters, null fields in legacy records, edge-case tenant settings)?
  5. **Infrastructure & Concurrency:**
     - Check APM metrics during failure spikes: CPU/Memory utilization, DB connection pool saturation, garbage collection pauses, or database deadlocks.

---

### Q22: "The API returns 200 OK, but the UI displays a blank screen or error banner. What happened?"
* **What Interviewers Are Looking For:** Contract drift and frontend-backend integration understanding.
* **Common Root Causes:**
  1. **Contract Drift (Field Name Changes):** Backend renamed `accountNumber` to `account_no`. The response is 200, but frontend parser accesses `data.accountNumber.map()`, throwing `TypeError: Cannot read properties of undefined`.
  2. **Type Mismatch:** Backend returned `"balance": "100.00"` (String) instead of `100.00` (Number).
  3. **Null vs. Empty Array:** Frontend expected `items: []` and executed `items.length`, but backend returned `items: null`.
  4. **CORS Failure:** The API returned 200 OK, but lacked the `Access-Control-Allow-Origin` header matching the UI domain. The browser intercepted and blocked the response.

---

### Q23: "How do you test database rollback and transaction atomicity when an API operation fails?"
* **Scenario:** Creating an order debits money from account, reserves inventory, and generates an invoice.
* **Test Strategy:**
  1. Trigger a failure in the final step (e.g., provide an invalid invoice tax code).
  2. Verify API returns error status (`422 Unprocessable Entity` or `400 Bad Request`).
  3. **Verification of Rollback (ACID Atomicity):**
     - Verify account balance did **not** decrease.
     - Verify inventory count was **not** decremented.
     - Verify no orphaned order record remains in the database with status `PENDING`.

---

## Section 10: Live Coding & Implementation Challenges

### Challenge 1: Playwright (TypeScript) — End-to-End Test with Schema Validation
```typescript
import { test, expect } from '@playwright/test';
import { z } from 'zod';

// 1. Define Strict Zod Schema
const AccountSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  type: z.enum(['CHECKING', 'SAVINGS', 'LOAN']),
  balance: z.number().nonnegative(),
});

test('Verify account creation and schema contract', async ({ request }) => {
  // 2. Perform POST request
  const response = await request.post('/parabank/services/bank/createAccount', {
    params: {
      customerId: '12212',
      newAccountType: '1', // SAVINGS
      fromAccountId: '12345',
    },
    headers: { Accept: 'application/json' },
  });

  // 3. Status Code Assertion
  expect(response.status()).toBe(200);

  // 4. Response Time Assertion (< 1500ms)
  // (In Playwright, timing can be tracked or captured via test info)

  // 5. Schema Validation
  const responseData = await response.json();
  const parsed = AccountSchema.safeParse(responseData);
  expect(parsed.success, `Schema validation error: ${parsed.error}`).toBe(true);

  // 6. Business Logic Assertion
  expect(responseData.type).toBe('SAVINGS');
  expect(responseData.balance).toBeGreaterThanOrEqual(0);
});
```

---

### Challenge 2: REST Assured (Java) — Reusable Specification & POJO Deserialization
```java
public class BankingApiTest {
    private static RequestSpecification requestSpec;

    @BeforeClass
    public static void setup() {
        requestSpec = new RequestSpecBuilder()
            .setBaseUri("https://parabank.parasoft.com")
            .setBasePath("/parabank/services/bank")
            .addHeader("Accept", "application/json")
            .setContentType(ContentType.JSON)
            .addFilter(new RequestLoggingFilter())
            .addFilter(new ResponseLoggingFilter())
            .build();
    }

    @Test
    public void testCustomerAccountsRetrieval() {
        String customerId = "12212";

        Account[] accounts = given()
            .spec(requestSpec)
            .pathParam("customerId", customerId)
        .when()
            .get("/customers/{customerId}/accounts")
        .then()
            .statusCode(200)
            .time(lessThan(2000L)) // Latency check
            .extract()
            .as(Account[].class); // Deserialization into Java POJO

        Assert.assertTrue(accounts.length > 0, "Accounts list should not be empty");
        Assert.assertNotNull(accounts[0].getId(), "Account ID must be present");
        Assert.assertTrue(accounts[0].getBalance() >= 0, "Balance must be non-negative");
    }
}
```

---

## 💡 Quick Tips for Acing the API Interview
1. **Never stop at status 200:** Always emphasize validating headers, schema types, response SLA, and data persistence.
2. **Talk about security:** Mentioning IDOR/BOLA and rate limiting unprompted immediately signals a Senior/Lead engineer.
3. **Emphasize CI/CD integration:** Explain how API tests run in parallel pull request pipelines (fast feedback) versus nightly regression suites.
4. **Clarify requirements first:** In scenario questions, ask: *"Is this API synchronous or asynchronous? What are the SLA expectations? Are there third-party dependencies we should mock?"*
