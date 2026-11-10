# 🔌 ParaBank REST API Test Automation Guide (Playwright)

## Overview

This repository features an enterprise-grade **REST API Test Automation Framework** built on Playwright's native `APIRequestContext`. It provides 100% coverage of all endpoints exposed by Parasoft's ParaBank application (`/parabank/services/bank`), including authentication, customer management, account lifecycle, fund transfers, bill payments, deposits, withdrawals, loan applications, transaction searches, and database administration.

---

## 🏗️ Architecture

```
Playwright API Framework
├── src/
│   ├── api/
│   │   └── BankingAPI.ts               # Core strongly-typed API Client
│   ├── types/
│   │   ├── api.types.ts                # Request & response data models
│   │   └── index.ts                    # Central types export
│   └── utils/
│       ├── xml-parser.ts               # Resilient XML tag/block extraction & schema parser
│       └── api-helpers.ts              # API helpers for hybrid UI/API test setup
└── tests/api/
    ├── auth-api.spec.ts                # Authentication, sessions & security tests
    ├── customers-api.spec.ts           # Customer profile retrieval & update suite
    ├── accounts-api.spec.ts            # Account inquiries & account creation (Checking/Savings)
    ├── transfers-billpay-api.spec.ts   # Transfers, Deposits, Withdrawals & Bill Pay
    ├── transactions-api.spec.ts        # Transaction inquiry & multi-attribute search
    ├── loans-api.spec.ts               # Loan request lifecycle (Approval / Denial)
    ├── admin-db-api.spec.ts            # cleanDB, initializeDB & idempotency suite
    └── banking-api.spec.ts             # Full end-to-end integration workflow test
```

---

## 📋 Comprehensive Endpoint Coverage Matrix

| Domain | Method | Endpoint Path | Coverage Status | Test Suite |
|---|---|---|---|---|
| **Auth** | `GET` | `/parabank/services/bank/login/{username}/{password}` | ✅ Covered | `auth-api.spec.ts` |
| **Customer** | `GET` | `/parabank/services/bank/customers/{customerId}` | ✅ Covered | `customers-api.spec.ts` |
| | `POST` | `/parabank/services/bank/customers/update/{customerId}` | ✅ Covered | `customers-api.spec.ts` |
| **Accounts** | `GET` | `/parabank/services/bank/customers/{customerId}/accounts` | ✅ Covered | `accounts-api.spec.ts` |
| | `GET` | `/parabank/services/bank/accounts/{accountId}` | ✅ Covered | `accounts-api.spec.ts` |
| | `POST` | `/parabank/services/bank/createAccount` | ✅ Covered | `accounts-api.spec.ts` |
| **Transfers** | `POST` | `/parabank/services/bank/transfer` | ✅ Covered | `transfers-billpay-api.spec.ts` |
| | `POST` | `/parabank/services/bank/deposit` | ✅ Covered | `transfers-billpay-api.spec.ts` |
| | `POST` | `/parabank/services/bank/withdraw` | ✅ Covered | `transfers-billpay-api.spec.ts` |
| | `POST` | `/parabank/services/bank/billpay` | ✅ Covered | `transfers-billpay-api.spec.ts` |
| **Transactions** | `GET` | `/parabank/services/bank/accounts/{accountId}/transactions` | ✅ Covered | `transactions-api.spec.ts` |
| | `GET` | `/parabank/services/bank/transactions/{transactionId}` | ✅ Covered | `transactions-api.spec.ts` |
| | `GET` | `/parabank/services/bank/accounts/{accountId}/transactions/onDate/{date}` | ✅ Covered | `transactions-api.spec.ts` |
| | `GET` | `/parabank/services/bank/accounts/{accountId}/transactions/fromDate/{from}/toDate/{to}` | ✅ Covered | `transactions-api.spec.ts` |
| | `GET` | `/parabank/services/bank/accounts/{accountId}/transactions/amount/{amount}` | ✅ Covered | `transactions-api.spec.ts` |
| | `GET` | `/parabank/services/bank/accounts/{accountId}/transactions/month/{month}/type/{type}` | ✅ Covered | `transactions-api.spec.ts` |
| **Loans** | `POST` | `/parabank/services/bank/requestLoan` | ✅ Covered | `loans-api.spec.ts` |
| **Admin** | `POST` | `/parabank/services/bank/cleanDB` | ✅ Covered | `admin-db-api.spec.ts` |
| | `POST` | `/parabank/services/bank/initializeDB` | ✅ Covered | `admin-db-api.spec.ts` |

