# Banking Test Automation Framework

Enterprise-grade Playwright test automation framework for banking applications, targeting [ParaBank](https://parabank.parasoft.com/parabank/) demo banking application.

## 🏗 Architecture

```
├── src/
│   ├── pages/          # Page Object Models
│   ├── fixtures/       # Custom Playwright fixtures
│   ├── utils/          # Helpers, constants, test data
│   ├── types/          # TypeScript type definitions
│   └── data/           # Test data files
├── tests/
│   ├── auth/           # Authentication tests
│   ├── accounts/       # Account management tests
│   ├── transfers/      # Fund transfer tests
│   ├── bill-pay/       # Bill payment tests
│   ├── loans/          # Loan application tests
│   ├── transactions/   # Transaction search tests
│   ├── profile/        # Profile management tests
│   ├── navigation/     # Navigation & UI tests
│   └── e2e/            # End-to-end workflows
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install browsers
npx playwright install --with-deps

# Run all tests
npm test

# Run with browser visible
npm run test:headed
```

## 📋 Test Suites

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:smoke` | Run smoke tests only |
| `npm run test:regression` | Run regression suite |
| `npm run test:chromium` | Run on Chromium only |
| `npm run test:firefox` | Run on Firefox only |
| `npm run test:webkit` | Run on Safari/WebKit only |
| `npm run test:mobile` | Run mobile viewport tests |
| `npm run test:parallel` | Run with 8 workers |
| `npm run test:auth` | Run authentication tests |
| `npm run test:accounts` | Run account tests |
| `npm run test:transfers` | Run transfer tests |
| `npm run test:e2e` | Run end-to-end workflows |

## 🔀 Sharding (for CI/CD)

```bash
# Split tests across 4 machines
npm run test:shard-1  # Machine 1
npm run test:shard-2  # Machine 2
npm run test:shard-3  # Machine 3
npm run test:shard-4  # Machine 4
```

## 📊 Reports

```bash
# Open HTML report
npm run report
```

## 🔧 Development

```bash
# Record new tests
npm run codegen

# Debug tests
npm run test:debug

# Type check
npm run lint
```

## 📐 Design Patterns

- **Page Object Model (POM)** — All page interactions encapsulated in page classes
- **Custom Fixtures** — Pre-configured test contexts with page objects
- **Test Data Generators** — Random but valid banking test data
- **Base Page Pattern** — Common actions inherited by all pages
- **Barrel Exports** — Clean import paths via index.ts files

## 📝 License

ISC
