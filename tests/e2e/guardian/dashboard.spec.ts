import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';

/**
 * Guardian Dashboard E2E Tests
 * Tests guardian dashboard functionality, real-time activity feed, and overview features
 */
test.describe('Guardian Dashboard', () => {
  let guardianPage: Page;
  let userPage: Page;
  let user2Page: Page;

  test.beforeEach(async ({ browser }) => {
    const guardianContext = await browser.newContext();
    const userContext = await browser.newContext();
    const user2Context = await browser.newContext();

    guardianPage = await guardianContext.newPage();
    userPage = await userContext.newPage();
    user2Page = await user2Context.newPage();

    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');
    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(user2Page, 'test-user-2@test.faddl.com');

    await guardianPage.goto('/guardian');
    await userPage.goto('/messages');
    await user2Page.goto('/messages');
  });

  test('should display guardian dashboard overview', async () => {
    await test.step('Verify dashboard loads correctly', async () => {
      // Check main dashboard components
      await expect(guardianPage.locator('[data-testid="guardian-dashboard"]')).toBeVisible();
      await expect(guardianPage.locator('[data-testid="dashboard-header"]')).toContainText('Guardian Dashboard');
      
      // Verify guardian profile information
      const guardianProfile = guardianPage.locator('[data-testid="guardian-profile"]');
      await expect(guardianProfile).toBeVisible();
      await expect(guardianProfile).toContainText('Ibrahim Al-Rashid');
    });

    await test.step('Display ward overview statistics', async () => {
      // Check ward statistics
      const wardStats = guardianPage.locator('[data-testid="ward-statistics"]');
      await expect(wardStats).toBeVisible();
      
      // Should show number of wards
      await expect(wardStats).toContainText('1 Ward'); // test-user-1
      
      // Should show activity summary
      await expect(wardStats).toContainText('Active Conversations');
      await expect(wardStats).toContainText('Pending Approvals');
    });

    await test.step('Show recent activity overview', async () => {
      // Check activity feed preview
      const activityPreview = guardianPage.locator('[data-testid="recent-activity"]');
      await expect(activityPreview).toBeVisible();
      
      // Should show recent activities
      const activityItems = guardianPage.locator('[data-testid="activity-item"]');
      await expect(activityItems.first()).toBeVisible();
    });

    await test.step('Display quick action buttons', async () => {
      // Check quick actions are available
      const quickActions = guardianPage.locator('[data-testid="quick-actions"]');
      await expect(quickActions).toBeVisible();
      
      // Verify essential quick action buttons
      await expect(quickActions).toContainText('View Conversations');
      await expect(quickActions).toContainText('Review Pending');
      await expect(quickActions).toContainText('Settings');
    });
  });

  test('should display real-time activity feed', async () => {
    await test.step('View comprehensive activity feed', async () => {
      // Navigate to full activity feed
      await guardianPage.click('[data-testid="view-all-activity"]');
      
      // Check activity feed loads
      const activityFeed = guardianPage.locator('[data-testid="activity-feed"]');
      await expect(activityFeed).toBeVisible();
      
      // Should show chronological activities
      const feedItems = guardianPage.locator('[data-testid="feed-item"]');
      await expect(feedItems.first()).toBeVisible();
    });

    await test.step('Generate new activity and verify real-time updates', async () => {
      // Generate activity from user page
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'Testing real-time activity feed update');
      await userPage.click('[data-testid="send-button"]');
      
      // Guardian should see new activity in real-time
      const newActivity = guardianPage.locator('[data-testid="feed-item"]').first();
      await expect(newActivity).toContainText('sent a message', { timeout: 5000 });
      await expect(newActivity).toContainText('Ahmed'); // User's name
      
      // Activity should have timestamp
      await expect(newActivity.locator('[data-testid="activity-timestamp"]')).toBeVisible();
    });

    await test.step('Filter activities by type', async () => {
      // Test activity filtering
      await guardianPage.click('[data-testid="filter-activities"]');
      
      // Filter by messages only
      await guardianPage.check('[data-testid="filter-messages"]');
      await guardianPage.click('[data-testid="apply-filters"]');
      
      // Should only show message activities
      const filteredItems = guardianPage.locator('[data-testid="feed-item"]');
      await expect(filteredItems.first()).toContainText('message');
      
      // Clear filters
      await guardianPage.click('[data-testid="clear-filters"]');
    });

    await test.step('View activity details', async () => {
      // Click on activity item for details
      await guardianPage.click('[data-testid="feed-item"]', { position: { x: 0, y: 0 } });
      
      // Should show activity details modal
      const detailsModal = guardianPage.locator('[data-testid="activity-details"]');
      await expect(detailsModal).toBeVisible();
      
      // Should show full activity information
      await expect(detailsModal).toContainText('Activity Details');
      await expect(detailsModal).toContainText('Message Content');
    });
  });

  test('should provide ward management interface', async () => {
    await test.step('View ward profile and information', async () => {
      // Navigate to ward management
      await guardianPage.click('[data-testid="manage-wards"]');
      
      // Should show ward list
      const wardList = guardianPage.locator('[data-testid="ward-list"]');
      await expect(wardList).toBeVisible();
      
      // Should show ward profile card
      const wardCard = guardianPage.locator('[data-testid="ward-card-test-user-1"]');
      await expect(wardCard).toBeVisible();
      await expect(wardCard).toContainText('Ahmed Al-Rashid');
    });

    await test.step('View ward activity summary', async () => {
      // Click on ward card to view details
      await guardianPage.click('[data-testid="ward-card-test-user-1"]');
      
      // Should show ward details
      const wardDetails = guardianPage.locator('[data-testid="ward-details"]');
      await expect(wardDetails).toBeVisible();
      
      // Should show activity metrics
      await expect(wardDetails).toContainText('Conversations');
      await expect(wardDetails).toContainText('Messages Today');
      await expect(wardDetails).toContainText('Last Active');
    });

    await test.step('Configure ward permissions', async () => {
      // Navigate to ward permissions
      await guardianPage.click('[data-testid="ward-permissions"]');
      
      // Should show permission settings
      const permissionSettings = guardianPage.locator('[data-testid="permission-settings"]');
      await expect(permissionSettings).toBeVisible();
      
      // Should show toggleable permissions
      await expect(permissionSettings).toContainText('Message Monitoring');
      await expect(permissionSettings).toContainText('Match Approval');
      await expect(permissionSettings).toContainText('Meeting Arrangement');
      
      // Test permission toggle
      const messageMonitoring = guardianPage.locator('[data-testid="permission-message-monitoring"]');
      await messageMonitoring.check();
      
      // Save changes
      await guardianPage.click('[data-testid="save-permissions"]');
      await expect(guardianPage.locator('[data-testid="permissions-saved"]')).toBeVisible();
    });
  });

  test('should handle notification preferences and alerts', async () => {
    await test.step('Configure notification settings', async () => {
      // Navigate to notification settings
      await guardianPage.click('[data-testid="notification-settings"]');
      
      // Should show notification preferences
      const notificationPrefs = guardianPage.locator('[data-testid="notification-preferences"]');
      await expect(notificationPrefs).toBeVisible();
      
      // Configure different notification types
      await guardianPage.check('[data-testid="notify-new-messages"]');
      await guardianPage.check('[data-testid="notify-content-flags"]');
      await guardianPage.uncheck('[data-testid="notify-login-activity"]');
      
      // Set notification frequency
      await guardianPage.selectOption('[data-testid="notification-frequency"]', 'immediate');
      
      // Save preferences
      await guardianPage.click('[data-testid="save-notification-preferences"]');
    });

    await test.step('Test real-time notifications', async () => {
      // Generate activity that should trigger notification
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'This is a test for notification system');
      await userPage.click('[data-testid="send-button"]');
      
      // Guardian should receive notification
      const notification = guardianPage.locator('[data-testid="notification-toast"]');
      await expect(notification).toBeVisible({ timeout: 5000 });
      await expect(notification).toContainText('New message from Ahmed');
    });

    await test.step('View notification history', async () => {
      // Navigate to notification history
      await guardianPage.click('[data-testid="notification-history"]');
      
      // Should show historical notifications
      const notificationHistory = guardianPage.locator('[data-testid="notification-list"]');
      await expect(notificationHistory).toBeVisible();
      
      // Should show recent notifications
      const notifications = guardianPage.locator('[data-testid="notification-item"]');
      await expect(notifications.first()).toBeVisible();
      await expect(notifications.first()).toContainText('New message');
    });

    await test.step('Configure alert thresholds', async () => {
      // Navigate to alert settings
      await guardianPage.click('[data-testid="alert-settings"]');
      
      // Configure alert thresholds
      await guardianPage.fill('[data-testid="max-messages-per-hour"]', '20');
      await guardianPage.fill('[data-testid="max-conversation-duration"]', '60');
      
      // Enable specific alerts
      await guardianPage.check('[data-testid="alert-suspicious-content"]');
      await guardianPage.check('[data-testid="alert-rapid-messaging"]');
      
      await guardianPage.click('[data-testid="save-alert-settings"]');
    });
  });

  test('should provide comprehensive reporting and analytics', async () => {
    await test.step('View dashboard analytics', async () => {
      // Navigate to analytics section
      await guardianPage.click('[data-testid="analytics-dashboard"]');
      
      // Should show key metrics
      const analytics = guardianPage.locator('[data-testid="analytics-overview"]');
      await expect(analytics).toBeVisible();
      
      // Check for essential metrics
      await expect(analytics).toContainText('Total Conversations');
      await expect(analytics).toContainText('Messages Approved');
      await expect(analytics).toContainText('Content Compliance');
      await expect(analytics).toContainText('Response Time');
    });

    await test.step('Generate periodic reports', async () => {
      // Navigate to report generation
      await guardianPage.click('[data-testid="generate-reports"]');
      
      // Configure report parameters
      await guardianPage.selectOption('[data-testid="report-type"]', 'monthly');
      await guardianPage.selectOption('[data-testid="report-format"]', 'pdf');
      
      // Generate report
      await guardianPage.click('[data-testid="create-report"]');
      
      // Should show report generation status
      await expect(guardianPage.locator('[data-testid="report-generating"]')).toBeVisible();
      
      // Should complete and offer download
      await expect(guardianPage.locator('[data-testid="report-ready"]')).toBeVisible({ timeout: 10000 });
    });

    await test.step('View conversation trends', async () => {
      // Navigate to trend analysis
      await guardianPage.click('[data-testid="conversation-trends"]');
      
      // Should show trend charts
      const trendCharts = guardianPage.locator('[data-testid="trend-charts"]');
      await expect(trendCharts).toBeVisible();
      
      // Should show various trend metrics
      await expect(trendCharts).toContainText('Message Volume');
      await expect(trendCharts).toContainText('Compliance Rate');
      await expect(trendCharts).toContainText('Response Patterns');
    });

    await test.step('Export analytics data', async () => {
      // Test data export functionality
      await guardianPage.click('[data-testid="export-data"]');
      
      // Should show export options
      const exportOptions = guardianPage.locator('[data-testid="export-options"]');
      await expect(exportOptions).toBeVisible();
      
      // Select CSV export
      await guardianPage.click('[data-testid="export-csv"]');
      
      // Should trigger download
      await expect(guardianPage.locator('[data-testid="download-started"]')).toBeVisible();
    });
  });

  test('should handle guardian collaboration features', async () => {
    await test.step('View other guardians in network', async () => {
      // Navigate to guardian network
      await guardianPage.click('[data-testid="guardian-network"]');
      
      // Should show connected guardians
      const guardianNetwork = guardianPage.locator('[data-testid="guardian-list"]');
      await expect(guardianNetwork).toBeVisible();
      
      // Should show other guardian (Guardian 2)
      const otherGuardian = guardianPage.locator('[data-testid="guardian-card-guardian-2"]');
      await expect(otherGuardian).toBeVisible();
      await expect(otherGuardian).toContainText('Khadija Al-Zahra');
    });

    await test.step('Initiate guardian communication', async () => {
      // Click to start communication with another guardian
      await guardianPage.click('[data-testid="contact-guardian-2"]');
      
      // Should open guardian messaging interface
      const guardianMessaging = guardianPage.locator('[data-testid="guardian-messaging"]');
      await expect(guardianMessaging).toBeVisible();
      
      // Send message to other guardian
      const message = 'Assalamu Alaikum, shall we discuss our children\'s progress?';
      await guardianPage.fill('[data-testid="guardian-message-input"]', message);
      await guardianPage.click('[data-testid="send-guardian-message"]');
      
      // Message should appear in conversation
      await expect(guardianPage.locator(`[data-testid="guardian-message"]:has-text("${message}")`)).toBeVisible();
    });

    await test.step('Share ward insights with other guardians', async () => {
      // Navigate to insight sharing
      await guardianPage.click('[data-testid="share-insights"]');
      
      // Should show sharing interface
      const insightSharing = guardianPage.locator('[data-testid="insight-sharing"]');
      await expect(insightSharing).toBeVisible();
      
      // Select insights to share
      await guardianPage.check('[data-testid="share-conversation-summary"]');
      await guardianPage.check('[data-testid="share-compatibility-notes"]');
      
      // Share with specific guardian
      await guardianPage.selectOption('[data-testid="share-with-guardian"]', 'guardian-2');
      await guardianPage.click('[data-testid="send-insights"]');
      
      // Should confirm sharing
      await expect(guardianPage.locator('[data-testid="insights-shared"]')).toBeVisible();
    });
  });

  test('should provide emergency protocols and quick actions', async () => {
    await test.step('Access emergency controls', async () => {
      // Navigate to emergency controls
      await guardianPage.click('[data-testid="emergency-controls"]');
      
      // Should show emergency options
      const emergencyPanel = guardianPage.locator('[data-testid="emergency-panel"]');
      await expect(emergencyPanel).toBeVisible();
      
      // Should show different emergency actions
      await expect(emergencyPanel).toContainText('Pause All Conversations');
      await expect(emergencyPanel).toContainText('Alert Other Guardians');
      await expect(emergencyPanel).toContainText('Contact Support');
    });

    await test.step('Execute emergency pause', async () => {
      // Test emergency pause functionality
      await guardianPage.click('[data-testid="emergency-pause-all"]');
      
      // Should show confirmation dialog
      const confirmDialog = guardianPage.locator('[data-testid="emergency-confirm"]');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText('pause all conversations');
      
      // Confirm emergency action
      await guardianPage.click('[data-testid="confirm-emergency-pause"]');
      
      // Should show emergency status
      await expect(guardianPage.locator('[data-testid="emergency-active"]')).toBeVisible();
    });

    await test.step('Verify emergency protocols are activated', async () => {
      // Check that user conversations are paused
      await userPage.reload();
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Should show emergency pause notice
      const pauseNotice = userPage.locator('[data-testid="emergency-pause-notice"]');
      await expect(pauseNotice).toBeVisible();
      await expect(pauseNotice).toContainText('temporarily paused');
      
      // Message input should be disabled
      await expect(userPage.locator('[data-testid="message-input"]')).toBeDisabled();
    });

    await test.step('Restore normal operations', async () => {
      // Resume normal operations
      await guardianPage.click('[data-testid="resume-operations"]');
      
      // Should show confirmation
      const resumeConfirm = guardianPage.locator('[data-testid="resume-confirm"]');
      await expect(resumeConfirm).toBeVisible();
      
      await guardianPage.click('[data-testid="confirm-resume"]');
      
      // Emergency status should be cleared
      await expect(guardianPage.locator('[data-testid="emergency-active"]')).not.toBeVisible();
      
      // User should be able to message again
      await userPage.reload();
      await expect(userPage.locator('[data-testid="message-input"]')).toBeEnabled();
    });
  });
});