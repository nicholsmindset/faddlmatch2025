import { defineConfig, devices } from '@playwright/test';

/**
 * FADDL Match E2E Test Configuration
 * Comprehensive testing for Islamic matrimonial platform
 * Focus: Real-time messaging, Guardian oversight, Islamic compliance
 */
export default defineConfig({
  testDir: './tests',
  
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
  
  /* Global test timeout - extended for security tests */
  timeout: 60 * 1000,
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
    
    // Security Tests - Critical Priority
    {
      name: 'security-auth-flow',
      testMatch: 'tests/security/auth-security-test-suite.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'security-webhooks',
      testMatch: 'tests/security/webhook-security-tests.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'security-vulnerability-assessment',
      testMatch: 'tests/security/vulnerability-assessment.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'security-monitoring',
      testMatch: 'tests/security/auth-monitoring-tests.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    
    // Performance Tests
    {
      name: 'performance-auth',
      testMatch: 'tests/performance/auth-performance-tests.ts',
      use: { 
        ...devices['Desktop Chrome'],
        video: 'off', // Disable video for performance tests
        trace: 'off', // Disable trace for performance tests
      },
      dependencies: ['setup'],
    },
    
    // Reliability Tests
    {
      name: 'reliability-auth',
      testMatch: 'tests/reliability/auth-reliability-tests.ts',
      use: { 
        ...devices['Desktop Chrome'],
        actionTimeout: 60000, // Longer timeout for reliability tests
        navigationTimeout: 60000,
      },
      dependencies: ['setup'],
      timeout: 120000, // 2 minute timeout for chaos engineering tests
    },

    // Cross-browser security testing
    {
      name: 'security-firefox',
      testMatch: 'tests/security/auth-security-test-suite.ts',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'security-webkit',
      testMatch: 'tests/security/auth-security-test-suite.ts',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // Mobile security testing
    {
      name: 'security-mobile-chrome',
      testMatch: 'tests/security/auth-security-test-suite.ts',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },

    {
      name: 'security-mobile-safari',
      testMatch: 'tests/security/auth-security-test-suite.ts',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    // E2E Tests (existing)
    {
      name: 'e2e-chromium',
      testMatch: 'tests/e2e/**/*.ts',
      use: { 
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
      dependencies: ['setup'],
    },

    {
      name: 'e2e-firefox',
      testMatch: 'tests/e2e/**/*.ts',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'e2e-webkit',
      testMatch: 'tests/e2e/**/*.ts',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    {
      name: 'e2e-mobile-chrome',
      testMatch: 'tests/e2e/**/*.ts',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'e2e-mobile-safari',
      testMatch: 'tests/e2e/**/*.ts',
      use: { ...devices['iPhone 12'] },
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
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});