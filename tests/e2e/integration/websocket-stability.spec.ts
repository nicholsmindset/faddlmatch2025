import { test, expect, Page } from '@playwright/test';
import { authenticateUser, waitForWebSocket } from '../../helpers/auth-helpers';

/**
 * WebSocket Stability E2E Tests
 * Tests WebSocket connection stability, reconnection handling, and error recovery
 */
test.describe('WebSocket Stability', () => {
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

  test('should establish stable WebSocket connections', async () => {
    await test.step('Verify initial WebSocket connection', async () => {
      // Wait for WebSocket connection to establish
      await waitForWebSocket(userPage);
      
      // Check connection status indicator
      const connectionStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText('Connected');
      
      // Verify WebSocket is functional
      const wsReady = await userPage.evaluate(() => {
        return window.socket && window.socket.connected;
      });
      expect(wsReady).toBe(true);
    });

    await test.step('Test WebSocket heartbeat mechanism', async () => {
      // Monitor WebSocket heartbeat
      const heartbeatReceived = await userPage.evaluate(() => {
        return new Promise((resolve) => {
          let heartbeatCount = 0;
          
          window.socket.on('heartbeat', () => {
            heartbeatCount++;
            if (heartbeatCount >= 2) {
              resolve(true);
            }
          });
          
          // Timeout after 30 seconds
          setTimeout(() => resolve(false), 30000);
        });
      });
      
      expect(heartbeatReceived).toBe(true);
    });

    await test.step('Test multiple client connections', async () => {
      // Verify all clients can connect simultaneously
      await waitForWebSocket(user2Page);
      await waitForWebSocket(guardianPage);
      
      const user1Connected = await userPage.evaluate(() => window.socket?.connected);
      const user2Connected = await user2Page.evaluate(() => window.socket?.connected);
      const guardianConnected = await guardianPage.evaluate(() => window.socket?.connected);
      
      expect(user1Connected).toBe(true);
      expect(user2Connected).toBe(true);
      expect(guardianConnected).toBe(true);
    });

    await test.step('Test WebSocket connection persistence', async () => {
      // Test connection remains stable over time
      await userPage.waitForTimeout(10000); // Wait 10 seconds
      
      const stillConnected = await userPage.evaluate(() => window.socket?.connected);
      expect(stillConnected).toBe(true);
      
      // Verify connection is still functional
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'Connection persistence test');
      await userPage.click('[data-testid="send-button"]');
      
      // Message should be delivered
      await expect(userPage.locator('[data-testid="message-status"]:has-text("Delivered")')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should handle WebSocket disconnections gracefully', async () => {
    await test.step('Test network disconnection handling', async () => {
      // Establish connection first
      await waitForWebSocket(userPage);
      
      // Simulate network disconnection
      await userPage.context().setOffline(true);
      
      // Should detect disconnection
      const disconnectedStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(disconnectedStatus).toContainText('Disconnected', { timeout: 5000 });
      
      // Should show offline indicator
      const offlineIndicator = userPage.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible();
    });

    await test.step('Test automatic reconnection', async () => {
      // Restore network connection
      await userPage.context().setOffline(false);
      
      // Should automatically reconnect
      await waitForWebSocket(userPage);
      
      const reconnectedStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(reconnectedStatus).toContainText('Connected', { timeout: 10000 });
      
      // Offline indicator should disappear
      await expect(userPage.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });

    await test.step('Test WebSocket forced disconnection', async () => {
      // Force WebSocket disconnection via JavaScript
      await userPage.evaluate(() => {
        if (window.socket) {
          window.socket.disconnect();
        }
      });
      
      // Should show reconnecting status
      const reconnectingStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(reconnectingStatus).toContainText('Reconnecting', { timeout: 2000 });
      
      // Should automatically reconnect
      await expect(reconnectingStatus).toContainText('Connected', { timeout: 10000 });
    });

    await test.step('Test reconnection retry mechanism', async () => {
      // Monitor reconnection attempts
      const reconnectionAttempts = await userPage.evaluate(async () => {
        let attempts = 0;
        
        // Disconnect WebSocket
        window.socket?.disconnect();
        
        return new Promise((resolve) => {
          window.socket?.on('reconnect_attempt', () => {
            attempts++;
          });
          
          window.socket?.on('reconnect', () => {
            resolve(attempts);
          });
          
          // Timeout after 30 seconds
          setTimeout(() => resolve(attempts), 30000);
        });
      });
      
      // Should have made reconnection attempts
      expect(reconnectionAttempts).toBeGreaterThan(0);
    });
  });

  test('should handle WebSocket message queuing during disconnection', async () => {
    await test.step('Queue messages when disconnected', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Disconnect WebSocket
      await userPage.evaluate(() => window.socket?.disconnect());
      
      // Send messages while disconnected
      const queuedMessages = ['Queued message 1', 'Queued message 2', 'Queued message 3'];
      
      for (const message of queuedMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        await userPage.click('[data-testid="send-button"]');
        
        // Should show queued status
        await expect(userPage.locator('[data-testid="message-status"]:has-text("Queued")')).toBeVisible();
      }
      
      // Should show number of queued messages
      const queuedCount = userPage.locator('[data-testid="queued-messages-count"]');
      await expect(queuedCount).toContainText('3');
    });

    await test.step('Send queued messages on reconnection', async () => {
      // Reconnect WebSocket
      await userPage.evaluate(() => window.socket?.connect());
      await waitForWebSocket(userPage);
      
      // Queued messages should be sent automatically
      const deliveredMessages = userPage.locator('[data-testid="message-status"]:has-text("Delivered")');
      await expect(deliveredMessages).toHaveCount(3, { timeout: 10000 });
      
      // Queue should be cleared
      await expect(userPage.locator('[data-testid="queued-messages-count"]')).not.toBeVisible();
    });

    await test.step('Handle message queue overflow', async () => {
      // Disconnect and send many messages
      await userPage.evaluate(() => window.socket?.disconnect());
      
      // Send messages beyond queue limit
      for (let i = 0; i < 25; i++) {
        await userPage.fill('[data-testid="message-input"]', `Overflow test message ${i}`);
        await userPage.click('[data-testid="send-button"]');
      }
      
      // Should show queue overflow warning
      const overflowWarning = userPage.locator('[data-testid="queue-overflow-warning"]');
      await expect(overflowWarning).toBeVisible();
      await expect(overflowWarning).toContainText('message queue is full');
    });
  });

  test('should handle WebSocket error conditions', async () => {
    await test.step('Handle WebSocket connection errors', async () => {
      // Mock WebSocket connection error
      await userPage.evaluate(() => {
        // Simulate connection error
        if (window.socket) {
          window.socket.emit('connect_error', new Error('Connection failed'));
        }
      });
      
      // Should show connection error
      const connectionError = userPage.locator('[data-testid="connection-error"]');
      await expect(connectionError).toBeVisible();
      await expect(connectionError).toContainText('connection error');
      
      // Should provide retry option
      const retryButton = userPage.locator('[data-testid="retry-connection"]');
      await expect(retryButton).toBeVisible();
    });

    await test.step('Handle WebSocket message errors', async () => {
      // Send invalid message to trigger error
      await userPage.evaluate(() => {
        if (window.socket) {
          window.socket.emit('invalid_event', { invalid: 'data' });
        }
      });
      
      // Should handle error gracefully without breaking connection
      const connectionStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText('Connected');
    });

    await test.step('Handle WebSocket timeout errors', async () => {
      // Simulate WebSocket timeout
      const timeoutHandled = await userPage.evaluate(async () => {
        return new Promise((resolve) => {
          let timeoutDetected = false;
          
          // Simulate timeout event
          if (window.socket) {
            window.socket.on('timeout', () => {
              timeoutDetected = true;
            });
            
            // Trigger timeout
            window.socket.emit('timeout');
          }
          
          setTimeout(() => resolve(timeoutDetected), 2000);
        });
      });
      
      expect(timeoutHandled).toBe(true);
    });

    await test.step('Handle server-side WebSocket errors', async () => {
      // Test handling of server-side errors
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send message that might trigger server error
      await userPage.fill('[data-testid="message-input"]', 'Server error test message');
      
      // Mock server error response
      await userPage.evaluate(() => {
        if (window.socket) {
          window.socket.on('error', (error) => {
            console.log('WebSocket error:', error);
          });
        }
      });
      
      await userPage.click('[data-testid="send-button"]');
      
      // Should handle server error gracefully
      const errorMessage = userPage.locator('[data-testid="message-error"]');
      // Error handling should not break the WebSocket connection
      const connectionStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText('Connected');
    });
  });

  test('should maintain WebSocket performance under load', async () => {
    await test.step('Test multiple simultaneous connections', async () => {
      // Create additional browser contexts to simulate load
      const additionalUsers = [];
      
      for (let i = 0; i < 5; i++) {
        const context = await userPage.context().browser()?.newContext();
        if (context) {
          const page = await context.newPage();
          await authenticateUser(page, `load-test-user-${i}@test.faddl.com`);
          await page.goto('/messages');
          await waitForWebSocket(page);
          additionalUsers.push(page);
        }
      }
      
      // Verify all connections are stable
      for (const userPage of additionalUsers) {
        const connected = await userPage.evaluate(() => window.socket?.connected);
        expect(connected).toBe(true);
      }
      
      // Clean up
      for (const userPage of additionalUsers) {
        await userPage.context().close();
      }
    });

    await test.step('Test high-frequency message handling', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await user2Page.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send rapid sequence of messages
      const messageCount = 10;
      const messages = [];
      
      for (let i = 0; i < messageCount; i++) {
        const message = `High frequency test message ${i}`;
        messages.push(message);
        
        await userPage.fill('[data-testid="message-input"]', message);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(50); // 50ms between messages
      }
      
      // Verify all messages are delivered
      for (const message of messages) {
        await expect(user2Page.locator(`[data-testid="message-bubble"]:has-text("${message}")`)).toBeVisible({ timeout: 5000 });
      }
      
      // Verify WebSocket connection remains stable
      const connectionStatus = userPage.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText('Connected');
    });

    await test.step('Test WebSocket memory usage', async () => {
      // Monitor WebSocket memory usage over time
      const initialMemory = await userPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Generate WebSocket activity
      for (let i = 0; i < 50; i++) {
        await userPage.fill('[data-testid="message-input"]', `Memory test message ${i}`);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(100);
      }
      
      // Check memory usage hasn't grown excessively
      const finalMemory = await userPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
        // Memory increase should be reasonable (less than 50%)
        expect(memoryIncrease).toBeLessThan(0.5);
        
        console.log(`Memory usage increased by ${(memoryIncrease * 100).toFixed(2)}%`);
      }
    });

    await test.step('Test WebSocket connection limits', async () => {
      // Test behavior at connection limits
      const connections = [];
      const maxConnections = 10;
      
      try {
        for (let i = 0; i < maxConnections; i++) {
          const context = await userPage.context().browser()?.newContext();
          if (context) {
            const page = await context.newPage();
            await authenticateUser(page, `connection-limit-test-${i}@test.faddl.com`);
            await page.goto('/messages');
            
            try {
              await waitForWebSocket(page);
              connections.push({ page, context });
            } catch (error) {
              // Connection limit reached
              await context.close();
              break;
            }
          }
        }
        
        console.log(`Successfully established ${connections.length} WebSocket connections`);
        
        // Verify connections are stable
        for (const { page } of connections) {
          const connected = await page.evaluate(() => window.socket?.connected);
          expect(connected).toBe(true);
        }
        
      } finally {
        // Clean up all connections
        for (const { context } of connections) {
          await context.close();
        }
      }
    });
  });

  test('should handle WebSocket security and validation', async () => {
    await test.step('Test WebSocket authentication validation', async () => {
      // Test WebSocket connection with invalid authentication
      const authValidation = await userPage.evaluate(async () => {
        try {
          // Attempt to connect with invalid token
          const socket = new WebSocket(`ws://localhost:3000/ws?token=invalid-token`);
          
          return new Promise((resolve) => {
            socket.onopen = () => resolve({ connected: true });
            socket.onerror = () => resolve({ connected: false, error: true });
            socket.onclose = () => resolve({ connected: false, closed: true });
            
            setTimeout(() => resolve({ timeout: true }), 5000);
          });
        } catch (error) {
          return { error: error.message };
        }
      });
      
      // Should fail to connect with invalid authentication
      expect(authValidation.connected).not.toBe(true);
    });

    await test.step('Test WebSocket message validation', async () => {
      // Test sending invalid message format
      const messageValidation = await userPage.evaluate(() => {
        return new Promise((resolve) => {
          if (window.socket) {
            // Send invalid message format
            window.socket.emit('message', { invalid: 'format' });
            
            // Listen for validation error
            window.socket.on('validation_error', (error) => {
              resolve({ validationError: true, error });
            });
            
            // Timeout if no error received
            setTimeout(() => resolve({ validationError: false }), 3000);
          } else {
            resolve({ noSocket: true });
          }
        });
      });
      
      // Should receive validation error for invalid message
      expect(messageValidation.validationError).toBe(true);
    });

    await test.step('Test WebSocket rate limiting', async () => {
      // Test WebSocket message rate limiting
      const rateLimitTest = await userPage.evaluate(async () => {
        let rateLimited = false;
        
        if (window.socket) {
          // Send messages rapidly
          for (let i = 0; i < 100; i++) {
            window.socket.emit('message', {
              type: 'chat',
              content: `Rate limit test ${i}`,
              conversation_id: 'test-conversation-1'
            });
          }
          
          // Listen for rate limit response
          return new Promise((resolve) => {
            window.socket.on('rate_limit_exceeded', () => {
              rateLimited = true;
              resolve({ rateLimited: true });
            });
            
            setTimeout(() => resolve({ rateLimited }), 5000);
          });
        }
        
        return { noSocket: true };
      });
      
      // Should trigger rate limiting
      expect(rateLimitTest.rateLimited).toBe(true);
    });
  });
});