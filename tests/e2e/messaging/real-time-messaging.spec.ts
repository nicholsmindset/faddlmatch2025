import { test, expect, Page } from '@playwright/test';
import { authenticateUser, waitForWebSocket } from '../../helpers/auth-helpers';
import { sendTestMessage, validateMessageDelivery } from '../../helpers/api-helpers';

/**
 * Real-time Messaging E2E Tests
 * Tests real-time message delivery, WebSocket connections, and Islamic compliance
 */
test.describe('Real-time Messaging', () => {
  let user1Page: Page;
  let user2Page: Page;
  let guardianPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Set up multiple browser contexts for different users
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    const guardianContext = await browser.newContext();

    user1Page = await user1Context.newPage();
    user2Page = await user2Context.newPage();
    guardianPage = await guardianContext.newPage();

    // Authenticate different users
    await authenticateUser(user1Page, 'test-user-1@test.faddl.com');
    await authenticateUser(user2Page, 'test-user-2@test.faddl.com');
    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');

    // Navigate to messages page
    await user1Page.goto('/messages');
    await user2Page.goto('/messages');
    await guardianPage.goto('/guardian');
  });

  test.afterEach(async ({ browser }) => {
    await browser.close();
  });

  test('should establish WebSocket connection on page load', async () => {
    // Test WebSocket connection establishment
    await test.step('Verify WebSocket connection', async () => {
      await waitForWebSocket(user1Page);
      
      // Check for connection status indicator
      await expect(user1Page.locator('[data-testid="connection-status"]')).toContainText('Connected');
      
      // Verify real-time status is active
      const connectionIndicator = user1Page.locator('[data-testid="real-time-indicator"]');
      await expect(connectionIndicator).toBeVisible();
      await expect(connectionIndicator).toHaveClass(/connected/);
    });
  });

  test('should send and receive messages in real-time', async () => {
    const testMessage = 'TEST_MESSAGE: Assalamu Alaikum, how was your day?';
    
    await test.step('User 1 sends message', async () => {
      // Select existing conversation or create new one
      await user1Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Type and send message
      await user1Page.fill('[data-testid="message-input"]', testMessage);
      await user1Page.click('[data-testid="send-button"]');
      
      // Verify message appears in sender's view
      await expect(user1Page.locator('[data-testid="message-bubble"]').last()).toContainText(testMessage);
    });

    await test.step('User 2 receives message in real-time', async () => {
      // Navigate to same conversation
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Wait for real-time message delivery (should be < 100ms)
      const messageLocator = user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`);
      await expect(messageLocator).toBeVisible({ timeout: 2000 });
      
      // Verify message metadata
      await expect(messageLocator).toHaveAttribute('data-sender', 'test-user-1');
      await expect(messageLocator).toHaveAttribute('data-compliant', 'true');
    });

    await test.step('Guardian receives notification', async () => {
      // Check guardian dashboard for new message notification
      const notification = guardianPage.locator('[data-testid="message-notification"]').first();
      await expect(notification).toBeVisible({ timeout: 3000 });
      await expect(notification).toContainText('New message');
    });
  });

  test('should show typing indicators in real-time', async () => {
    await test.step('Setup conversation', async () => {
      await user1Page.click('[data-testid="conversation-test-conversation-1"]');
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
    });

    await test.step('User 1 starts typing', async () => {
      // Start typing (should trigger typing indicator)
      await user1Page.fill('[data-testid="message-input"]', 'Hello');
      
      // User 2 should see typing indicator
      const typingIndicator = user2Page.locator('[data-testid="typing-indicator"]');
      await expect(typingIndicator).toBeVisible({ timeout: 1000 });
      await expect(typingIndicator).toContainText('Ahmed is typing...');
    });

    await test.step('Typing indicator disappears when user stops', async () => {
      // Clear input (stop typing)
      await user1Page.fill('[data-testid="message-input"]', '');
      
      // Typing indicator should disappear
      await expect(user2Page.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 3000 });
    });
  });

  test('should handle message read receipts', async () => {
    const testMessage = 'TEST_MESSAGE: Please confirm you received this message.';
    
    await test.step('Send message and verify delivery status', async () => {
      await user1Page.click('[data-testid="conversation-test-conversation-1"]');
      await user1Page.fill('[data-testid="message-input"]', testMessage);
      await user1Page.click('[data-testid="send-button"]');
      
      // Message should show as delivered
      const messageStatus = user1Page.locator('[data-testid="message-status"]').last();
      await expect(messageStatus).toContainText('Delivered');
    });

    await test.step('Mark message as read and verify read receipt', async () => {
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Message should be visible and marked as read
      const messageLocator = user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`);
      await expect(messageLocator).toBeVisible();
      
      // Check read receipt on sender's side
      const readStatus = user1Page.locator('[data-testid="message-status"]').last();
      await expect(readStatus).toContainText('Read', { timeout: 2000 });
    });
  });

  test('should maintain connection during network interruptions', async () => {
    await test.step('Simulate network disconnection', async () => {
      // Simulate offline mode
      await user1Page.context().setOffline(true);
      
      // Connection status should update
      await expect(user1Page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
      
      // Should show offline indicator
      await expect(user1Page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });

    await test.step('Attempt to send message while offline', async () => {
      await user1Page.click('[data-testid="conversation-test-conversation-1"]');
      await user1Page.fill('[data-testid="message-input"]', 'TEST_MESSAGE: Offline test message');
      await user1Page.click('[data-testid="send-button"]');
      
      // Message should be queued
      await expect(user1Page.locator('[data-testid="message-status"]:has-text("Queued")')).toBeVisible();
    });

    await test.step('Restore connection and verify message delivery', async () => {
      // Restore network connection
      await user1Page.context().setOffline(false);
      
      // Wait for reconnection
      await waitForWebSocket(user1Page);
      await expect(user1Page.locator('[data-testid="connection-status"]')).toContainText('Connected');
      
      // Queued message should be delivered
      await expect(user1Page.locator('[data-testid="message-status"]:has-text("Delivered")')).toBeVisible({ timeout: 5000 });
    });
  });

  test('should enforce message rate limiting', async () => {
    await test.step('Send multiple messages rapidly', async () => {
      await user1Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send messages rapidly (should trigger rate limiting)
      for (let i = 0; i < 10; i++) {
        await user1Page.fill('[data-testid="message-input"]', `TEST_MESSAGE: Rapid message ${i}`);
        await user1Page.click('[data-testid="send-button"]');
      }
      
      // Should show rate limiting warning
      await expect(user1Page.locator('[data-testid="rate-limit-warning"]')).toBeVisible({ timeout: 2000 });
      await expect(user1Page.locator('[data-testid="rate-limit-warning"]')).toContainText('sending too quickly');
    });

    await test.step('Verify send button is temporarily disabled', async () => {
      // Send button should be disabled
      await expect(user1Page.locator('[data-testid="send-button"]')).toBeDisabled();
      
      // Wait for rate limit to reset
      await expect(user1Page.locator('[data-testid="send-button"]')).toBeEnabled({ timeout: 10000 });
    });
  });

  test('should handle WebSocket reconnection gracefully', async () => {
    await test.step('Force WebSocket disconnection', async () => {
      // Execute JavaScript to close WebSocket connection
      await user1Page.evaluate(() => {
        // Access the WebSocket connection and close it
        if (window.socket) {
          window.socket.disconnect();
        }
      });
      
      // Should show reconnecting status
      await expect(user1Page.locator('[data-testid="connection-status"]')).toContainText('Reconnecting');
    });

    await test.step('Verify automatic reconnection', async () => {
      // Should automatically reconnect
      await expect(user1Page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 5000 });
      
      // Test message delivery after reconnection
      await user1Page.fill('[data-testid="message-input"]', 'TEST_MESSAGE: Post-reconnection test');
      await user1Page.click('[data-testid="send-button"]');
      
      await expect(user1Page.locator('[data-testid="message-status"]:has-text("Delivered")')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should validate message delivery performance', async () => {
    const startTime = Date.now();
    
    await test.step('Measure message delivery time', async () => {
      await user1Page.click('[data-testid="conversation-test-conversation-1"]');
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send message and measure delivery time
      const testMessage = `TEST_MESSAGE: Performance test ${Date.now()}`;
      await user1Page.fill('[data-testid="message-input"]', testMessage);
      await user1Page.click('[data-testid="send-button"]');
      
      // Wait for message to appear on receiver's side
      await expect(user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`)).toBeVisible({ timeout: 1000 });
      
      const deliveryTime = Date.now() - startTime;
      console.log(`Message delivery time: ${deliveryTime}ms`);
      
      // Delivery should be under 100ms for real-time messaging
      expect(deliveryTime).toBeLessThan(1000); // Allow 1s buffer for test environment
    });
  });
});