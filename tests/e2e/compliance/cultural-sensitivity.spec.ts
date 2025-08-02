import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';

/**
 * Cultural Sensitivity E2E Tests
 * Tests cultural awareness, regional variations, and inclusive Islamic practices
 */
test.describe('Cultural Sensitivity', () => {
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

  test('should respect different Islamic cultural backgrounds', async () => {
    await test.step('Accommodate Arabic Islamic traditions', async () => {
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      const arabicTraditions = [
        'In our family, we follow traditional Arab Islamic customs for marriage.',
        'Our nikah ceremony will include beautiful Arabic traditions.',
        'We recite Quran in Arabic during family gatherings.',
        'Mashallah, your family seems to have strong Islamic values.'
      ];
      
      for (const tradition of arabicTraditions) {
        await userPage.fill('[data-testid="message-input"]', tradition);
        
        // Should recognize Arabic cultural context
        const arabicRecognition = userPage.locator('[data-testid="arabic-cultural-recognition"]');
        await expect(arabicRecognition).toBeVisible();
        await expect(arabicRecognition).toContainText('Arabic Islamic heritage');
        
        // Should show cultural appreciation
        const culturalAppreciation = userPage.locator('[data-testid="cultural-appreciation"]');
        await expect(culturalAppreciation).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Support South Asian Islamic customs', async () => {
      const southAsianCustoms = [
        'Our family follows beautiful Pakistani Islamic wedding traditions.',
        'We have lovely Indian Muslim customs for engagement ceremonies.',
        'Bengali Islamic culture has unique marriage practices.',
        'Alhamdulillah, our community mosque celebrates diverse traditions.'
      ];
      
      for (const custom of southAsianCustoms) {
        await userPage.fill('[data-testid="message-input"]', custom);
        
        // Should recognize South Asian cultural context
        const southAsianRecognition = userPage.locator('[data-testid="south-asian-cultural-recognition"]');
        await expect(southAsianRecognition).toBeVisible();
        await expect(southAsianRecognition).toContainText('South Asian Islamic heritage');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Acknowledge African Islamic traditions', async () => {
      const africanTraditions = [
        'Our family honors African Islamic scholarly traditions.',
        'Nigerian Islamic culture has beautiful marriage customs.',
        'Ethiopian Muslim communities have unique practices.',
        'West African Islamic traditions are deeply meaningful.'
      ];
      
      for (const tradition of africanTraditions) {
        await userPage.fill('[data-testid="message-input"]', tradition);
        
        // Should recognize African cultural context
        const africanRecognition = userPage.locator('[data-testid="african-cultural-recognition"]');
        await expect(africanRecognition).toBeVisible();
        await expect(africanRecognition).toContainText('African Islamic heritage');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Include Southeast Asian Islamic practices', async () => {
      const southeastAsianPractices = [
        'Indonesian Islamic wedding ceremonies are magnificent.',
        'Malaysian Muslim families have wonderful traditions.',
        'Thai Islamic communities maintain beautiful customs.',
        'Filipino Muslim culture adds richness to our faith.'
      ];
      
      for (const practice of southeastAsianPractices) {
        await userPage.fill('[data-testid="message-input"]', practice);
        
        // Should recognize Southeast Asian cultural context
        const southeastAsianRecognition = userPage.locator('[data-testid="southeast-asian-cultural-recognition"]');
        await expect(southeastAsianRecognition).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should handle multilingual Islamic expressions', async () => {
    await test.step('Support Arabic Islamic phrases with translations', async () => {
      const arabicPhrases = [
        { arabic: 'Barakallahu feeki', translation: 'May Allah bless you (to a female)' },
        { arabic: 'Fi amanillah', translation: 'Go with Allah\'s protection' },
        { arabic: 'Rabbana atina fi\'d-dunya hasanatan', translation: 'Our Lord, give us good in this world' },
        { arabic: 'Allahu a\'lam', translation: 'Allah knows best' }
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const phrase of arabicPhrases) {
        await userPage.fill('[data-testid="message-input"]', phrase.arabic);
        
        // Should provide translation
        const translationDisplay = userPage.locator('[data-testid="arabic-translation"]');
        await expect(translationDisplay).toBeVisible();
        await expect(translationDisplay).toContainText(phrase.translation);
        
        // Should show pronunciation guide
        const pronunciationGuide = userPage.locator('[data-testid="pronunciation-guide"]');
        await expect(pronunciationGuide).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Handle non-Arabic Islamic expressions', async () => {
      const multilingualExpressions = [
        { phrase: 'InshaAllah (Urdu)', meaning: 'God willing' },
        { phrase: 'Mashallah (Turkish)', meaning: 'What Allah has willed' },
        { phrase: 'Alhamdulillah (Persian)', meaning: 'Praise be to Allah' },
        { phrase: 'Subhanallah (Malay)', meaning: 'Glory be to Allah' }
      ];
      
      for (const expression of multilingualExpressions) {
        await userPage.fill('[data-testid="message-input"]', expression.phrase);
        
        // Should recognize Islamic expression regardless of language
        const expressionRecognition = userPage.locator('[data-testid="islamic-expression-recognition"]');
        await expect(expressionRecognition).toBeVisible();
        await expect(expressionRecognition).toContainText(expression.meaning);
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Provide language learning support', async () => {
      // Access Islamic language learning resources
      await userPage.click('[data-testid="language-learning"]');
      
      // Should show Arabic learning resources
      const arabicLearning = userPage.locator('[data-testid="arabic-learning-resources"]');
      await expect(arabicLearning).toBeVisible();
      await expect(arabicLearning).toContainText('Islamic Arabic phrases');
      
      // Should include pronunciation guides
      const pronunciationResources = userPage.locator('[data-testid="pronunciation-resources"]');
      await expect(pronunciationResources).toBeVisible();
      
      // Should offer cultural context explanations
      const culturalContext = userPage.locator('[data-testid="cultural-context-explanations"]');
      await expect(culturalContext).toBeVisible();
    });
  });

  test('should accommodate different Islamic schools of jurisprudence', async () => {
    await test.step('Respect Hanafi school perspectives', async () => {
      const hanafiPerspectives = [
        'According to Hanafi jurisprudence, our marriage contract will include specific conditions.',
        'In the Hanafi school, certain practices are recommended for Islamic marriages.',
        'Our imam follows Hanafi teachings regarding family matters.',
        'The Hanafi madhab has beautiful guidance on spouse selection.'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const perspective of hanafiPerspectives) {
        await userPage.fill('[data-testid="message-input"]', perspective);
        
        // Should recognize Hanafi school reference
        const hanafiRecognition = userPage.locator('[data-testid="hanafi-school-recognition"]');
        await expect(hanafiRecognition).toBeVisible();
        await expect(hanafiRecognition).toContainText('Hanafi jurisprudence');
        
        // Should show respect for scholarly opinion
        const scholarlyRespect = userPage.locator('[data-testid="scholarly-respect"]');
        await expect(scholarlyRespect).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Acknowledge Shafi\'i school practices', async () => {
      const shafiPractices = [
        'Our family follows Shafi\'i madhab regarding marriage ceremonies.',
        'Shafi\'i scholars have specific guidance on courtship.',
        'In the Shafi\'i school, family involvement is particularly emphasized.',
        'We consult Shafi\'i jurisprudence for Islamic marriage guidance.'
      ];
      
      for (const practice of shafiPractices) {
        await userPage.fill('[data-testid="message-input"]', practice);
        
        // Should recognize Shafi\'i school reference
        const shafiRecognition = userPage.locator('[data-testid="shafi-school-recognition"]');
        await expect(shafiRecognition).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Include Maliki and Hanbali perspectives', async () => {
      const otherSchoolPerspectives = [
        'Maliki jurisprudence has unique approaches to marriage contracts.',
        'Hanbali scholars emphasize certain aspects of Islamic courtship.',
        'Different madhabs enrich our understanding of Islamic marriage.',
        'All four schools of jurisprudence offer valuable guidance.'
      ];
      
      for (const perspective of otherSchoolPerspectives) {
        await userPage.fill('[data-testid="message-input"]', perspective);
        
        // Should acknowledge scholarly diversity
        const scholarlyDiversity = userPage.locator('[data-testid="scholarly-diversity-recognition"]');
        await expect(scholarlyDiversity).toBeVisible();
        await expect(scholarlyDiversity).toContainText('Islamic scholarship diversity');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should handle interfaith and convert considerations', async () => {
    await test.step('Support new Muslim experiences', async () => {
      const newMuslimMessages = [
        'I recently embraced Islam and am learning about Islamic marriage.',
        'As a new Muslim, I appreciate guidance on Islamic courtship.',
        'Converting to Islam has been a beautiful journey, including learning about marriage.',
        'I\'m grateful for the Muslim community\'s support in my new faith journey.'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const message of newMuslimMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should show special support for new Muslims
        const newMuslimSupport = userPage.locator('[data-testid="new-muslim-support"]');
        await expect(newMuslimSupport).toBeVisible();
        await expect(newMuslimSupport).toContainText('new Muslim journey');
        
        // Should provide additional Islamic resources
        const islamicResources = userPage.locator('[data-testid="new-muslim-resources"]');
        await expect(islamicResources).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Address cultural transition challenges', async () => {
      const culturalTransitionMessages = [
        'Balancing my family\'s culture with Islamic practices can be challenging.',
        'I\'m learning to merge my background with Islamic traditions.',
        'My family is supportive of my Islamic journey and marriage plans.',
        'Creating harmony between cultures and Islamic values is important to me.'
      ];
      
      for (const message of culturalTransitionMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should provide cultural transition support
        const transitionSupport = userPage.locator('[data-testid="cultural-transition-support"]');
        await expect(transitionSupport).toBeVisible();
        await expect(transitionSupport).toContainText('cultural harmony');
        
        // Should offer guidance resources
        const guidanceResources = userPage.locator('[data-testid="cultural-guidance-resources"]');
        await expect(guidanceResources).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Provide inclusive Islamic community resources', async () => {
      // Access inclusive community resources
      await userPage.click('[data-testid="inclusive-community-resources"]');
      
      // Should show resources for diverse backgrounds
      const diverseResources = userPage.locator('[data-testid="diverse-background-resources"]');
      await expect(diverseResources).toBeVisible();
      await expect(diverseResources).toContainText('inclusive Islamic community');
      
      // Should include convert support networks
      const convertSupport = userPage.locator('[data-testid="convert-support-networks"]');
      await expect(convertSupport).toBeVisible();
      
      // Should offer cultural bridge-building guidance
      const culturalBridging = userPage.locator('[data-testid="cultural-bridge-building"]');
      await expect(culturalBridging).toBeVisible();
    });
  });

  test('should accommodate economic and social diversity', async () => {
    await test.step('Respect different economic backgrounds', async () => {
      const economicConsiderations = [
        'Our family values simplicity in Islamic marriage ceremonies.',
        'We believe in modest celebrations that focus on Islamic blessings.',
        'Economic considerations shouldn\'t overshadow Islamic values in marriage.',
        'Islam teaches us that the best marriages are those with fewer complications.'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const consideration of economicConsiderations) {
        await userPage.fill('[data-testid="message-input"]', consideration);
        
        // Should appreciate economic modesty
        const economicModesty = userPage.locator('[data-testid="economic-modesty-appreciation"]');
        await expect(economicModesty).toBeVisible();
        await expect(economicModesty).toContainText('Islamic simplicity');
        
        // Should emphasize Islamic values over material aspects
        const valuesEmphasis = userPage.locator('[data-testid="islamic-values-emphasis"]');
        await expect(valuesEmphasis).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Handle educational background differences', async () => {
      const educationalMessages = [
        'I value Islamic education and religious knowledge above formal degrees.',
        'Our family appreciates both religious and worldly education.',
        'Islamic scholarship and modern education can complement each other.',
        'The most important education is understanding Islam and good character.'
      ];
      
      for (const message of educationalMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should respect diverse educational perspectives
        const educationalRespect = userPage.locator('[data-testid="educational-perspective-respect"]');
        await expect(educationalRespect).toBeVisible();
        await expect(educationalRespect).toContainText('balanced approach to education');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Support various professional backgrounds', async () => {
      const professionalMessages = [
        'I work in a field that allows me to maintain Islamic principles.',
        'Balancing career and Islamic values is important in my profession.',
        'I appreciate professions that serve the Muslim community.',
        'Islamic ethics guide my professional choices and decisions.'
      ];
      
      for (const message of professionalMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should appreciate Islamic professional ethics
        const professionalEthics = userPage.locator('[data-testid="islamic-professional-ethics"]');
        await expect(professionalEthics).toBeVisible();
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });

  test('should provide culturally sensitive guidance and resources', async () => {
    await test.step('Offer region-specific Islamic marriage guidance', async () => {
      // Access regional guidance resources
      await userPage.click('[data-testid="regional-islamic-guidance"]');
      
      // Should show different regional resources
      const regionalResources = userPage.locator('[data-testid="regional-resources"]');
      await expect(regionalResources).toBeVisible();
      
      // Should include various cultural contexts
      await expect(regionalResources).toContainText('Middle Eastern Islamic customs');
      await expect(regionalResources).toContainText('South Asian Islamic traditions');
      await expect(regionalResources).toContainText('African Islamic practices');
      await expect(regionalResources).toContainText('Southeast Asian Islamic customs');
    });

    await test.step('Provide culturally appropriate conversation starters', async () => {
      // Access conversation guidance
      await userPage.click('[data-testid="conversation-guidance"]');
      
      // Should show culturally sensitive topics
      const culturalTopics = userPage.locator('[data-testid="culturally-appropriate-topics"]');
      await expect(culturalTopics).toBeVisible();
      
      // Should include various cultural perspectives
      await expect(culturalTopics).toContainText('family traditions');
      await expect(culturalTopics).toContainText('cultural celebrations');
      await expect(culturalTopics).toContainText('regional Islamic practices');
      await expect(culturalTopics).toContainText('community involvement');
    });

    await test.step('Generate cultural sensitivity reports', async () => {
      // Navigate to guardian dashboard for cultural sensitivity monitoring
      await guardianPage.click('[data-testid="cultural-sensitivity-monitoring"]');
      
      // Should show cultural awareness metrics
      const culturalMetrics = userPage.locator('[data-testid="cultural-awareness-metrics"]');
      await expect(culturalMetrics).toBeVisible();
      
      // Should track cultural inclusivity
      await expect(culturalMetrics).toContainText('Cultural Inclusivity Score');
      await expect(culturalMetrics).toContainText('Cross-Cultural Understanding');
      await expect(culturalMetrics).toContainText('Religious Diversity Appreciation');
      
      // Generate cultural sensitivity report
      await guardianPage.click('[data-testid="generate-cultural-report"]');
      
      // Should create comprehensive cultural analysis
      const culturalReport = guardianPage.locator('[data-testid="cultural-sensitivity-report"]');
      await expect(culturalReport).toBeVisible();
    });
  });

  test('should handle special circumstances and considerations', async () => {
    await test.step('Support single parent families', async () => {
      const singleParentMessages = [
        'As a single parent, I appreciate the Islamic community\'s support.',
        'Raising children with Islamic values as a single parent has unique challenges.',
        'I\'m grateful for mosque community support in my parenting journey.',
        'Islamic principles guide my approach to single parenting.'
      ];
      
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      for (const message of singleParentMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should show special support for single parents
        const singleParentSupport = userPage.locator('[data-testid="single-parent-support"]');
        await expect(singleParentSupport).toBeVisible();
        await expect(singleParentSupport).toContainText('Islamic community support');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Accommodate widowed individuals', async () => {
      const widowedMessages = [
        'As someone who has lost a spouse, I appreciate Islamic guidance on remarriage.',
        'The Islamic principles of supporting widows gives me comfort.',
        'I\'m grateful for community support during my period of iddah.',
        'Islam\'s compassionate approach to widowhood is reassuring.'
      ];
      
      for (const message of widowedMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should provide sensitive support
        const widowedSupport = userPage.locator('[data-testid="widowed-individual-support"]');
        await expect(widowedSupport).toBeVisible();
        await expect(widowedSupport).toContainText('Islamic compassion');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });

    await test.step('Support individuals with disabilities', async () => {
      const disabilityMessages = [
        'Islam teaches us that all individuals deserve respect and marriage opportunities.',
        'My disability doesn\'t define me; my Islamic faith and character do.',
        'I appreciate the Islamic principle of not discriminating based on physical abilities.',
        'The Muslim community\'s inclusivity gives me hope in finding a spouse.'
      ];
      
      for (const message of disabilityMessages) {
        await userPage.fill('[data-testid="message-input"]', message);
        
        // Should show inclusive support
        const inclusiveSupport = userPage.locator('[data-testid="inclusive-disability-support"]');
        await expect(inclusiveSupport).toBeVisible();
        await expect(inclusiveSupport).toContainText('Islamic inclusivity');
        
        await userPage.click('[data-testid="send-button"]');
        await userPage.clear('[data-testid="message-input"]');
      }
    });
  });
});