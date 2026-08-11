import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for UniEats
 * 
 * Run with:
 *   npm run test:e2e          — headless
 *   npm run test:e2e:headed   — headed (watch)
 *   npm run test:e2e:ui       — interactive UI mode
 *   npm run test:walkthrough    — headed walkthrough (all flows linked)
 *   npm run test:walkthrough:ui — walkthrough in Playwright UI Mode
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,        // Run tests sequentially since flows are interconnected
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                  // Single worker for sequential execution
  reporter: [['html', { open: 'never' }], ['list']],
  
  timeout: 60_000,             // 60s per test
  expect: {
    timeout: 10_000,           // 10s for assertions
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: 'http://localhost:5091/api',
        VITE_APP_NAME: 'UniEats',
        VITE_JWT_ISSUER: 'ShoppingFoodAPI',
        VITE_JWT_AUDIENCE: 'ShoppingFoodClient',
      },
    },
  ],

  projects: [
    // Auth setup — runs first and saves login states
    {
      name: 'auth-setup',
      testDir: './e2e/helpers',
      testMatch: 'auth-setup.ts',
    },
    // Desktop Chrome tests
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['auth-setup'],
    },
    // Headed walkthrough — links all business flows for visual review
    {
      name: 'walkthrough',
      testDir: './e2e/walkthrough',
      timeout: 600_000,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        headless: false,
        video: 'on',
        trace: 'on',
        launchOptions: {
          slowMo: Number(process.env.WALKTHROUGH_SLOW_MO ?? 400),
        },
      },
    },
  ],
});
