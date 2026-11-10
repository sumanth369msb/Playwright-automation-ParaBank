# UI Automation Interview Preparation: Playwright & Selenium

This document is tailored for Sumanth's SDET-2 interview at Zinier, focusing on UI automation with Playwright (TypeScript) and Selenium (Java/Python). The interviewer is expected to probe deeply into architecture, framework design, and troubleshooting.

## Section 1: Playwright Deep Dive

### 1. How does Playwright's architecture differ from Selenium's?
*   **What's being tested:** Understanding of the underlying communication protocols and browser control mechanisms.
*   **Structured Answer:**
    *   **Selenium** uses the WebDriver protocol (W3C standard), which acts as a middleman. The test script communicates with the WebDriver via HTTP REST API, and the WebDriver translates these commands to the browser's native API. This can introduce latency and overhead.
    *   **Playwright** communicates directly with the browser using WebSockets and the Chrome DevTools Protocol (CDP) for Chromium (and similar protocols for WebKit/Firefox). It maintains a single, persistent WebSocket connection for the entire session. This allows for bidirectional communication (the browser can push events to Playwright, like network requests or DOM changes) making it significantly faster and enabling features like network interception and robust auto-waiting.
*   **Pro Tip:** Emphasize the *bidirectional* nature of WebSockets. In Selenium, you poll for state (is it there yet? is it there yet?). In Playwright, the browser *tells* Playwright when a state changes.

### 2. Explain Playwright's Browser Contexts. Why are they useful?
*   **What's being tested:** Understanding of isolation and parallel execution strategies.
*   **Structured Answer:**
    *   A Browser Context is an isolated incognito-like session within a single browser instance.
    *   Creating a context is extremely fast and cheap compared to launching a full browser.
    *   They are the foundation of Playwright's parallelism. Each test in Playwright gets its own isolated Browser Context by default. This guarantees zero state leakage between tests (cookies, local storage, session storage are all isolated).
    *   They allow testing multi-user scenarios in a single script (e.g., User A logs in Context 1, User B logs in Context 2, they chat).
*   **Pro Tip:** Mention how you use the `authenticatedPage` fixture in your framework to inject a pre-authenticated context, saving time by not repeating the login UI steps for every test.

### 3. What are the best practices for Locators in Playwright?
*   **What's being tested:** Knowledge of robust element selection and accessibility standards.
*   **Structured Answer:**
    *   Playwright strongly recommends user-facing locators that align with accessibility.
    *   **Priority 1:** `getByRole` (e.g., `page.getByRole('button', { name: 'Submit' })`). This is the most robust because it tests how assistive technologies see the page.
    *   **Priority 2:** `getByText`, `getByLabel`, `getByPlaceholder`.
    *   **Priority 3:** `getByTestId` (e.g., `data-testid="submit-btn"`). Useful when elements lack accessible roles or text, but requires source code changes.
    *   **Priority 4 (Avoid if possible):** CSS and XPath. They are tightly coupled to the DOM structure and easily break when the UI changes.
*   **Pro Tip:** If the interviewer asks about a scenario where `getByRole` fails, explain that sometimes developers misuse ARIA roles or build custom components poorly. In that case, `getByTestId` is the fallback, and you'd raise a bug/ticket for the lack of accessibility.

### 4. How does Playwright's Auto-waiting work?
*   **What's being tested:** Understanding of one of Playwright's core value propositions over older tools.
*   **Structured Answer:**
    *   Before performing an action (like `click()` or `fill()`), Playwright automatically waits for a series of "actionability" checks on the element.
    *   It checks if the element is: Attached to the DOM, Visible, Stable (not animating), Receives Events (not obscured by another element), and Enabled.
    *   If these conditions aren't met within the timeout, the action fails.
    *   This eliminates the need for arbitrary `sleep()` or explicit waits (like `WebDriverWait`) for standard interactions in 95% of cases.
*   **Pro Tip:** Contrast this with Selenium, where you often have to explicitly wait for an element to be clickable before clicking it, otherwise you risk a `ElementClickInterceptedException`.

