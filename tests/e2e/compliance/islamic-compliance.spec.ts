import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';
import { 
  getIslamicGreetings, 
  getIslamicPhrases, 
  getProhibitedContent,
  getHalalTopics 
} from '../../fixtures/sample-content';

/**
 * Islamic Compliance E2E Tests
 * Tests Islamic principles compliance, halal communication guidelines, and religious appropriateness
 */
test.describe('Islamic Compliance', () => {
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

  test('should validate Islamic greetings and religious expressions', async () => {
    const islamicGreetings = getIslamicGreetings();
    
    await test.step('Test proper Islamic greetings are encouraged', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const greeting of islamicGreetings) {
        await userPage.fill('[data-testid="message-input"]', greeting.text);
        
        // Should show positive compliance indicator
        const complianceIndicator = userPage.locator('[data-testid="compliance-indicator"]');
        await expect(complianceIndicator).toHaveClass(/highly-recommended/);
        
        // Should show Islamic greeting recognition
        const greetingRecognition = userPage.locator('[data-testid="islamic-greeting-recognition"]');
        await expect(greetingRecognition).toBeVisible();
        await expect(greetingRecognition).toContainText(greeting.category);
        
        await userPage.click('[data-testid="send-button"]');
        
        // Message should be sent with Islamic blessing indicator
        const messageLocator = userPage.locator(`[data-testid="message-bubble"]:has-text("${greeting.text}")`);
        await expect(messageLocator).toHaveAttribute('data-islamic-content', 'greeting');
        await expect(messageLocator).toHaveClass(/blessed-content/);
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Test Islamic phrases and expressions', async () => {
      const islamicPhrases = getIslamicPhrases();
      
      for (const phrase of islamicPhrases) {
        await userPage.fill('[data-testid="message-input"]', phrase.text);
        
        // Should recognize Islamic expression
        const expressionRecognition = userPage.locator('[data-testid="islamic-expression-recognition"]');
        await expect(expressionRecognition).toBeVisible();
        await expect(expressionRecognition).toContainText(phrase.meaning);
        
        // Should show appropriate response suggestion
        if (phrase.response) {
          const responseSuggestion = userPage.locator('[data-testid="response-suggestion"]');
          await expect(responseSuggestion).toBeVisible();
          await expect(responseSuggestion).toContainText(phrase.response);
        }
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Test religious knowledge sharing', async () => {
      const religiousMessages = [
        'I learned a beautiful hadith today about kindness to parents.',
        'The Quran says "And whoever relies upon Allah - then He is sufficient for him."',
        'I attended a great Islamic lecture about marriage in Islam.',
        'May Allah guide us both in making the right decision.'
      ];
      
      for (const message of religiousMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should show religious content recognition
        const religiousRecognition = userPage.locator('[data-testid="religious-content-recognition"]');
        await expect(religiousRecognition).toBeVisible();
        await expect(religiousRecognition).toContainText('Islamic knowledge');
        
        // Should encourage such content
        const encouragement = userPage.locator('[data-testid="content-encouragement"]');
        await expect(encouragement).toBeVisible();
        await expect(encouragement).toContainText('beneficial');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should enforce halal communication guidelines', async () => {
    await test.step('Validate halal conversation topics', async () => {
      const halalTopics = getHalalTopics();
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const topic of halalTopics) {
        await userPage.fill('[data-testid="message-input"]', topic.example);
        
        // Should show topic appropriateness
        const topicValidation = userPage.locator('[data-testid="topic-validation"]');
        await expect(topicValidation).toHaveClass(/appropriate-topic/);
        await expect(topicValidation).toContainText(topic.category);
        
        // Should provide guidance if needed
        if (topic.guidance) {
          const guidanceNote = userPage.locator('[data-testid="topic-guidance"]');
          await expect(guidanceNote).toBeVisible();
          await expect(guidanceNote).toContainText(topic.guidance);
        }
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Prevent inappropriate intimacy levels', async () => {
      const inappropriateIntimacy = [
        'I miss you so much, can\'t wait to hold you.',
        'You look so beautiful in your pictures.',
        'I dream about our romantic future together.',
        'Send me more photos of yourself.'
      ];
      
      for (const message of inappropriateIntimacy) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should flag inappropriate intimacy
        const intimacyWarning = userPage.locator('[data-testid="intimacy-warning"]');
        await expect(intimacyWarning).toBeVisible();
        await expect(intimacyWarning).toContainText('inappropriate level of intimacy');
        
        // Should suggest alternative approaches
        const alternativeSuggestion = userPage.locator('[data-testid="alternative-suggestion"]');
        await expect(alternativeSuggestion).toBeVisible();
        await expect(alternativeSuggestion).toContainText('family-appropriate');
        
        // Send button should be disabled
        await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Encourage family involvement discussions', async () => {
      const familyInvolvementMessages = [
        'I would like our families to meet and get to know each other.',
        'My parents are excited to learn more about your family.',
        'Should we arrange a formal meeting with both families present?',
        'I believe involving our families will make this process more blessed.'
      ];
      
      for (const message of familyInvolvementMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should encourage family involvement
        const familyEncouragement = userPage.locator('[data-testid="family-involvement-encouragement"]');
        await expect(familyEncouragement).toBeVisible();
        await expect(familyEncouragement).toContainText('Islamic approach');
        
        // Should show positive reinforcement
        const positiveReinforcement = userPage.locator('[data-testid="positive-reinforcement"]');
        await expect(positiveReinforcement).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should respect Islamic privacy and modesty principles', async () => {
    await test.step('Prevent requests for private information', async () => {
      const privateInfoRequests = [
        'Can you send me photos of yourself?',
        'What do you look like without hijab?',
        'Tell me about your private life and personal habits.',
        'Can we video call privately without families knowing?'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const request of privateInfoRequests) {
        await userPage.fill('[data-testid="message-input"]', request);
        
        // Should flag privacy violation
        const privacyWarning = userPage.locator('[data-testid="privacy-violation-warning"]');
        await expect(privacyWarning).toBeVisible();
        await expect(privacyWarning).toContainText('violates Islamic privacy principles');
        
        // Should provide Islamic guidance
        const islamicGuidance = userPage.locator('[data-testid="islamic-privacy-guidance"]');
        await expect(islamicGuidance).toBeVisible();
        await expect(islamicGuidance).toContainText('modesty and privacy');
        
        // Should block sending
        await expect(userPage.locator('[data-testid="send-button"]')).toBeDisabled();
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Encourage appropriate information sharing', async () => {
      const appropriateSharing = [
        'I would be happy to have our families exchange information.',
        'My family can provide references about my character.',
        'Perhaps our guardians can discuss our compatibility.',
        'I believe in transparency with proper Islamic boundaries.'
      ];
      
      for (const message of appropriateSharing) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should encourage appropriate sharing
        const sharingEncouragement = userPage.locator('[data-testid="appropriate-sharing-encouragement"]');
        await expect(sharingEncouragement).toBeVisible();
        await expect(sharingEncouragement).toContainText('Islamic transparency');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Validate photo and media sharing policies', async () => {
      // Test photo sharing restrictions
      await userPage.click('[data-testid="attach-media"]');
      
      // Should show Islamic media guidelines
      const mediaGuidelines = userPage.locator('[data-testid="islamic-media-guidelines"]');
      await expect(mediaGuidelines).toBeVisible();
      await expect(mediaGuidelines).toContainText('family-appropriate photos only');
      
      // Should require guardian approval for photo sharing
      const guardianApprovalRequired = userPage.locator('[data-testid="guardian-photo-approval"]');
      await expect(guardianApprovalRequired).toBeVisible();
      await expect(guardianApprovalRequired).toContainText('guardian approval required');
    });
  });

  test('should implement Islamic meeting and courtship guidelines', async () => {
    await test.step('Enforce chaperoned meeting requirements', async () => {
      const meetingRequests = [
        'Would you like to meet for coffee just the two of us?',
        'Can we meet privately to talk?',
        'Let\'s go out for dinner alone together.'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const request of meetingRequests) {
        await userPage.fill('[data-testid="message-input"]', request);
        
        // Should flag unchaperoned meeting request
        const chaperonWarning = userPage.locator('[data-testid="chaperon-requirement-warning"]');
        await expect(chaperonWarning).toBeVisible();
        await expect(chaperonWarning).toContainText('Islamic meetings require supervision');
        
        // Should suggest proper meeting format
        const meetingSuggestion = userPage.locator('[data-testid="proper-meeting-suggestion"]');
        await expect(meetingSuggestion).toBeVisible();
        await expect(meetingSuggestion).toContainText('family members present');
        
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Encourage proper Islamic courtship', async () => {
      const properCourtship = [
        'I would like to arrange a meeting with both our families present.',
        'Perhaps we can meet at the mosque community center with our guardians.',
        'I believe we should involve our families in getting to know each other.',
        'May Allah guide us in this process with proper Islamic etiquette.'
      ];
      
      for (const message of properCourtship) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should encourage proper courtship
        const courtshipEncouragement = userPage.locator('[data-testid="proper-courtship-encouragement"]');
        await expect(courtshipEncouragement).toBeVisible();
        await expect(courtshipEncouragement).toContainText('Islamic courtship principles');
        
        // Should provide blessing for appropriate approach
        const islamicBlessing = userPage.locator('[data-testid="islamic-blessing"]');
        await expect(islamicBlessing).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Guide marriage intention discussions', async () => {
      const marriageIntentionMessages = [
        'I am seriously looking for marriage, not just casual conversation.',
        'My intention is to find a spouse for the sake of Allah.',
        'I pray that Allah will guide us to make the right decision about marriage.',
        'Marriage is half of faith, and I take this process seriously.'
      ];
      
      for (const message of marriageIntentionMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should recognize serious marriage intention
        const intentionRecognition = userPage.locator('[data-testid="marriage-intention-recognition"]');
        await expect(intentionRecognition).toBeVisible();
        await expect(intentionRecognition).toContainText('serious Islamic approach');
        
        // Should encourage such discussions
        const intentionEncouragement = userPage.locator('[data-testid="intention-encouragement"]');
        await expect(intentionEncouragement).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should provide Islamic guidance and education', async () => {
    await test.step('Offer Islamic marriage education resources', async () => {
      // Navigate to Islamic guidance section
      await userPage.click('[data-testid="islamic-guidance"]');
      
      // Should show Islamic marriage resources
      const marriageResources = userPage.locator('[data-testid="islamic-marriage-resources"]');
      await expect(marriageResources).toBeVisible();
      
      // Should include key topics
      await expect(marriageResources).toContainText('Rights and Responsibilities');
      await expect(marriageResources).toContainText('Islamic Courtship Guidelines');
      await expect(marriageResources).toContainText('Family Involvement');
      await expect(marriageResources).toContainText('Prayer for Guidance (Istikhara)');
    });

    await test.step('Provide contextual Islamic reminders', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Should show daily Islamic reminder
      const dailyReminder = userPage.locator('[data-testid="daily-islamic-reminder"]');
      await expect(dailyReminder).toBeVisible();
      
      // Should include relevant Islamic teachings
      const islamicTeaching = userPage.locator('[data-testid="islamic-teaching"]');
      await expect(islamicTeaching).toBeVisible();
      await expect(islamicTeaching).toContainText('marriage');
    });

    await test.step('Integrate prayer time awareness', async () => {
      // Should show prayer time notifications
      const prayerTimeNotification = userPage.locator('[data-testid="prayer-time-notification"]');
      // Note: This might not always be visible depending on current time
      
      // Should respect prayer times in messaging
      await userPage.fill('[data-testid="message-input"]', 'Test message during prayer awareness');
      
      // Check if prayer time reminder is shown
      const prayerReminder = userPage.locator('[data-testid="prayer-time-reminder"]');
      if (await prayerReminder.isVisible()) {
        await expect(prayerReminder).toContainText('prayer time');
      }
    });

    await test.step('Provide dua and Islamic supplications', async () => {
      // Access Islamic supplications section
      await userPage.click('[data-testid="islamic-supplications"]');
      
      // Should show relevant duas
      const islamicDuas = userPage.locator('[data-testid="islamic-duas"]');
      await expect(islamicDuas).toBeVisible();
      
      // Should include marriage-related duas
      await expect(islamicDuas).toContainText('Dua for finding a spouse');
      await expect(islamicDuas).toContainText('Istikhara prayer');
      await expect(islamicDuas).toContainText('Dua for barakah in marriage');
    });
  });

  test('should handle cultural and regional Islamic variations', async () => {
    await test.step('Respect different Islamic cultural practices', async () => {
      const culturalPractices = [
        'In our culture, the nikah ceremony includes specific traditions.',
        'Our family follows the Hanafi school of Islamic jurisprudence.',
        'We observe certain cultural Islamic practices from our region.',
        'Our mosque community has beautiful Islamic traditions.'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const practice of culturalPractices) {
        await userPage.fill('[data-testid="message-input"]', practice);
        
        // Should recognize cultural Islamic diversity
        const culturalRecognition = userPage.locator('[data-testid="cultural-islamic-recognition"]');
        await expect(culturalRecognition).toBeVisible();
        await expect(culturalRecognition).toContainText('Islamic diversity');
        
        // Should encourage respectful cultural exchange
        const culturalExchange = userPage.locator('[data-testid="cultural-exchange-encouragement"]');
        await expect(culturalExchange).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Handle language and regional preferences', async () => {
      // Test Arabic Islamic phrases
      const arabicPhrases = [
        'Barakallahu feeki (May Allah bless you)',
        'Fi amanillah (Go with Allah\'s protection)',
        'Rabbana atina fi\'d-dunya hasanatan (Our Lord, give us good in this world)'
      ];
      
      for (const phrase of arabicPhrases) {
        await userPage.fill('[data-testid="message-input"]', phrase);
        
        // Should recognize Arabic Islamic phrases
        const arabicRecognition = userPage.locator('[data-testid="arabic-islamic-recognition"]');
        await expect(arabicRecognition).toBeVisible();
        
        // Should provide translation if needed
        const translation = userPage.locator('[data-testid="arabic-translation"]');
        await expect(translation).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Accommodate different Islamic schools of thought', async () => {
      const schoolOfThoughtMessages = [
        'Our family follows the Shafi\'i madhab regarding marriage contracts.',
        'In the Maliki school, certain conditions apply to marriage.',
        'We practice according to Hanbali jurisprudence.',
        'Different Islamic scholars have varying opinions on this matter.'
      ];
      
      for (const message of schoolOfThoughtMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should accommodate different schools of thought
        const scholarlyAccommodation = userPage.locator('[data-testid="scholarly-accommodation"]');
        await expect(scholarlyAccommodation).toBeVisible();
        await expect(scholarlyAccommodation).toContainText('valid Islamic perspectives');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should monitor Islamic compliance metrics', async () => {
    await test.step('Track Islamic content compliance rates', async () => {
      // Navigate to guardian dashboard to check compliance metrics
      await guardianPage.click('[data-testid="islamic-compliance-metrics"]');
      
      // Should show compliance dashboard
      const complianceDashboard = userPage.locator('[data-testid="compliance-dashboard"]');
      await expect(complianceDashboard).toBeVisible();
      
      // Should show key Islamic compliance metrics
      await expect(complianceDashboard).toContainText('Islamic Greetings Usage');
      await expect(complianceDashboard).toContainText('Halal Topic Discussions');
      await expect(complianceDashboard).toContainText('Family Involvement Rate');
      await expect(complianceDashboard).toContainText('Prayer Time Respect');
    });

    await test.step('Generate Islamic compliance reports', async () => {
      // Generate compliance report
      await guardianPage.click('[data-testid="generate-compliance-report"]');
      
      // Should show report generation options
      const reportOptions = guardianPage.locator('[data-testid="compliance-report-options"]');
      await expect(reportOptions).toBeVisible();
      
      // Select Islamic compliance focus
      await guardianPage.check('[data-testid="islamic-values-focus"]');
      await guardianPage.check('[data-testid="cultural-sensitivity"]');
      await guardianPage.check('[data-testid="religious-appropriateness"]');
      
      // Generate report
      await guardianPage.click('[data-testid="create-compliance-report"]');
      
      // Should show report creation confirmation
      await expect(guardianPage.locator('[data-testid="compliance-report-created"]')).toBeVisible();
    });

    await test.step('Monitor ongoing Islamic compliance', async () => {
      // Should show real-time compliance monitoring
      const realTimeCompliance = guardianPage.locator('[data-testid="real-time-compliance"]');
      await expect(realTimeCompliance).toBeVisible();
      
      // Should show current compliance status
      const complianceStatus = guardianPage.locator('[data-testid="current-compliance-status"]');
      await expect(complianceStatus).toBeVisible();
      await expect(complianceStatus).toContainText('%'); // Percentage score
      
      // Should provide improvement suggestions
      const improvementSuggestions = guardianPage.locator('[data-testid="compliance-improvement-suggestions"]');
      await expect(improvementSuggestions).toBeVisible();
    });
  });
});