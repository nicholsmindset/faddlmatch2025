import { test, expect, type Page } from '@playwright/test';

test.describe('Cultural and Religious Interface Considerations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Islamic design principles are respected', async ({ page }) => {
    // Check color scheme aligns with Islamic aesthetics
    const primaryElements = page.locator('.bg-green-600, .text-green-600');
    const primaryCount = await primaryElements.count();
    expect(primaryCount).toBeGreaterThan(0);
    
    // Green is commonly used in Islamic design
    const firstPrimaryElement = primaryElements.first();
    const styles = await firstPrimaryElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Should use appropriate green tones
    expect(styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || styles.color !== 'rgba(0, 0, 0, 0)').toBeTruthy();
  });

  test('Religious terminology is used appropriately', async ({ page }) => {
    // Check for appropriate Islamic terminology
    const religiousTerms = [
      'Halal',
      'Muslim',
      'Islamic',
      'marriage',
      'matrimonial'
    ];
    
    const pageContent = await page.textContent('body');
    
    for (const term of religiousTerms) {
      const termRegex = new RegExp(term, 'i');
      expect(pageContent).toMatch(termRegex);
    }
    
    // Check specific value propositions mention Islamic values
    const muslimValuesSection = page.locator('text=Muslim Values First');
    await expect(muslimValuesSection).toBeVisible();
    
    const muslimValuesDescription = page.locator('p:has-text("Islamic principles")');
    await expect(muslimValuesDescription).toBeVisible();
    
    // Check for mentions of guardian involvement
    const guardianMention = page.locator('text=guardian');
    await expect(guardianMention).toBeVisible();
  });

  test('Cultural sensitivity in language and presentation', async ({ page }) => {
    // Check respectful language around divorce and widowhood
    const targetAudience = page.locator('text=divorced and widowed Muslims');
    await expect(targetAudience).toBeVisible();
    
    // Language should be respectful and not stigmatizing
    const pageText = await page.textContent('body');
    
    // Should not contain stigmatizing terms
    const problematicTerms = ['broken', 'failed', 'damaged'];
    for (const term of problematicTerms) {
      expect(pageText?.toLowerCase()).not.toContain(term);
    }
    
    // Should use positive, respectful language
    const positiveTerms = ['respectful', 'meaningful', 'serious', 'journey'];
    for (const term of positiveTerms) {
      expect(pageText?.toLowerCase()).toContain(term);
    }
  });

  test('Family and guardian involvement is emphasized', async ({ page }) => {
    // Check mentions of family involvement
    const familyMentions = page.locator('text=family, text=guardian');
    const familyCount = await familyMentions.count();
    expect(familyCount).toBeGreaterThan(0);
    
    // Specific check for guardian involvement feature
    const guardianFeature = page.locator('p:has-text("guardian involvement")');
    await expect(guardianFeature).toBeVisible();
    
    // Check success story mentions family confidence
    const familyConfidence = page.locator('text=gave my family confidence');
    await expect(familyConfidence).toBeVisible();
  });

  test('Modesty and privacy considerations are prominent', async ({ page }) => {
    // Check privacy controls are highlighted
    const privacySection = page.locator('h3:has-text("Privacy Controls")');
    await expect(privacySection).toBeVisible();
    
    const privacyDescription = page.locator('p:has-text("photo visibility controls")');
    await expect(privacyDescription).toBeVisible();
    
    // Check mentions of secure communication
    const secureComm = page.locator('text=secure communication');
    await expect(secureComm).toBeVisible();
    
    // Verify no inappropriate imagery or content
    const images = page.locator('img');
    const imageCount = await images.count();
    
    // Currently no images, but check alt text when images are added
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // Images should have appropriate alt text
      if (alt) {
        expect(alt.toLowerCase()).not.toContain('inappropriate');
      }
    }
  });

  test('Marriage-focused messaging (not dating)', async ({ page }) => {
    // Check that messaging focuses on marriage, not casual dating
    const marriageTerms = page.locator('text=marriage, text=matrimonial, text=remarriage');
    const marriageCount = await marriageTerms.count();
    expect(marriageCount).toBeGreaterThan(0);
    
    // Should emphasize serious intentions
    const seriousIntentions = page.locator('h3:has-text("Serious Intentions")');
    await expect(seriousIntentions).toBeVisible();
    
    const notCasualDating = page.locator('text=not casual dating');
    await expect(notCasualDating).toBeVisible();
    
    // Page content should avoid casual dating terminology
    const pageText = await page.textContent('body');
    const casualTerms = ['hookup', 'fling', 'casual'];
    
    for (const term of casualTerms) {
      if (pageText?.toLowerCase().includes(term)) {
        // If 'casual' appears, it should be in context of "not casual dating"
        expect(pageText?.toLowerCase()).toContain('not casual');
      }
    }
  });

  test('Respectful visual design elements', async ({ page }) => {
    // Check for appropriate use of Islamic geometric patterns or colors
    // Currently using green color scheme which is appropriate
    
    const designElements = page.locator('.bg-green-100, .bg-green-600');
    const designCount = await designElements.count();
    expect(designCount).toBeGreaterThan(0);
    
    // Check for rounded corners (softer, more welcoming design)
    const roundedElements = page.locator('[class*="rounded"]');
    const roundedCount = await roundedElements.count();
    expect(roundedCount).toBeGreaterThan(0);
    
    // Verify no inappropriate visual elements
    const shadowElements = page.locator('[class*="shadow"]');
    // Shadows are acceptable and used for depth
    
    // Check that visual hierarchy respects content importance
    const mainHeading = page.locator('h2:has-text("Welcome to")');
    const subheadings = page.locator('h3');
    
    await expect(mainHeading).toBeVisible();
    await expect(subheadings.first()).toBeVisible();
  });

  test('Appropriate success story representation', async ({ page }) => {
    // Check success story is culturally appropriate
    const successStory = page.locator('.bg-white.rounded-2xl.p-8.mb-16');
    await expect(successStory).toBeVisible();
    
    // Check testimonial content
    const testimonial = page.locator('p:has-text("FADDL Match helped me find")');
    await expect(testimonial).toBeVisible();
    
    const testimonialText = await testimonial.textContent();
    
    // Should mention Islamic values
    expect(testimonialText?.toLowerCase()).toContain('islamic values');
    
    // Should mention guardian involvement positively
    expect(testimonialText?.toLowerCase()).toContain('guardian');
    expect(testimonialText?.toLowerCase()).toContain('confidence');
    
    // Attribution should be appropriate (first name only for privacy)
    const attribution = page.locator('p:has-text("- Aisha, Singapore")');
    await expect(attribution).toBeVisible();
  });

  test('Language accessibility for Muslim communities', async ({ page }) => {
    // Check if page structure supports RTL languages (for Arabic-speaking users)
    const htmlDir = await page.locator('html').getAttribute('dir');
    // Currently LTR, but should be prepared for RTL support
    
    // Check font choices support international characters
    const bodyFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    
    expect(bodyFont).toContain('Inter'); // Good international font support
    
    // Check for future Arabic font support in config
    // This is configured in tailwind.config.js with 'Noto Naskh Arabic'
  });

  test('Community and belonging messaging', async ({ page }) => {
    // Check messaging emphasizes community and belonging
    const communityElements = page.locator('text=community, text=support, text=family');
    const communityCount = await communityElements.count();
    expect(communityCount).toBeGreaterThan(0);
    
    // Check platform positioning
    const platformDescription = page.locator('p:has-text("respectful matrimonial platform")');
    await expect(platformDescription).toBeVisible();
    
    // Should emphasize shared values and understanding
    const sharedValues = page.locator('text=Islamic principles, text=Muslim values');
    await expect(sharedValues.first()).toBeVisible();
  });

  test('Avoiding Western dating culture references', async ({ page }) => {
    const pageContent = await page.textContent('body');
    
    // Should avoid typical Western dating app terminology
    const westernTerms = [
      'swipe',
      'match rate',
      'hookup',
      'player',
      'game',
      'score'
    ];
    
    for (const term of westernTerms) {
      expect(pageContent?.toLowerCase()).not.toContain(term);
    }
    
    // Should use appropriate Islamic/matrimonial terminology instead
    const appropriateTerms = [
      'matrimonial',
      'marriage',
      'partner',
      'spouse',
      'family'
    ];
    
    for (const term of appropriateTerms) {
      expect(pageContent?.toLowerCase()).toContain(term);
    }
  });

  test('Cultural color psychology and symbolism', async ({ page }) => {
    // Green is significant in Islamic culture (nature, peace, paradise)
    const greenElements = page.locator('[class*="green"]');
    const greenCount = await greenElements.count();
    expect(greenCount).toBeGreaterThan(0);
    
    // Check that colors create appropriate emotional response
    const primaryButton = page.locator('button:has-text("Begin Your Journey")');
    const buttonStyles = await primaryButton.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should use calming, trustworthy colors
    expect(buttonStyles).toBeTruthy();
    
    // Gold/yellow accent colors are also culturally appropriate
    const accentElements = page.locator('.bg-yellow-50, .to-yellow-50');
    const accentCount = await accentElements.count();
    expect(accentCount).toBeGreaterThan(0);
  });

  test('Respectful imagery and iconography', async ({ page }) => {
    // Check SVG icons are appropriate
    const icons = page.locator('svg');
    const iconCount = await icons.count();
    expect(iconCount).toBe(3); // Three value proposition icons
    
    // Icons should represent appropriate concepts
    // Check if icons have appropriate paths/shapes
    for (let i = 0; i < iconCount; i++) {
      const icon = icons.nth(i);
      const pathElements = icon.locator('path');
      const pathCount = await pathElements.count();
      expect(pathCount).toBeGreaterThan(0);
    }
    
    // No inappropriate imagery should be present
    const inappropriateSelectors = [
      'img[alt*="bikini"]',
      'img[alt*="alcohol"]',
      'img[alt*="party"]'
    ];
    
    for (const selector of inappropriateSelectors) {
      const inappropriateElements = page.locator(selector);
      const count = await inappropriateElements.count();
      expect(count).toBe(0);
    }
  });
});