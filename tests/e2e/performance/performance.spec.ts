import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';

/**
 * Performance E2E Tests
 * Tests page load times, API response times, and overall application performance
 */
test.describe('Performance Testing', () => {
  let userPage: Page;
  let guardianPage: Page;

  test.beforeEach(async ({ browser }) => {
    const userContext = await browser.newContext();
    const guardianContext = await browser.newContext();

    userPage = await userContext.newPage();
    guardianPage = await guardianContext.newPage();

    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');
  });

  test('should meet page load performance requirements', async () => {
    await test.step('Test messages page load time', async () => {
      const startTime = Date.now();
      
      await userPage.goto('/messages');
      
      // Wait for page to be fully loaded
      await userPage.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Messages page should load under 2.5 seconds
      expect(loadTime).toBeLessThan(2500);
      
      console.log(`Messages page load time: ${loadTime}ms`);
      
      // Verify essential elements are loaded
      await expect(userPage.locator('[data-testid="conversation-list"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="message-interface"]')).toBeVisible();
    });

    await test.step('Test guardian dashboard load time', async () => {
      const startTime = Date.now();
      
      await guardianPage.goto('/guardian');
      
      // Wait for page to be fully loaded
      await guardianPage.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Guardian dashboard should load under 2.5 seconds
      expect(loadTime).toBeLessThan(2500);
      
      console.log(`Guardian dashboard load time: ${loadTime}ms`);
      
      // Verify essential elements are loaded
      await expect(guardianPage.locator('[data-testid="guardian-dashboard"]')).toBeVisible();
      await expect(guardianPage.locator('[data-testid="activity-feed"]')).toBeVisible();
    });

    await test.step('Test matches page load time', async () => {
      const startTime = Date.now();
      
      await userPage.goto('/matches');
      
      // Wait for page to be fully loaded
      await userPage.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Matches page should load under 2.5 seconds
      expect(loadTime).toBeLessThan(2500);
      
      console.log(`Matches page load time: ${loadTime}ms`);
      
      // Verify essential elements are loaded
      await expect(userPage.locator('[data-testid="matches-view"]')).toBeVisible();
    });

    await test.step('Test initial app load time', async () => {
      // Clear browser cache and test fresh load
      await userPage.context().clearCookies();
      await userPage.context().clearPermissions();
      
      const startTime = Date.now();
      
      await userPage.goto('/');
      
      // Wait for app to be fully loaded
      await userPage.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Initial app load should be under 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`Initial app load time: ${loadTime}ms`);
    });
  });

  test('should maintain API response time performance', async () => {
    await test.step('Test message sending API performance', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const startTime = Date.now();
      
      // Listen for API response
      const responsePromise = userPage.waitForResponse(resp => 
        resp.url().includes('/api/messages') && resp.request().method() === 'POST'
      );
      
      await userPage.fill('[data-testid="message-input"]', 'Performance test message');
      await userPage.click('[data-testid="send-button"]');
      
      const response = await responsePromise;
      const apiResponseTime = Date.now() - startTime;
      
      // API response should be under 200ms
      expect(apiResponseTime).toBeLessThan(200);
      expect(response.status()).toBe(200);
      
      console.log(`Message API response time: ${apiResponseTime}ms`);
    });

    await test.step('Test conversation loading API performance', async () => {
      const startTime = Date.now();
      
      const responsePromise = userPage.waitForResponse(resp => 
        resp.url().includes('/api/conversations')
      );
      
      await userPage.reload();
      
      const response = await responsePromise;
      const apiResponseTime = Date.now() - startTime;
      
      // Conversation API should respond under 200ms
      expect(apiResponseTime).toBeLessThan(500); // Allow more time for page reload
      expect(response.status()).toBe(200);
      
      console.log(`Conversation API response time: ${apiResponseTime}ms`);
    });

    await test.step('Test guardian data API performance', async () => {
      const startTime = Date.now();
      
      const responsePromise = guardianPage.waitForResponse(resp => 
        resp.url().includes('/api/guardian')
      );
      
      await guardianPage.reload();
      
      const response = await responsePromise;
      const apiResponseTime = Date.now() - startTime;
      
      // Guardian API should respond under 200ms
      expect(apiResponseTime).toBeLessThan(500);
      expect(response.status()).toBe(200);
      
      console.log(`Guardian API response time: ${apiResponseTime}ms`);
    });

    await test.step('Test content moderation API performance', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const startTime = Date.now();
      
      const moderationPromise = userPage.waitForResponse(resp => 
        resp.url().includes('/api/moderate-content')
      );
      
      await userPage.fill('[data-testid="message-input"]', 'Content moderation performance test');
      
      const response = await moderationPromise;
      const moderationTime = Date.now() - startTime;
      
      // Content moderation should be under 100ms for real-time feedback
      expect(moderationTime).toBeLessThan(100);
      expect(response.status()).toBe(200);
      
      console.log(`Content moderation API response time: ${moderationTime}ms`);
    });
  });

  test('should demonstrate efficient resource usage', async () => {
    await test.step('Test memory usage during normal operation', async () => {
      await userPage.goto('/messages');
      
      // Get initial memory usage
      const initialMemory = await userPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Perform typical user actions
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send multiple messages
      for (let i = 0; i < 10; i++) {
        await userPage.fill('[data-testid="message-input"]', `Memory test message ${i}`);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(100);
      }
      
      // Navigate between conversations
      await userPage.click('[data-testid="conversation-list"]');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Get final memory usage
      const finalMemory = await userPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // Convert to MB
        
        // Memory increase should be reasonable (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10);
        
        console.log(`Memory usage increased by ${memoryIncrease.toFixed(2)}MB`);
      }
    });

    await test.step('Test network resource efficiency', async () => {
      // Track network requests during page operation
      const networkRequests: string[] = [];
      
      userPage.on('request', request => {
        networkRequests.push(request.url());
      });
      
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send a message
      await userPage.fill('[data-testid="message-input"]', 'Network efficiency test');
      await userPage.click('[data-testid="send-button"]');
      
      // Wait for all network activity to settle
      await userPage.waitForLoadState('networkidle');
      
      // Filter relevant API requests
      const apiRequests = networkRequests.filter(url => 
        url.includes('/api/') || url.includes('ws://')
      );
      
      // Should make reasonable number of API requests
      expect(apiRequests.length).toBeLessThan(20);
      
      console.log(`Total API requests made: ${apiRequests.length}`);
    });

    await test.step('Test DOM performance with large datasets', async () => {
      // Simulate loading many conversations
      await userPage.goto('/messages');
      
      const startTime = Date.now();
      
      // Wait for conversation list to load
      await userPage.waitForSelector('[data-testid="conversation-list"]');
      
      const loadTime = Date.now() - startTime;
      
      // Even with many conversations, should load quickly
      expect(loadTime).toBeLessThan(1000);
      
      // Test scrolling performance
      const scrollStartTime = Date.now();
      
      await userPage.locator('[data-testid="conversation-list"]').evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      
      const scrollTime = Date.now() - scrollStartTime;
      
      // Scrolling should be smooth (under 50ms)
      expect(scrollTime).toBeLessThan(50);
      
      console.log(`Large dataset scroll time: ${scrollTime}ms`);
    });
  });

  test('should maintain performance under load', async () => {
    await test.step('Test concurrent user simulation', async () => {
      // Create multiple browser contexts to simulate concurrent users
      const additionalUsers: Page[] = [];
      
      try {
        for (let i = 0; i < 3; i++) {
          const context = await userPage.context().browser()?.newContext();
          if (context) {
            const page = await context.newPage();
            await authenticateUser(page, `load-test-user-${i}@test.faddl.com`);
            additionalUsers.push(page);
          }
        }
        
        // All users navigate to messages simultaneously
        const navigationPromises = additionalUsers.map(page => 
          page.goto('/messages')
        );
        
        const startTime = Date.now();
        await Promise.all(navigationPromises);
        const concurrentLoadTime = Date.now() - startTime;
        
        // Concurrent loading should complete within reasonable time
        expect(concurrentLoadTime).toBeLessThan(5000);
        
        console.log(`Concurrent load time for ${additionalUsers.length} users: ${concurrentLoadTime}ms`);
        
        // Verify all pages loaded successfully
        for (const page of additionalUsers) {
          await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
        }
        
      } finally {
        // Clean up additional user contexts
        for (const page of additionalUsers) {
          await page.context().close();
        }
      }
    });

    await test.step('Test rapid message sending performance', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const messageCount = 20;
      const startTime = Date.now();
      
      // Send messages rapidly
      for (let i = 0; i < messageCount; i++) {
        await userPage.fill('[data-testid="message-input"]', `Rapid message ${i}`);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(50); // Small delay between messages
      }
      
      // Wait for all messages to be delivered
      await userPage.waitForSelector(`[data-testid="message-bubble"]:has-text("Rapid message ${messageCount - 1}")`, { timeout: 10000 });
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / messageCount;
      
      // Average time per message should be reasonable
      expect(averageTime).toBeLessThan(500);
      
      console.log(`Average time per rapid message: ${averageTime.toFixed(2)}ms`);
    });

    await test.step('Test guardian dashboard performance with high activity', async () => {
      // Generate activity to populate guardian dashboard
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send multiple messages to generate guardian notifications
      for (let i = 0; i < 10; i++) {
        await userPage.fill('[data-testid="message-input"]', `Guardian activity test ${i}`);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(200);
      }
      
      // Load guardian dashboard and measure performance
      const startTime = Date.now();
      
      await guardianPage.goto('/guardian');
      await guardianPage.waitForLoadState('networkidle');
      
      const dashboardLoadTime = Date.now() - startTime;
      
      // Guardian dashboard should load efficiently even with high activity
      expect(dashboardLoadTime).toBeLessThan(3000);
      
      console.log(`Guardian dashboard load time with high activity: ${dashboardLoadTime}ms`);
      
      // Verify all notifications are displayed
      const notifications = guardianPage.locator('[data-testid="notification-item"]');
      await expect(notifications.first()).toBeVisible();
    });
  });

  test('should optimize for mobile performance', async () => {
    await test.step('Test mobile device performance', async () => {
      // Simulate mobile device
      await userPage.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const startTime = Date.now();
      
      await userPage.goto('/messages');
      await userPage.waitForLoadState('networkidle');
      
      const mobileLoadTime = Date.now() - startTime;
      
      // Mobile load time should be reasonable
      expect(mobileLoadTime).toBeLessThan(3000);
      
      console.log(`Mobile messages page load time: ${mobileLoadTime}ms`);
      
      // Test mobile interaction performance
      const interactionStartTime = Date.now();
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.waitForSelector('[data-testid="message-input"]');
      
      const interactionTime = Date.now() - interactionStartTime;
      
      // Mobile interactions should be responsive
      expect(interactionTime).toBeLessThan(500);
      
      console.log(`Mobile interaction time: ${interactionTime}ms`);
    });

    await test.step('Test touch interface performance', async () => {
      // Simulate touch device
      await userPage.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Test touch scrolling performance
      const scrollStartTime = Date.now();
      
      await userPage.touchscreen.tap(400, 500);
      await userPage.evaluate(() => {
        const messageContainer = document.querySelector('[data-testid="message-container"]');
        if (messageContainer) {
          messageContainer.scrollTop = 200;
        }
      });
      
      const scrollTime = Date.now() - scrollStartTime;
      
      // Touch scrolling should be smooth
      expect(scrollTime).toBeLessThan(100);
      
      console.log(`Touch scroll performance: ${scrollTime}ms`);
    });

    await test.step('Test mobile keyboard performance', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Test mobile keyboard interaction
      const keyboardStartTime = Date.now();
      
      await userPage.click('[data-testid="message-input"]');
      await userPage.fill('[data-testid="message-input"]', 'Mobile keyboard test');
      
      const keyboardTime = Date.now() - keyboardStartTime;
      
      // Mobile keyboard interaction should be responsive
      expect(keyboardTime).toBeLessThan(1000);
      
      console.log(`Mobile keyboard interaction time: ${keyboardTime}ms`);
    });
  });

  test('should provide performance monitoring capabilities', async () => {
    await test.step('Collect Core Web Vitals metrics', async () => {
      await userPage.goto('/messages');
      
      // Wait for page to fully load
      await userPage.waitForLoadState('networkidle');
      
      // Collect Core Web Vitals
      const coreWebVitals = await userPage.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: any = {};
          
          // Largest Contentful Paint (LCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // First Input Delay (FID) - approximated with first click
          document.addEventListener('click', function(event) {
            if (!metrics.fid) {
              metrics.fid = performance.now() - event.timeStamp;
            }
          }, { once: true });
          
          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            metrics.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Return metrics after a delay to collect data
          setTimeout(() => resolve(metrics), 3000);
        });
      });
      
      console.log('Core Web Vitals:', coreWebVitals);
      
      // Verify Core Web Vitals meet performance standards
      if ((coreWebVitals as any).lcp) {
        expect((coreWebVitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      
      if ((coreWebVitals as any).cls !== undefined) {
        expect((coreWebVitals as any).cls).toBeLessThan(0.1); // CLS < 0.1
      }
    });

    await test.step('Monitor performance regressions', async () => {
      // Test for common performance regression indicators
      await userPage.goto('/messages');
      
      // Check for memory leaks
      const initialMemory = await userPage.evaluate(() => 
        (performance as any).memory?.usedJSHeapSize || 0
      );
      
      // Perform operations that might cause memory leaks
      for (let i = 0; i < 5; i++) {
        await userPage.click('[data-testid="conversation-test-conversation-1"]');
        await userPage.fill('[data-testid="message-input"]', `Memory leak test ${i}`);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(500);
      }
      
      const finalMemory = await userPage.evaluate(() => 
        (performance as any).memory?.usedJSHeapSize || 0
      );
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
        
        // Memory increase should be reasonable for the operations performed
        expect(memoryIncrease).toBeLessThan(0.5); // Less than 50% increase
        
        console.log(`Memory increase during operations: ${(memoryIncrease * 100).toFixed(2)}%`);
      }
    });

    await test.step('Generate performance report', async () => {
      // Collect comprehensive performance data
      const performanceData = await userPage.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource');
        
        return {
          navigation: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            firstByte: navigation.responseStart - navigation.navigationStart,
          },
          resources: resources.length,
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          } : null
        };
      });
      
      console.log('Performance Report:', JSON.stringify(performanceData, null, 2));
      
      // Verify key performance metrics
      expect(performanceData.navigation.domContentLoaded).toBeLessThan(2000);
      expect(performanceData.navigation.loadComplete).toBeLessThan(3000);
      expect(performanceData.navigation.firstByte).toBeLessThan(500);
    });
  });
});