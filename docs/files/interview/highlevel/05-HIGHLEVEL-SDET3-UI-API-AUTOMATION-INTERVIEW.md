# SDET-3 Master Guide: UI & API Automation Interview Questions

**Target Role:** SDET-3 / Senior QA Automation Engineer @ HighLevel (GoHighLevel)  
**Core Technologies:** Playwright, API Testing (REST/GraphQL), Framework Architecture, CI/CD, Flakiness Resolution

As an SDET-3, interviewers are not looking for someone who just writes scripts. They are looking for an **architect** who designs scalable, resilient test frameworks, speeds up CI/CD pipelines, and mentors junior engineers.

---

## 1. High-Level Framework Architecture (The "How do you build a framework?" Question)

### Q1: "If you were hired to build our automation framework from scratch, how would you design it?"
**Your Strategy:** Do not just say "Page Object Model". Talk about a **Hybrid UI + API Framework**.
> *"For a complex CRM like HighLevel, I would build a TypeScript Playwright framework integrating both API and UI testing. 
> 
> **1. Data Setup via API (Speed):** I never use the UI to create test data. If I need to test an appointment booking UI, I use a backend REST/GraphQL API call in the `beforeAll` hook to create the user, calendar, and availability. This cuts test execution time by 70%.
> **2. Page Object Model (POM):** I strictly separate locators, actions, and assertions. Pages return objects so tests are readable.
> **3. Environment Configs:** I use a central `playwright.config.ts` to manage multiple environments (Staging, Prod) and handle auth state (JWTs) dynamically.
> **4. Reporting & Observability:** I integrate Allure Reports or Playwright's built-in HTML reporter, attaching trace viewers and video recordings automatically on failure for instant RCA."*

---

## 2. API Automation & Advanced Concepts

### Q2: "How do you handle API Authentication (JWT/OAuth) efficiently in your test suites?"
**Your Strategy:** Talk about caching auth states so you don't log in 500 times.
> *"Authentication is the biggest bottleneck in API tests. I use Playwright's `APIRequestContext` to fetch a JWT token in the global setup, and then save the `storageState` to a JSON file. Every worker in parallel execution reads from that same JSON file. This way, we only hit the auth server once per test run, avoiding rate limits and shaving minutes off the pipeline execution."*

### Q3: "HighLevel uses GraphQL heavily. How does testing GraphQL differ from REST?"
**Your Strategy:** Focus on the HTTP 200 quirk.
> *"The biggest difference is error handling. In REST, if I search for an invalid user, I expect a 404. If the server crashes, I expect a 500. 
> In GraphQL, there is a single endpoint (`/graphql`), and **it almost always returns HTTP 200 OK**, even if the query fails completely.
> As an SDET-3, I teach my team that checking `.status() == 200` is useless. We must explicitly parse the JSON response and write assertions like `expect(response.body.errors).toBeUndefined()` to guarantee the query actually succeeded."*

### Q4: "How do you validate large JSON payloads effectively?"
**Your Strategy:** JSON Schema Validation.
> *"Instead of writing 50 lines of code asserting every single key in a massive API payload, I use **JSON Schema Validation** (using libraries like `ajv`). I generate a schema representing the exact expected structure, types (string, int), and required fields. One assertion validates the entire payload structure, which is much more resilient to API changes."*

---

### Q5: "What happens when you hit the backend with 1000 concurrent requests? Why might the database fail, and how do you handle it?"
**Your Strategy:** Talk about Connection Pool Exhaustion, wait queues, and caching.
> *"If we blast the API with 1000 concurrent requests, it will likely crash with a `Connection Pool Exhausted` or `Too Many Connections` error. 
> 
> **Why it fails:** Databases (like PostgreSQL or MySQL) do not open a brand new network connection for every request because the TCP handshake is too slow. Instead, the backend API uses a **Connection Pool** (e.g., maximum 50 or 100 active connections). If 1000 requests hit simultaneously, the first 100 grab the active connections, and the remaining 900 are put in a wait queue. If the active queries take too long to return the connection to the pool, the queued requests hit a timeout (e.g., `ConnectionTimeoutError`), and the API starts throwing HTTP 500s.
> 
> **How to handle it:** 
> 1. **Testing:** I use tools like k6 or Locust to simulate spike loads (Spike Testing) to find the exact breaking point of the connection pool.
> 2. **Architectural Fixes:** I would work with the developers to implement a connection multiplexer like **PgBouncer**, tune the pool size based on available RAM, or implement **Redis Caching** so read-heavy requests never actually hit the database."*

