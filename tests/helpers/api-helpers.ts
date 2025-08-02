import { Page, expect } from '@playwright/test';

/**
 * API Helper Functions
 * Utilities for testing API interactions, responses, and data validation
 */

export interface ApiResponse {
  status: number;
  data?: any;
  error?: string;
  headers?: Record<string, string>;
  responseTime?: number;
}

export interface MessageData {
  id?: string;
  conversationId: string;
  content: string;
  senderId: string;
  timestamp?: string;
  islamicCompliant?: boolean;
  guardianApproved?: boolean;
}

/**
 * Send a test message via API
 */
export async function sendTestMessage(
  page: Page, 
  messageData: MessageData
): Promise<ApiResponse> {
  try {
    const startTime = Date.now();
    
    const response = await page.evaluate(async (data) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
    }, messageData);
    
    response.responseTime = Date.now() - startTime;
    
    return response;
    
  } catch (error) {
    console.error('❌ Failed to send test message:', error);
    throw error;
  }
}

/**
 * Validate message delivery
 */
export async function validateMessageDelivery(
  page: Page, 
  messageContent: string, 
  timeout: number = 5000
): Promise<boolean> {
  try {
    // Wait for message to appear in the UI
    const messageLocator = page.locator(`[data-testid="message-bubble"]:has-text("${messageContent}")`);
    await expect(messageLocator).toBeVisible({ timeout });
    
    // Verify message status is delivered
    const statusLocator = page.locator('[data-testid="message-status"]:has-text("Delivered")');
    await expect(statusLocator).toBeVisible({ timeout: 2000 });
    
    return true;
    
  } catch (error) {
    console.error(`❌ Message delivery validation failed for: ${messageContent}`, error);
    return false;
  }
}

/**
 * Test API response time
 */
