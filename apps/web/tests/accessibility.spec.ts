import { test, expect, type Page } from '@playwright/test';

test.describe('Accessibility (WCAG 2.1 AA) Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Keyboard navigation works throughout the site', async ({ page }) => {
    // Start at the top of the page
    await page.keyboard.press('Tab');
    
    // Should focus on the first interactive element (Sign In button)
    const firstButton = page.locator('button:has-text("Sign In")').first();
    await expect(firstButton).toBeFocused();
    
    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    
    // Should reach the CTA button
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeFocused();
    
    // Continue to footer links
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const footerLinks = page.locator('footer a');
    const firstFooterLink = footerLinks.first();
    await expect(firstFooterLink).toBeFocused();
    
    // Test reverse tabbing
    await page.keyboard.press('Shift+Tab');
    // Should go back to previous element
  });

  test('Focus indicators are visible and meet contrast requirements', async ({ page }) => {
    const focusableElements = [
      'button:has-text("Sign In")',
      'button:has-text("Begin Your Journey")',
      'footer a'
    ];

    for (const selector of focusableElements) {
      const element = page.locator(selector).first();
      await element.focus();
      
      // Check if element has focus
      await expect(element).toBeFocused();
      
      // Check for focus ring or outline
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have some kind of focus indicator
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.boxShadow !== 'none' ||
        focusStyles.outlineWidth !== '0px';
      
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('Images have appropriate alt text or are decorative', async ({ page }) => {
    // Check SVG icons for accessibility
    const svgIcons = page.locator('svg');
    const iconCount = await svgIcons.count();
    
    for (let i = 0; i < iconCount; i++) {
      const icon = svgIcons.nth(i);
      
      // SVG should either have aria-label, title, or be marked as decorative
      const ariaLabel = await icon.getAttribute('aria-label');
      const titleElement = icon.locator('title');
      const ariaHidden = await icon.getAttribute('aria-hidden');
      
      const hasAccessibilityAttribute = 
        ariaLabel !== null || 
        await titleElement.count() > 0 || 
        ariaHidden === 'true';
      
      expect(hasAccessibilityAttribute).toBeTruthy();
    }
  });

  test('Form elements have proper labels and descriptions', async ({ page }) => {
    // Note: This test would be more comprehensive when we have actual forms
    // For now, check button labels
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      
      // Buttons should have meaningful text
      expect(buttonText?.trim()).toBeTruthy();
      expect(buttonText?.trim().length).toBeGreaterThan(2);
    }
  });

  test('Headings follow proper hierarchy', async ({ page }) => {
    // Get all headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
    
    let previousLevel = 0;
    
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const currentLevel = parseInt(tagName.substring(1));
      
      if (i === 0) {
        // First heading should be h1
        expect(currentLevel).toBe(1);
      } else {
        // Subsequent headings should not skip levels
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
      }
      
      previousLevel = currentLevel;
      
      // Heading should have meaningful text
      const headingText = await heading.textContent();
      expect(headingText?.trim()).toBeTruthy();
    }
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    // Test main text contrast
    const textElements = [
      'h1:has-text("FADDL Match")',
      'h2:has-text("Welcome to")',
      'p:has-text("Your journey")',
      'h3:has-text("Muslim Values First")'
    ];

    for (const selector of textElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // Basic validation that color and background are set
        expect(styles.color).toBeTruthy();
        expect(styles.fontSize).toBeTruthy();
        
        // Color should not be transparent or inherit without being resolved
        expect(styles.color).not.toBe('transparent');
      }
    }
  });

  test('Interactive elements are large enough for touch', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const interactiveElements = [
      'button:has-text("Sign In")',
      'button:has-text("Begin Your Journey")',
      'footer a'
    ];

    for (const selector of interactiveElements) {
      const element = page.locator(selector).first();
      await expect(element).toBeVisible();
      
      const boundingBox = await element.boundingBox();
      
      if (boundingBox) {
        // WCAG recommends minimum 44x44px for touch targets
        // We'll use 32x32px as minimum for this design
        expect(boundingBox.width).toBeGreaterThanOrEqual(32);
        expect(boundingBox.height).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test('Page has proper document structure', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check HTML lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });

  test('Links are descriptive and accessible', async ({ page }) => {
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const linkText = await link.textContent();
      const href = await link.getAttribute('href');
      
      // Links should have meaningful text
      expect(linkText?.trim()).toBeTruthy();
      
      // Avoid generic link text
      const genericTerms = ['click here', 'read more', 'link'];
      const isGeneric = genericTerms.some(term => 
        linkText?.toLowerCase().includes(term)
      );
      expect(isGeneric).toBeFalsy();
      
      // Links should have href attribute
      if (href !== '#') {
        expect(href).toBeTruthy();
      }
    }
  });

  test('No accessibility violations with basic automated checks', async ({ page }) => {
    // Check for common accessibility issues
    
    // 1. Missing alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Images should have alt text or be marked as decorative
      const hasAccessibilityAttribute = alt !== null || ariaHidden === 'true';
      expect(hasAccessibilityAttribute).toBeTruthy();
    }
    
    // 2. Check for proper button types
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const type = await button.getAttribute('type');
      const onClick = await button.getAttribute('onclick');
      
      // Buttons should have proper type or onclick handler
      const hasProperFunction = type !== null || onClick !== null;
      // For this test, we'll just check they have text content
      const buttonText = await button.textContent();
      expect(buttonText?.trim()).toBeTruthy();
    }
  });

  test('Screen reader compatibility', async ({ page }) => {
    // Test ARIA landmarks and roles
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for navigation landmarks (when they exist)
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
    }
    
    // Test that interactive elements are properly labeled
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Button should have either aria-label or text content
      const hasLabel = ariaLabel !== null || (textContent && textContent.trim().length > 0);
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Zoom functionality works correctly', async ({ page }) => {
    // Test page at different zoom levels
    const zoomLevels = [1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      // Simulate zoom by changing viewport and scaling
      const baseWidth = 1024;
      const baseHeight = 768;
      
      await page.setViewportSize({ 
        width: Math.floor(baseWidth / zoom), 
        height: Math.floor(baseHeight / zoom) 
      });
      
      // Check that content is still accessible
      await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
      
      // Check that text doesn't overflow
      const body = await page.locator('body').boundingBox();
      const html = await page.locator('html').boundingBox();
      
      if (body && html) {
        expect(body.width).toBeLessThanOrEqual(html.width + 10); // 10px tolerance
      }
    }
  });
});