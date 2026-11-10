# SDET-2 Interview Preparation: API Automation

**Candidate**: Sumanth
**Target Company**: Zinier (AI-native field service management, event-driven, microservices)
**Interviewer**: Keerthivasan Venkatraman (QA Technical Lead)
**Interview Style**: Rigorous, deeply technical, exhaustive ("ram and squeeze until empty")

This document prepares you for a deep-dive technical interview focusing on API automation, specifically mapping to your experience with REST Assured (Java), Playwright (TypeScript), TestNG, and your work at ServiceNow, Gainsight, and on the ParaBank project.

---

## Section 1: API Testing Fundamentals

**Q1: What is the difference between Idempotent and Non-Idempotent HTTP methods? Give examples.**
* **What they are testing:** Deep understanding of REST principles and HTTP protocol semantics.
* **Answer:** An idempotent HTTP method is one where making multiple identical requests has the same effect on the server as making a single request.
  * **Idempotent:** `GET`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`. (e.g., Calling `DELETE /users/123` once or ten times still results in user 123 being deleted).
  * **Non-Idempotent:** `POST`, `PATCH` (sometimes). (e.g., Calling `POST /users` ten times creates ten users).
* **Pro Tip:** Mention that while `PUT` is idempotent by definition (replacing the entire resource), `PATCH` (partial update) can be non-idempotent depending on the implementation (e.g., `{"increment_balance": 10}`). At Zinier, given their event-driven nature, idempotency is crucial for handling duplicate events or retry mechanisms safely.

**Q2: Explain Content Negotiation in REST APIs.**
* **What they are testing:** Knowledge of HTTP headers and how clients/servers agree on data formats.
* **Answer:** Content negotiation is the mechanism used for serving different representations of a resource at the same URI, so the client can specify which format it prefers. This is driven by headers:
  * `Accept` (Client tells server what it can understand, e.g., `application/json` or `application/xml`).
  * `Content-Type` (Client tells server what format the request payload is in, or Server tells client what format the response payload is in).
* **Pro Tip:** Tie this to your ParaBank project. ParaBank returns XML. You could mention, "If ParaBank supported multiple formats, I would set the `Accept: application/json` header in Playwright's `APIRequestContext`, but since it's XML, I have to handle it specifically. Content negotiation ensures API evolvability."

**Q3: How do you handle schema validation and contract testing?**
* **What they are testing:** Moving beyond simple assertions to robust integration strategies.
* **Answer:**
  * **Schema Validation:** Verifying the structure of the JSON/XML response against a predefined schema (e.g., JSON Schema) without strictly checking data values. This catches missing fields or type changes.
  * **Contract Testing:** Using tools like Pact to define a contract between a consumer (e.g., Zinier's UI or another microservice) and a provider (the API). Tests ensure the provider honors the expected contract.
* **Pro Tip:** In a microservices architecture like Zinier's, contract testing is superior to massive end-to-end API tests because it isolates services and allows independent deployment.

**Q4: How do you design API automation for OAuth2 authentication flows?**
* **What they are testing:** Handling complex state and security in automation.
* **Answer:** OAuth2 requires obtaining an access token before making resource requests. In automation, I would:
  1. Make a `POST` request to the token endpoint (`/oauth/token`) with `client_id`, `client_secret`, and `grant_type` (often `client_credentials` for machine-to-machine automation).
  2. Extract the `access_token` from the response.
  3. Store it in a variable/context.
  4. Inject it into subsequent requests using the `Authorization: Bearer <token>` header.
  5. Handle token expiration by intercepting 401s and refreshing the token automatically within the framework framework (e.g., using a Singleton token manager).

---

## Section 2: REST Assured (Java)

**Q5: Explain the architecture of REST Assured and its BDD syntax.**
* **What they are testing:** Hands-on Java automation experience.
* **Answer:** REST Assured is a Java DSL for simplifying testing of REST APIs. It uses a BDD (Behavior-Driven Development) format:
  * `given()`: Sets up the request state (headers, query params, path params, body, authentication). Returns `RequestSpecification`.
  * `when()`: Performs the action/HTTP method (GET, POST, PUT, DELETE).
  * `then()`: Validates the response (status code, body assertions, headers). Returns `ResponseSpecification`.
* **Pro Tip:** Mention `RequestSpecBuilder` and `ResponseSpecBuilder`. "To avoid repeating headers and base URLs, I create standard `RequestSpecification` objects that can be reused across multiple test classes."

**Q6: How do you handle Serialization and Deserialization in REST Assured?**
* **What they are testing:** Data handling and Java ecosystem knowledge (Jackson/Gson).
* **Answer:** I map JSON/XML structures to Java Plain Old Java Objects (POJOs).
  * **Serialization (Java to JSON):** When sending a POST request, I pass a Java object to the `.body()` method. REST Assured uses Jackson/Gson (via ObjectMapper) to convert the POJO to a JSON string.
  * **Deserialization (JSON to Java):** When reading a response, I use `.as(MyClass.class)`. This parses the JSON response back into a Java object, making assertions type-safe and easier to manage.
* **Pro Tip:** Talk about `@JsonIgnoreProperties(ignoreUnknown = true)` to prevent tests from breaking if the API adds new fields, which is common in agile microservice environments like Zinier.

**Q7: How do you integrate REST Assured with TestNG for data-driven testing?**
* **What they are testing:** Framework design patterns.
* **Answer:** I use TestNG's `@DataProvider`.
  1. Create a method annotated with `@DataProvider` returning an `Object[][]` or `Iterator<Object[]>`.
  2. This method can read data from Excel, CSV, or a database.
  3. The `@Test` method uses `dataProvider = "name"` and accepts the data as parameters.
  4. REST Assured uses these parameters in the `given()` block to execute the same API test multiple times with different payloads.

---

## Section 3: Playwright API Testing (ParaBank Focus)

**Q8: Explain how you structure API tests in your ParaBank Playwright framework.**
* **What they are testing:** Modern JS/TS tooling, architecture, and recent project knowledge.
* **Answer:** I created a wrapper class `BankingAPI.ts` that takes Playwright's `APIRequestContext`.
  * It abstracts business actions into methods like `cleanDB()`, `login()`, `createAccount()`.
  * In `tests/api/banking-api.spec.ts`, I use these methods to build scenarios.
  * I utilize constants for endpoints, test data generators (like Faker), and TypeScript interfaces for strong typing of payloads.
* **Pro Tip:** Keerthivasan will appreciate encapsulation. By hiding the raw `request.post()` calls inside `BankingAPI.ts`, the test file reads like business logic, making it easier to maintain when API contracts change.

**Q9: Why use `test.describe.serial` for dependent API tests? What are the risks?**
* **What they are testing:** Understanding of test execution flow and parallelization trade-offs.
* **Answer:** I use `test.describe.serial` in ParaBank because the flow is strictly sequential: `authenticate` -> `fetch accounts` -> `get details` -> `create account` -> `transfer funds`. If `authenticate` fails, there's no point running the rest.
  * **The Risk:** It breaks parallel execution. If you have hundreds of these, your suite slows down.
  * **The Alternative:** For faster suites, each test should be independent. I would handle setup (authentication, account creation) in a `beforeEach` hook or a fixture, allowing the `transfer funds` test to run in parallel with others.

**Q10: How are you handling XML responses from ParaBank in Playwright?**
* **What they are testing:** Problem-solving with legacy/awkward formats in modern tools.
* **Answer:** ParaBank returns XML. Currently, I use regular expressions to parse out necessary data (like account IDs).
  * **Pros:** It's fast and doesn't require external dependencies for simple extractions.
  * **Cons:** Regex is brittle. If the XML structure changes slightly (e.g., attributes added, newlines changed), the regex might break.
* **Pro Tip:** "While regex works for simple extractions in my demo, for a production framework at Zinier, I would integrate a proper XML parser like `xml2js` or `fast-xml-parser` to convert the XML response into a JSON object, making it much safer to assert against."

**Q11: Playwright API vs REST Assured — which do you prefer and why?**
* **What they are testing:** Tool evaluation and objective reasoning.
* **Answer:** Both are powerful.
  * **REST Assured:** Excellent for Java-heavy ecosystems. Integrates beautifully with TestNG, Allure, and Java data structures (POJOs).
  * **Playwright:** Incredible if the team is already using TypeScript/JavaScript for UI automation. It allows sharing the same network layer, fixtures, and execution engine (Playwright Test) for both UI and API. In my ParaBank project, Playwright's `APIRequestContext` is extremely fast and integrates seamlessly with my TS setup.

---

## Section 4: TestNG Deep Dive

**Q12: Explain the TestNG annotation lifecycle and when you'd use them in API testing.**
* **What they are testing:** Granular control of test setup/teardown.
* **Answer:**
  * `@BeforeSuite`: Set up global configs (e.g., read environment variables, start mock servers).
  * `@BeforeTest`: Configure settings specific to a `<test>` tag in `testng.xml` (e.g., setting up a specific database connection for a module).
  * `@BeforeClass`: Initialize the `RequestSpecification` or instantiate API wrapper classes.
  * `@BeforeMethod`: Generate specific test data or reset a user's state before each test.
  * `@Test`: The actual API call and assertions.
  * `@AfterMethod`: Soft cleanup (e.g., deleting a record created in the test).
  * `@AfterClass` / `@AfterSuite`: Closing database connections, generating Allure reports.

**Q13: How do you handle flaky API tests in TestNG?**
* **What they are testing:** Real-world stability management.
* **Answer:** I implement the `IRetryAnalyzer` interface.
  * Create a class that overrides the `retry()` method to allow a test to re-run up to *N* times if it fails.
  * Apply this to tests via `@Test(retryAnalyzer = MyRetry.class)` or globally using an `IAnnotationTransformer` listener in `testng.xml`.
* **Pro Tip:** Mention that retries treat the symptom, not the disease. You also investigate *why* it's flaky (e.g., network latency, eventual consistency, bad test data isolation) and fix the root cause.

---

## Section 5: Situational Questions

**Q14: "You have an API returning intermittent 500 errors in production. How do you debug?"**
* **What they are testing:** Debugging methodology and system understanding.
* **Answer Strategy:**
  1. **Isolate:** Can I reproduce it? (Postman/Curl). Are specific payloads causing it?
  2. **Logs:** Check application logs (Splunk, Kibana, Datadog) for the correlation ID of the failed request. Look for NullPointerExceptions or DB timeouts.
  3. **Dependencies:** Check downstream microservices. Is the API calling another service that is timing out?
  4. **Infrastructure:** Check server metrics (CPU/Memory) and Load Balancer logs.
  5. **Data:** Check if the issue happens only for specific tenant data or specific edge cases.

**Q15: "How would you design API automation for a microservices architecture with 50+ services?"**
* **What they are testing:** Senior-level architectural thinking. Zinier operates heavily on microservices.
* **Answer Strategy:**
  * **Component Tests:** Test each service in isolation. Mock downstream dependencies using tools like WireMock.
  * **Contract Testing:** Implement Pact to ensure services don't break each other's expected input/output.
  * **E2E Minimal API Tests:** A small suite of E2E tests that traverse multiple services for critical user journeys.
  * **CI/CD Integration:** Run component tests on every PR for a specific service. Run contract tests before merging. Run E2E tests post-deployment in staging.

**Q16: "How do you test eventual consistency in async APIs?"**
* **What they are testing:** Handling event-driven architectures (like Zinier's).
* **Answer Strategy:**
  * When an API triggers an async job (e.g., returns 202 Accepted), I don't assert the final state immediately.
  * **Polling:** Implement a polling loop (with timeout and interval) that queries a `status` endpoint or the database until the state changes to 'COMPLETED'.
  * **Playwright Example:** Playwright's `expect.poll` is perfect for this. In Java, I'd use the `Awaitility` library.

---

## Section 6: Behavioral Questions (STAR Method)

**Q17: "Tell me about a time you found a critical API bug."**
* **Situation:** At ServiceNow / Gainsight, we had a new endpoint for [feature].
* **Task:** I was writing automated tests for the edge cases.
* **Action:** Instead of just testing the happy path, I tested boundary values and unauthorized role access. I discovered that by modifying the payload slightly, an unprivileged user could escalate their role (or view another tenant's data).
* **Result:** Raised a High severity bug. Worked with devs to fix the authorization logic. Added negative regression tests to the CI pipeline to ensure it never happened again.

**Q18: "How did you handle disagreements about test coverage with developers?"**
* **Situation:** A developer felt unit tests were enough for a specific microservice and E2E API tests were redundant.
* **Task:** I needed to ensure system stability without slowing down the pipeline unnecessarily.
* **Action:** I sat down with the developer to review the unit test coverage. I acknowledged their good work, but pointed out an integration gap where their service interacted with a third-party gateway, which wasn't covered by unit tests.
* **Result:** We compromised: We relied on their unit tests for deep logic, but added just two API contract tests to cover the integration point. It built trust and maintained quality.
