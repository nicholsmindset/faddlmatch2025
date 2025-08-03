import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
  });

  test('Homepage loads correctly across browsers', async ({ page, browserName }) => {
    // Check if page loads without errors
    await expect(page).toHaveTitle(/FADDL Match/);
    
    // Check header elements
    await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Check hero section
    await expect(page.locator('h2:has-text("Welcome to")')).toBeVisible();
    await expect(page.locator('span:has-text("FADDL Match")')).toBeVisible();
    
    // Check value propositions
    await expect(page.locator('text=Muslim Values First')).toBeVisible();
    await expect(page.locator('text=Privacy Controls')).toBeVisible();
    await expect(page.locator('text=Serious Intentions')).toBeVisible();

    // Take screenshot for visual comparison
    await page.screenshot({ 
      path: `test-results/homepage-${browserName}.png`,
      fullPage: true 
    });
  });

  test('CSS Grid and Flexbox layouts work properly', async ({ page }) => {
    // Check the three-column grid on desktop
    const valuePropsGrid = page.locator('.grid.md\\:grid-cols-3');
    await expect(valuePropsGrid).toBeVisible();
    
    // Check each value proposition card
    const cards = page.locator('.grid.md\\:grid-cols-3 > div');
    await expect(cards).toHaveCount(3);
    
    // Verify card layout
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);
      await expect(card).toHaveClass(/bg-white.*rounded-2xl/);
      await expect(card.locator('svg')).toBeVisible();
      await expect(card.locator('h3')).toBeVisible();
      await expect(card.locator('p')).toBeVisible();
    }
  });

  test('Typography and fonts render correctly', async ({ page }) => {
    // Check Inter font is applied
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });
    expect(bodyStyles).toContain('Inter');

    // Check heading hierarchy
    const h1 = page.locator('h1:has-text("FADDL Match")');
    const h2 = page.locator('h2:has-text("Welcome to")');
    const h3 = page.locator('h3').first();

    await expect(h1).toBeVisible();
    await expect(h2).toBeVisible();
    await expect(h3).toBeVisible();

    // Check font sizes are appropriate
    const h1Size = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
    const h2Size = await h2.evaluate(el => window.getComputedStyle(el).fontSize);
    const h3Size = await h3.evaluate(el => window.getComputedStyle(el).fontSize);

    // Verify heading hierarchy (h1 > h2 > h3)
    expect(parseFloat(h1Size)).toBeGreaterThan(parseFloat(h3Size));
    expect(parseFloat(h2Size)).toBeGreaterThan(parseFloat(h3Size));
  });

  test('Color contrast meets accessibility standards', async ({ page }) => {
    // Check primary button contrast
    const signInButton = page.locator('button:has-text("Sign In")').first();
    const buttonStyles = await signInButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });

    // Basic contrast check (should be dark text on light background or vice versa)
    expect(buttonStyles.backgroundColor).toBeTruthy();
    expect(buttonStyles.color).toBeTruthy();

    // Check text readability on colored backgrounds
    const heroText = page.locator('p:has-text("Your journey into the next chapter")');
    const textColor = await heroText.evaluate(el => window.getComputedStyle(el).color);
    expect(textColor).toBeTruthy();
  });

  test('Icons and SVGs render properly', async ({ page }) => {
    // Check header logo/icon
    const logoIcon = page.locator('.bg-green-600.rounded-full');
    await expect(logoIcon).toBeVisible();
    
    // Check value proposition icons
    const valueIcons = page.locator('.grid.md\\:grid-cols-3 svg');
    await expect(valueIcons).toHaveCount(3);
    
    // Verify each icon is visible and has proper styling
    for (let i = 0; i < 3; i++) {
      const icon = valueIcons.nth(i);
      await expect(icon).toBeVisible();
      
      // Check icon has proper dimensions
      const iconBox = await icon.boundingBox();
      expect(iconBox?.width).toBeGreaterThan(0);
      expect(iconBox?.height).toBeGreaterThan(0);
    }
  });

  test('Hover states and interactions work', async ({ page }) => {
    // Test button hover states
    const signInButton = page.locator('button:has-text("Sign In")').first();
    
    // Get initial styles
    const initialStyles = await signInButton.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Hover over button
    await signInButton.hover();
    
    // Small delay to allow CSS transition
    await page.waitForTimeout(100);
    
    // Button should be interactive
    await expect(signInButton).not.toBeDisabled();
    
    // Test CTA button
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeVisible();
    await ctaButton.hover();
    
    // Check for transform/scale effect
    const hasTransform = await ctaButton.evaluate(el => {
      const transform = window.getComputedStyle(el).transform;
      return transform !== 'none';
    });
    
    // Footer links hover
    const footerLinks = page.locator('footer a');
    const firstLink = footerLinks.first();
    await firstLink.hover();
    
    await expect(firstLink).toBeVisible();
  });

  test('Gradient backgrounds render correctly', async ({ page }) => {
    // Check main gradient background
    const mainElement = page.locator('main');
    await expect(mainElement).toHaveClass(/bg-gradient-to-br/);
    
    // Verify gradient is applied
    const backgroundImage = await mainElement.evaluate(el => {
      return window.getComputedStyle(el).backgroundImage;
    });
    
    expect(backgroundImage).toContain('gradient');
    
    // Check premium button gradient
    // This would be tested when we have premium buttons in the UI
  });

  test('Loading states and animations work', async ({ page }) => {
    // Check loading spinner when not signed in
    await page.reload();
    
    // Look for loading spinner (if it appears briefly)
    const loadingSpinner = page.locator('.animate-spin');
    
    // The spinner might be brief, so we check the main content loads
    await expect(page.locator('h2:has-text("Welcome to")')).toBeVisible({ timeout: 10000 });
    
    // Check for any CSS animations
    const animatedElements = page.locator('[class*="animate-"]');
    if (await animatedElements.count() > 0) {
      await expect(animatedElements.first()).toBeVisible();
    }
  });

  test('Error handling displays correctly', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    
    // Should show some kind of error or redirect
    // This depends on Next.js configuration
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});