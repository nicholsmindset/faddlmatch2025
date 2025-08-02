import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';

/**
 * Guardian Approval Workflows E2E Tests  
 * Tests guardian approval processes, profile reviews, and match approvals
 */
test.describe('Guardian Approval Workflows', () => {
  let guardianPage: Page;
  let userPage: Page;
  let pendingUserPage: Page;

  test.beforeEach(async ({ browser }) => {
    const guardianContext = await browser.newContext();
    const userContext = await browser.newContext();
    const pendingUserContext = await browser.newContext();

    guardianPage = await guardianContext.newPage();
    userPage = await userContext.newPage();  
    pendingUserPage = await pendingUserContext.newPage();

    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');
    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(pendingUserPage, 'pending@test.faddl.com');

    await guardianPage.goto('/guardian');
    await userPage.goto('/matches');
    await pendingUserPage.goto('/dashboard');
  });

  test('should handle profile approval workflow', async () => {
    await test.step('Guardian receives profile approval request', async () => {
      // Navigate to pending approvals
      await guardianPage.click('[data-testid="pending-approvals"]');
      
      // Should show pending profile approval
      const pendingApprovals = guardianPage.locator('[data-testid="approval-queue"]');
      await expect(pendingApprovals).toBeVisible();
      
      // Should show pending user profile
      const pendingProfile = guardianPage.locator('[data-testid="pending-profile-pending"]');
      await expect(pendingProfile).toBeVisible();
      await expect(pendingProfile).toContainText('Omar Al-Faruq');
      await expect(pendingProfile).toContainText('Profile Review');
    });

    await test.step('Guardian reviews profile details', async () => {
      // Click to review profile
      await guardianPage.click('[data-testid="review-profile-pending"]');
      
      // Should open profile review interface
      const profileReview = guardianPage.locator('[data-testid="profile-review-modal"]');
      await expect(profileReview).toBeVisible();
      
      // Should show complete profile information
      await expect(profileReview).toContainText('Omar Al-Faruq');
      await expect(profileReview).toContainText('Age: 30');
      await expect(profileReview).toContainText('Religious Practice');
      await expect(profileReview).toContainText('Family Background');
      
      // Should show profile completeness score
      const completenessScore = guardianPage.locator('[data-testid="profile-completeness"]');
      await expect(completenessScore).toBeVisible();
      await expect(completenessScore).toContainText('%');
    });

    await test.step('Guardian provides feedback and requests changes', async () => {
      // Add feedback for improvement
      await guardianPage.fill('[data-testid="profile-feedback"]', 'Please add more details about your career and family background.');
      
      // Request changes instead of approving
      await guardianPage.click('[data-testid="request-changes"]');
      
      // Should show confirmation
      await expect(guardianPage.locator('[data-testid="changes-requested"]')).toBeVisible();
      
      // Profile should remain in pending status
      await guardianPage.click('[data-testid="close-review"]');
      await expect(guardianPage.locator('[data-testid="pending-profile-pending"]')).toContainText('Changes Requested');
    });

    await test.step('User receives feedback and updates profile', async () => {
      // Pending user should see feedback notification
      await pendingUserPage.reload();
      
      const feedbackNotification = pendingUserPage.locator('[data-testid="guardian-feedback"]');
      await expect(feedbackNotification).toBeVisible();
      await expect(feedbackNotification).toContainText('Guardian feedback received');
      
      // Click to view feedback
      await feedbackNotification.click();
      
      // Should show guardian's feedback
      const feedbackModal = pendingUserPage.locator('[data-testid="feedback-modal"]');
      await expect(feedbackModal).toBeVisible();
      await expect(feedbackModal).toContainText('add more details about your career');
    });

    await test.step('Guardian approves updated profile', async () => {
      // Simulate user updating profile and resubmitting
      // Guardian reviews updated profile
      await guardianPage.click('[data-testid="review-profile-pending"]');
      
      // Profile should show as updated
      const profileReview = guardianPage.locator('[data-testid="profile-review-modal"]');
      await expect(profileReview).toContainText('Updated Profile');
      
      // Add approval notes
      await guardianPage.fill('[data-testid="approval-notes"]', 'Profile looks complete and appropriate. Approved for matching.');
      
      // Approve profile
      await guardianPage.click('[data-testid="approve-profile"]');
      
      // Should show approval confirmation
      await expect(guardianPage.locator('[data-testid="profile-approved"]')).toBeVisible();
      
      // Profile should be removed from pending queue
      await guardianPage.click('[data-testid="close-review"]');
      await expect(guardianPage.locator('[data-testid="pending-profile-pending"]')).not.toBeVisible();
    });

    await test.step('User is notified of approval', async () => {
      // User should receive approval notification
      await pendingUserPage.reload();
      
      const approvalNotification = pendingUserPage.locator('[data-testid="profile-approved-notification"]');
      await expect(approvalNotification).toBeVisible();
      await expect(approvalNotification).toContainText('Profile approved');
      
      // User should now have access to matches
      await pendingUserPage.goto('/matches');
      
      // Should not show pending approval message
      await expect(pendingUserPage.locator('[data-testid="pending-approval-message"]')).not.toBeVisible();
    });
  });

  test('should handle match approval workflow', async () => {
    await test.step('User requests match approval', async () => {
      // User views potential match and requests guardian approval
      await userPage.click('[data-testid="match-card-test-user-2"]');
      
      // Should show match details
      const matchDetails = userPage.locator('[data-testid="match-details"]');
      await expect(matchDetails).toBeVisible();
      
      // Request guardian approval for match
      await userPage.click('[data-testid="request-match-approval"]');
      
      // Should show approval request confirmation
      await expect(userPage.locator('[data-testid="approval-requested"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="approval-requested"]')).toContainText('Guardian approval requested');
    });

    await test.step('Guardian receives match approval request', async () => {
      // Guardian should receive notification
      const matchApprovalNotification = guardianPage.locator('[data-testid="match-approval-notification"]');
      await expect(matchApprovalNotification).toBeVisible({ timeout: 5000 });
      
      // Navigate to match approvals
      await guardianPage.click('[data-testid="match-approvals"]');
      
      // Should show pending match approval
      const pendingMatch = guardianPage.locator('[data-testid="pending-match-approval"]');
      await expect(pendingMatch).toBeVisible();
      await expect(pendingMatch).toContainText('Ahmed'); // Ward's name
      await expect(pendingMatch).toContainText('Fatima'); // Potential match
    });

    await test.step('Guardian reviews match compatibility', async () => {
      // Click to review match details
      await guardianPage.click('[data-testid="review-match-approval"]');
      
      // Should show comprehensive match review interface
      const matchReview = guardianPage.locator('[data-testid="match-review-interface"]');
      await expect(matchReview).toBeVisible();
      
      // Should show compatibility analysis
      await expect(matchReview).toContainText('Compatibility Score');
      await expect(matchReview).toContainText('Religious Compatibility');
      await expect(matchReview).toContainText('Family Background');
      await expect(matchReview).toContainText('Educational Level');
      
      // Should show both profiles side by side
      const wardProfile = guardianPage.locator('[data-testid="ward-profile-summary"]');
      const matchProfile = guardianPage.locator('[data-testid="match-profile-summary"]');
      await expect(wardProfile).toBeVisible();
      await expect(matchProfile).toBeVisible();
    });

    await test.step('Guardian requests additional information', async () => {
      // Guardian wants more information before deciding
      await guardianPage.click('[data-testid="request-more-info"]');
      
      // Should show information request form
      const infoRequest = guardianPage.locator('[data-testid="info-request-form"]');
      await expect(infoRequest).toBeVisible();
      
      // Request specific information
      await guardianPage.fill('[data-testid="info-request-details"]', 'Please provide more information about family background and career aspirations.');
      
      // Send request
      await guardianPage.click('[data-testid="send-info-request"]');
      
      // Should show request sent confirmation
      await expect(guardianPage.locator('[data-testid="info-request-sent"]')).toBeVisible();
    });

    await test.step('Guardian approves match with conditions', async () => {
      // After receiving additional information, guardian makes decision
      await guardianPage.click('[data-testid="review-match-approval"]');
      
      // Add approval conditions
      await guardianPage.fill('[data-testid="approval-conditions"]', 'Approval granted with condition that initial meetings include family members.');
      
      // Set meeting requirements
      await guardianPage.check('[data-testid="require-family-meetings"]');
      await guardianPage.check('[data-testid="supervised-initial-contact"]');
      
      // Approve match
      await guardianPage.click('[data-testid="approve-match"]');
      
      // Should show approval confirmation
      await expect(guardianPage.locator('[data-testid="match-approved"]')).toBeVisible();
    });

    await test.step('User receives match approval with conditions', async () => {
      // User should receive approval notification
      await userPage.reload();
      
      const approvalNotification = userPage.locator('[data-testid="match-approved-notification"]');
      await expect(approvalNotification).toBeVisible();
      await expect(approvalNotification).toContainText('Match approved');
      
      // Should show approval conditions
      await approvalNotification.click();
      
      const conditionsModal = userPage.locator('[data-testid="approval-conditions-modal"]');
      await expect(conditionsModal).toBeVisible();
      await expect(conditionsModal).toContainText('initial meetings include family members');
    });
  });

  test('should handle conversation approval workflow', async () => {
    await test.step('User initiates conversation requiring approval', async () => {
      // User starts conversation that requires guardian approval
      await userPage.goto('/messages');
      await userPage.click('[data-testid="start-new-conversation"]');
      await userPage.selectOption('[data-testid="select-contact"]', 'test-user-2');
      
      // Send initial message that requires approval
      await userPage.fill('[data-testid="initial-message"]', 'Assalamu Alaikum, I would like to get to know you better.');
      await userPage.click('[data-testid="send-with-approval"]');
      
      // Should show pending approval status
      await expect(userPage.locator('[data-testid="conversation-pending"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="conversation-pending"]')).toContainText('Awaiting guardian approval');
    });

    await test.step('Guardian reviews conversation request', async () => {
      // Guardian receives conversation approval request
      const conversationApproval = guardianPage.locator('[data-testid="conversation-approval-request"]');
      await expect(conversationApproval).toBeVisible({ timeout: 5000 });
      
      // Click to review conversation request
      await conversationApproval.click();
      
      // Should show conversation approval interface
      const approvalInterface = guardianPage.locator('[data-testid="conversation-approval-interface"]');
      await expect(approvalInterface).toBeVisible();
      
      // Should show initial message for review
      await expect(approvalInterface).toContainText('I would like to get to know you better');
      
      // Should show participants information
      await expect(approvalInterface).toContainText('Ahmed Al-Rashid');
      await expect(approvalInterface).toContainText('Fatima Al-Zahra');
    });

    await test.step('Guardian sets conversation guidelines', async () => {
      // Set conversation monitoring level
      await guardianPage.selectOption('[data-testid="monitoring-level"]', 'standard');
      
      // Set conversation guidelines
      await guardianPage.fill('[data-testid="conversation-guidelines"]', 'Keep conversations respectful and Islamic. Include family in meeting discussions.');
      
      // Set time limits
      await guardianPage.check('[data-testid="daily-time-limit"]');
      await guardianPage.fill('[data-testid="max-daily-minutes"]', '60');
      
      // Approve conversation with guidelines
      await guardianPage.click('[data-testid="approve-conversation"]');
      
      // Should show approval confirmation
      await expect(guardianPage.locator('[data-testid="conversation-approved"]')).toBeVisible();
    });

    await test.step('Conversation becomes active with guidelines', async () => {
      // User should see conversation is now active
      await userPage.reload();
      
      const activeConversation = userPage.locator('[data-testid="active-conversation"]');
      await expect(activeConversation).toBeVisible();
      
      // Should show guardian guidelines
      const guidelines = userPage.locator('[data-testid="conversation-guidelines"]');
      await expect(guidelines).toBeVisible();
      await expect(guidelines).toContainText('Keep conversations respectful');
      
      // Should show time limit indicator
      const timeLimit = userPage.locator('[data-testid="daily-time-remaining"]');
      await expect(timeLimit).toBeVisible();
      await expect(timeLimit).toContainText('60 minutes');
    });
  });

  test('should handle meeting arrangement approval workflow', async () => {
    await test.step('User requests meeting arrangement', async () => {
      // User requests to arrange meeting
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Click arrange meeting button
      await userPage.click('[data-testid="arrange-meeting"]');
      
      // Fill meeting request form
      const meetingForm = userPage.locator('[data-testid="meeting-request-form"]');
      await expect(meetingForm).toBeVisible();
      
      await userPage.selectOption('[data-testid="meeting-type"]', 'family_introduction');
      await userPage.fill('[data-testid="preferred-date"]', '2024-03-15');
      await userPage.fill('[data-testid="preferred-time"]', '19:00');
      await userPage.fill('[data-testid="meeting-purpose"]', 'Family introduction and getting to know each other better.');
      
      // Submit meeting request
      await userPage.click('[data-testid="submit-meeting-request"]');
      
      // Should show request submitted confirmation
      await expect(userPage.locator('[data-testid="meeting-request-submitted"]')).toBeVisible();
    });

    await test.step('Guardian reviews meeting request', async () => {
      // Guardian receives meeting approval request
      const meetingApproval = guardianPage.locator('[data-testid="meeting-approval-request"]');
      await expect(meetingApproval).toBeVisible({ timeout: 5000 });
      
      // Click to review meeting request
      await meetingApproval.click();
      
      // Should show meeting review interface
      const meetingReview = guardianPage.locator('[data-testid="meeting-review-interface"]');
      await expect(meetingReview).toBeVisible();
      
      // Should show meeting details
      await expect(meetingReview).toContainText('Family introduction');
      await expect(meetingReview).toContainText('March 15, 2024');
      await expect(meetingReview).toContainText('7:00 PM');
    });

    await test.step('Guardian approves meeting with modifications', async () => {
      // Guardian suggests location modification
      await guardianPage.fill('[data-testid="suggested-location"]', 'Local mosque community center');
      
      // Add meeting requirements
      await guardianPage.check('[data-testid="require-both-families"]');
      await guardianPage.check('[data-testid="require-supervision"]');
      
      // Set meeting duration
      await guardianPage.fill('[data-testid="meeting-duration"]', '2');
      
      // Add guardian notes
      await guardianPage.fill('[data-testid="meeting-notes"]', 'Both families should be present. Meeting duration should not exceed 2 hours.');
      
      // Approve meeting
      await guardianPage.click('[data-testid="approve-meeting"]');
      
      // Should show approval confirmation
      await expect(guardianPage.locator('[data-testid="meeting-approved"]')).toBeVisible();
    });

    await test.step('Both parties receive meeting approval', async () => {
      // User should receive meeting approval notification
      await userPage.reload();
      
      const meetingNotification = userPage.locator('[data-testid="meeting-approved-notification"]');
      await expect(meetingNotification).toBeVisible();
      
      // Click to view meeting details
      await meetingNotification.click();
      
      // Should show approved meeting details with guardian modifications
      const meetingDetails = userPage.locator('[data-testid="approved-meeting-details"]');
      await expect(meetingDetails).toBeVisible();
      await expect(meetingDetails).toContainText('Local mosque community center');
      await expect(meetingDetails).toContainText('Both families should be present');
    });

    await test.step('Guardian can track meeting status', async () => {
      // Guardian can monitor meeting arrangements
      await guardianPage.click('[data-testid="scheduled-meetings"]');
      
      // Should show upcoming meetings
      const upcomingMeetings = guardianPage.locator('[data-testid="upcoming-meetings"]');
      await expect(upcomingMeetings).toBeVisible();
      
      // Should show approved meeting
      const approvedMeeting = guardianPage.locator('[data-testid="meeting-item"]');
      await expect(approvedMeeting).toContainText('Family introduction');
      await expect(approvedMeeting).toContainText('March 15, 2024');
      
      // Should show meeting status
      await expect(approvedMeeting).toContainText('Approved');
    });
  });

  test('should handle approval workflow rejections', async () => {
    await test.step('Guardian rejects profile approval', async () => {
      // Navigate to pending approvals
      await guardianPage.click('[data-testid="pending-approvals"]');
      await guardianPage.click('[data-testid="review-profile-pending"]');
      
      // Add rejection reason
      await guardianPage.fill('[data-testid="rejection-reason"]', 'Profile lacks sufficient detail about Islamic practice and family values.');
      
      // Reject profile
      await guardianPage.click('[data-testid="reject-profile"]');
      
      // Should show rejection confirmation
      await expect(guardianPage.locator('[data-testid="profile-rejected"]')).toBeVisible();
    });

    await test.step('User receives rejection with feedback', async () => {
      // User should receive rejection notification
      await pendingUserPage.reload();
      
      const rejectionNotification = pendingUserPage.locator('[data-testid="profile-rejected-notification"]');
      await expect(rejectionNotification).toBeVisible();
      
      // Should show rejection reason
      await rejectionNotification.click();
      
      const rejectionDetails = pendingUserPage.locator('[data-testid="rejection-details"]');
      await expect(rejectionDetails).toBeVisible();
      await expect(rejectionDetails).toContainText('lacks sufficient detail about Islamic practice');
    });

    await test.step('User can resubmit after addressing feedback', async () => {
      // User should have option to resubmit
      const resubmitButton = pendingUserPage.locator('[data-testid="resubmit-profile"]');
      await expect(resubmitButton).toBeVisible();
      
      // Click to edit and resubmit profile
      await resubmitButton.click();
      
      // Should open profile edit interface
      const profileEdit = pendingUserPage.locator('[data-testid="profile-edit-interface"]');
      await expect(profileEdit).toBeVisible();
      
      // Should highlight areas that need improvement
      const highlightedFields = pendingUserPage.locator('[data-testid="field-needs-improvement"]');
      await expect(highlightedFields).toHaveCount(2); // Islamic practice and family values
    });
  });
});