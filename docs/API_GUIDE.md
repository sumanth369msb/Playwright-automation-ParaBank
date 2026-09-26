# 🔌 API Test Automation Guide (Playwright)

## Overview

Playwright isn't just for UI automation—it has a powerful built-in `APIRequestContext` that eliminates the need for third-party libraries like `Axios` or `Supertest`. 

We have successfully integrated enterprise-grade **REST API Automation** into your ParaBank framework! This allows you to test backend services independently or create "Hybrid Tests" (where test data is instantly set up via API before a UI test runs).

## 📁 Architecture Additions

1. **`src/api/BankingAPI.ts`**: A dedicated API Client Class. This isolates all the HTTP methods (`GET`, `POST`), endpoint paths, headers, and serialization logic from your actual test cases.
2. **`tests/api/banking-api.spec.ts`**: The actual test suite asserting the API responses.
3. **`package.json`**: Added a `npm run test:api` command for seamless pipeline integration.

---

## 🛠️ The ParaBank API Client

Parasoft's ParaBank demo application natively runs on XML-based REST APIs. 

The new `BankingAPI.ts` client handles the following critical endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/parabank/services/bank/login/{username}/{password}` | `GET` | Authenticates and returns Customer XML |
| `/parabank/services/bank/customers/{customerId}/accounts` | `GET` | Retrieves all accounts for a customer |
| `/parabank/services/bank/accounts/{accountId}` | `GET` | Retrieves specific account balances |
| `/parabank/services/bank/createAccount` | `POST` | Opens a new Checking/Savings account |
| `/parabank/services/bank/transfer` | `POST` | Transfers funds between accounts |

---

## 💡 Best Practices Implemented

### 1. Serial Test Execution
Because API testing often involves state changes (e.g., you must Login before you get a `customerId`, and you must create an account before you can `transfer` to it), we use `test.describe.serial()`. This ensures the tests run sequentially, passing variables (like `customerId`) down the chain.

### 2. Manual `request` Context
Playwright's default `{ request }` fixture is torn down after every individual test. To share the same session/state across `beforeAll` and multiple tests, we manually initialized it:
```typescript
let apiContext;
test.beforeAll(async () => {
  apiContext = await request.newContext({ baseURL: BASE_URL });
  bankingAPI = new BankingAPI(apiContext);
});
test.afterAll(async () => {
  await apiContext.dispose();
});
```

### 3. XML Parsing vs Regex
Since ParaBank natively returns XML without standard REST JSON headers, we avoided forcing JSON (which can cause 406 Not Acceptable errors in ParaBank). Instead, we safely extract exact values using `response.text()` and lightweight Regex (e.g., `text.match(/<id>(\d+)<\/id>/)`).

---

## 🚀 How to Run the API Tests

You can run your API tests completely headless and lightning-fast using the new npm script:

```bash
npm run test:api
```

*(You can also use the standard Playwright UI runner `npx playwright test --ui` and check only the `tests/api` folder).*