### 5. Explain Network Interception in Playwright. Give a practical use case.
*   **What's being tested:** Ability to isolate UI tests from backend instability and test edge cases.
*   **Structured Answer:**
    *   Playwright can intercept network requests made by the page using `page.route()`.
    *   **Mocking:** You can fulfill a request with mock data instead of letting it hit the real server (`route.fulfill({ json: mockData })`). This is crucial for testing UI states when the backend is down, slow, or when you want to force specific responses (e.g., a 500 error).
    *   **Modifying:** You can intercept a request, modify its headers or payload, and let it continue (`route.continue()`).
    *   **Blocking:** You can block unnecessary resources (like analytics scripts or heavy images) to speed up test execution (`route.abort()`).
*   **Pro Tip:** Mention that in the ParaBank framework, if you wanted to test the UI for a failed transfer without actually manipulating the backend state, you could mock the `/transfer` API endpoint to return a specific error code.

### 6. How do custom fixtures work in Playwright? Why use them over traditional setup methods (beforeEach)?
*   **What's being tested:** Advanced framework architecture and state management.
*   **Structured Answer:**
    *   Fixtures encapsulate setup and teardown logic. They are passed to tests via Dependency Injection.
    *   **Scoping:** They can be test-scoped (instantiated per test) or worker-scoped (instantiated once per worker process).
    *   **Lazy Evaluation:** A fixture is only executed if the test explicitly requests it in its argument list. `beforeEach` runs for *every* test in the block, even if the test doesn't need that specific setup.
    *   **Encapsulation & Reusability:** Fixtures handle their own teardown (the code after the `use()` statement), making cleanup reliable even if the test fails.
*   **Pro Tip:** Reference your `banking-fixtures.ts`. Explain how extending `baseTest` with `BankingFixtures` provides type-safe dependency injection for your Page Objects (e.g., `loginPage`, `accountsOverviewPage`). The test just asks for `loginPage`, and the fixture instantiates it and passes it in.

## Section 2: Selenium (Java/Python)

### 1. Explain the different types of waits in Selenium.
*   **What's being tested:** Core WebDriver mechanics for handling async behavior.
*   **Structured Answer:**
    *   **Implicit Wait:** Set once globally for the WebDriver instance. It tells WebDriver to poll the DOM for a specified time when trying to find an element if it's not immediately available. *Anti-pattern:* Mixing implicit and explicit waits can cause unpredictable timeout durations.
    *   **Explicit Wait (WebDriverWait):** Applied to a specific element and condition (e.g., `ExpectedConditions.visibilityOfElementLocated`). It waits until the condition is met or the timeout expires. Best practice for dynamic pages.
    *   **Fluent Wait:** An extension of Explicit Wait. Allows you to define the maximum timeout, the polling frequency, and specify exceptions to ignore (like `NoSuchElementException`) while polling.
*   **Pro Tip:** Be definitive: Explicit Waits are superior. They are precise. Implicit waits are a blunt instrument that slows down tests when asserting that an element is *not* present.

### 2. How do you handle a `StaleElementReferenceException`?
*   **What's being tested:** Real-world debugging experience with dynamic DOMs.
*   **Structured Answer:**
    *   **Cause:** The element was found, but before the action was performed, the DOM was updated (e.g., via JavaScript/AJAX), and the reference to that specific DOM node is no longer valid.
    *   **Solution 1 (The Selenium Way):** Re-locate the element immediately before interacting with it. Wrap the location and interaction in a try-catch block or a loop that retries a few times.
    *   **Solution 2 (Page Object Model):** Don't store WebElements as class variables unless using `PageFactory` (which has lazy initialization but its own issues). Instead, store Locators (By objects) and find the element inside the interaction method (`driver.findElement(myLocator).click()`).
*   **Pro Tip:** Contrast this with Playwright. Playwright's locators are "strict" and evaluated lazily at the moment of action. Playwright rarely suffers from StaleElement problems because it automatically re-evaluates the locator during its actionability checks.

