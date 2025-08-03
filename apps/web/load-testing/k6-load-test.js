/**
 * 🚀 FADDL Match API Load Testing Suite
 * Comprehensive stress testing for backend APIs and edge functions
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for detailed analysis
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const authFailures = new Counter('auth_failures');
const dbErrors = new Counter('database_errors');
const edgeFunctionColdStarts = new Trend('edge_function_cold_starts');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const API_KEY = __ENV.SUPABASE_ANON_KEY || '';

// Load test scenarios
export const options = {
  scenarios: {
    // Normal Load: Typical usage patterns
    normal_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'normal_load' },
    },
    
    // Peak Load: High activity periods (Friday evenings, etc.)
    peak_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '3m', target: 200 },  // Ramp up to 200 users
        { duration: '10m', target: 200 }, // Stay at 200 users
        { duration: '3m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '1m',
      tags: { test_type: 'peak_load' },
      startTime: '20m',
    },
    
    // Stress Test: Beyond normal capacity
    stress_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '5m', target: 500 },  // Ramp up to 500 users
        { duration: '10m', target: 500 }, // Stay at 500 users
        { duration: '5m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '2m',
      tags: { test_type: 'stress_test' },
      startTime: '40m',
    },
    
    // Spike Test: Sudden traffic increase (viral content)
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 100 }, // Normal load
        { duration: '1m', target: 500 },  // Sudden spike
        { duration: '30s', target: 100 }, // Back to normal
        { duration: '1m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'spike_test' },
      startTime: '70m',
    }
  },
  
  thresholds: {
    // Performance targets
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.01'], // Error rate below 1%
    'error_rate': ['rate<0.01'],
    'response_time': ['p(95)<200'], // 95% of API responses under 200ms
    
    // Scenario-specific thresholds
    'http_req_duration{test_type:normal_load}': ['p(95)<300'],
    'http_req_duration{test_type:peak_load}': ['p(95)<500'],
    'http_req_duration{test_type:stress_test}': ['p(95)<1000'],
    'http_req_duration{test_type:spike_test}': ['p(95)<2000'],
  },
};

// Test data pools
const testUsers = Array.from({ length: 1000 }, (_, i) => ({
  id: `test-user-${i}`,
  email: `test${i}@faddlmatch.com`,
  firstName: `TestUser${i}`,
}));

const sampleProfiles = [
  {
    age: 25,
    gender: 'male',
    location_city: 'London',
    location_country: 'UK',
    bio: 'Practicing Muslim looking for a life partner',
    religious_level: 'practicing',
    prayer_frequency: 'regularly',
    education_level: 'bachelors',
    occupation: 'Software Engineer',
  },
  {
    age: 23,
    gender: 'female',
    location_city: 'Manchester',
    location_country: 'UK',
    bio: 'Devout Muslim seeking marriage within Islamic values',
    religious_level: 'devout',
    prayer_frequency: 'always',
    education_level: 'masters',
    occupation: 'Teacher',
  }
];

// Utility functions
function randomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function randomProfile() {
  return sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];
}

function makeAuthenticatedRequest(endpoint, method = 'GET', payload = null) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
  };
  
  const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}/functions/v1/${endpoint}`;
  
  const startTime = new Date().getTime();
  const response = http.request(method, url, payload ? JSON.stringify(payload) : null, { headers });
  const endTime = new Date().getTime();
  
  responseTime.add(endTime - startTime);
  
  return response;
}

export function setup() {
  console.log('🚀 Starting FADDL Match API Load Testing');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  
  // Health check before starting tests
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }
  
  console.log('✅ Health check passed');
  return { timestamp: new Date().toISOString() };
}

export default function() {
  const user = randomUser();
  
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/api/health`);
    
    check(response, {
      'Health check status is 200': (r) => r.status === 200,
      'Health check response time < 100ms': (r) => r.timings.duration < 100,
      'Health check has valid JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
    
    if (response.status !== 200) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });
  
  group('Authentication Flow', () => {
    // Simulate user sync (Clerk → Supabase)
    const syncPayload = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    };
    
    const response = makeAuthenticatedRequest('auth-sync-user', 'POST', syncPayload);
    
    check(response, {
      'Auth sync status is 200 or 409': (r) => r.status === 200 || r.status === 409,
      'Auth sync response time < 500ms': (r) => r.timings.duration < 500,
      'Auth sync has success response': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true || r.status === 409; // 409 = already exists
        } catch {
          return false;
        }
      },
    });
    
    if (response.status > 299) {
      authFailures.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    
    // Track cold starts for edge functions
    if (response.timings.duration > 1000) {
      edgeFunctionColdStarts.add(response.timings.duration);
    }
  });
  
  group('Profile Management', () => {
    const profile = randomProfile();
    const profilePayload = {
      userId: user.id,
      basicInfo: {
        age: profile.age,
        gender: profile.gender,
        location_city: profile.location_city,
        location_country: profile.location_country,
        bio: profile.bio,
      },
      religiousInfo: {
        religious_level: profile.religious_level,
        prayer_frequency: profile.prayer_frequency,
      },
      personalInfo: {
        education_level: profile.education_level,
        occupation: profile.occupation,
        interests: ['reading', 'traveling'],
        languages: ['english', 'arabic'],
        seeking_marriage_timeline: 'within_year',
      },
      familyInfo: {
        guardian_enabled: false,
        family_values: ['respect', 'honesty'],
        children_preference: 'maybe',
      },
      preferences: {
        age_range: [20, 30],
        location_radius_km: 50,
      },
    };
    
    // Create profile
    const createResponse = makeAuthenticatedRequest('profile-create', 'POST', profilePayload);
    
    check(createResponse, {
      'Profile create status is 200 or 409': (r) => r.status === 200 || r.status === 409,
      'Profile create response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    if (createResponse.status > 299) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    
    // Update profile
    const updatePayload = {
      userId: user.id,
      basicInfo: { bio: 'Updated bio for testing' },
    };
    
    const updateResponse = makeAuthenticatedRequest('profile-update', 'POST', updatePayload);
    
    check(updateResponse, {
      'Profile update status is 200': (r) => r.status === 200,
      'Profile update response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (updateResponse.status !== 200) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });
  
  group('Matching System', () => {
    const matchRequest = {
      userId: user.id,
      limit: 10,
    };
    
    const response = makeAuthenticatedRequest('matches-generate', 'POST', matchRequest);
    
    check(response, {
      'Match generation status is 200': (r) => r.status === 200,
      'Match generation response time < 2000ms': (r) => r.timings.duration < 2000,
      'Match generation returns matches': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.matches) || body.success === true;
        } catch {
          return false;
        }
      },
    });
    
    if (response.status !== 200) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });
  
  group('Messaging System', () => {
    const messagePayload = {
      conversationId: `conv-${user.id}-test`,
      content: 'Assalamu alaikum, how are you?',
      messageType: 'text',
    };
    
    const response = makeAuthenticatedRequest('messages-send', 'POST', messagePayload);
    
    check(response, {
      'Message send status is 200': (r) => r.status === 200,
      'Message send response time < 1000ms': (r) => r.timings.duration < 1000,
      'Message send has valid response': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true || body.message;
        } catch {
          return false;
        }
      },
    });
    
    if (response.status !== 200) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });
  
  group('Rate Limiting Validation', () => {
    // Test rate limiting by making rapid requests
    for (let i = 0; i < 5; i++) {
      const response = http.get(`${BASE_URL}/api/health`);
      
      if (i === 4) { // Check on last request
        check(response, {
          'Rate limiting allows normal traffic': (r) => r.status !== 429,
          'Rate limiting response time consistent': (r) => r.timings.duration < 200,
        });
      }
      
      sleep(0.1); // Small delay between requests
    }
  });
  
  // Random sleep to simulate realistic user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log('🏁 Load testing completed');
  console.log(`Started at: ${data.timestamp}`);
  console.log(`Completed at: ${new Date().toISOString()}`);
}