# 06 - Automation Framework Design and CI/CD

This document prepares Sumanth for the SDET-2 interview at Zinier, focusing heavily on framework architecture, CI/CD integration, and high-level automation strategy.

---

## Section 1: Test Automation Strategy

### 1. Test Pyramid
*   **Unit Tests (Base):** Fast, isolated, cheap. Written by developers. Should form the majority of the test suite (~70%).
*   **Integration/API Tests (Middle):** Slower than unit tests, verify interactions between components. Excellent ROI for testing business logic. (~20%).
*   **End-to-End / UI Tests (Top):** Slow, brittle, expensive to maintain. Focus on critical user journeys. (~10%).
*   **Tradeoffs:** As you go up the pyramid, tests get slower and more expensive to write/maintain, but closer to actual user behavior.

### 2. When to Automate vs. Manual Testing
*   **Automate:** Repetitive tasks (regression), high-risk business flows, data-driven scenarios, performance/load testing, cross-browser/cross-device verification.
*   **Manual:** Exploratory testing, usability testing, one-off edge cases, rapid prototypes, visual layout subjective checks (though visual regression tools help here).

### 3. ROI Calculation for Automation
*   **Formula:** ROI = (Savings from Automation - Cost of Automation) / Cost of Automation
*   **Costs:** Tool licensing, infrastructure/CI costs, SDET salaries for creation and maintenance.
*   **Savings:** Time saved by not doing manual execution, faster time-to-market, cost of bugs caught early (shift-left).

### 4. Test Selection
*   **Smoke:** Sanity check of core functionality. Fast execution (under 5-10 mins). Run on every PR/merge.
*   **Sanity:** Focused testing on a specific component after a change.
*   **Regression:** Full suite ensuring existing functionality isn't broken. Run nightly or pre-release.

### 5. Risk-Based Testing
Prioritize tests based on the probability of failure and the business impact of a failure. High-risk areas (e.g., payments, core workflows) get automated first and run most frequently.

### 6. Shift-Left Testing Philosophy
Testing early in the SDLC. Writing unit tests, API tests before UI tests. Doing code reviews, static analysis, and running tests automatically on pull requests to catch bugs before they merge to main.

---

## Section 2: Framework Architecture & Design Patterns

### 1. Framework Types
*   **Linear:** Record & playback (brittle).
*   **Modular:** Reusable scripts for specific components.
*   **Data-driven:** Separation of test logic and test data (e.g., using CSV, JSON).
*   **Keyword-driven:** Action words linked to code (e.g., Robot Framework).
*   **Hybrid:** Combines modular, data-driven, and keyword.
*   **BDD:** Cucumber/SpecFlow. Uses Gherkin (Given/When/Then) for business readability. (Experience: Nightwatch + Cucumber at Cognizant).

### 2. Design Patterns in Test Automation
*   **Page Object Model (POM):** Separates page elements and actions from test logic. Reduces duplication and improves maintenance. (Experience: Current Playwright project with BasePage).
*   **Singleton:** Ensures only one instance of a class exists (e.g., WebDriver instance or a Global Configuration manager).
*   **Factory:** Creates objects without specifying the exact class (e.g., BrowserFactory returning Chrome, Firefox, or Safari driver based on config).
*   **Builder:** Simplifies object creation, especially for complex test data payloads (API testing).
*   **Strategy:** Enables selecting an algorithm at runtime (e.g., different login strategies like UI login vs. API token login).

### 3. Configuration Management
*   Use environment variables and `.env` files.
*   Maintain `config.ts` (or similar) that maps environments (dev, qa, staging) to base URLs, DB strings, etc.
*   Never hardcode secrets. Use AWS Secrets Manager, Azure Key Vault, or GitHub Secrets.

### 4. Test Data Management Strategies
*   **Static Data:** Hardcoded in JSON/fixtures (good for lookups, bad for stateful tests).
*   **Dynamic Generation:** Using tools like Faker.js to create unique users per test.
*   **API Seeding:** Using API calls in `beforeAll` or `beforeEach` to set up exact state. (Best practice).
*   **DB Seeding:** Direct DB inserts (faster, but couples tests to DB schema).