### 3. Selenium vs. Playwright: Which would you choose and why?
*   **What's being tested:** Ability to evaluate tooling objectively based on project needs.
*   **Structured Answer:**
    *   **Choose Playwright when:** Building a modern automation framework from scratch for a web app (React, Angular, Vue). You need speed, built-in auto-waiting, easy network mocking, out-of-the-box parallel execution, and excellent debugging tools (Trace Viewer).
    *   **Choose Selenium when:** You have a massive legacy codebase in Java/C#, need to test on obscure or older browsers (IE11, older Safari versions), or require specific integrations that only exist in the massive Selenium ecosystem. You are also testing mobile native apps (via Appium, which shares WebDriver architecture).
    *   *Conclusion:* For modern web testing, Playwright is vastly superior due to its architecture and developer experience.

## Section 3: Page Object Model & Framework Design

### 1. What belongs in a `BasePage` class?
*   **What's being tested:** Object-oriented design principles and DRY (Don't Repeat Yourself).
*   **Structured Answer:**
    *   The `BasePage` should contain common interactions that apply across multiple pages.
    *   It wraps the raw automation tool commands (e.g., Playwright's `page.click()`) with custom logic, logging, or error handling.
    *   Examples from your framework: `navigate()`, `waitForPageLoad()`, `clickElement()`, `fillInput()`, `getText()`, `selectDropdown()`.
    *   **Anti-pattern:** Storing specific application locators in the `BasePage`. `BasePage` should be application-agnostic.
*   **Pro Tip:** Explain that your `BasePage` might wrap `page.click()` with an automatic step in the reporter, or add a custom wait before clicking if a specific application requires it globally.

### 2. Explain the Component Pattern (e.g., your `NavigationComponent`).
*   **What's being tested:** Advanced POM structuring beyond flat page classes.
*   **Structured Answer:**
    *   Pages often share complex UI blocks (headers, footers, sidebars, complex data tables).
    *   Instead of duplicating locator logic for the header in every page object, or bloating the `BasePage`, you create a `NavigationComponent`.
    *   This component encapsulates the locators and actions for that specific UI block. Other Page Objects can instantiate or inherit this component.
*   **Pro Tip:** State that this adheres to the Single Responsibility Principle. The `AccountsOverviewPage` shouldn't care how to click the "Logout" button in the header; the `NavigationComponent` handles that.

### 3. How do you handle Page Transitions in POM?
*   **What's being tested:** Ensuring robust state management between actions.
*   **Structured Answer:**
    *   When an action on Page A causes a navigation to Page B (e.g., clicking 'Login' on LoginPage goes to AccountsOverviewPage), the method in Page A should handle this.
    *   **Approach 1 (Fluent):** The `login()` method returns an instance of `AccountsOverviewPage`.
    *   **Approach 2 (Assertions):** The method completes the action, and the test itself handles the instantiation of the next page and asserts it's loaded.
    *   In Playwright with fixtures, Approach 2 is often cleaner because the fixtures manage instantiation. You perform the action, then assert the URL or a key element on the new page using the expected page object's `isLoaded()` method.

## Section 4: CI/CD Integration

### 1. How do you handle test sharding and parallel execution in CI?
*   **What's being tested:** Scalability of test execution.
*   **Structured Answer:**
    *   **Playwright Workers:** Locally, Playwright runs tests in parallel using multiple OS processes (workers).
    *   **CI Sharding:** To scale beyond one machine, you use sharding. You divide the test suite into fractions (e.g., 4 shards) and run them on 4 separate CI runners/containers simultaneously.
    *   Playwright CLI supports this natively: `npx playwright test --shard=1/4`.
    *   The challenge is merging the reports afterward. Playwright provides a blob report format specifically designed to be merged after sharded runs complete.
*   **Pro Tip:** Mention how you configure GitHub Actions/Jenkins matrix jobs to spin up the shards dynamically and upload the blob reports as artifacts, followed by a final job to merge them.

### 2. What is your strategy for selecting which tests to run in CI?
*   **What's being tested:** Balancing feedback speed with test coverage.
*   **Structured Answer:**
    *   Not all tests should run on every commit.
    *   **Pull Request/Commit:** Run a `@smoke` suite (fast, critical paths only) and perhaps run tests specifically impacted by the changed code (if using a smart selection tool).
    *   **Nightly/Pre-Release:** Run the full `@regression` suite.
    *   Use Playwright's `grep` feature to filter tests by tags in the CI pipeline commands.

## Section 5: Situational Questions

### 1. Your Playwright tests pass locally but fail in CI. How do you debug?
*   **What's being tested:** Real-world troubleshooting methodology.
*   **Structured Answer:**
    1.  **Analyze the CI Report:** Look at the failure logs. Is it a timeout? An assertion failure?
    2.  **Examine Artifacts:** This is crucial. Check the Playwright Trace Viewer (`trace.zip`), screenshots, and videos generated in CI. The Trace Viewer almost always reveals the issue (e.g., network request failed, UI element was obscured by a modal that only appears in the CI environment).
    3.  **Environment Differences:**
        *   **Headless vs Headed:** CI runs headless. Sometimes UI renders slightly differently.
        *   **Screen Size:** Ensure the CI browser context viewport matches local.
        *   **Network Speed/Latency:** CI runners might be slower. Ensure auto-waiting and timeouts are sufficient, or mock flaky endpoints.
        *   **Timezones/Locales:** Check if the CI runner uses UTC while local uses PST, affecting date tests.
    4.  **Reproduce:** Try to run the exact command used in CI locally (e.g., headless, specific project).

### 2. The application changed its login flow. 50 tests broke. What's your refactoring strategy?
*   **What's being tested:** Maintainability of framework design.
*   **Structured Answer:**
    *   If the framework is designed correctly (POM + Fixtures), 50 tests should *not* need updating.
    *   I would update the locators and methods in the `LoginPage` object.
    *   If I'm using an `authenticatedPage` fixture or a global setup script that handles login via API (to bypass the UI for non-auth tests), I only update that one central location.
    *   The tests themselves (which just call `loginPage.login(user, pass)`) should remain untouched.
*   **Pro Tip:** This is the perfect time to highlight the value of the `authenticatedPage` fixture in your ParaBank framework. It isolates login failures to the auth domain tests, preventing cascading failures across the suite.

### 3. How do you handle test flakiness in UI automation?
*   **What's being tested:** Maturity and realistic expectations of UI testing.
*   **Structured Answer:**
    *   **Identify:** Use CI metrics to identify tests that frequently flip between pass and fail.
    *   **Isolate:** Quarantine flaky tests (remove them from the critical blocking pipeline) so they don't erode developer trust, but keep running them to gather data.
    *   **Root Cause Analysis:**
        *   *Wait Issues:* Are we explicitly waiting instead of relying on state? (Use Playwright web-first assertions like `expect(locator).toBeVisible()`).
        *   *State Leakage:* Is a previous test leaving dirty data? Ensure database/API teardowns are robust, or use isolated Browser Contexts.
        *   *Third-Party Dependencies:* Is an external API slow? Mock it.
    *   **Retry Logic:** As a last resort, configure Playwright to retry failures (e.g., `retries: 2` in config).

## Section 6: Behavioral Questions

### 1. Tell me about a time you had to make a tradeoff in your framework design.
*   **What's being tested:** Architectural decision-making and pragmatism.
*   **Structured Answer (Example):** "In the ParaBank framework, I had to choose between using traditional Page Object instantiation (`new LoginPage(page)`) in every test versus using Playwright Fixtures. Traditional POM was easier for junior QA to understand immediately. However, I chose Fixtures. The tradeoff was a steeper learning curve initially (understanding Dependency Injection), but the long-term benefit was massive: less boilerplate in tests, guaranteed safe teardowns, and the ability to inject complex, pre-authenticated states efficiently. I mitigated the learning curve by documenting the `banking-fixtures.ts` extensively."

### 2. How do you handle the maintenance burden of UI automation?
*   **What's being tested:** Long-term thinking. Automation is code; it needs maintenance.
*   **Structured Answer:**
    *   **Shift Left:** Write fewer UI tests. Push tests down the pyramid to the API or Unit level whenever possible. UI tests should focus on critical end-to-end flows.
    *   **Strict Code Reviews:** Treat automation code like production code. Enforce POM, DRY principles, and proper naming conventions during PR reviews.
    *   **Use Data Attributes:** Advocate for developers to add `data-testid` attributes to critical elements to decouple tests from CSS/DOM changes.
    *   **Regular Refactoring:** Dedicate time in sprints to refactor the framework, update dependencies, and clean up technical debt.
