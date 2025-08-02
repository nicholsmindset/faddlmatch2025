import { defineConfig, devices } from '@playwright/test';

/**
 * FADDL Match E2E Test Configuration
 * Comprehensive testing for Islamic matrimonial platform
 * Focus: Real-time messaging, Guardian oversight, Islamic compliance
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  /* Global test timeout */
  timeout: 30 * 1000,
  expect: {
    /* Timeout for expect() calls */
    timeout: 10 * 1000,
  },
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for all tests */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Record video for failed tests */
    video: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Global timeout for actions */
    actionTimeout: 10 * 1000,
    
    /* Navigation timeout */
    navigationTimeout: 10 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable performance monitoring
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'] 
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'] 
      },
      dependencies: ['setup'],
    },

    /* Mobile testing */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'] 
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'] 
      },
      dependencies: ['setup'],
    },

    /* Islamic compliance specific testing */
    {
      name: 'islamic-compliance',
      testDir: './tests/e2e/compliance',
      use: { 
        ...devices['Desktop Chrome'],
        // Extended timeout for content moderation tests
        actionTimeout: 15 * 1000,
      },
      dependencies: ['setup'],
    },

    /* Performance testing */
    {
      name: 'performance',
      testDir: './tests/e2e/performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Performance monitoring configuration
        video: 'off', // Disable video for performance tests
        trace: 'off', // Disable trace for performance tests
      },
      dependencies: ['setup'],
    },

    /* Real-time messaging tests */
    {
      name: 'real-time',
      testDir: './tests/e2e/messaging',
      use: { 
        ...devices['Desktop Chrome'],
        // Real-time test configuration
        actionTimeout: 5 * 1000, // Faster timeouts for real-time tests
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI 
    ? undefined 
    : {
        command: 'cd apps/web && npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/config/global-setup.ts'),
  globalTeardown: require.resolve('./tests/config/global-teardown.ts'),
});