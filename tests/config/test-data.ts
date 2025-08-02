/**
 * Test Data Configuration
 * Centralized test data management and configuration
 */

export const testConfig = {
  // Base URLs for different environments
  baseUrls: {
    development: 'http://localhost:3000',
    staging: 'https://staging.faddl.com',
    production: 'https://app.faddl.com'
  },

  // Test timeouts in milliseconds
  timeouts: {
    default: 30000,
    short: 5000,
    long: 60000,
    apiResponse: 5000,
    pageLoad: 10000,
    webSocketConnection: 10000,
    messageDelivery: 3000
  },

  // Performance thresholds
  performance: {
    apiResponseTime: 200, // milliseconds
    pageLoadTime: 2500, // milliseconds
    messageDeliveryTime: 100, // milliseconds
    webSocketConnectionTime: 5000, // milliseconds
    memoryUsageIncrease: 0.5, // 50% max increase
    lighthouseScoreMinimum: 95
  },

  // Islamic compliance settings
  islamicCompliance: {
    minimumComplianceScore: 60,
    excellentThreshold: 90,
    appropriateThreshold: 70,
    needsGuidanceThreshold: 40,
    blockedContentPenalty: 100
  },

  // Guardian oversight settings
  guardianOversight: {
    approvalTimeoutHours: 24,
    emergencyResponseTimeMinutes: 5,
    notificationDelaySeconds: 2,
    maxDailyMessagingMinutes: 120,
    maxMessagesPerHour: 20
  },

  // Authentication settings
  auth: {
    sessionTimeoutMinutes: 60,
    tokenRefreshThresholdMinutes: 10,
    maxLoginAttempts: 3,
    lockoutDurationMinutes: 15
  },

  // Test user roles and permissions
  userRoles: {
    user: {
      permissions: ['send_messages', 'view_matches', 'request_approvals', 'view_profile'],
      restrictions: ['cannot_access_guardian_features', 'requires_approval_for_meetings']
    },
    guardian: {
      permissions: [
        'view_ward_conversations', 
        'approve_matches', 
        'monitor_messages', 
        'set_permissions',
        'receive_notifications',
        'pause_conversations',
        'arrange_meetings'
      ],
      restrictions: ['cannot_send_messages_as_ward']
    },
    admin: {
      permissions: ['all_system_access', 'user_management', 'system_configuration'],
      restrictions: []
    }
  },

  // Browser configurations
  browsers: {
    desktop: {
      chromium: { width: 1920, height: 1080 },
      firefox: { width: 1920, height: 1080 },
      webkit: { width: 1920, height: 1080 }
    },
    mobile: {
      'iPhone 12': { width: 390, height: 844 },
      'Pixel 5': { width: 393, height: 851 },
      'iPad': { width: 768, height: 1024 }
    }
  },

  // API endpoints for testing
  apiEndpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      verify: '/api/auth/verify'
    },
    messages: {
      send: '/api/messages',
      list: '/api/messages/conversation/:conversationId',
      moderate: '/api/moderate-content',
      typing: '/api/messages/typing'
    },
    conversations: {
      list: '/api/conversations',
      create: '/api/conversations',
      update: '/api/conversations/:id',
      delete: '/api/conversations/:id'
    },
    guardian: {
      dashboard: '/api/guardian/dashboard',
      approve: '/api/guardian/approve',
      permissions: '/api/guardian/permissions',
      notifications: '/api/guardian/notifications'
    },
    matches: {
      list: '/api/matches',
      approve: '/api/matches/approve',
      request: '/api/matches/request'
    }
  },

  // WebSocket events
  webSocketEvents: {
    connection: 'connect',
    disconnect: 'disconnect',
    message: 'message',
    typing: 'typing',
    stopTyping: 'stop_typing',
    messageDelivered: 'message_delivered',
    messageRead: 'message_read',
    guardianNotification: 'guardian_notification',
    conversationUpdate: 'conversation_update'
  },

  // Test data seeds
  testDataSeeds: {
    users: 5,
    guardians: 3,
    conversations: 10,
    messagesPerConversation: 20,
    matchesPerUser: 8
  },

  // Content moderation test cases
  contentModeration: {
    islamicGreetings: [
      'Assalamu Alaikum',
      'Wa alaikum assalam',
      'Barakallahu feeki',
      'Alhamdulillah'
    ],
    appropriateContent: [
      'How is your family?',
      'What are your educational goals?',
      'Tell me about your Islamic practice',
      'I would like our families to meet'
    ],
    inappropriateContent: [
      'Can we meet alone?',
      'Send me your photos',
      'I want to hold your hand',
      'Let\'s keep this secret'
    ],
    borderlineContent: [
      'You seem nice',
      'I think we might be compatible',
      'Can we talk more personally?',
      'I\'d like to know you better'
    ]
  },

  // Cultural sensitivity test data
  culturalSensitivity: {
    regions: ['arab', 'south_asian', 'african', 'southeast_asian', 'western'],
    madhabs: ['hanafi', 'shafi', 'maliki', 'hanbali'],
    practiceLevels: ['learning', 'practicing', 'strict', 'scholarly'],
    languages: ['en', 'ar', 'ur', 'tr', 'id', 'ms']
  },

  // Accessibility testing configuration
  accessibility: {
    wcagLevel: 'AA',
    wcagVersion: '2.1',
    colorContrastRatio: 4.5,
    minimumTouchTargetSize: 44, // pixels
    maximumResponseTime: 100, // milliseconds for screen readers
    keyboardNavigationTimeout: 2000 // milliseconds
  },

  // Load testing parameters
  loadTesting: {
    concurrentUsers: 10,
    testDurationMinutes: 5,
    rampUpTimeSeconds: 30,
    maxResponseTimeMs: 1000,
    errorRateThreshold: 0.01, // 1%
    throughputMinimum: 100 // requests per minute
  },

  // Error scenarios for testing
  errorScenarios: {
    networkFailure: {
      statusCode: 0,
      message: 'Network connection failed'
    },
    serverError: {
      statusCode: 500,
      message: 'Internal server error'
    },
    unauthorized: {
      statusCode: 401,
      message: 'Unauthorized access'
    },
    forbidden: {
      statusCode: 403,
      message: 'Forbidden access'
    },
    notFound: {
      statusCode: 404,
      message: 'Resource not found'
    },
    rateLimited: {
      statusCode: 429,
      message: 'Rate limit exceeded'
    },
    validationError: {
      statusCode: 400,
      message: 'Validation failed'
    }
  },

  // Notification testing configuration
  notifications: {
    types: [
      'new_message',
      'guardian_approval_required',
      'match_request',
      'conversation_paused',
      'meeting_arranged',
      'content_flagged'
    ],
    deliveryMethods: ['push', 'email', 'sms'],
    urgencyLevels: ['low', 'medium', 'high', 'critical'],
    maxRetries: 3,
    retryDelaySeconds: 5
  },

  // Security testing parameters
  security: {
    maxLoginAttempts: 3,
    sessionTimeout: 3600, // seconds
    passwordComplexity: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    rateLimiting: {
      maxRequestsPerMinute: 60,
      maxMessagesPerHour: 20,
      maxMatchRequestsPerDay: 10
    }
  },

  // Feature flags for testing
  featureFlags: {
    enableRealTimeMessaging: true,
    enableGuardianOversight: true,
    enableContentModeration: true,
    enableCulturalSensitivity: true,
    enablePerformanceMonitoring: true,
    enableAccessibilityFeatures: true,
    enableIslamicCalendarIntegration: true,
    enableMultiLanguageSupport: true
  },

  // Test environment configurations
  environments: {
    test: {
      database: 'test_faddl_match',
      logLevel: 'debug',
      enableMocking: true,
      bypassAuthentication: true
    },
    staging: {
      database: 'staging_faddl_match',
      logLevel: 'info',
      enableMocking: false,
      bypassAuthentication: false
    },
    production: {
      database: 'prod_faddl_match',
      logLevel: 'error',
      enableMocking: false,
      bypassAuthentication: false
    }
  }
};

