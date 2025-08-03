/**
 * 🔍 Edge Function Performance Monitor
 * Monitors cold starts, execution times, and resource usage
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Custom metrics for edge function monitoring
const coldStartTime = new Trend('edge_function_cold_start_time');
const executionTime = new Trend('edge_function_execution_time');
const memoryUsage = new Trend('edge_function_memory_usage');
const errorRate = new Rate('edge_function_error_rate');
const timeoutCounter = new Counter('edge_function_timeouts');
const retryCounter = new Counter('edge_function_retries');

// Configuration
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const API_KEY = __ENV.SUPABASE_ANON_KEY || '';
const TIMEOUT_MS = 30000; // 30 second timeout

export const options = {
  scenarios: {
    // Cold start testing - simulate functions being invoked after idle period
    cold_start_test: {
      executor: 'constant-arrival-rate',
      rate: 1, // 1 request per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 1,
      maxVUs: 5,
      tags: { test_type: 'cold_start' },
    },
    
    // Sustained load - keep functions warm
    sustained_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '15m',
      startTime: '12m', // Start after cold start test
      tags: { test_type: 'sustained' },
    },
    
    // Burst load - simulate sudden spikes
    burst_load: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up to 50 RPS
        { duration: '5m', target: 50 },  // Sustained burst
        { duration: '2m', target: 10 },  // Ramp down
      ],
      preAllocatedVUs: 20,
      maxVUs: 100,
      startTime: '30m',
      tags: { test_type: 'burst' },
    }
  },
  
  thresholds: {
    // Cold start thresholds
    'edge_function_cold_start_time': ['p(95)<5000'], // 95% of cold starts under 5s
    'edge_function_execution_time': ['p(95)<1000'],  // 95% of executions under 1s
    'edge_function_error_rate': ['rate<0.05'],       // Less than 5% error rate
    'http_req_duration{test_type:cold_start}': ['p(95)<6000'],
    'http_req_duration{test_type:sustained}': ['p(95)<1000'],
    'http_req_duration{test_type:burst}': ['p(95)<2000'],
  },
};

// Edge functions to test
const edgeFunctions = [
  {
    name: 'auth-sync-user',
    endpoint: 'auth-sync-user',
    payload: () => ({
      userId: `monitor-user-${Math.floor(Math.random() * 1000)}`,
      email: `monitor${Math.floor(Math.random() * 1000)}@test.com`,
      firstName: 'MonitorUser',
    }),
    expectedStatus: [200, 409], // 409 = already exists
  },
  {
    name: 'profile-create',
    endpoint: 'profile-create',
    payload: () => ({
      userId: `monitor-user-${Math.floor(Math.random() * 1000)}`,
      basicInfo: {
        age: 25,
        gender: 'male',
        location_city: 'London',
        location_country: 'UK',
        bio: 'Monitor test profile',
      },
      religiousInfo: {
        religious_level: 'practicing',
        prayer_frequency: 'regularly',
      },
      personalInfo: {
        education_level: 'bachelors',
        occupation: 'Engineer',
        interests: ['reading'],
        languages: ['english'],
        seeking_marriage_timeline: 'within_year',
      },
      familyInfo: {
        guardian_enabled: false,
        family_values: ['respect'],
        children_preference: 'maybe',
      },
      preferences: {
        age_range: [20, 30],
        location_radius_km: 50,
      },
    }),
    expectedStatus: [200, 409],
  },
  {
    name: 'profile-update',
    endpoint: 'profile-update',
    payload: () => ({
      userId: `monitor-user-${Math.floor(Math.random() * 100)}`, // Use existing users
      basicInfo: {
        bio: `Updated bio at ${new Date().toISOString()}`,
      },
    }),
    expectedStatus: [200],
  },
  {
    name: 'matches-generate',
    endpoint: 'matches-generate',
    payload: () => ({
      userId: `monitor-user-${Math.floor(Math.random() * 100)}`,
      limit: 10,
    }),
    expectedStatus: [200],
  },
  {
    name: 'messages-send',
    endpoint: 'messages-send',
    payload: () => ({
      conversationId: `conv-monitor-${Math.floor(Math.random() * 100)}`,
      content: 'Monitor test message',
      messageType: 'text',
    }),
    expectedStatus: [200],
  },
];

function makeEdgeFunctionRequest(functionDef, detectColdStart = false) {
  const url = `${SUPABASE_URL}/functions/v1/${functionDef.endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
  };
  
  const startTime = new Date().getTime();
  const payload = functionDef.payload();
  
  const params = {
    headers,
    timeout: `${TIMEOUT_MS}ms`,
    tags: {
      function_name: functionDef.name,
      endpoint: functionDef.endpoint,
    },
  };
  
  const response = http.post(url, JSON.stringify(payload), params);
  const endTime = new Date().getTime();
  const totalTime = endTime - startTime;
  
  // Detect cold starts (heuristic: >3 seconds usually indicates cold start)
  const isColdStart = totalTime > 3000 || (detectColdStart && totalTime > 1500);
  
  if (isColdStart) {
    coldStartTime.add(totalTime, { function_name: functionDef.name });
  } else {
    executionTime.add(totalTime, { function_name: functionDef.name });
  }
  
  // Check for timeouts
  if (response.timings.duration >= TIMEOUT_MS * 0.9) { // 90% of timeout
    timeoutCounter.add(1, { function_name: functionDef.name });
  }
  
  // Parse response for memory usage if available
  try {
    const responseBody = JSON.parse(response.body);
    if (responseBody.metrics && responseBody.metrics.memoryUsed) {
      memoryUsage.add(responseBody.metrics.memoryUsed, { function_name: functionDef.name });
    }
  } catch (e) {
    // Response body might not be JSON or might not contain metrics
  }
  
  const isSuccess = functionDef.expectedStatus.includes(response.status);
  errorRate.add(!isSuccess, { function_name: functionDef.name });
  
  // Validation checks
  const checks = check(response, {
    [`${functionDef.name}: status is expected`]: (r) => functionDef.expectedStatus.includes(r.status),
    [`${functionDef.name}: response time < 10s`]: (r) => r.timings.duration < 10000,
    [`${functionDef.name}: not timeout`]: (r) => r.timings.duration < TIMEOUT_MS * 0.9,
    [`${functionDef.name}: has response body`]: (r) => r.body && r.body.length > 0,
  }, { function_name: functionDef.name });
  
  // Log detailed metrics for failed requests
  if (!isSuccess || totalTime > 5000) {
    console.log(`⚠️  ${functionDef.name} - Status: ${response.status}, Time: ${totalTime}ms, Cold Start: ${isColdStart}`);
    
    if (response.error) {
      console.log(`❌ Error: ${response.error}`);
    }
  }
  
  return {
    response,
    totalTime,
    isColdStart,
    isSuccess,
  };
}

export function setup() {
  console.log('🚀 Starting Edge Function Performance Monitoring');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Functions to test: ${edgeFunctions.map(f => f.name).join(', ')}`);
  
  // Pre-warm functions by calling them once
  console.log('🔥 Pre-warming functions...');
  edgeFunctions.forEach(func => {
    try {
      makeEdgeFunctionRequest(func);
      sleep(1);
    } catch (e) {
      console.log(`Warning: Could not pre-warm ${func.name}: ${e.message}`);
    }
  });
  
  console.log('✅ Setup complete');
  return { timestamp: new Date().toISOString() };
}

export default function() {
  const testType = __ENV.K6_SCENARIO || 'default';
  
  // For cold start testing, add longer delays to ensure functions go cold
  if (testType === 'cold_start') {
    sleep(Math.random() * 10 + 5); // 5-15 second delay
  }
  
  // Randomly select a function to test
  const functionDef = edgeFunctions[Math.floor(Math.random() * edgeFunctions.length)];
  
  const result = makeEdgeFunctionRequest(functionDef, testType === 'cold_start');
  
  // For sustained load, keep a steady pace
  if (testType === 'sustained') {
    sleep(Math.random() * 2 + 0.5); // 0.5-2.5 second delay
  }
  
  // For burst testing, minimal delay
  if (testType === 'burst') {
    sleep(Math.random() * 0.5); // 0-0.5 second delay
  }
  
  // Retry failed requests (simulate real user behavior)
  if (!result.isSuccess && Math.random() < 0.3) { // 30% retry rate
    retryCounter.add(1, { function_name: functionDef.name });
    sleep(1);
    makeEdgeFunctionRequest(functionDef);
  }
}

export function teardown(data) {
  console.log('🏁 Edge Function Monitoring Complete');
  console.log(`Started: ${data.timestamp}`);
  console.log(`Completed: ${new Date().toISOString()}`);
  
  // Summary log
  console.log('📊 Test Summary:');
  console.log(`- Functions tested: ${edgeFunctions.length}`);
  console.log(`- Cold start detection enabled`);
  console.log(`- Timeout threshold: ${TIMEOUT_MS}ms`);
  console.log('Check k6 output for detailed metrics');
}

// Helper function for manual testing
export function testSingleFunction(functionName) {
  const func = edgeFunctions.find(f => f.name === functionName);
  if (!func) {
    throw new Error(`Function ${functionName} not found`);
  }
  
  console.log(`🧪 Testing ${functionName}...`);
  const result = makeEdgeFunctionRequest(func, true);
  
  console.log(`✅ ${functionName} completed:`);
  console.log(`   Status: ${result.response.status}`);
  console.log(`   Time: ${result.totalTime}ms`);
  console.log(`   Cold Start: ${result.isColdStart}`);
  console.log(`   Success: ${result.isSuccess}`);
  
  return result;
}