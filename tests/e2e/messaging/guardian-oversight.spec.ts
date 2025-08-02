import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';

/**
 * Guardian Oversight E2E Tests
 * Tests guardian supervision, approval workflows, and family involvement features
 */
test.describe('Guardian Oversight', () => {
  let userPage: Page;
  let user2Page: Page;  
  let guardianPage: Page;
  let guardian2Page: Page;

  test.beforeEach(async ({ browser }) => {
    const userContext = await browser.newContext();
    const user2Context = await browser.newContext();
    const guardianContext = await browser.newContext();
    const guardian2Context = await browser.newContext();

    userPage = await userContext.newPage();
    user2Page = await user2Context.newPage();
    guardianPage = await guardianContext.newPage();
    guardian2Page = await guardian2Context.newPage();

    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(user2Page, 'test-user-2@test.faddl.com');
    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');
    await authenticateUser(guardian2Page, 'guardian-2@test.faddl.com');

    await userPage.goto('/messages');
    await user2Page.goto('/messages');
    await guardianPage.goto('/guardian');
    await guardian2Page.goto('/guardian');
  });

  test('should notify guardians of new conversations', async () => {
    await test.step('User initiates new conversation', async () => {
      // Navigate to matches and start new conversation
      await userPage.goto('/matches');
      await userPage.click('[data-testid="match-card-test-user-2"]');
      await userPage.click('[data-testid="start-conversation"]');
      
      // Send initial message
      await userPage.fill('[data-testid="message-input"]', 'Assalamu Alaikum, it\'s nice to meet you.');
      await userPage.click('[data-testid="send-button"]');
    });

    await test.step('Both guardians receive notifications', async () => {
      // Guardian 1 should receive notification
      const notification1 = guardianPage.locator('[data-testid="new-conversation-notification"]');
      await expect(notification1).toBeVisible({ timeout: 5000 });
      await expect(notification1).toContainText('New conversation started');
      await expect(notification1).toContainText('Ahmed'); // User 1's name
      
      // Guardian 2 should also receive notification
      const notification2 = guardian2Page.locator('[data-testid="new-conversation-notification"]');
      await expect(notification2).toBeVisible({ timeout: 5000 });
      await expect(notification2).toContainText('New conversation started');
      await expect(notification2).toContainText('Fatima'); // User 2's name
    });

    await test.step('Guardians can view conversation details', async () => {
      // Guardian clicks on notification
      await guardianPage.click('[data-testid="new-conversation-notification"]');
      
      // Should open conversation oversight view
      const conversationView = guardianPage.locator('[data-testid="conversation-oversight"]');
      await expect(conversationView).toBeVisible();
      
      // Should show participants and initial message
      await expect(conversationView).toContainText('Ahmed');
      await expect(conversationView).toContainText('Fatima');
      await expect(conversationView).toContainText('Assalamu Alaikum');
    });
  });

  test('should allow guardians to approve or intervene in conversations', async () => {
    await test.step('Guardian reviews ongoing conversation', async () => {
      // Navigate to existing conversation oversight
      await guardianPage.click('[data-testid="active-conversations"]');
      await guardianPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Should show conversation monitoring interface
      const monitoringInterface = guardianPage.locator('[data-testid="conversation-monitoring"]');
      await expect(monitoringInterface).toBeVisible();
      
      // Should show conversation history
      const messageHistory = guardianPage.locator('[data-testid="message-history"]');
      await expect(messageHistory).toBeVisible();
    });

    await test.step('Guardian can set conversation permissions', async () => {
      // Click on conversation settings
      await guardianPage.click('[data-testid="conversation-settings"]');
      
      // Should show permission controls
      const permissionControls = guardianPage.locator('[data-testid="permission-controls"]');
      await expect(permissionControls).toBeVisible();
      
      // Test different permission levels
      await guardianPage.check('[data-testid="require-approval"]');
      await guardianPage.click('[data-testid="save-permissions"]');
      
      // Should show confirmation
      await expect(guardianPage.locator('[data-testid="permissions-saved"]')).toBeVisible();
    });

    await test.step('Guardian can temporarily pause conversation', async () => {
      // Click pause conversation button
      await guardianPage.click('[data-testid="pause-conversation"]');
      
      // Should show confirmation dialog
      const confirmDialog = guardianPage.locator('[data-testid="pause-confirmation"]');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText('pause this conversation');
      
      await guardianPage.click('[data-testid="confirm-pause"]');
      
      // Should show paused status
      await expect(guardianPage.locator('[data-testid="conversation-status"]')).toContainText('Paused');
    });

    await test.step('Users are notified of conversation pause', async () => {
      // Users should see conversation is paused
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const pausedNotice = userPage.locator('[data-testid="conversation-paused"]');
      await expect(pausedNotice).toBeVisible();
      await expect(pausedNotice).toContainText('paused by guardian');
      
      // Message input should be disabled
      await expect(userPage.locator('[data-testid="message-input"]')).toBeDisabled();
    });
  });

  test('should handle guardian approval workflow for sensitive messages', async () => {
    let testMessage: string;
    
    await test.step('User sends message requiring approval', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Send message that requires guardian approval
      testMessage = 'I think we should meet to discuss our future together.';
      await userPage.fill('[data-testid="message-input"]', testMessage);
      await userPage.click('[data-testid="send-button"]');
      
      // Message should show pending approval status
      const messageStatus = userPage.locator('[data-testid="message-status"]').last();
      await expect(messageStatus).toContainText('Pending Approval');
    });

    await test.step('Guardian receives approval request', async () => {
      // Guardian should receive approval notification
      const approvalRequest = guardianPage.locator('[data-testid="approval-request"]');
      await expect(approvalRequest).toBeVisible({ timeout: 5000 });
      await expect(approvalRequest).toContainText('Message requires approval');
      
      // Click to review message
      await approvalRequest.click();
      
      // Should show message review interface
      const reviewInterface = guardianPage.locator('[data-testid="message-review"]');
      await expect(reviewInterface).toBeVisible();
      await expect(reviewInterface).toContainText(testMessage);
    });

    await test.step('Guardian approves message', async () => {
      // Guardian can add guidance note
      await guardianPage.fill('[data-testid="guidance-note"]', 'Meeting should include family members.');
      
      // Approve the message
      await guardianPage.click('[data-testid="approve-message"]');
      
      // Should show approval confirmation
      await expect(guardianPage.locator('[data-testid="approval-confirmed"]')).toBeVisible();
    });

    await test.step('Message is delivered with guardian guidance', async () => {
      // Message should now be visible to recipient
      const messageLocator = user2Page.locator(`[data-testid="message-bubble"]:has-text("${testMessage}")`);
      await expect(messageLocator).toBeVisible({ timeout: 5000 });
      
      // Should show guardian guidance note
      const guidanceNote = user2Page.locator('[data-testid="guardian-guidance"]');
      await expect(guidanceNote).toBeVisible();
      await expect(guidanceNote).toContainText('Meeting should include family members');
      
      // Original sender should see message as delivered
      const senderStatus = userPage.locator('[data-testid="message-status"]').last();
      await expect(senderStatus).toContainText('Delivered');
    });
  });

  test('should enable guardian-to-guardian communication', async () => {
    await test.step('Guardian initiates communication with other guardian', async () => {
      // Navigate to guardian communication
      await guardianPage.click('[data-testid="guardian-communication"]');
      
      // Start conversation with other guardian
      await guardianPage.click('[data-testid="contact-guardian-2"]');
      
      // Send message to other guardian
      const guardianMessage = 'Assalamu Alaikum, shall we discuss our children\'s compatibility?';
      await guardianPage.fill('[data-testid="guardian-message-input"]', guardianMessage);
      await guardianPage.click('[data-testid="send-guardian-message"]');
    });

    await test.step('Other guardian receives and responds', async () => {
      // Guardian 2 should receive notification
      const notification = guardian2Page.locator('[data-testid="guardian-message-notification"]');
      await expect(notification).toBeVisible({ timeout: 5000 });
      
      // Open guardian communication
      await guardian2Page.click('[data-testid="guardian-communication"]');
      
      // Should see message from Guardian 1
      const messageLocator = guardian2Page.locator('[data-testid="guardian-message"]');
      await expect(messageLocator).toContainText('discuss our children\'s compatibility');
      
      // Reply to Guardian 1
      const reply = 'Wa alaikum assalam, yes, I think they are well-suited for each other.';
      await guardian2Page.fill('[data-testid="guardian-message-input"]', reply);
      await guardian2Page.click('[data-testid="send-guardian-message"]');
      
      // Guardian 1 should receive reply
      await expect(guardianPage.locator(`[data-testid="guardian-message"]:has-text("${reply}")`)).toBeVisible({ timeout: 5000 });
    });
  });

  test('should track and report conversation analytics', async () => {
    await test.step('Generate conversation activity', async () => {
      // Create some conversation activity
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const messages = [
        'How was your day today?',
        'What are your hobbies and interests?',
        'Tell me about your family.'
      ];
      
      for (const message of messages) {
        await userPage.fill('[data-testid="message-input"]', message);
        await userPage.click('[data-testid="send-button"]');
        await userPage.waitForTimeout(1000); // Space out messages
      }
    });

    await test.step('Guardian views conversation analytics', async () => {
      // Navigate to analytics dashboard
      await guardianPage.click('[data-testid="conversation-analytics"]');
      
      // Should show conversation statistics
      const stats = guardianPage.locator('[data-testid="conversation-stats"]');
      await expect(stats).toBeVisible();
      
      // Should show message frequency
      await expect(stats).toContainText('Messages today');
      await expect(stats).toContainText('Response time');
      
      // Should show compliance metrics
      const complianceMetrics = guardianPage.locator('[data-testid="compliance-metrics"]');
      await expect(complianceMetrics).toBeVisible();
      await expect(complianceMetrics).toContainText('100%'); // All compliant
    });

    await test.step('Guardian can export conversation report', async () => {
      // Click export report button
      await guardianPage.click('[data-testid="export-report"]');
      
      // Should show export options
      const exportOptions = guardianPage.locator('[data-testid="export-options"]');
      await expect(exportOptions).toBeVisible();
      
      // Select PDF export
      await guardianPage.click('[data-testid="export-pdf"]');
      
      // Should show download confirmation
      await expect(guardianPage.locator('[data-testid="download-started"]')).toBeVisible();
    });
  });

  test('should handle emergency intervention scenarios', async () => {
    await test.step('Guardian detects concerning behavior pattern', async () => {
      // Guardian sees concerning conversation pattern
      await guardianPage.click('[data-testid="active-conversations"]');
      await guardianPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Guardian can flag conversation for review
      await guardianPage.click('[data-testid="flag-conversation"]');
      
      // Should show emergency options
      const emergencyOptions = guardianPage.locator('[data-testid="emergency-options"]');
      await expect(emergencyOptions).toBeVisible();
    });

    await test.step('Guardian can immediately terminate conversation', async () => {
      // Click emergency stop
      await guardianPage.click('[data-testid="emergency-stop"]');
      
      // Should show confirmation with serious warning
      const confirmDialog = guardianPage.locator('[data-testid="emergency-confirm"]');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText('immediately terminate');
      
      await guardianPage.click('[data-testid="confirm-emergency-stop"]');
      
      // Should show termination confirmation
      await expect(guardianPage.locator('[data-testid="conversation-terminated"]')).toBeVisible();
    });

    await test.step('Users are notified of conversation termination', async () => {
      // Both users should see termination notice
      const terminationNotice = userPage.locator('[data-testid="conversation-terminated-notice"]');
      await expect(terminationNotice).toBeVisible();
      await expect(terminationNotice).toContainText('terminated by guardian');
      
      // Conversation should be completely disabled
      await expect(userPage.locator('[data-testid="message-input"]')).not.toBeVisible();
      await expect(userPage.locator('[data-testid="send-button"]')).not.toBeVisible();
    });

    await test.step('Both guardians are notified of emergency action', async () => {
      // Guardian 2 should receive emergency notification
      const emergencyNotification = guardian2Page.locator('[data-testid="emergency-notification"]');
      await expect(emergencyNotification).toBeVisible({ timeout: 5000 });
      await expect(emergencyNotification).toContainText('emergency action taken');
    });
  });

  test('should maintain guardian oversight history and audit trail', async () => {
    await test.step('Generate oversight activities', async () => {
      // Perform various guardian actions
      await guardianPage.click('[data-testid="active-conversations"]');
      await guardianPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // View conversation
      await guardianPage.click('[data-testid="view-messages"]');
      
      // Add guidance note
      await guardianPage.click('[data-testid="add-guidance"]');
      await guardianPage.fill('[data-testid="guidance-input"]', 'Remember to keep conversations respectful.');
      await guardianPage.click('[data-testid="save-guidance"]');
    });

    await test.step('View oversight activity log', async () => {
      // Navigate to activity log
      await guardianPage.click('[data-testid="oversight-history"]');
      
      // Should show chronological list of actions
      const activityLog = guardianPage.locator('[data-testid="activity-log"]');
      await expect(activityLog).toBeVisible();
      
      // Should show recent actions
      await expect(activityLog).toContainText('Viewed conversation');
      await expect(activityLog).toContainText('Added guidance note');
      
      // Should show timestamps
      const timestamps = guardianPage.locator('[data-testid="activity-timestamp"]');
      await expect(timestamps.first()).toBeVisible();
    });

    await test.step('Generate comprehensive oversight report', async () => {
      // Generate monthly report
      await guardianPage.click('[data-testid="generate-report"]');
      await guardianPage.selectOption('[data-testid="report-period"]', 'monthly');
      await guardianPage.click('[data-testid="create-report"]');
      
      // Should show report summary
      const reportSummary = guardianPage.locator('[data-testid="report-summary"]');
      await expect(reportSummary).toBeVisible();
      await expect(reportSummary).toContainText('conversations monitored');
      await expect(reportSummary).toContainText('guidance provided');
    });
  });
});