import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';
import { 
  getInappropriateContent, 
  getIslamicGreetings, 
  getBoundaryTestContent 
} from '../../fixtures/sample-content';

/**
 * Content Moderation E2E Tests
 * Tests Islamic content validation, automatic moderation, and guardian oversight
 */
test.describe('Content Moderation', () => {
  let userPage: Page;
  let guardianPage: Page;

  test.beforeEach(async ({ browser }) => {
    const userContext = await browser.newContext();
    const guardianContext = await browser.newContext();

    userPage = await userContext.newPage();
    guardianPage = await guardianContext.newPage();

    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');

    await userPage.goto('/messages');
    await guardianPage.goto('/guardian');
  });

  test('should validate Islamic greetings and appropriate content', async () => {
    const islamicGreetings = getIslamicGreetings();
    
    await test.step('Test Islamic greetings are approved', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const greeting of islamicGreetings) {
        await userPage.fill('[data-testid="message-input"]', greeting.text);
        
        // Should show compliance indicator
        const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
        await expect(complianceIndicator).toHaveClass(/compliant/);
        await expect(complianceIndicator).toHaveAttribute('title', /Islamic greeting/);
        
        await userPage.click('[data-testid="send-button"]');
        
        // Message should be sent successfully
        const messageLocator = userPage.locator(`[data-testid="message-bubble"]:has-text("${greeting.text}")`);
        await expect(messageLocator).toBeVisible();
        await expect(messageLocator).toHaveAttribute('data-compliant', 'true');
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Test religious content is approved', async () => {
      const religiousContent = [
        'Alhamdulillah, I had a blessed day today.',
        'InshaAllah we can meet soon with our families.',
        'May Allah bless our families and guide us.',
        'I was at the mosque for Maghrib prayer.'
      ];
      
      for (const content of religiousContent) {
        await userPage.fill('[data-testid="message-input"]', content);
        
        const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
        await expect(complianceIndicator).toHaveClass(/compliant/);
        
        await userPage.click('[data-testid="send-button"]');
        
        const messageLocator = userPage.locator(`[data-testid="message-bubble"]:has-text("${content}")`);
        await expect(messageLocator).toBeVisible();
        await expect(messageLocator).toHaveAttribute('data-compliant', 'true');
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should block inappropriate content', async () => {
    const inappropriateContent = getInappropriateContent();
    
    await test.step('Test inappropriate content is blocked', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const content of inappropriateContent) {
        await userPage.fill('[data-testid="message-input"]', content.text);
        
        // Should show non-compliant indicator
        const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
        await expect(complianceIndicator).toHaveClass(/non-compliant/);
        await expect(complianceIndicator).toHaveAttribute('title', new RegExp(content.reason));
        
        // Send button should be disabled
        await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
        
        // Should show warning message
        const warningMessage = userPage.locator('[data-testid="content-warning"]');
        await expect(warningMessage).toBeVisible();
        await expect(warningMessage).toContainText(content.reason);
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Test attempting to send blocked content', async () => {
      const blockedContent = 'This is inappropriate content that should be blocked';
      await userPage.fill('[data-testid="message-input"]', blockedContent);
      
      // Try to force send by triggering Enter key
      await userPage.press('[data-testid="message-input"]', 'Enter');
      
      // Message should not be sent
      const messageLocator = userPage.locator(`[data-testid="message-bubble"]:has-text("${blockedContent}")`);
      await expect(messageLocator).not.toBeVisible();
      
      // Error message should be displayed
      await expect(userPage.locator('[data-testid="send-error"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="send-error"]')).toContainText('cannot be sent');
    });
  });

  test('should handle boundary cases in content moderation', async () => {
    const boundaryContent = getBoundaryTestContent();
    
    await test.step('Test boundary cases', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const content of boundaryContent) {
        await userPage.fill('[data-testid="message-input"]', content.text);
        
        const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
        
        if (content.shouldPass) {
          await expect(complianceIndicator).toHaveClass(/compliant/);
          await expect(userPage.locator('[data-testid="send-button"]')).toBeEnabled();
        } else {
          await expect(complianceIndicator).toHaveClass(/non-compliant/);
          await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
        }
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should trigger guardian notification for flagged content', async () => {
    await test.step('Send potentially concerning content', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const concerningContent = 'I want to meet you alone without our families knowing';
      await userPage.fill('[data-testid="message-input"]', concerningContent);
      
      // Content should be flagged but might still be sendable
      const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
      await expect(complianceIndicator).toHaveClass(/flagged/);
      
      await userPage.click('[data-testid="send-button"]');
    });

    await test.step('Guardian receives alert notification', async () => {
      // Check guardian dashboard for alert
      const alertNotification = guardianPage.locator('[data-testid="content-alert"]');
      await expect(alertNotification).toBeVisible({ timeout: 5000 });
      await expect(alertNotification).toContainText('Content requires review');
      
      // Click to view details
      await alertNotification.click();
      
      // Should show content review dialog
      const reviewDialog = guardianPage.locator('[data-testid="content-review-dialog"]');
      await expect(reviewDialog).toBeVisible();
      await expect(reviewDialog).toContainText('meet you alone');
    });

    await test.step('Guardian can approve or reject content', async () => {
      // Guardian can choose to approve or reject
      const approveButton = guardianPage.locator('[data-testid="approve-content"]');
      const rejectButton = guardianPage.locator('[data-testid="reject-content"]');
      
      await expect(approveButton).toBeVisible();
      await expect(rejectButton).toBeVisible();
      
      // Test rejection
      await rejectButton.click();
      
      // Should show confirmation
      await expect(guardianPage.locator('[data-testid="action-confirmation"]')).toContainText('Content rejected');
    });
  });

  test('should validate content length limits', async () => {
    await test.step('Test maximum message length', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Create very long message (over limit)
      const longMessage = 'A'.repeat(1001); // Assuming 1000 char limit
      await userPage.fill('[data-testid="message-input"]', longMessage);
      
      // Should show character count warning
      const charCounter = userPage.locator('[data-testid="character-counter"]');
      await expect(charCounter).toBeVisible();
      await expect(charCounter).toHaveClass(/over-limit/);
      
      // Send button should be disabled
      await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
    });

    await test.step('Test minimum message length', async () => {
      // Test empty message
      await userPage.fill('[data-testid="message-input"]', '');
      await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
      
      // Test very short message
      await userPage.fill('[data-testid="message-input"]', 'Hi');
      await expect(userPage.locator('[data-testid="send-button"]')).toBeEnabled();
    });
  });

  test('should handle real-time content moderation during typing', async () => {
    await test.step('Test real-time validation while typing', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const messageInput = userPage.locator('[data-testid="message-input"]');
      const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
      
      // Start with compliant content
      await messageInput.fill('Assalamu');
      await expect(complianceIndicator).toHaveClass(/compliant/);
      
      // Add non-compliant word
      await messageInput.fill('Assalamu inappropriate_word');
      await expect(complianceIndicator).toHaveClass(/non-compliant/);
      
      // Remove non-compliant word
      await messageInput.fill('Assalamu Alaikum');
      await expect(complianceIndicator).toHaveClass(/compliant/);
    });
  });

  test('should maintain moderation history and analytics', async () => {
    await test.step('Generate moderation events', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send mix of compliant and non-compliant content
      const testMessages = [
        { text: 'Assalamu Alaikum', compliant: true },
        { text: 'inappropriate content', compliant: false },
        { text: 'How was your day?', compliant: true },
        { text: 'more inappropriate content', compliant: false }
      ];
      
      for (const message of testMessages) {
        await userPage.fill('[data-testid="message-input"]', message.text);
        
        if (message.compliant) {
          await userPage.click('[data-testid="send-button"]');
        }
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Check guardian can view moderation history', async () => {
      // Navigate to moderation history in guardian dashboard
      await guardianPage.click('[data-testid="moderation-history"]');
      
      // Should show moderation events
      const moderationEvents = guardianPage.locator('[data-testid="moderation-event"]');
      await expect(moderationEvents).toHaveCount(2); // Two blocked messages
      
      // Should show statistics
      const stats = guardianPage.locator('[data-testid="moderation-stats"]');
      await expect(stats).toBeVisible();
      await expect(stats).toContainText('blocked');
      await expect(stats).toContainText('approved');
    });
  });

  test('should handle content moderation API failures gracefully', async () => {
    await test.step('Test moderation service failure', async () => {
      // Mock API failure by intercepting moderation API calls
      await userPage.route('**/api/moderate-content', route => route.abort());
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'Test message during API failure');
      
      // Should show fallback behavior (conservative approach - block sending)
      const errorIndicator = userPage.locator('[data-testid="moderation-error"]');
      await expect(errorIndicator).toBeVisible();
      await expect(errorIndicator).toContainText('moderation unavailable');
      
      // Send button should be disabled during API failure
      await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
    });

    await test.step('Test recovery from API failure', async () => {
      // Restore API functionality
      await userPage.unroute('**/api/moderate-content');
      
      // Wait for service recovery
      await userPage.waitForTimeout(2000);
      
      // Moderation should work again
      await userPage.fill('[data-testid="message-input"]', 'Assalamu Alaikum');
      
      const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
      await expect(complianceIndicator).toHaveClass(/compliant/);
      await expect(userPage.locator('[data-testid="send-button"]')).toBeEnabled();
    });
  });
});