/**
 * Get configuration for current environment
 */
export function getTestConfig(environment: 'test' | 'staging' | 'production' = 'test') {
  return {
    ...testConfig,
    currentEnvironment: environment,
    baseUrl: testConfig.baseUrls[environment === 'test' ? 'development' : environment],
    ...testConfig.environments[environment]
  };
}

/**
 * Get browser configuration
 */
export function getBrowserConfig(browser: string, device?: string) {
  if (device) {
    return testConfig.browsers.mobile[device] || testConfig.browsers.desktop[browser];
  }
  return testConfig.browsers.desktop[browser];
}

/**
 * Get API endpoint URL
 */
export function getApiEndpoint(category: string, endpoint: string, params?: Record<string, string>) {
  let url = testConfig.apiEndpoints[category]?.[endpoint];
  
  if (params && url) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  return url;
}

/**
 * Get performance threshold for specific metric
 */
export function getPerformanceThreshold(metric: string): number {
  return testConfig.performance[metric] || 1000; // Default 1 second
}

/**
 * Get timeout for specific operation
 */
export function getTimeout(operation: string): number {
  return testConfig.timeouts[operation] || testConfig.timeouts.default;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  return testConfig.featureFlags[feature] || false;
}

/**
 * Get test data for specific type
 */
export function getTestData(type: string): any[] {
  return testConfig.contentModeration[type] || [];
}

/**
 * Get cultural sensitivity data
 */
export function getCulturalData() {
  return testConfig.culturalSensitivity;
}

/**
 * Get accessibility configuration
 */
export function getAccessibilityConfig() {
  return testConfig.accessibility;
}

/**
 * Get security testing parameters
 */
export function getSecurityConfig() {
  return testConfig.security;
}

export default testConfig;