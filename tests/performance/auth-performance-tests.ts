/**
 * ⚡ Authentication Performance Testing Suite
 * Load testing and performance benchmarking for FADDL Match authentication
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { performance } from 'perf_hooks'

interface PerformanceMetrics {
  operation: string
  duration: number
  success: boolean
  timestamp: number
  userLoad?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []

  async measureOperation<T>(
    operation: string, 
    fn: () => Promise<T>, 
    userLoad: number = 1
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    let success = false
    let result: T

    try {
      result = await fn()
      success = true
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = performance.now() - start
      this.metrics.push({
        operation,
        duration,
        success,
        timestamp: Date.now(),
        userLoad
      })
    }

    return { result, duration: performance.now() - start }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.success)
    if (operationMetrics.length === 0) return 0
    
    const totalTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    return totalTime / operationMetrics.length
  }

  getSuccessRate(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation)
    if (operationMetrics.length === 0) return 0
    
    const successCount = operationMetrics.filter(m => m.success).length
    return (successCount / operationMetrics.length) * 100
  }

  clear() {
    this.metrics = []
  }
}

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  performanceTargets: {
    login: 2000,           // 2 seconds
    registration: 5000,    // 5 seconds
    jwtValidation: 50,     // 50ms
    webhookProcessing: 200, // 200ms
    sessionRefresh: 1000,  // 1 second
    profileLoad: 1500,     // 1.5 seconds
    apiResponse: 500       // 500ms
  },
  loadTest: {
    maxConcurrentUsers: 50,
    testDuration: 60000, // 1 minute
    rampUpTime: 10000    // 10 seconds
  },
  testUsers: Array.from({ length: 50 }, (_, i) => ({
    email: `loadtest${i}@faddlmatch.com`,
    password: 'LoadTest123!',
    firstName: `LoadUser${i}`,
    lastName: 'Test'
  }))
}

const monitor = new PerformanceMonitor()

test.describe('Authentication Performance Tests', () => {
  test.beforeEach(() => {
    monitor.clear()
  })

  test('should meet login performance targets', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/sign-in`)

    const { duration } = await monitor.measureOperation('login', async () => {
      await page.fill('input[name="emailAddress"]', TEST_CONFIG.testUsers[0].email)
      await page.fill('input[name="password"]', TEST_CONFIG.testUsers[0].password)
      await page.click('button[type="submit"]')
      
      // Wait for redirect or dashboard load
      await page.waitForURL(/dashboard|matches|onboarding/, { timeout: 10000 })
    })

    console.log(`Login time: ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(TEST_CONFIG.performanceTargets.login)
  })

  test('should meet registration performance targets', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/sign-up`)

    const testUser = {
      email: `perf-test-${Date.now()}@example.com`,
      password: 'PerfTest123!',
      firstName: 'Performance',
      lastName: 'Test'
    }

    const { duration } = await monitor.measureOperation('registration', async () => {
      await page.fill('input[name="emailAddress"]', testUser.email)
      await page.fill('input[name="password"]', testUser.password)
      await page.fill('input[name="firstName"]', testUser.firstName)
      await page.fill('input[name="lastName"]', testUser.lastName)
      await page.click('button[type="submit"]')
      
      // Wait for verification page or redirect
      await page.waitForURL(/verify-email|onboarding/, { timeout: 10000 })
    })

    console.log(`Registration time: ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(TEST_CONFIG.performanceTargets.registration)
  })

  test('should meet API response time targets', async ({ request }) => {
    // Test various API endpoints
    const endpoints = [
      { url: '/api/health', target: 100 },
      { url: '/api/user/profile', target: 500, requiresAuth: true },
      { url: '/api/matches', target: 1000, requiresAuth: true }
    ]

    for (const endpoint of endpoints) {
      const { duration } = await monitor.measureOperation(`api-${endpoint.url}`, async () => {
        const response = await request.get(`${TEST_CONFIG.baseUrl}${endpoint.url}`)
        expect(response.status()).toBeLessThan(500)
        return response
      })

      console.log(`${endpoint.url} response time: ${duration.toFixed(2)}ms`)
      expect(duration).toBeLessThan(endpoint.target)
    }
  })

  test('should handle JWT validation efficiently', async ({ request }) => {
    // Test JWT validation performance
    const iterations = 100
    const durations: number[] = []

    for (let i = 0; i < iterations; i++) {
      const { duration } = await monitor.measureOperation('jwt-validation', async () => {
        const response = await request.get(`${TEST_CONFIG.baseUrl}/api/auth/validate`, {
          headers: {
            'Authorization': 'Bearer test-jwt-token'
          }
        })
        return response
      })
      
      durations.push(duration)
    }

    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const maxTime = Math.max(...durations)
    
    console.log(`JWT validation - Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`)
    
    expect(averageTime).toBeLessThan(TEST_CONFIG.performanceTargets.jwtValidation)
    expect(maxTime).toBeLessThan(TEST_CONFIG.performanceTargets.jwtValidation * 2)
  })
})

test.describe('Load Testing', () => {
  test('should handle concurrent login load', async ({ browser }) => {
    const concurrentUsers = 10
    const contexts: BrowserContext[] = []
    const results: Promise<PerformanceMetrics>[] = []

    try {
      // Create browser contexts for concurrent users
      for (let i = 0; i < concurrentUsers; i++) {
        contexts.push(await browser.newContext())
      }

      // Simulate concurrent logins
      const startTime = performance.now()
      
      for (let i = 0; i < concurrentUsers; i++) {
        const context = contexts[i]
        const testUser = TEST_CONFIG.testUsers[i % TEST_CONFIG.testUsers.length]
        
        results.push(
          (async () => {
            const page = await context.newPage()
            
            return await monitor.measureOperation(`concurrent-login-${i}`, async () => {
              await page.goto(`${TEST_CONFIG.baseUrl}/sign-in`)
              await page.fill('input[name="emailAddress"]', testUser.email)
              await page.fill('input[name="password"]', testUser.password)
              await page.click('button[type="submit"]')
              
              // Wait for authentication success
              await page.waitForURL(/dashboard|matches|onboarding/, { timeout: 15000 })
              return { success: true, userId: i }
            }, concurrentUsers)
          })().then(result => ({
            operation: `concurrent-login-${i}`,
            duration: result.duration,
            success: true,
            timestamp: Date.now(),
            userLoad: concurrentUsers
          })).catch(() => ({
            operation: `concurrent-login-${i}`,
            duration: 0,
            success: false,
            timestamp: Date.now(),
            userLoad: concurrentUsers
          }))
        )
      }

      const loginResults = await Promise.allSettled(results)
      const totalTime = performance.now() - startTime
      
      const successCount = loginResults.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length
      
      const successRate = (successCount / concurrentUsers) * 100
      const averageLoginTime = monitor.getAverageTime('concurrent-login')

      console.log(`Concurrent Load Results:`)
      console.log(`- Users: ${concurrentUsers}`)
      console.log(`- Success Rate: ${successRate.toFixed(1)}%`)
      console.log(`- Average Login Time: ${averageLoginTime.toFixed(2)}ms`)
      console.log(`- Total Test Time: ${totalTime.toFixed(2)}ms`)

      // Performance assertions
      expect(successRate).toBeGreaterThan(80) // 80% success rate minimum
      expect(averageLoginTime).toBeLessThan(TEST_CONFIG.performanceTargets.login * 2)

    } finally {
      // Clean up browser contexts
      await Promise.all(contexts.map(context => context.close()))
    }
  })

  test('should handle concurrent registration load', async ({ browser }) => {
    const concurrentUsers = 5 // Lower for registration to avoid overwhelming
    const contexts: BrowserContext[] = []
    const results: Promise<void>[] = []

    try {
      for (let i = 0; i < concurrentUsers; i++) {
        contexts.push(await browser.newContext())
      }

      const startTime = performance.now()

      for (let i = 0; i < concurrentUsers; i++) {
        const context = contexts[i]
        
        results.push(
          (async () => {
            const page = await context.newPage()
            const uniqueUser = {
              email: `loadtest-reg-${Date.now()}-${i}@example.com`,
              password: 'LoadTest123!',
              firstName: `LoadUser${i}`,
              lastName: 'Test'
            }

            await monitor.measureOperation(`concurrent-registration-${i}`, async () => {
              await page.goto(`${TEST_CONFIG.baseUrl}/sign-up`)
              await page.fill('input[name="emailAddress"]', uniqueUser.email)
              await page.fill('input[name="password"]', uniqueUser.password)
              await page.fill('input[name="firstName"]', uniqueUser.firstName)
              await page.fill('input[name="lastName"]', uniqueUser.lastName)
              await page.click('button[type="submit"]')
              
              await page.waitForURL(/verify-email|onboarding/, { timeout: 15000 })
            }, concurrentUsers)
          })()
        )
      }

      await Promise.allSettled(results)
      const totalTime = performance.now() - startTime
      
      const averageRegistrationTime = monitor.getAverageTime('concurrent-registration')
      const successRate = monitor.getSuccessRate('concurrent-registration')

      console.log(`Concurrent Registration Results:`)
      console.log(`- Users: ${concurrentUsers}`)
      console.log(`- Success Rate: ${successRate.toFixed(1)}%`)
      console.log(`- Average Registration Time: ${averageRegistrationTime.toFixed(2)}ms`)
      console.log(`- Total Test Time: ${totalTime.toFixed(2)}ms`)

      expect(successRate).toBeGreaterThan(70) // 70% success rate minimum for registration
      expect(averageRegistrationTime).toBeLessThan(TEST_CONFIG.performanceTargets.registration * 2)

    } finally {
      await Promise.all(contexts.map(context => context.close()))
    }
  })

  test('should handle API endpoint load', async ({ request }) => {
    const concurrentRequests = 20
    const iterations = 5
    const results: Promise<void>[] = []

    const endpoints = [
      '/api/health',
      '/api/auth/validate',
      '/api/user/profile'
    ]

    for (const endpoint of endpoints) {
      console.log(`Testing endpoint: ${endpoint}`)
      
      const endpointResults: number[] = []
      
      for (let iteration = 0; iteration < iterations; iteration++) {
        const promises: Promise<number>[] = []
        
        for (let req = 0; req < concurrentRequests; req++) {
          promises.push(
            monitor.measureOperation(`api-load-${endpoint}-${req}`, async () => {
              const response = await request.get(`${TEST_CONFIG.baseUrl}${endpoint}`)
              expect(response.status()).toBeLessThan(500)
              return response.status()
            }).then(result => result.duration)
          )
        }

        const iterationResults = await Promise.allSettled(promises)
        const successfulResults = iterationResults
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<number>).value)
        
        endpointResults.push(...successfulResults)
      }

      const averageTime = endpointResults.reduce((sum, t) => sum + t, 0) / endpointResults.length
      const maxTime = Math.max(...endpointResults)
      const p95Time = endpointResults.sort((a, b) => a - b)[Math.floor(endpointResults.length * 0.95)]

      console.log(`${endpoint} Load Test Results:`)
      console.log(`- Requests: ${concurrentRequests * iterations}`)
      console.log(`- Average Response Time: ${averageTime.toFixed(2)}ms`)
      console.log(`- 95th Percentile: ${p95Time.toFixed(2)}ms`)
      console.log(`- Max Response Time: ${maxTime.toFixed(2)}ms`)

      // Adjust targets based on endpoint
      const target = endpoint === '/api/health' ? 100 : 
                    endpoint.includes('auth') ? 200 : 500

      expect(averageTime).toBeLessThan(target)
      expect(p95Time).toBeLessThan(target * 2)
    }
  })
})

test.describe('Memory and Resource Usage', () => {
  test('should not have memory leaks during repeated operations', async ({ page }) => {
    // Monitor memory usage during repeated login/logout cycles
    await page.goto(TEST_CONFIG.baseUrl)

    const iterations = 10
    const memoryUsages: number[] = []

    for (let i = 0; i < iterations; i++) {
      // Login
      await page.goto(`${TEST_CONFIG.baseUrl}/sign-in`)
      await page.fill('input[name="emailAddress"]', TEST_CONFIG.testUsers[0].email)
      await page.fill('input[name="password"]', TEST_CONFIG.testUsers[0].password)
      await page.click('button[type="submit"]')
      await page.waitForURL(/dashboard|matches|onboarding/, { timeout: 10000 })

      // Measure memory (if available)
      const metrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
          jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0
        }
      })

      if (metrics.usedJSHeapSize > 0) {
        memoryUsages.push(metrics.usedJSHeapSize)
      }

      // Logout
      await page.click('[data-testid="user-menu"], [aria-label="User menu"]')
      await page.click('text=Sign out')
      await page.waitForURL(/sign-in|\//, { timeout: 5000 })
    }

    if (memoryUsages.length > 0) {
      const averageMemory = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length
      const memoryGrowth = memoryUsages[memoryUsages.length - 1] - memoryUsages[0]
      
      console.log(`Memory Usage Analysis:`)
      console.log(`- Average Memory: ${(averageMemory / 1024 / 1024).toFixed(2)} MB`)
      console.log(`- Memory Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`)
      
      // Memory shouldn't grow more than 50MB over 10 iterations
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024)
    }
  })

  test('should handle session cleanup efficiently', async ({ browser }) => {
    // Test session cleanup performance
    const sessionCount = 20
    const contexts: BrowserContext[] = []

    try {
      // Create multiple authenticated sessions
      for (let i = 0; i < sessionCount; i++) {
        const context = await browser.newContext()
        const page = await context.newPage()
        
        await page.goto(`${TEST_CONFIG.baseUrl}/sign-in`)
        await page.fill('input[name="emailAddress"]', TEST_CONFIG.testUsers[i % TEST_CONFIG.testUsers.length].email)
        await page.fill('input[name="password"]', TEST_CONFIG.testUsers[i % TEST_CONFIG.testUsers.length].password)
        await page.click('button[type="submit"]')
        
        contexts.push(context)
      }

      // Measure cleanup time
      const { duration } = await monitor.measureOperation('session-cleanup', async () => {
        await Promise.all(contexts.map(context => context.close()))
      })

      console.log(`Session cleanup time for ${sessionCount} sessions: ${duration.toFixed(2)}ms`)
      
      // Cleanup should be fast
      expect(duration).toBeLessThan(5000) // 5 seconds max

    } catch (error) {
      // Ensure cleanup even if test fails
      await Promise.all(contexts.map(context => context.close().catch(() => {})))
      throw error
    }
  })
})

test.describe('Performance Summary', () => {
  test('should generate performance report', async () => {
    const metrics = monitor.getMetrics()
    
    // Group metrics by operation
    const operationGroups = metrics.reduce((groups, metric) => {
      const operation = metric.operation.split('-')[0]
      if (!groups[operation]) {
        groups[operation] = []
      }
      groups[operation].push(metric)
      return groups
    }, {} as Record<string, PerformanceMetrics[]>)

    const performanceReport = {
      testSummary: {
        totalOperations: metrics.length,
        overallSuccessRate: (metrics.filter(m => m.success).length / metrics.length) * 100,
        testDuration: Math.max(...metrics.map(m => m.timestamp)) - Math.min(...metrics.map(m => m.timestamp))
      },
      operationMetrics: Object.entries(operationGroups).map(([operation, operationMetrics]) => ({
        operation,
        averageTime: operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length,
        successRate: (operationMetrics.filter(m => m.success).length / operationMetrics.length) * 100,
        count: operationMetrics.length,
        target: TEST_CONFIG.performanceTargets[operation as keyof typeof TEST_CONFIG.performanceTargets] || 'N/A'
      })),
      recommendations: [
        'Monitor database query performance during peak usage',
        'Implement caching for frequently accessed user data',
        'Consider CDN for static assets to improve global performance',
        'Add connection pooling for database connections',
        'Implement graceful degradation for high-load scenarios'
      ]
    }

    console.log('📊 Performance Test Report:', JSON.stringify(performanceReport, null, 2))

    // Assert overall performance
    expect(performanceReport.testSummary.overallSuccessRate).toBeGreaterThan(80)
  })
})