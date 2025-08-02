import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';

/**
 * Guardian Permissions E2E Tests
 * Tests guardian permission management, role-based access, and permission enforcement
 */
test.describe('Guardian Permissions', () => {
  let guardianPage: Page;
  let secondGuardianPage: Page;
  let userPage: Page;

  test.beforeEach(async ({ browser }) => {
    const guardianContext = await browser.newContext();
    const secondGuardianContext = await browser.newContext();
    const userContext = await browser.newContext();

    guardianPage = await guardianContext.newPage();
    secondGuardianPage = await secondGuardianContext.newPage();
    userPage = await userContext.newPage();

    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');
    await authenticateUser(secondGuardianPage, 'guardian-2@test.faddl.com');
    await authenticateUser(userPage, 'test-user-1@test.faddl.com');

    await guardianPage.goto('/guardian');
    await secondGuardianPage.goto('/guardian');
    await userPage.goto('/messages');
  });

  test('should manage guardian role hierarchy and permissions', async () => {
    await test.step('View guardian role settings', async () => {
      // Navigate to permission settings
      await guardianPage.click('[data-testid="permission-settings"]');
      
      // Should show guardian role information
      const roleInfo = guardianPage.locator('[data-testid="guardian-role-info"]');
      await expect(roleInfo).toBeVisible();
      await expect(roleInfo).toContainText('Primary Guardian');
      await expect(roleInfo).toContainText('Full Permissions');
    });

    await test.step('Configure ward-specific permissions', async () => {
      // Navigate to ward permissions
      await guardianPage.click('[data-testid="ward-permissions"]');
      
      // Should show permission matrix for each ward
      const permissionMatrix = guardianPage.locator('[data-testid="permission-matrix"]');
      await expect(permissionMatrix).toBeVisible();
      
      // Configure message monitoring permission
      const messageMonitoring = guardianPage.locator('[data-testid="permission-message-monitoring"]');
      await expect(messageMonitoring).toBeChecked(); // Should be enabled by default
      
      // Configure match approval permission
      const matchApproval = guardianPage.locator('[data-testid="permission-match-approval"]');
      await expect(matchApproval).toBeChecked();
      
      // Configure meeting arrangement permission
      const meetingArrangement = guardianPage.locator('[data-testid="permission-meeting-arrangement"]');
      await expect(meetingArrangement).toBeChecked();
      
      // Test permission modification
      await matchApproval.uncheck();
      await guardianPage.click('[data-testid="save-permissions"]');
      
      // Should show permission updated confirmation
      await expect(guardianPage.locator('[data-testid="permissions-updated"]')).toBeVisible();
    });

    await test.step('Verify permission enforcement', async () => {
      // With match approval disabled, guardian should not see match approval requests
      await guardianPage.click('[data-testid="pending-approvals"]');
      
      // Match approval section should be disabled or hidden
      const matchApprovalSection = guardianPage.locator('[data-testid="match-approvals"]');
      await expect(matchApprovalSection).toHaveClass(/disabled/);
      
      // Re-enable permission
      await guardianPage.click('[data-testid="permission-settings"]');
      await guardianPage.click('[data-testid="ward-permissions"]');
      await guardianPage.check('[data-testid="permission-match-approval"]');
      await guardianPage.click('[data-testid="save-permissions"]');
    });
  });

  test('should handle multi-guardian permission coordination', async () => {
    await test.step('Set up shared guardian responsibilities', async () => {
      // Guardian 1 configures shared permissions
      await guardianPage.click('[data-testid="shared-guardianship"]');
      
      // Should show shared guardian interface
      const sharedGuardianship = guardianPage.locator('[data-testid="shared-guardianship-interface"]');
      await expect(sharedGuardianship).toBeVisible();
      
      // Add second guardian
      await guardianPage.click('[data-testid="add-co-guardian"]');
      await guardianPage.fill('[data-testid="co-guardian-email"]', 'guardian-2@test.faddl.com');
      
      // Set shared permissions
      await guardianPage.check('[data-testid="shared-message-monitoring"]');
      await guardianPage.check('[data-testid="shared-approval-workflow"]');
      
      // Define permission hierarchy
      await guardianPage.selectOption('[data-testid="co-guardian-role"]', 'secondary');
      
      // Send invitation
      await guardianPage.click('[data-testid="send-guardian-invitation"]');
      
      // Should show invitation sent confirmation
      await expect(guardianPage.locator('[data-testid="invitation-sent"]')).toBeVisible();
    });

    await test.step('Second guardian accepts shared responsibility', async () => {
      // Guardian 2 should receive invitation notification
      const invitation = secondGuardianPage.locator('[data-testid="guardian-invitation"]');
      await expect(invitation).toBeVisible({ timeout: 5000 });
      
      // Click to view invitation details
      await invitation.click();
      
      // Should show invitation details
      const invitationDetails = secondGuardianPage.locator('[data-testid="invitation-details"]');
      await expect(invitationDetails).toBeVisible();
      await expect(invitationDetails).toContainText('Secondary Guardian');
      await expect(invitationDetails).toContainText('Ahmed Al-Rashid'); // Ward name
      
      // Accept invitation
      await secondGuardianPage.click('[data-testid="accept-invitation"]');
      
      // Should show acceptance confirmation
      await expect(secondGuardianPage.locator('[data-testid="invitation-accepted"]')).toBeVisible();
    });

    await test.step('Verify shared guardian permissions', async () => {
      // Guardian 2 should now see shared ward in dashboard
      await secondGuardianPage.reload();
      
      const sharedWard = secondGuardianPage.locator('[data-testid="shared-ward-test-user-1"]');
      await expect(sharedWard).toBeVisible();
      await expect(sharedWard).toContainText('Shared Guardianship');
      await expect(sharedWard).toContainText('Secondary Guardian');
      
      // Guardian 2 should have limited permissions
      await secondGuardianPage.click('[data-testid="shared-ward-test-user-1"]');
      
      // Should see monitoring capabilities
      const monitoringInterface = secondGuardianPage.locator('[data-testid="monitoring-interface"]');
      await expect(monitoringInterface).toBeVisible();
      
      // Should not see primary guardian functions
      await expect(secondGuardianPage.locator('[data-testid="terminate-guardianship"]')).not.toBeVisible();
    });

    await test.step('Test approval workflow coordination', async () => {
      // Generate approval request that requires both guardians
      await userPage.goto('/matches');
      await userPage.click('[data-testid="match-card-test-user-2"]');
      await userPage.click('[data-testid="request-match-approval"]');
      
      // Both guardians should receive notification
      const approval1 = guardianPage.locator('[data-testid="shared-approval-request"]');
      const approval2 = secondGuardianPage.locator('[data-testid="shared-approval-request"]');
      
      await expect(approval1).toBeVisible({ timeout: 5000 });
      await expect(approval2).toBeVisible({ timeout: 5000 });
      
      // Primary guardian approves first
      await guardianPage.click('[data-testid="shared-approval-request"]');
      await guardianPage.click('[data-testid="primary-approve"]');
      
      // Should show waiting for secondary approval
      await expect(guardianPage.locator('[data-testid="awaiting-secondary-approval"]')).toBeVisible();
      
      // Secondary guardian also approves
      await secondGuardianPage.click('[data-testid="shared-approval-request"]');
      await secondGuardianPage.click('[data-testid="secondary-approve"]');
      
      // Approval should be complete
      await expect(secondGuardianPage.locator('[data-testid="approval-complete"]')).toBeVisible();
    });
  });

  test('should enforce time-based permission restrictions', async () => {
    await test.step('Configure time-based restrictions', async () => {
      // Navigate to advanced permission settings
      await guardianPage.click('[data-testid="advanced-permissions"]');
      
      // Should show time-based restriction options
      const timeRestrictions = guardianPage.locator('[data-testid="time-restrictions"]');
      await expect(timeRestrictions).toBeVisible();
      
      // Set messaging hours
      await guardianPage.check('[data-testid="restrict-messaging-hours"]');
      await guardianPage.fill('[data-testid="messaging-start-time"]', '09:00');
      await guardianPage.fill('[data-testid="messaging-end-time"]', '21:00');
      
      // Set days of week restrictions
      await guardianPage.uncheck('[data-testid="friday-messaging"]'); // No messaging during Jummah
      
      // Set daily time limits
      await guardianPage.check('[data-testid="daily-time-limit"]');
      await guardianPage.fill('[data-testid="max-daily-minutes"]', '120');
      
      // Save time restrictions
      await guardianPage.click('[data-testid="save-time-restrictions"]');
      
      // Should show confirmation
      await expect(guardianPage.locator('[data-testid="restrictions-saved"]')).toBeVisible();
    });

    await test.step('Verify time restriction enforcement', async () => {
      // Simulate time outside allowed hours (e.g., early morning)
      await guardianPage.evaluate(() => {
        // Mock current time to be 6:00 AM
        const mockDate = new Date();
        mockDate.setHours(6, 0, 0, 0);
        Date.now = () => mockDate.getTime();
      });
      
      // User should see time restriction message
      await userPage.reload();
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const timeRestriction = userPage.locator('[data-testid="time-restriction-notice"]');
      await expect(timeRestriction).toBeVisible();
      await expect(timeRestriction).toContainText('messaging hours: 9:00 AM - 9:00 PM');
      
      // Message input should be disabled
      await expect(userPage.locator('[data-testid="message-input"]')).toBeDisabled();
    });

    await test.step('Verify daily time limit tracking', async () => {
      // Reset time to allowed hours
      await guardianPage.evaluate(() => {
        const mockDate = new Date();
        mockDate.setHours(14, 0, 0, 0); // 2:00 PM
        Date.now = () => mockDate.getTime();
      });
      
      await userPage.reload();
      
      // Should show daily time remaining
      const timeRemaining = userPage.locator('[data-testid="daily-time-remaining"]');
      await expect(timeRemaining).toBeVisible();
      await expect(timeRemaining).toContainText('120 minutes remaining');
      
      // Simulate time usage
      await guardianPage.evaluate(() => {
        // Mock that 100 minutes have been used today
        localStorage.setItem('daily-messaging-time-used', '100');
      });
      
      await userPage.reload();
      await expect(timeRemaining).toContainText('20 minutes remaining');
    });
  });

  test('should manage location-based permission restrictions', async () => {
    await test.step('Configure location-based permissions', async () => {
      // Navigate to location restrictions
      await guardianPage.click('[data-testid="location-permissions"]');
      
      // Should show location-based options
      const locationSettings = guardianPage.locator('[data-testid="location-settings"]');
      await expect(locationSettings).toBeVisible();
      
      // Enable location-based restrictions
      await guardianPage.check('[data-testid="enable-location-restrictions"]');
      
      // Add approved locations
      await guardianPage.click('[data-testid="add-approved-location"]');
      await guardianPage.fill('[data-testid="location-name"]', 'Home');
      await guardianPage.fill('[data-testid="location-address"]', '123 Main St, Dubai, UAE');
      await guardianPage.click('[data-testid="save-location"]');
      
      // Add second approved location
      await guardianPage.click('[data-testid="add-approved-location"]');
      await guardianPage.fill('[data-testid="location-name"]', 'University');
      await guardianPage.fill('[data-testid="location-address"]', 'American University of Dubai');
      await guardianPage.click('[data-testid="save-location"]');
      
      // Set location verification requirements
      await guardianPage.check('[data-testid="require-location-verification"]');
      
      // Save location settings
      await guardianPage.click('[data-testid="save-location-settings"]');
    });

    await test.step('Test location verification', async () => {
      // Simulate user at unapproved location
      await userPage.evaluate(() => {
        // Mock geolocation to unapproved location
        navigator.geolocation.getCurrentPosition = (success) => {
          success({
            coords: {
              latitude: 25.2048, // Different location
              longitude: 55.2708,
              accuracy: 10
            }
          });
        };
      });
      
      await userPage.reload();
      
      // Should show location verification required
      const locationVerification = userPage.locator('[data-testid="location-verification-required"]');
      await expect(locationVerification).toBeVisible();
      await expect(locationVerification).toContainText('approved location');
      
      // Messaging should be restricted
      await expect(userPage.locator('[data-testid="message-input"]')).toBeDisabled();
    });

    await test.step('Verify approved location access', async () => {
      // Simulate user at approved location (Home)
      await userPage.evaluate(() => {
        navigator.geolocation.getCurrentPosition = (success) => {
          success({
            coords: {
              latitude: 25.2048, // Home coordinates (mocked)
              longitude: 55.2708,
              accuracy: 10
            }
          });
        };
      });
      
      await userPage.reload();
      
      // Location verification should pass
      const locationApproved = userPage.locator('[data-testid="location-approved"]');
      await expect(locationApproved).toBeVisible();
      
      // Messaging should be enabled
      await expect(userPage.locator('[data-testid="message-input"]')).toBeEnabled();
    });
  });

  test('should handle emergency permission overrides', async () => {
    await test.step('Configure emergency override settings', async () => {
      // Navigate to emergency settings
      await guardianPage.click('[data-testid="emergency-settings"]');
      
      // Should show emergency override options
      const emergencySettings = guardianPage.locator('[data-testid="emergency-override-settings"]');
      await expect(emergencySettings).toBeVisible();
      
      // Configure emergency contacts
      await guardianPage.fill('[data-testid="emergency-contact-1"]', '+971-50-123-4567');
      await guardianPage.fill('[data-testid="emergency-contact-2"]', 'imam@localmosque.ae');
      
      // Set emergency override conditions
      await guardianPage.check('[data-testid="allow-emergency-messaging"]');
      await guardianPage.check('[data-testid="require-emergency-verification"]');
      
      // Save emergency settings
      await guardianPage.click('[data-testid="save-emergency-settings"]');
    });

    await test.step('Test emergency override activation', async () => {
      // Simulate emergency situation
      await userPage.goto('/emergency-contact');
      
      // Should show emergency contact interface
      const emergencyInterface = userPage.locator('[data-testid="emergency-interface"]');
      await expect(emergencyInterface).toBeVisible();
      
      // Fill emergency justification
      await userPage.fill('[data-testid="emergency-reason"]', 'Family emergency - need to contact immediately');
      await userPage.selectOption('[data-testid="emergency-type"]', 'family_emergency');
      
      // Request emergency override
      await userPage.click('[data-testid="request-emergency-override"]');
      
      // Should show override request sent
      await expect(userPage.locator('[data-testid="override-request-sent"]')).toBeVisible();
    });

    await test.step('Guardian approves emergency override', async () => {
      // Guardian receives emergency override request
      const emergencyRequest = guardianPage.locator('[data-testid="emergency-override-request"]');
      await expect(emergencyRequest).toBeVisible({ timeout: 5000 });
      await expect(emergencyRequest).toHaveClass(/urgent/);
      
      // Click to review emergency request
      await emergencyRequest.click();
      
      // Should show emergency details
      const emergencyDetails = guardianPage.locator('[data-testid="emergency-details"]');
      await expect(emergencyDetails).toBeVisible();
      await expect(emergencyDetails).toContainText('Family emergency');
      
      // Grant emergency override
      await guardianPage.click('[data-testid="grant-emergency-override"]');
      
      // Set override duration
      await guardianPage.selectOption('[data-testid="override-duration"]', '2'); // 2 hours
      
      // Confirm emergency override
      await guardianPage.click('[data-testid="confirm-emergency-override"]');
      
      // Should show override granted
      await expect(guardianPage.locator('[data-testid="emergency-override-granted"]')).toBeVisible();
    });

    await test.step('Verify emergency permissions are active', async () => {
      // User should receive override approval
      await userPage.reload();
      
      const overrideActive = userPage.locator('[data-testid="emergency-override-active"]');
      await expect(overrideActive).toBeVisible();
      await expect(overrideActive).toContainText('Emergency override active');
      
      // Should show remaining override time
      const remainingTime = userPage.locator('[data-testid="override-time-remaining"]');
      await expect(remainingTime).toBeVisible();
      await expect(remainingTime).toContainText('2 hours');
      
      // All restrictions should be temporarily lifted
      await userPage.goto('/messages');
      await expect(userPage.locator('[data-testid="message-input"]')).toBeEnabled();
      
      // Should show emergency mode indicator
      const emergencyMode = userPage.locator('[data-testid="emergency-mode-indicator"]');
      await expect(emergencyMode).toBeVisible();
    });

    await test.step('Emergency override expires automatically', async () => {
      // Simulate time passage (2 hours)
      await userPage.evaluate(() => {
        const futureTime = Date.now() + (2 * 60 * 60 * 1000);
        Date.now = () => futureTime;
      });
      
      await userPage.reload();
      
      // Emergency override should be expired
      await expect(userPage.locator('[data-testid="emergency-override-active"]')).not.toBeVisible();
      
      // Normal restrictions should be restored
      const normalMode = userPage.locator('[data-testid="normal-permissions-restored"]');
      await expect(normalMode).toBeVisible();
    });
  });
});