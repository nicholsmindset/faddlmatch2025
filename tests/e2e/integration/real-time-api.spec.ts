import { test, expect, Page } from '@playwright/test';
import { authenticateUser, waitForWebSocket } from '../../helpers/auth-helpers';

/**
 * Real-time API Integration E2E Tests
 * Tests API response times, real-time synchronization, and system integration
 */
test.describe('Real-time API Integration', () => {
  let userPage: Page;
  let user2Page: Page;
  let guardianPage: Page;

  test.beforeEach(async ({ browser }) => {
    const userContext = await browser.newContext();
    const user2Context = await browser.newContext();
    const guardianContext = await browser.newContext();

    userPage = await userContext.newPage();
    user2Page = await user2Context.newPage();
    guardianPage = await guardianContext.newPage();

    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(user2Page, 'test-user-2@test.faddl.com');
    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');

    await userPage.goto('/messages');
    await user2Page.goto('/messages');
    await guardianPage.goto('/guardian');
  });

  test('should meet API response time requirements', async () => {
    await test.step('Test message API response times', async () => {
      // Navigate to conversation
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Measure message send API response time
      const startTime = Date.now();
      
      await userPage.fill('[data-testid="message-input"]', 'API response time test message');
      
      // Listen for API request completion
      const responsePromise = userPage.waitForResponse(resp => 
        resp.url().includes('/api/messages') && resp.request().method() === 'POST'
      );
      
      await userPage.click('[data-testid="send-button"]');
      
      const response = await responsePromise;
      const responseTime = Date.now() - startTime;
      
      // API response should be under 200ms
      expect(responseTime).toBeLessThan(200);
      expect(response.status()).toBe(200);
      
      console.log(`Message API response time: ${responseTime}ms`);
    });

    await test.step('Test conversation loading API response times', async () => {
      // Measure conversation loading time
      const startTime = Date.now();
      
      const responsePromise = userPage.waitForResponse(resp => 
        resp.url().includes('/api/conversations')
      );
      
      await userPage.reload();
      
      const response = await responsePromise;
      const responseTime = Date.now() - startTime;
      
      // Conversation loading should be under 200ms
      expect(responseTime).toBeLessThan(200);
      expect(response.status()).toBe(200);
      
      console.log(`Conversation API response time: ${responseTime}ms`);
    });

    await test.step('Test guardian dashboard API response times', async () => {
      // Measure guardian dashboard loading time
      const startTime = Date.now();
      
      const responsePromise = guardianPage.waitForResponse(resp => 
        resp.url().includes('/api/guardian/dashboard')
      );
      
      await guardianPage.reload();
      
      const response = await responsePromise;
      const responseTime = Date.now() - startTime;
      
      // Guardian dashboard should load under 200ms
      expect(responseTime).toBeLessThan(200);
      expect(response.status()).toBe(200);
      
      console.log(`Guardian dashboard API response time: ${responseTime}ms`);
    });

    await test.step('Test content moderation API response times', async () => {
      // Test real-time content moderation API
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const moderationStartTime = Date.now();
      
      // Monitor moderation API calls
      const moderationPromise = userPage.waitForResponse(resp => 
        resp.url().includes('/api/moderate-content')
      );
      
      await userPage.fill('[data-testid="message-input"]', 'Content moderation test message');
      
      const moderationResponse = await moderationPromise;
      const moderationTime = Date.now() - moderationStartTime;
      
      // Content moderation should be under 100ms for real-time feedback
      expect(moderationTime).toBeLessThan(100);
      expect(moderationResponse.status()).toBe(200);
      
      console.log(`Content moderation API response time: ${moderationTime}ms`);
    });
  });

  test('should maintain real-time synchronization across clients', async () => {
    await test.step('Test real-time message synchronization', async () => {
      // Set up both users in same conversation
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
      
      const testMessage = `Real-time sync test ${Date.now()}`;
      
      // User 1 sends message
      await userPage.fill('[data-testid="message-input"]', testMessage);
      
      const syncStartTime = Date.now();
      await userPage.click('[data-testid="send-button"]');
      
      // User 2 should receive message in real-time
      const messageLocator = user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`);
      await expect(messageLocator).toBeVisible({ timeout: 1000 });
      
      const syncTime = Date.now() - syncStartTime;
      
      // Real-time delivery should be under 100ms
      expect(syncTime).toBeLessThan(1000); // Allow 1s buffer for test environment
      
      console.log(`Real-time sync time: ${syncTime}ms`);
    });

    await test.step('Test typing indicator synchronization', async () => {
      // Test typing indicator real-time sync
      const typingStartTime = Date.now();
      
      // User 1 starts typing
      await userPage.fill('[data-testid="message-input"]', 'T');
      
      // User 2 should see typing indicator
      const typingIndicator = user2Page.locator('[data-testid="typing-indicator"]');
      await expect(typingIndicator).toBeVisible({ timeout: 1000 });
      
      const typingIndicatorTime = Date.now() - typingStartTime;
      
      // Typing indicator should appear quickly
      expect(typingIndicatorTime).toBeLessThan(500);
      
      console.log(`Typing indicator sync time: ${typingIndicatorTime}ms`);
    });

    await test.step('Test guardian real-time notifications', async () => {
      // Generate activity that should notify guardian
      const notificationStartTime = Date.now();
      
      const testMessage = 'Guardian notification test message';
      await userPage.fill('[data-testid="message-input"]', testMessage);
      await userPage.click('[data-testid="send-button"]');
      
      // Guardian should receive real-time notification
      const guardianNotification = guardianPage.locator('[data-testid="message-notification"]');
      await expect(guardianNotification).toBeVisible({ timeout: 2000 });
      
      const notificationTime = Date.now() - notificationStartTime;
      
      // Guardian notification should be timely
      expect(notificationTime).toBeLessThan(2000);
      
      console.log(`Guardian notification time: ${notificationTime}ms`);
    });

    await test.step('Test multi-client state synchronization', async () => {
      // Test that actions in one client sync to others
      const testMessage = 'Multi-client sync test';
      
      await userPage.fill('[data-testid="message-input"]', testMessage);
      await userPage.click('[data-testid="send-button"]');
      
      // Wait for message to appear in sender's view
      await expect(userPage.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`)).toBeVisible();
      
      // Check message appears in recipient's view
      await expect(user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`)).toBeVisible();
      
      // Check message appears in guardian's monitoring view
      await guardianPage.click('[data-testid="active-conversations"]');
      await guardianPage.click('[data-testid="conversation-test-conversation-1"]');
      
      await expect(guardianPage.locator(`[data-testid="message-item"]:has-text("${testMessage}")`)).toBeVisible();
    });
  });

  test('should handle API rate limiting and throttling', async () => {
    await test.step('Test message rate limiting', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send messages rapidly to trigger rate limiting
      const rateLimitPromises = [];
      
      for (let i = 0; i < 20; i++) {
        const promise = userPage.evaluate((index) => {
          return fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: 'test-conversation-1',
              content: `Rate limit test message ${index}`
            })
          }).then(r => ({ status: r.status, index }));
        }, i);
        
        rateLimitPromises.push(promise);
      }
      
      const responses = await Promise.all(rateLimitPromises);
      
      // Should see some rate limited responses (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      console.log(`Rate limited ${rateLimitedResponses.length} out of ${responses.length} requests`);
    });

    await test.step('Test API throttling recovery', async () => {
      // Wait for rate limit to reset
      await userPage.waitForTimeout(5000);
      
      // Should be able to send messages again
      await userPage.fill('[data-testid="message-input"]', 'Post rate-limit recovery test');
      await userPage.click('[data-testid="send-button"]');
      
      // Message should be sent successfully
      await expect(userPage.locator('[data-testid="message-status"]:has-text("Delivered")')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test content moderation rate limiting', async () => {
      // Test rapid content moderation requests
      const moderationPromises = [];
      
      for (let i = 0; i < 10; i++) {
        const promise = userPage.evaluate((index) => {
          return fetch('/api/moderate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `Moderation test content ${index}`
            })
          }).then(r => r.status);
        }, i);
        
        moderationPromises.push(promise);
      }
      
      const moderationResponses = await Promise.all(moderationPromises);
      
      // Most should succeed, but some may be rate limited
      const successfulModerations = moderationResponses.filter(status => status === 200);
      expect(successfulModerations.length).toBeGreaterThan(5);
      
      console.log(`${successfulModerations.length} successful moderation requests out of ${moderationResponses.length}`);
    });
  });

  test('should maintain API data consistency', async () => {
    await test.step('Test message ordering consistency', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send rapid sequence of messages
      const messages = ['First message', 'Second message', 'Third message'];
      
      for (const message of messages) {
        await userPage.fill('[data-testid="message-input"]', message);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(100); // Small delay between messages
      }
      
      // Verify message order is consistent across clients
      const senderMessages = await userPage.locator('[data-testid="message-bubble"]').allTextContents();
      const receiverMessages = await user2Page.locator('[data-testid="message-bubble"]').allTextContents();
      
      // Filter to get only our test messages
      const senderTestMessages = senderMessages.filter(text => 
        messages.some(msg => text.includes(msg))
      );
      const receiverTestMessages = receiverMessages.filter(text => 
        messages.some(msg => text.includes(msg))
      );
      
      // Message order should be consistent
      expect(senderTestMessages).toEqual(receiverTestMessages);
    });

    await test.step('Test conversation state consistency', async () => {
      // Generate conversation activity
      const testMessage = 'Conversation state consistency test';
      await userPage.fill('[data-testid="message-input"]', testMessage);
      await userPage.click('[data-testid="send-button"]');
      
      // Check conversation state across different views
      // User 1 view
      await expect(userPage.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`)).toBeVisible();
      
      // User 2 view
      await expect(user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`)).toBeVisible();
      
      // Guardian monitoring view
      await guardianPage.click('[data-testid="active-conversations"]');
      await guardianPage.click('[data-testid="conversation-test-conversation-1"]');
      await expect(guardianPage.locator(`[data-testid="message-item"]:has-text("${testMessage}")`)).toBeVisible();
      
      // Verify message metadata consistency
      const userMessageData = await userPage.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`).getAttribute('data-message-id');
      const user2MessageData = await user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`).getAttribute('data-message-id');
      
      expect(userMessageData).toBe(user2MessageData);
    });

    await test.step('Test guardian data consistency', async () => {
      // Generate guardian activity
      await guardianPage.click('[data-testid="active-conversations"]');
      await guardianPage.click('[data-testid="conversation-test-conversation-1"]');
      await guardianPage.click('[data-testid="add-guidance"]');
      await guardianPage.fill('[data-testid="guidance-input"]', 'Test guidance note');
      await guardianPage.click('[data-testid="save-guidance"]');
      
      // Verify guidance appears in user view
      await userPage.reload();
      const guidanceNote = userPage.locator('[data-testid="guardian-guidance"]');
      await expect(guidanceNote).toBeVisible();
      await expect(guidanceNote).toContainText('Test guidance note');
      
      // Verify guidance appears in other user's view
      await user2Page.reload();
      const guidanceNote2 = user2Page.locator('[data-testid="guardian-guidance"]');
      await expect(guidanceNote2).toBeVisible();
      await expect(guidanceNote2).toContainText('Test guidance note');
    });
  });

  test('should handle API authentication and authorization', async () => {
    await test.step('Test API authentication validation', async () => {
      // Test API calls with invalid authentication
      const response = await userPage.evaluate(async () => {
        try {
          const result = await fetch('/api/messages', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer invalid-token'
            },
            body: JSON.stringify({
              conversation_id: 'test-conversation-1',
              content: 'Unauthorized test message'
            })
          });
          return { status: result.status };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
    });

    await test.step('Test role-based API authorization', async () => {
      // Test guardian-only API endpoint with user credentials
      const response = await userPage.evaluate(async () => {
        try {
          const result = await fetch('/api/guardian/terminate-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: 'test-conversation-1'
            })
          });
          return { status: result.status };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      // Should return 403 Forbidden (user lacks guardian permissions)
      expect(response.status).toBe(403);
    });

    await test.step('Test guardian API authorization', async () => {
      // Test guardian accessing their ward's data
      const response = await guardianPage.evaluate(async () => {
        try {
          const result = await fetch('/api/guardian/ward-conversations/test-user-1');
          return { status: result.status };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      // Should succeed for guardian accessing their ward
      expect(response.status).toBe(200);
    });

    await test.step('Test cross-guardian data access prevention', async () => {
      // Test guardian trying to access another guardian's ward
      const response = await guardianPage.evaluate(async () => {
        try {
          const result = await fetch('/api/guardian/ward-conversations/test-user-3'); // Not their ward
          return { status: result.status };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      // Should return 403 Forbidden (accessing unauthorized ward)
      expect(response.status).toBe(403);
    });
  });

  test('should provide comprehensive API error handling', async () => {
    await test.step('Test network failure handling', async () => {
      // Simulate network failure
      await userPage.context().setOffline(true);
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'Network failure test message');
      await userPage.click('[data-testid="send-button"]');
      
      // Should show network error message
      const networkError = userPage.locator('[data-testid="network-error"]');
      await expect(networkError).toBeVisible();
      await expect(networkError).toContainText('network connection');
      
      // Message should be queued for retry
      await expect(userPage.locator('[data-testid="message-queued"]')).toBeVisible();
      
      // Restore network
      await userPage.context().setOffline(false);
      
      // Message should be sent automatically
      await expect(userPage.locator('[data-testid="message-delivered"]')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Test API server error handling', async () => {
      // Mock server error response
      await userPage.route('**/api/messages', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      }));
      
      await userPage.fill('[data-testid="message-input"]', 'Server error test message');
      await userPage.click('[data-testid="send-button"]');
      
      // Should show server error message
      const serverError = userPage.locator('[data-testid="server-error"]');
      await expect(serverError).toBeVisible();
      await expect(serverError).toContainText('server error');
      
      // Should provide retry option
      const retryButton = userPage.locator('[data-testid="retry-message"]');
      await expect(retryButton).toBeVisible();
      
      // Clear mock and test retry
      await userPage.unroute('**/api/messages');
      await retryButton.click();
      
      // Message should be sent successfully on retry
      await expect(userPage.locator('[data-testid="message-delivered"]')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test API validation error handling', async () => {
      // Test invalid message content
      const response = await userPage.evaluate(async () => {
        try {
          const result = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: 'test-conversation-1',
              content: '' // Empty content should fail validation
            })
          });
          return { 
            status: result.status, 
            data: await result.json() 
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      // Should return 400 Bad Request with validation errors
      expect(response.status).toBe(400);
      expect(response.data.errors).toBeDefined();
    });
  });
});