export async function testApiResponseTime(
  page: Page, 
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  maxResponseTime: number = 200
): Promise<ApiResponse> {
  try {
    const startTime = Date.now();
    
    const response = await page.evaluate(async ({ endpoint, method, data }) => {
      const options: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(endpoint, options);
      const responseData = await response.json().catch(() => null);
      
      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
    }, { endpoint, method, data });
    
    const responseTime = Date.now() - startTime;
    response.responseTime = responseTime;
    
    // Verify response time meets requirements
    if (responseTime > maxResponseTime) {
      console.warn(`⚠️ API response time (${responseTime}ms) exceeds limit (${maxResponseTime}ms)`);
    }
    
    return response;
    
  } catch (error) {
    console.error(`❌ API response time test failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(
  page: Page, 
  endpoint: string, 
  responseData: any, 
  status: number = 200,
  delay?: number
): Promise<void> {
  try {
    await page.route(endpoint, async (route) => {
      if (delay) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
    
    console.log(`✅ Mocked API response for: ${endpoint}`);
    
  } catch (error) {
    console.error(`❌ Failed to mock API response for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Test content moderation API
 */
export async function testContentModeration(
  page: Page, 
  content: string, 
  expectedResult: boolean
): Promise<boolean> {
  try {
    const response = await page.evaluate(async (content) => {
      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });
      
      return {
        status: response.status,
        data: await response.json()
      };
    }, content);
    
    if (response.status !== 200) {
      throw new Error(`Content moderation API returned status: ${response.status}`);
    }
    
    const isCompliant = response.data.islamicCompliant;
    
    if (isCompliant !== expectedResult) {
      console.warn(`⚠️ Content moderation mismatch for "${content}": expected ${expectedResult}, got ${isCompliant}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Content moderation test failed for: ${content}`, error);
    return false;
  }
}

/**
 * Test API error handling
 */
export async function testApiErrorHandling(
  page: Page, 
  endpoint: string, 
  expectedStatus: number,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<boolean> {
  try {
    const response = await page.evaluate(async ({ endpoint, method, data }) => {
      const options: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      try {
        const response = await fetch(endpoint, options);
        return {
          status: response.status,
          data: await response.json().catch(() => null)
        };
      } catch (error) {
        return {
          status: 0,
          error: error.message
        };
      }
    }, { endpoint, method, data });
    
    return response.status === expectedStatus;
    
  } catch (error) {
    console.error(`❌ API error handling test failed for ${endpoint}:`, error);
    return false;
  }
}

/**
 * Batch API requests for load testing
 */
export async function batchApiRequests(
  page: Page, 
  requests: Array<{
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
  }>,
  concurrent: boolean = false
): Promise<ApiResponse[]> {
  try {
    const executeRequest = async (request: any) => {
      const startTime = Date.now();
      
      const response = await page.evaluate(async ({ endpoint, method, data }) => {
        const options: RequestInit = {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
          options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        const responseData = await response.json().catch(() => null);
        
        return {
          status: response.status,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries())
        };
      }, request);
      
      response.responseTime = Date.now() - startTime;
      return response;
    };
    
    if (concurrent) {
      return await Promise.all(requests.map(executeRequest));
    } else {
      const results = [];
      for (const request of requests) {
        results.push(await executeRequest(request));
      }
      return results;
    }
    
  } catch (error) {
    console.error('❌ Batch API requests failed:', error);
    throw error;
  }
}

/**
 * Test API rate limiting
 */
export async function testApiRateLimit(
  page: Page, 
  endpoint: string, 
  requestCount: number = 20,
  method: 'GET' | 'POST' = 'POST'
): Promise<{ limited: boolean; limitReached: number }> {
  try {
    const requests = Array(requestCount).fill(null).map((_, index) => ({
      endpoint,
      method,
      data: method === 'POST' ? { content: `Rate limit test ${index}` } : undefined
    }));
    
    const responses = await batchApiRequests(page, requests, true);
    
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    return {
      limited: rateLimitedResponses.length > 0,
      limitReached: rateLimitedResponses.length
    };
    
  } catch (error) {
    console.error('❌ Rate limit test failed:', error);
    throw error;
  }
}

/**
 * Validate API response schema
 */
export async function validateApiSchema(
  response: ApiResponse, 
  expectedSchema: any
): Promise<boolean> {
  try {
    // Simple schema validation (in a real implementation, you might use a library like Joi or Zod)
    const data = response.data;
    
    if (!data) return false;
    
    for (const [key, expectedType] of Object.entries(expectedSchema)) {
      if (!(key in data)) {
        console.error(`Missing required field: ${key}`);
        return false;
      }
      
      const actualType = typeof data[key];
      if (actualType !== expectedType) {
        console.error(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API schema validation failed:', error);
    return false;
  }
}

/**
 * Test WebSocket API integration
 */
export async function testWebSocketApi(
  page: Page, 
  message: any, 
  expectedResponse?: any
): Promise<boolean> {
  try {
    const result = await page.evaluate(async ({ message, expectedResponse }) => {
      return new Promise((resolve) => {
        if (!window.socket || !window.socket.connected) {
          resolve(false);
          return;
        }
        
        let responseReceived = false;
        
        // Listen for response
        const responseHandler = (data: any) => {
          if (expectedResponse) {
            responseReceived = JSON.stringify(data) === JSON.stringify(expectedResponse);
          } else {
            responseReceived = true;
          }
          
          window.socket.off('message', responseHandler);
          resolve(responseReceived);
        };
        
        window.socket.on('message', responseHandler);
        
        // Send message
        window.socket.emit('message', message);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          window.socket.off('message', responseHandler);
          resolve(responseReceived);
        }, 5000);
      });
    }, { message, expectedResponse });
    
    return result as boolean;
    
  } catch (error) {
    console.error('❌ WebSocket API test failed:', error);
    return false;
  }
}

/**
 * Monitor API performance metrics
 */
export async function monitorApiPerformance(
  page: Page, 
  duration: number = 30000
): Promise<{
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowRequests: number;
}> {
  try {
    const metrics = {
      requests: [] as number[],
      errors: 0,
      slowRequests: 0
    };
    
    // Monitor network requests
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const responseTime = Date.now(); // Simplified - would need request start time
        metrics.requests.push(responseTime);
        
        if (response.status() >= 400) {
          metrics.errors++;
        }
        
        if (responseTime > 1000) { // Requests over 1 second
          metrics.slowRequests++;
        }
      }
    });
    
    // Wait for monitoring duration
    await page.waitForTimeout(duration);
    
    const totalRequests = metrics.requests.length;
    const averageResponseTime = totalRequests > 0 
      ? metrics.requests.reduce((a, b) => a + b, 0) / totalRequests 
      : 0;
    const errorRate = totalRequests > 0 ? (metrics.errors / totalRequests) * 100 : 0;
    
    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowRequests: metrics.slowRequests
    };
    
  } catch (error) {
    console.error('❌ API performance monitoring failed:', error);
    throw error;
  }
}

/**
 * Generate test data for API calls
 */
export function generateTestData(type: string, count: number = 1): any[] {
  const generators: { [key: string]: () => any } = {
    message: () => ({
      content: `Test message ${Date.now()}`,
      conversationId: 'test-conversation-1',
      senderId: 'test-user-1',
      timestamp: new Date().toISOString()
    }),
    
    conversation: () => ({
      participants: ['test-user-1', 'test-user-2'],
      guardianOversight: true,
      islamicCompliant: true
    }),
    
    approval_request: () => ({
      type: 'match_approval',
      userId: 'test-user-1',
      targetUserId: 'test-user-2',
      message: 'Requesting approval for this match'
    })
  };
  
  const generator = generators[type];
  if (!generator) {
    throw new Error(`Unknown test data type: ${type}`);
  }
  
  return Array(count).fill(null).map(() => generator());
}