### 5. Reporting Architecture
*   Standard output: JUnit XML (for CI parsing), HTML reports.
*   Advanced: Allure (great for trend analysis), Playwright native HTML reporter.
*   Custom reporters: Integrating with Slack/Teams or test management tools (Jira/Xray).

### 6. Error Handling, Retry, & Flakiness
*   **Retries:** Configure at framework level (e.g., Playwright `retries: 2` on CI only).
*   **Flaky Management:** Tag flaky tests, isolate them, or move them to a non-blocking quarantine suite until fixed.
*   **Auto-healing:** (Bonus) AI tools that adjust selectors dynamically.

---

## Section 3: CI/CD Pipeline Integration

### 1. Pipeline Configuration (GitHub Actions / Azure DevOps)
*   Define workflows in YAML.
*   Steps: Checkout -> Setup Node/Python -> Install Deps -> Install Browsers -> Run Tests -> Upload Artifacts.

### 2. Docker Containers
*   Use official images (e.g., `mcr.microsoft.com/playwright:v1.x-focal`) to ensure tests run in the exact same OS/browser environment locally and in CI, eliminating "works on my machine" issues.

### 3. Parallel Execution Strategies
*   **Workers:** Running tests in parallel on a single machine using multiple threads/processes.
*   **Sharding:** Splitting the test suite across multiple CI machines. Playwright supports this natively (`--shard=1/3`).
*   **Matrix Builds:** Running the same suite against different configurations (e.g., Chrome, WebKit, Mobile Safari) concurrently.

### 4. Test Artifact Management
*   Configure the framework to save screenshots, videos, and trace files **only on failure** to save storage.
*   Upload these folders as pipeline artifacts for debugging.

### 5. Branch Strategies & Quality Gates
*   **PR/Commit:** Fast Unit & API tests. Smoke UI tests. (Blocking gate).
*   **Merge to Main:** Full Regression suite (API + UI).
*   **Nightly:** Full Regression + cross-browser + performance tests.

---

## Section 4: Advanced Automation Topics

### 1. Visual Regression Testing
*   Tools: Percy, Applitools, Playwright native snapshots.
*   Checks pixel-by-pixel differences. Essential for CSS changes, charts, and complex layouts.

### 2. Contract Testing (Pact)
*   Verifies that the consumer (frontend) and provider (backend) agree on the API payload structure. Faster and more stable than E2E tests for integration verification.

### 3. Service Virtualization / API Mocking
*   Mocking 3rd-party services (e.g., Payment gateways) in E2E tests so you aren't dependent on their uptime or charged for test transactions. Playwright `page.route()` is excellent for this.

---

## Section 5: Situational Questions

### 1. "Design a test automation framework for Zinier from scratch. What's your architecture?"
*   **What's being tested:** Architectural thinking, knowledge of modern tools, scalability.
*   **Structured Answer:**
    *   **Tool:** Playwright (Typescript) for UI/API. Fast, modern, handles async well.
    *   **Pattern:** POM + Custom Fixtures.
    *   **Structure:**
        *   `/tests`: domain-organized (`/auth`, `/work-orders`).
        *   `/pages`: BasePage, specialized page classes.
        *   `/api`: API clients for data setup/teardown.
        *   `/fixtures`: Custom Playwright fixtures (e.g., `loggedInUser`).
    *   **CI/CD:** Dockerized execution in GitHub Actions/Jenkins. Sharding for speed.
*   **Pro Tip:** Emphasize that you would build a *hybrid* approach—using API calls to set up test state instantly, and only using the UI for the actual user journey being tested.

### 2. "Your test suite takes 2 hours. The team wants it under 15 minutes. What do you do?"
*   **What's being tested:** Optimization skills, CI/CD knowledge, test strategy.
*   **Structured Answer:**
    1.  **Analyze & Audit:** Review the suite. Are we testing API logic via the UI? Move those to API tests.
    2.  **API Data Setup:** Replace UI steps for login and prerequisite data creation with fast API calls.
    3.  **Parallelization:** Enable workers locally.
    4.  **CI Sharding:** Split the suite across 5-10 Jenkins nodes or GitHub Action runners.
    5.  **Test Selection:** Run only relevant tests (e.g., via dependency graph or tags) instead of the whole suite on every PR.
