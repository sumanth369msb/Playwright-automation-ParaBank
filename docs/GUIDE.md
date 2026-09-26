# 🏦 Banking Test Automation Framework — Complete Guide

## Overview

This guide documents the enterprise-grade Playwright banking test automation framework built for testing complex banking applications like Wells Fargo, CIBC, or similar financial institutions. The framework targets **ParaBank** — a free, public demo banking application by Parasoft — solving the challenge of having no real banking app available.

---

## 📋 Table of Contents

1. [Architecture & Design Decisions](#architecture--design-decisions)
2. [Project Structure](#project-structure)
3. [Framework Components](#framework-components)
4. [Test Cases Inventory](#test-cases-inventory)
5. [Configuration & Scaling](#configuration--scaling)
6. [Running Tests](#running-tests)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Extending to 1000+ Tests](#extending-to-1000-tests)
9. [What Changed](#what-changed)

---

## Architecture & Design Decisions

### Why ParaBank?

> [!IMPORTANT]
> Since no real banking application or APIs were available, we chose **ParaBank** (https://parabank.parasoft.com/parabank/) — a purpose-built demo banking app by Parasoft that provides:
> - Real login/registration system
> - Account management (checking, savings, loans)
> - Fund transfers between accounts
> - Bill payment processing
> - Loan applications with approval/denial logic
> - Transaction history and search
> - REST API endpoints for test setup/teardown
> - Always-online public access (no deployment needed)

### Design Patterns Used

| Pattern | Purpose |
|---------|---------|
| **Page Object Model (POM)** | Encapsulates all page interactions in dedicated classes |
| **Abstract Base Page** | Common methods (click, fill, wait, screenshot) inherited by all pages |
| **Custom Fixtures** | Pre-configured Playwright test contexts with injected page objects |
| **Barrel Exports** | Clean import paths via `index.ts` re-exports |
| **Data Generators** | Random but valid test data for each run (prevents test collisions) |
| **Test Tagging** | `@smoke`, `@regression`, `@critical`, `@e2e` for suite selection |

---

## Project Structure

```
playwright_automation/
├── 📄 playwright.config.ts          # Multi-browser, multi-suite configuration
├── 📄 package.json                  # 30+ npm scripts for every scenario
├── 📄 tsconfig.json                 # Strict TypeScript with path aliases
├── 📄 README.md                     # Quick-start documentation
├── 📄 .env.example                  # Environment variable template
├── 📄 .gitignore                    # Comprehensive ignore rules
│
├── 📁 src/                          # Framework source code
│   ├── 📁 pages/                    # Page Object Models (12 files)
│   │   ├── BasePage.ts              # Abstract base with common methods
│   │   ├── LoginPage.ts             # Login form interactions
│   │   ├── RegisterPage.ts          # User registration flow
│   │   ├── AccountsOverviewPage.ts  # Accounts dashboard
│   │   ├── AccountDetailsPage.ts    # Individual account view
│   │   ├── OpenNewAccountPage.ts    # New account creation
│   │   ├── TransferFundsPage.ts     # Fund transfer operations
│   │   ├── BillPayPage.ts           # Bill payment processing
│   │   ├── FindTransactionsPage.ts  # Transaction search
│   │   ├── RequestLoanPage.ts       # Loan application
│   │   ├── UpdateProfilePage.ts     # Profile management
│   │   ├── NavigationComponent.ts   # Sidebar navigation
│   │   └── index.ts                 # Barrel export
│   │
│   ├── 📁 fixtures/                 # Custom Playwright Fixtures
│   │   ├── banking-fixtures.ts      # Extended test with all page objects
│   │   └── index.ts                 # Barrel export
│   │
│   ├── 📁 utils/                    # Utility Libraries
│   │   ├── constants.ts             # URLs, timeouts, error messages
│   │   ├── test-data.ts             # Data generators & credentials
│   │   ├── helpers.ts               # Currency parsing, retry logic
│   │   ├── api-helpers.ts           # ParaBank REST API helpers
│   │   ├── reporters/
│   │   │   └── custom-reporter.ts   # Banking-specific test reporter
│   │   └── index.ts                 # Barrel export
│   │
│   ├── 📁 types/                    # TypeScript Definitions
│   │   ├── banking.types.ts         # All banking domain interfaces
│   │   └── index.ts                 # Barrel export
│   │
│   └── 📁 data/                     # Test Data Files
│       └── test-fixtures.json       # Static test data for data-driven tests
│
├── 📁 tests/                        # Test Suites (50+ test cases)
│   ├── global.setup.ts              # Pre-test setup (DB init, health check)
│   ├── 📁 auth/                     # Authentication (13 tests)
│   │   ├── login.spec.ts            # Login scenarios
│   │   └── registration.spec.ts     # Registration scenarios
│   ├── 📁 accounts/                 # Account Management (15 tests)
│   │   ├── accounts-overview.spec.ts
│   │   ├── open-account.spec.ts
│   │   └── account-details.spec.ts
│   ├── 📁 transfers/                # Fund Transfers (8 tests)
│   │   └── transfer-funds.spec.ts
│   ├── 📁 bill-pay/                 # Bill Payments (7 tests)
│   │   └── bill-payment.spec.ts
│   ├── 📁 loans/                    # Loan Applications (5 tests)
│   │   └── request-loan.spec.ts
│   ├── 📁 transactions/             # Transaction Search (6 tests)
│   │   └── find-transactions.spec.ts
│   ├── 📁 profile/                  # Profile Management (4 tests)
│   │   └── update-profile.spec.ts
│   ├── 📁 navigation/               # Navigation & UI (5 tests)
│   │   └── navigation.spec.ts
│   ├── 📁 e2e/                      # End-to-End Workflows (5 tests)
│   │   └── banking-workflows.spec.ts
│   └── 📁 _legacy/                  # Archived original tests
│       ├── example.spec.ts
│       └── test-1.spec.ts
│
└── 📁 .github/workflows/           # CI/CD Pipeline
    └── playwright.yml               # GitHub Actions with sharding
```

---

## Framework Components

### Page Object Models

Each page object inherits from `BasePage` which provides:

```typescript
// Common methods available on ALL page objects
abstract class BasePage {
  navigate(path)          // Go to URL
  waitForPageLoad()       // Wait for DOM + network idle
  waitForLoad()           // Alias for tests
  isLoaded()              // Check if page is ready
  getTitle()              // Page title
  getUrl()                // Current URL
  takeScreenshot(name)    // Full-page screenshot
  waitForElement(sel)     // Wait for element visibility
  clickElement(sel)       // Click with auto-wait
  fillInput(sel, value)   // Fill input with auto-wait
  getText(sel)            // Get text content
  isVisible(sel)          // Check visibility
  isEnabled(sel)          // Check enabled state
  selectDropdown(sel, v)  // Select option
}
```

### Custom Fixtures

Tests import `test` and `expect` from the custom fixture file instead of `@playwright/test`:

```typescript
import { test, expect } from '../../src/fixtures/banking-fixtures';

// Available fixtures in every test:
test('example', async ({
  loginPage,              // LoginPage instance
  registerPage,           // RegisterPage instance
  accountsOverviewPage,   // AccountsOverviewPage instance
  transferFundsPage,      // TransferFundsPage instance
  billPayPage,            // BillPayPage instance
  findTransactionsPage,   // FindTransactionsPage instance
  openNewAccountPage,     // OpenNewAccountPage instance
  requestLoanPage,        // RequestLoanPage instance
  updateProfilePage,      // UpdateProfilePage instance
  accountDetailsPage,     // AccountDetailsPage instance
  navigation,             // NavigationComponent instance
  authenticatedPage,      // Auto-login fixture (call to get logged-in state)
}) => {
  // test code
});
```

### Test Data Generators

```typescript
import { generateUser, generatePayeeInfo, generateRandomAmount } from '../../src/utils/test-data';

const user = generateUser();       // Unique user with timestamp-based username
const payee = generatePayeeInfo(); // Random payee for bill payments
const amount = generateRandomAmount(10, 500); // Random dollar amount
```

---

## Test Cases Inventory

### Total: 55+ Test Cases across 9 domains

| Domain | File | Tests | Tags |
|--------|------|-------|------|
| **Login** | `tests/auth/login.spec.ts` | 8 | `@smoke`, `@regression`, `@critical` |
| **Registration** | `tests/auth/registration.spec.ts` | 5 | `@smoke`, `@regression`, `@critical` |
| **Accounts Overview** | `tests/accounts/accounts-overview.spec.ts` | 5 | `@smoke`, `@regression` |
| **Open Account** | `tests/accounts/open-account.spec.ts` | 5 | `@smoke`, `@regression`, `@critical` |
| **Account Details** | `tests/accounts/account-details.spec.ts` | 5 | `@smoke`, `@regression` |
| **Fund Transfers** | `tests/transfers/transfer-funds.spec.ts` | 8 | `@smoke`, `@regression`, `@transfers` |
| **Bill Payments** | `tests/bill-pay/bill-payment.spec.ts` | 7 | `@smoke`, `@regression` |
| **Loan Requests** | `tests/loans/request-loan.spec.ts` | 5 | `@regression`, `@loans` |
| **Find Transactions** | `tests/transactions/find-transactions.spec.ts` | 6 | `@regression`, `@transactions` |
| **Profile Updates** | `tests/profile/update-profile.spec.ts` | 4 | `@regression` |
| **Navigation & UI** | `tests/navigation/navigation.spec.ts` | 5 | `@smoke`, `@regression` |
| **E2E Workflows** | `tests/e2e/banking-workflows.spec.ts` | 5 | `@e2e`, `@critical` |

---

## Configuration & Scaling

### Playwright Config Highlights

```typescript
// playwright.config.ts key settings:
{
  fullyParallel: true,           // Run test files in parallel
  workers: process.env.CI ? 4 : undefined,  // Auto-detect locally
  retries: process.env.CI ? 2 : 1,          // Retry failed tests
  timeout: 60_000,               // 60s per test
  expect: { timeout: 10_000 },   // 10s for assertions

  // 7 project configurations:
  projects: [
    'setup',           // Global setup (DB init)
    'chromium',        // Primary browser
    'firefox',         // Cross-browser
    'webkit',          // Safari
    'mobile-chrome',   // Mobile viewport
    'mobile-safari',   // iOS viewport
    'smoke',           // @smoke tests only
    'regression',      // @regression tests only
  ]
}
```

### Multiple Reporters

- **Local**: HTML report + terminal list
- **CI**: HTML + JSON + JUnit + terminal list

---

## Running Tests

### Quick Commands

```bash
# All tests on Chromium
npm run test:chromium

# Smoke tests only (fast feedback)
npm run test:smoke

# Full regression
npm run test:regression

# By domain
npm run test:auth
npm run test:accounts
npm run test:transfers
npm run test:e2e

# Cross-browser
npm run test:firefox
npm run test:webkit
npm run test:mobile

# Debug mode (step through)
npm run test:debug

# High parallelism
npm run test:parallel     # 8 workers

# Sharded (for CI)
npm run test:shard-1      # Machine 1 of 4
npm run test:shard-2      # Machine 2 of 4
npm run test:shard-3      # Machine 3 of 4
npm run test:shard-4      # Machine 4 of 4
```

---

## CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/playwright.yml`) supports:

| Trigger | Suite | Sharding |
|---------|-------|----------|
| **Push to main/develop** | Smoke tests | No |
| **Pull Request** | Full regression | 4 shards |
| **Daily schedule (6 AM UTC)** | Full regression | 4 shards |
| **Manual dispatch** | Selectable suite | No |

### Sharded Execution

Tests are split across 4 parallel GitHub Actions runners:
```
Runner 1: Tests 1-14   ─┐
Runner 2: Tests 15-28   │─── All run simultaneously
Runner 3: Tests 29-42   │
Runner 4: Tests 43-55+ ─┘
```
Reports are merged automatically after all shards complete.

---

## Extending to 1000+ Tests

### Strategy for Scaling

1. **Add test files by domain** — Each domain folder can hold unlimited spec files
2. **Use data-driven testing** — One test function, multiple data sets:
   ```typescript
   const transferAmounts = [10, 100, 500, 1000, 5000];
   for (const amount of transferAmounts) {
     test(\`should transfer \$\${amount}\`, async ({ ... }) => { ... });
   }
   ```
3. **Increase shards** — Change `shard: [1/4, ...]` to `[1/8, ...]` or `[1/16, ...]`
4. **Add more workers** — `npm run test:parallel` already uses 8 workers
5. **Tag-based execution** — Add `@critical`, `@performance`, `@security` tags
6. **New domains** — Add folders like `tests/security/`, `tests/performance/`, `tests/accessibility/`

### Suggested New Test Domains for 1000+

| Domain | Potential Tests |
|--------|----------------|
| Security (XSS, CSRF, injection) | 50+ |
| API layer testing | 100+ |
| Performance/load scenarios | 30+ |
| Accessibility (a11y) | 40+ |
| Internationalization (i18n) | 30+ |
| Multi-user concurrent workflows | 20+ |
| Error handling edge cases | 50+ |
| Data-driven variations | 500+ |

---

## What Changed

### Files Created (New)
| File | Purpose |
|------|---------|
| `src/pages/BasePage.ts` | Abstract base class with common page methods |
| `src/pages/LoginPage.ts` | Login page object |
| `src/pages/RegisterPage.ts` | Registration page object |
| `src/pages/AccountsOverviewPage.ts` | Accounts dashboard page object |
| `src/pages/AccountDetailsPage.ts` | Account detail page object |
| `src/pages/OpenNewAccountPage.ts` | New account page object |
| `src/pages/TransferFundsPage.ts` | Transfer funds page object |
| `src/pages/BillPayPage.ts` | Bill payment page object |
| `src/pages/FindTransactionsPage.ts` | Transaction search page object |
| `src/pages/RequestLoanPage.ts` | Loan request page object |
| `src/pages/UpdateProfilePage.ts` | Profile update page object |
| `src/pages/NavigationComponent.ts` | Navigation component |
| `src/pages/index.ts` | Barrel export |
| `src/fixtures/banking-fixtures.ts` | Custom test fixtures |
| `src/fixtures/index.ts` | Barrel export |
| `src/utils/constants.ts` | Application constants |
| `src/utils/test-data.ts` | Test data generators |
| `src/utils/helpers.ts` | Utility functions |
| `src/utils/api-helpers.ts` | REST API helpers |
| `src/utils/reporters/custom-reporter.ts` | Custom reporter |
| `src/utils/index.ts` | Barrel export |
| `src/types/banking.types.ts` | TypeScript interfaces |
| `src/types/index.ts` | Barrel export |
| `src/data/test-fixtures.json` | Static test data |
| `tests/global.setup.ts` | Global pre-test setup |
| `tests/auth/login.spec.ts` | 8 login tests |
| `tests/auth/registration.spec.ts` | 5 registration tests |
| `tests/accounts/accounts-overview.spec.ts` | 5 overview tests |
| `tests/accounts/open-account.spec.ts` | 5 open account tests |
| `tests/accounts/account-details.spec.ts` | 5 detail tests |
| `tests/transfers/transfer-funds.spec.ts` | 8 transfer tests |
| `tests/bill-pay/bill-payment.spec.ts` | 7 bill pay tests |
| `tests/loans/request-loan.spec.ts` | 5 loan tests |
| `tests/transactions/find-transactions.spec.ts` | 6 search tests |
| `tests/profile/update-profile.spec.ts` | 4 profile tests |
| `tests/navigation/navigation.spec.ts` | 5 navigation tests |
| `tests/e2e/banking-workflows.spec.ts` | 5 e2e workflow tests |
| `README.md` | Project documentation |
| `.env.example` | Environment template |

### Files Modified
| File | Changes |
|------|---------|
| `playwright.config.ts` | Multi-browser projects, smoke/regression suites, multiple reporters, proper timeouts, ParaBank baseURL |
| `package.json` | 30+ npm scripts, renamed to "banking-automation-framework", version 2.0.0 |
| `tsconfig.json` | Path aliases, strict mode, includes src/ directory |
| `.gitignore` | Comprehensive rules for test artifacts |
| `.github/workflows/playwright.yml` | Enterprise CI/CD with sharding, smoke/regression/manual triggers |

### Files Archived
| File | Location |
|------|----------|
| `tests/example.spec.ts` | Moved to `tests/_legacy/` |
| `tests/test-1.spec.ts` | Moved to `tests/_legacy/` |

---

> [!TIP]
> To get started immediately, run `npm run test:smoke` for a quick validation that everything works, then explore `npm run test:chromium` for the full suite.
