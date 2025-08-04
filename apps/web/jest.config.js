/**
 * 🧪 Jest Configuration for FADDL Match Web App
 * Comprehensive testing setup for subscription system
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setupTests.ts'],
  
  // Test directories
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
  },
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/middleware.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
  ],
  
  // Coverage thresholds for subscription system
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    // Specific thresholds for critical subscription components
    'src/components/subscription/**/*.{js,jsx,ts,tsx}': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
    'src/hooks/useSubscription.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
    'src/app/api/subscriptions/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'src/app/api/webhooks/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|framer-motion|@stripe/stripe-js))',
  ],
  
  // Mock modules
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  
  // Timeout for async tests
  testTimeout: 10000,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/test-utils/globalSetup.ts',
  globalTeardown: '<rootDir>/src/test-utils/globalTeardown.ts',
  
  // Mock static assets
  moduleNameMapper: {
    ...require('next/jest')({ dir: './' }).moduleNameMapper,
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/test-utils/__mocks__/fileMock.js',
  },
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset modules before each test
  resetModules: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)