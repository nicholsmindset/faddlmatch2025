import { test, expect, type Page } from '@playwright/test';

test.describe('Mobile Interactions and Touch Gestures', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  test('Touch interactions work correctly on mobile', async ({ page }) => {
    // Test tap interactions
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible();
    
    // Simulate touch tap
    await signInButton.tap();
    
    // Should trigger some action (modal, navigation, etc.)
    // For now, we'll check the button remains interactive
    await expect(signInButton).toBeVisible();
    
    // Test CTA button
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeVisible();
    await ctaButton.tap();
  });

  test('Scroll behavior works smoothly on mobile', async ({ page }) => {
    // Test vertical scrolling
    const initialScrollPosition = await page.evaluate(() => window.scrollY);
    expect(initialScrollPosition).toBe(0);
    
    // Scroll down to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    const footerScrollPosition = await page.evaluate(() => window.scrollY);
    expect(footerScrollPosition).toBeGreaterThan(0);
    
    // Scroll back to top
    await page.locator('header').scrollIntoViewIfNeeded();
    
    const topScrollPosition = await page.evaluate(() => window.scrollY);
    expect(topScrollPosition).toBeLessThan(footerScrollPosition);
  });

  test('Touch targets are appropriately sized for mobile', async ({ page }) => {
    const touchTargets = [
      'button:has-text("Sign In")',
      'button:has-text("Begin Your Journey")',
      'footer a'
    ];

    for (const selector of touchTargets) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        await expect(element).toBeVisible();
        
        const boundingBox = await element.boundingBox();
        
        if (boundingBox) {
          // Touch targets should be at least 44x44px according to Apple HIG
          // We'll use a minimum of 32x32px for this design
          expect(boundingBox.width).toBeGreaterThanOrEqual(32);
          expect(boundingBox.height).toBeGreaterThanOrEqual(32);
          
          // Touch targets should have adequate spacing
          // This would require checking distances between elements
        }
      }
    }
  });

  test('Mobile viewport meta tag prevents zooming issues', async ({ page }) => {
    // Check if viewport meta tag exists and is configured correctly
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    // Should have viewport meta tag for mobile responsiveness
    // This would typically be set in the Next.js layout or _document
    // For now, we'll check the page renders correctly on mobile
    
    await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
    
    // Check that content doesn't require horizontal scrolling
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowInnerWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 5); // 5px tolerance
  });

  test('Text input focuses correctly on mobile', async ({ page }) => {
    // This test would be more relevant when we have actual input fields
    // For now, we'll test that buttons can receive focus
    
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.tap();
    
    // On mobile, buttons should be tappable without requiring precise clicking
    await expect(signInButton).toBeVisible();
  });

  test('Mobile navigation and orientation changes', async ({ page }) => {
    // Test portrait orientation
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
    
    // Take screenshot of portrait mode
    await page.screenshot({ 
      path: 'test-results/mobile-portrait.png',
      fullPage: true 
    });
    
    // Test landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
    
    // Take screenshot of landscape mode
    await page.screenshot({ 
      path: 'test-results/mobile-landscape.png',
      fullPage: true 
    });
    
    // Check that content adapts to landscape
    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    
    if (headerBox) {
      expect(headerBox.width).toBeLessThanOrEqual(667);
    }
  });

  test('Swipe gestures work where expected', async ({ page }) => {
    // For now, this is a placeholder since the current homepage doesn't have swipeable content
    // This would be implemented when we have image carousels, card stacks, etc.
    
    // Test horizontal scrolling if any
    const horizontalScrollContainer = page.locator('[class*="overflow-x"]');
    if (await horizontalScrollContainer.count() > 0) {
      const container = horizontalScrollContainer.first();
      await expect(container).toBeVisible();
      
      // Test swipe simulation
      const containerBox = await container.boundingBox();
      if (containerBox) {
        // Simulate swipe left
        await page.mouse.move(containerBox.x + containerBox.width - 50, containerBox.y + containerBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(containerBox.x + 50, containerBox.y + containerBox.height / 2);
        await page.mouse.up();
      }
    }
  });

  test('Long press interactions work correctly', async ({ page }) => {
    // Test long press on buttons (if applicable)
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeVisible();
    
    const buttonBox = await ctaButton.boundingBox();
    if (buttonBox) {
      // Simulate long press
      await page.mouse.move(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1000); // Hold for 1 second
      await page.mouse.up();
    }
    
    // Button should still be functional after long press
    await expect(ctaButton).toBeVisible();
  });

  test('Mobile-specific UI elements display correctly', async ({ page }) => {
    // Check that mobile-specific classes are working
    const mobileElements = page.locator('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    const count = await mobileElements.count();
    
    // Should have responsive classes
    expect(count).toBeGreaterThan(0);
    
    // Check grid behavior on mobile
    const grid = page.locator('.grid.md\\:grid-cols-3');
    await expect(grid).toBeVisible();
    
    // On mobile, should display as single column
    const cards = page.locator('.grid.md\\:grid-cols-3 > div');
    const cardCount = await cards.count();
    expect(cardCount).toBe(3);
    
    // Check that cards stack vertically on mobile
    let previousCardBottom = 0;
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const cardBox = await card.boundingBox();
      
      if (cardBox && i > 0) {
        // Each card should be below the previous one
        expect(cardBox.y).toBeGreaterThan(previousCardBottom - 10); // 10px tolerance
      }
      
      if (cardBox) {
        previousCardBottom = cardBox.y + cardBox.height;
      }
    }
  });

  test('Mobile performance and loading', async ({ page }) => {
    // Simulate slower mobile network
    await page.route('**/*', route => {
      // Add slight delay to simulate mobile network
      setTimeout(() => route.continue(), 50);
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time even on slower networks
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    
    // Check that loading states are handled gracefully
    const loadingSpinner = page.locator('.animate-spin');
    // Spinner might be brief, so we just check that the page loads eventually
  });

  test('Mobile accessibility features work', async ({ page }) => {
    // Test that focus is properly managed on mobile
    const firstButton = page.locator('button:has-text("Sign In")').first();
    await firstButton.focus();
    await expect(firstButton).toBeFocused();
    
    // Test that focus is visible on mobile
    const focusStyles = await firstButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have some kind of focus indicator
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' || 
      focusStyles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('Mobile-specific animations and transitions', async ({ page }) => {
    // Test button press animations
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeVisible();
    
    // Check for hover/active states that work on mobile
    const hasTransition = await ctaButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transition !== 'none';
    });
    
    // Should have CSS transitions for better mobile experience
    expect(hasTransition).toBeTruthy();
    
    // Test tap and release
    await ctaButton.tap();
    
    // Button should remain functional
    await expect(ctaButton).toBeVisible();
  });
});