---

### Q6: "What happens when a downstream service returns a 400 Bad Request, but your upstream API returns a 500 Internal Server Error to the client?"
**Your Strategy:** Explain cascading failures and improper exception handling in microservices.
> *"This is a classic microservice anti-pattern. If Service B (downstream) returns a `400 Bad Request`, it means Service A (upstream) sent it malformed data. 
> Instead of gracefully handling that 400, Service A crashed or improperly wrapped the error, bubbling it up to the client as a generic `500 Internal Server Error`.
> 
> **Why this is bad:** It completely masks the root cause. The frontend team sees a 500 and thinks the server is down, when in reality, the user just submitted an invalid form field that Service A failed to validate before passing it to Service B.
> 
> **How to test/fix it:** As an SDET, I write integration tests specifically mocking downstream services to return `400`, `401`, or `429` errors. I assert that our upstream API catches those HTTP errors and remaps them properly into user-friendly `400` validation errors (or `502 Bad Gateway` if it's truly a downstream failure), rather than defaulting to a lazy `500`."*

---

## 3. UI Automation & Combating Flakiness

### Q7: "Our UI tests are extremely flaky because the DOM elements render dynamically. How do you fix this?"
**Your Strategy:** Banning static waits and utilizing Playwright's auto-wait.
> *"Flakiness usually comes from `Thread.sleep()` or static waits. As an SDET-3, my first rule in code reviews is banning static waits.
> 1. **Auto-waiting:** I strictly use Playwright's web-first assertions (e.g., `expect(locator).toBeVisible()`), which inherently poll the DOM.
> 2. **Network State Waiting:** If a button click triggers a network call to fetch data, I don't wait for the UI to catch up. I explicitly wait for the backend response using `page.waitForResponse('**/api/v1/data')`. This guarantees the data has arrived before the next UI action.
> 3. **Resilient Locators:** I avoid XPath indexing (`div[3]/span`). I prioritize user-facing attributes like `data-testid`, `role`, or `aria-label`."*

### Q8: "How do you test scenarios involving 3rd-party integrations (e.g., Stripe, Twilio) that are flaky or rate-limited?"
**Your Strategy:** API Mocking / Network Interception.
> *"We cannot rely on real 3rd-party sandboxes for every CI run because of rate limits and external latency. 
> I use Playwright's **Network Interception** (`page.route()`) to mock the responses. When the UI makes a call to Stripe, Playwright intercepts it and instantly returns a mock JSON success payload. This allows us to test our UI's error states and success states reliably and instantly."*

---

## 4. CI/CD & Pipeline Optimization (Senior Architect Thinking)

### Q9: "Your test suite has grown to 2,000 tests and takes 2 hours to run. How do you reduce it to 10 minutes?"
**Your Strategy:** Parallelization, sharding, and API shortcuts.
> *"I tackle this in three layers:
> 1. **Data Setup:** As mentioned, replace all UI setup steps with fast API calls.
> 2. **Pipeline Sharding:** I wouldn't just run parallel workers on one machine. I would implement **Test Sharding** in GitHub Actions/GitLab CI. I spin up 10 parallel CI runners, splitting the 2,000 tests across them using `--shard=1/10`. 
> 3. **Tagging / Smoke Suites:** I enforce strict tagging (e.g., `@smoke`, `@regression`, `@ai`). We don't need to run 2,000 tests on every single PR commit. We run a 5-minute smoke suite on PRs, and the full 2,000 suite nightly."*

---

## 5. Behavioral: SDET-3 Leadership

### Q10: "Tell me about a time you introduced a new testing tool or practice to a team that was resistant."
**Your Strategy:** Connect it to your ServiceNow/Gainsight experience (automation adoption).
> *"At my previous company, developers were resistant to writing end-to-end tests because Selenium was too slow and flaky. Instead of forcing them to use it, I built a Proof of Concept using Playwright. 
> I migrated one of our most flaky, 5-minute tests into a 30-second Playwright test using API setup and network waiting. I integrated the Playwright trace viewer directly into our PRs. Once the developers saw that a failed test literally gave them a video recording and a network log of exactly what broke, the resistance vanished. They started voluntarily contributing to the framework."*

