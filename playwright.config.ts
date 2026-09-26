import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Enterprise Banking Test Automation Configuration
 * Target: ParaBank Demo Banking Application
 * 
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'https://parabank.parasoft.com/parabank';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Test directory — organized by banking domain */
  testDir: './tests',

  /* Run tests in files in parallel for speed */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests — more retries on CI for flakiness */
  retries: process.env.CI ? 2 : 1,

  /* Parallel workers — scale based on environment */
  workers: process.env.CI ? 4 : undefined,

  /* Folder for test artifacts such as screenshots, videos, traces */
  outputDir: 'test-results',

  /* Preserve test artifacts */
  preserveOutput: 'always',

  /* Reporter configuration — multiple reporters for enterprise needs */
  reporter: process.env.CI
    ? [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit-results.xml' }],
        ['list'],
      ]
    : [
        ['html', { open: 'on-failure', outputFolder: 'playwright-report' }],
        ['list'],
      ],

  /* Global timeout for each test — 60 seconds */
  timeout: 60_000,

  /* Expect timeout — 10 seconds for assertions */
  expect: {
    timeout: 10_000,
  },

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for ParaBank */
    baseURL: BASE_URL,

    /* Run browser in headless mode */
    headless: true,

    /* Collect trace on first retry for debugging */
    trace: 'on-first-retry',

    /* Capture screenshot only on failure to save resources */
    screenshot: 'only-on-failure',

    /* Video recording off by default — enable per-test if needed */
    video: 'off',

    /* Navigation timeout */
    navigationTimeout: 30_000,

    /* Action timeout */
    actionTimeout: 15_000,

    /* Viewport size */
    viewport: { width: 1280, height: 720 },

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Configure projects for parallel multi-browser testing */
  projects: [
    /* ========== Setup Projects ========== */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* ========== Primary Browser ========== */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    /* ========== Cross-browser Testing ========== */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    /* ========== Mobile Testing ========== */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    /* ========== Smoke Test Suite (fast feedback) ========== */
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      grep: /@smoke/,
      dependencies: ['setup'],
    },

    /* ========== Regression Suite ========== */
    {
      name: 'regression',
      use: { ...devices['Desktop Chrome'] },
      grep: /@regression/,
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