*   **Pro Tip:** Sharding is the silver bullet for CI time, but API state setup is the silver bullet for fundamental framework speed.

### 3. "How do you handle test data in a microservices environment where services share data?"
*   **What's being tested:** Complex data management, understanding of state.
*   **Structured Answer:** Avoid shared state. Every test should generate its own unique entities (using UUIDs or Faker) to prevent collisions when running in parallel. If downstream services need this data, we use the respective APIs to seed it before the test starts, and clean it up in `afterAll`/`afterEach`.
*   **Pro Tip:** Mention idempotency and the danger of relying on static database dumps.

### 4. "Your CI pipeline is flaky — 20% of builds fail due to test issues. How do you fix this?"
*   **What's being tested:** Debugging methodology, handling tech debt.
*   **Structured Answer:**
    1.  Identify the flaky tests using CI metrics (e.g., Allure or native CI analytics).
    2.  Move them to a "quarantine" suite. They run, but don't block the build. Restores dev trust.
    3.  Investigate roots: Usually it's race conditions (waiting for DOM instead of network), shared test data collisions, or environment instability.
    4.  Fix using proper explicit waits (Playwright auto-waiting, waiting for API responses).
*   **Pro Tip:** Never just add `sleep(5000)`. Always wait for a specific state (network idle, element visible, API response).

### 5. "How do you decide what to automate first in a new project?"
*   **What's being tested:** Prioritization, business acumen.
*   **Structured Answer:** Risk-based approach. 1) Happy path of the core business flow (e.g., Login -> Create Order -> Checkout). 2) High-frequency regression tasks. 3) Work down from P1 to P3 priorities.
*   **Pro Tip:** Ask product managers/devs: "If this broke in production, would it cause an immediate hotfix?" If yes, automate it first.

---

## Section 6: Behavioral Questions

### 1. "Tell me about a framework you built from scratch."
*   **What's being tested:** End-to-end ownership.
*   **Structured Answer (STAR):**
    *   **Situation:** At ServiceNow/current project, we lacked a cohesive E2E strategy.
    *   **Task:** Build a scalable, fast framework for the team.
    *   **Action:** Chose Playwright. Implemented POM with a BasePage abstract class. Created custom fixtures for typed interfaces. Integrated API calls for setup to reduce execution time. Added grep-based tagging.
    *   **Result:** Reduced test execution time significantly, increased reliability, and integrated it cleanly into the CI pipeline.
*   **Pro Tip:** Highlight the *decisions* you made (e.g., "I chose Playwright over Cypress because we needed native multi-tab support and better API testing integration").

### 2. "How did you achieve 100% regression automation at ServiceNow?"
*   **What's being tested:** Scaling automation, advanced techniques, agentic/AI integration.
*   **Structured Answer (STAR):**
    *   **Situation:** Massive backlog of manual regression cases.
    *   **Task:** Automate everything efficiently.
    *   **Action:** Leveraged MCP-based agentic test automation. Used AI to parse manual test steps, generate Playwright scripts, and self-heal brittle selectors. Coupled this with a rigorous review process.
    *   **Result:** Reached 100% coverage, shifting engineers from script writers to automation architects and reviewers.
*   **Pro Tip:** Zinier is looking at AI/ML. Highly emphasize how MCP/Agentic automation accelerated your output.

### 3. "Describe a time you had to convince the team to adopt a new testing tool."
*   **What's being tested:** Soft skills, influence, technical justification.
*   **Structured Answer (STAR):**
    *   **Situation:** Team was using an older, slower tool (e.g., Selenium/Nightwatch) and facing flakiness.
    *   **Task:** Transition to a modern tool (Playwright) without stopping current delivery.
    *   **Action:** I didn't just argue; I built a Proof of Concept (POC). I took the 5 flakiest tests, rewrote them in Playwright, and showed a side-by-side comparison of execution speed and code cleanliness.
    *   **Result:** The data won them over. We incrementally migrated the suite over 3 months.
*   **Pro Tip:** Engineers are convinced by data and working code, not just slide decks. Mentioning a "POC" is the winning keyword here.
