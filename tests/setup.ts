/**
 * Global Test Setup
 * Configures the test environment and provides global utilities
 */

import { test as base, expect } from '@playwright/test';
import { authenticateUser, getCurrentUser } from './helpers/auth-helpers';
import { testApiResponseTime, validateMessageDelivery } from './helpers/api-helpers';
import { validateIslamicContent } from './helpers/islamic-content-helpers';
import { testUsers, testGuardians, type TestUser, type TestGuardian } from './fixtures/test-users';
import { getTestConfig } from './config/test-data';

// Extend the base test with custom fixtures and utilities
export const test = base.extend<{
  authenticatedUserPage: any;
  authenticatedGuardianPage: any;
  testConfig: any;
  islamicContentValidator: any;
  performanceTester: any;
}>({
  // Authenticated user page fixture
  authenticatedUserPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Authenticate with default test user
    await authenticateUser(page, 'test-user-1@test.faddl.com');
    
    await use(page);
    await context.close();
  },

  // Authenticated guardian page fixture
  authenticatedGuardianPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Authenticate with default test guardian
    await authenticateUser(page, 'guardian-1@test.faddl.com');
    
    await use(page);
    await context.close();
  },

  // Test configuration fixture
  testConfig: async ({}, use) => {
    const config = getTestConfig(process.env.NODE_ENV as any || 'test');
    await use(config);
  },

  // Islamic content validator fixture
  islamicContentValidator: async ({}, use) => {
    const validator = {
      validate: validateIslamicContent,
      isAppropriate: (content: string) => {
        const result = validateIslamicContent(content);
        return result.isCompliant && result.complianceScore >= 70;
      },
      getComplianceScore: (content: string) => {
        return validateIslamicContent(content).complianceScore;
      }
    };
    await use(validator);
  },

  // Performance testing fixture
  performanceTester: async ({}, use) => {
    const tester = {
      testApiResponse: testApiResponseTime,
      validateMessageDelivery: validateMessageDelivery,
      measurePageLoad: async (page: any, url: string) => {
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        return Date.now() - startTime;
      }
    };
    await use(tester);
  }
});

// Global test configuration
export const config = {
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  
  // Global setup and teardown
  globalSetup: require.resolve('./config/global-setup.ts'),
  globalTeardown: require.resolve('./config/global-teardown.ts'),
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 10 * 1000,
  },
};

// Custom matchers for Islamic compliance testing
expect.extend({
  toBeIslamicallyCompliant(received: string, options?: { minimumScore?: number }) {
    const result = validateIslamicContent(received);
    const minimumScore = options?.minimumScore || 60;
    
    const pass = result.isCompliant && result.complianceScore >= minimumScore;
    
    if (pass) {
      return {
        message: () => 
          `Expected "${received}" not to be Islamically compliant (score: ${result.complianceScore})`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected "${received}" to be Islamically compliant. Score: ${result.complianceScore}, Flags: ${result.flags.join(', ')}`,
        pass: false,
      };
    }
  },

  toMeetPerformanceThreshold(received: number, threshold: number) {
    const pass = received <= threshold;
    
    if (pass) {
      return {
        message: () => 
          `Expected ${received}ms not to meet performance threshold of ${threshold}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected ${received}ms to meet performance threshold of ${threshold}ms`,
        pass: false,
      };
    }
  },

  toHaveGuardianApproval(received: any) {
    const hasApproval = received.guardianApproved === true;
    
    if (hasApproval) {
      return {
        message: () => `Expected message not to have guardian approval`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected message to have guardian approval`,
        pass: false,
      };
    }
  }
});

// Declare custom matcher types
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeIslamicallyCompliant(options?: { minimumScore?: number }): R;
      toMeetPerformanceThreshold(threshold: number): R;
      toHaveGuardianApproval(): R;
    }
  }
}

// Global test utilities
export const testUtils = {
  // Get test user by role
  getTestUser: (role: 'user' | 'guardian' = 'user', index: number = 0): TestUser | TestGuardian => {
    if (role === 'guardian') {
      return testGuardians[index] || testGuardians[0];
    }
    return testUsers[index] || testUsers[0];
  },

  // Generate random test data
  generateRandomContent: (type: 'appropriate' | 'inappropriate' | 'islamic') => {
    const appropriateContent = [
      'How is your family doing?',
      'What are your career goals?',
      'Tell me about your Islamic practice',
      'I would like our families to meet'
    ];
    
    const islamicContent = [
      'Assalamu Alaikum, how are you today?',
      'Alhamdulillah, I had a blessed day',
      'May Allah guide us in our decisions',
      'InshaAllah we can arrange a family meeting'
    ];
    
    const inappropriateContent = [
      'Can we meet alone?',
      'Send me your photos',
      'I want to hold your hand',
      'Let\'s keep this secret'
    ];
    
    const contentMap = {
      appropriate: appropriateContent,
      islamic: islamicContent,
      inappropriate: inappropriateContent
    };
    
    const content = contentMap[type];
    return content[Math.floor(Math.random() * content.length)];
  },

  // Wait for element with custom timeout
  waitForElement: async (page: any, selector: string, timeout: number = 10000) => {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.warn(`Element ${selector} not found within ${timeout}ms`);
      return false;
    }
  },

  // Take screenshot with timestamp
  takeScreenshot: async (page: any, name: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    await page.screenshot({ path: `test-results/screenshots/${filename}` });
    return filename;
  },

  // Log test step
  logStep: (step: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${step}`);
    if (details) {
      console.log(`  Details:`, details);
    }
  },

  // Validate response time
  validateResponseTime: (actualTime: number, maxTime: number, operation: string) => {
    if (actualTime > maxTime) {
      console.warn(`⚠️ ${operation} took ${actualTime}ms (limit: ${maxTime}ms)`);
      return false;
    }
    console.log(`✅ ${operation} completed in ${actualTime}ms`);
    return true;
  },

  // Generate test report data
  generateReportData: (testName: string, results: any) => {
    return {
      testName,
      timestamp: new Date().toISOString(),
      results,
      environment: process.env.NODE_ENV || 'test',
      browser: process.env.PLAYWRIGHT_BROWSER || 'chromium'
    };
  }
};

// Error handling for tests
export const handleTestError = (error: Error, context: string) => {
  console.error(`❌ Test error in ${context}:`, error.message);
  
  // Log additional context for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack trace:', error.stack);
  }
  
  // Return structured error for reporting
  return {
    context,
    message: error.message,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };
};

// Performance monitoring utilities
export const performanceMonitor = {
  start: () => Date.now(),
  
  end: (startTime: number, operation: string, threshold?: number) => {
    const duration = Date.now() - startTime;
    
    if (threshold && duration > threshold) {
      console.warn(`⚠️ Performance warning: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
    } else {
      console.log(`✅ ${operation} completed in ${duration}ms`);
    }
    
    return duration;
  },
  
  measure: async (operation: () => Promise<any>, description: string) => {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`📊 ${description}: ${duration}ms`);
    
    return { result, duration };
  }
};

// Test data cleanup utilities
export const cleanup = {
  clearBrowserData: async (page: any) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  },
  
  resetTestDatabase: async () => {
    // In a real implementation, this would reset test database state
    console.log('🔄 Resetting test database state...');
  },
  
  clearTestFiles: async () => {
    // Clean up any temporary test files
    console.log('🗑️ Cleaning up test files...');
  }
};

export { expect };