---

## 🧪 Test Suites & Coverage Breakdown

### 1. Authentication & Security (`tests/api/auth-api.spec.ts`)
- **Positive:** Standard credential authentication, latency SLA compliance (< 10s), XML schema verification.
- **Negative:** Invalid password handling, non-existent customer credentials.
- **Security:** SQL injection probe (`' OR '1'='1`), malicious string sanitation, special character handling.

### 2. Customer Management (`tests/api/customers-api.spec.ts`)
- **Positive:** Query profile by customer ID, update customer contact info (city, phone), verify persistence via subsequent GET request.
- **Negative & Edge Cases:** Non-existent customer IDs, malformed alphanumeric ID formats, partial profile updates.

### 3. Account Lifecycle (`tests/api/accounts-api.spec.ts`)
- **Positive:** Retrieve account portfolios, query specific balances, open new Checking accounts (`type = 0`), open new Savings accounts (`type = 1`).
- **Negative:** Invalid account IDs, query non-existent customer portfolios, attempt to fund account creation from non-existent source accounts.

### 4. Transfers & Payments (`tests/api/transfers-billpay-api.spec.ts`)
- **Positive:** Fund transfers between distinct accounts, account deposits, cash withdrawals, and electronic bill pay execution.
- **Negative & Edge Cases:** Negative amounts, transfers to non-existent target accounts, transfers from non-existent sources, invalid account parameter formats.

### 5. Transaction Inquiries & Search (`tests/api/transactions-api.spec.ts`)
- **Positive:** List all transactions for an account, query specific transaction by ID, filter by amount, filter by date (`MM-DD-YYYY`), filter by date range, filter by month and type.
- **Negative:** Non-existent transaction IDs, non-existent account IDs, malformed date formats.

### 6. Loan Applications (`tests/api/loans-api.spec.ts`)
- **Positive & Business Logic:** Eligible loan applications (approved with new account ID generated), ineligible high-ratio loans (denied with rejection reason).
- **Negative:** Negative loan amount, negative down payment, invalid customer IDs, invalid funding accounts.

### 7. Database Administration (`tests/api/admin-db-api.spec.ts`)
- **Positive:** Execute `cleanDB`, execute `initializeDB`.
- **Reliability:** Idempotency verification (repeated cleanDB calls succeed without server exceptions), environment state validation.

### 8. End-to-End API Workflow (`tests/api/banking-api.spec.ts`)
- Sequential 9-step business flow: Authenticate -> List Accounts -> Check Balance -> Open Savings -> Deposit -> Transfer -> Verify Transaction History -> Apply for Loan -> Reset Database.

---

## 🚀 Execution Commands

Execute all API tests or targeted suites using npm scripts:

```bash
# Run all API tests headless in the dedicated API project
npm run test:api

# Run specific functional suites
npm run test:api:auth           # Authentication & Security
npm run test:api:customers      # Customer Profiles
npm run test:api:accounts       # Accounts & Balances
npm run test:api:transfers      # Transfers, Deposits & Bill Pay
npm run test:api:transactions   # Transaction Search
npm run test:api:loans          # Loan Applications
npm run test:api:admin          # DB Clean & Initialization
npm run test:api:e2e            # End-to-End API Workflow
```

Or run via Playwright CLI:
```bash
npx playwright test tests/api/ --project=api --reporter=list,html
```
