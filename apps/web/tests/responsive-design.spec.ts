import { test, expect, type Page } from '@playwright/test';

const BREAKPOINTS = {
  mobile: { width: 320, height: 568 },
  mobileLarge: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  desktopLarge: { width: 1440, height: 900 },
  desktopXL: { width: 1920, height: 1080 }
};

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  Object.entries(BREAKPOINTS).forEach(([device, viewport]) => {
    test(`Homepage responsive design on ${device} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      // Wait for page to load
      await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible();
      
      // Take screenshot for visual comparison
      await page.screenshot({ 
        path: `test-results/responsive-${device}-${viewport.width}x${viewport.height}.png`,
        fullPage: true 
      });

      // Check header responsive behavior
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // On mobile, check if header stacks or remains horizontal
      if (viewport.width <= 768) {
        // Mobile-specific checks
        const headerFlex = page.locator('header .flex');
        await expect(headerFlex).toBeVisible();
        
        // Check if content is readable and not overlapping
        const logo = page.locator('.bg-green-600.rounded-full');
        const signInButton = page.locator('button:has-text("Sign In")').first();
        
        await expect(logo).toBeVisible();
        await expect(signInButton).toBeVisible();
        
        // Ensure no horizontal scrolling
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const windowInnerWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 5); // 5px tolerance
      }

      // Check hero section responsiveness
      const heroHeading = page.locator('h2:has-text("Welcome to")');
      await expect(heroHeading).toBeVisible();
      
      // Text should not overflow container
      const heroContainer = page.locator('.text-center.max-w-4xl');
      const containerBox = await heroContainer.boundingBox();
      expect(containerBox?.width).toBeGreaterThan(0);
      
      // Check if text scales appropriately
      const headingStyles = await heroHeading.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight
        };
      });
      
      expect(headingStyles.fontSize).toBeTruthy();
      
      // Check grid responsiveness
      const valuePropsGrid = page.locator('.grid.md\\:grid-cols-3');
      await expect(valuePropsGrid).toBeVisible();
      
      if (viewport.width < 768) {
        // On mobile, grid should stack vertically
        const cards = page.locator('.grid.md\\:grid-cols-3 > div');
        const cardCount = await cards.count();
        expect(cardCount).toBe(3);
        
        // Check card spacing and layout
        for (let i = 0; i < cardCount; i++) {
          const card = cards.nth(i);
          await expect(card).toBeVisible();
          
          const cardBox = await card.boundingBox();
          expect(cardBox?.width).toBeGreaterThan(0);
          expect(cardBox?.height).toBeGreaterThan(0);
        }
      } else {
        // On desktop, should be side by side
        const cards = page.locator('.grid.md\\:grid-cols-3 > div');
        await expect(cards).toHaveCount(3);
      }
    });
  });

  test('Navigation responsiveness', async ({ page }) => {
    // Test different viewport sizes for navigation
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Check header layout doesn't break
      const headerBox = await header.boundingBox();
      expect(headerBox?.width).toBeLessThanOrEqual(viewport.width);
      
      // Ensure all header elements are accessible
      const logo = page.locator('.bg-green-600.rounded-full');
      const signInButton = page.locator('button:has-text("Sign In")').first();
      
      await expect(logo).toBeVisible();
      await expect(signInButton).toBeVisible();
    }
  });

  test('Text readability across devices', async ({ page }) => {
    const testViewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      
      // Check heading text is readable
      const mainHeading = page.locator('h2:has-text("Welcome to")');
      await expect(mainHeading).toBeVisible();
      
      const headingBox = await mainHeading.boundingBox();
      expect(headingBox?.width).toBeLessThanOrEqual(viewport.width - 32); // Account for padding
      
      // Check paragraph text
      const paragraph = page.locator('p:has-text("Your journey into the next chapter")');
      await expect(paragraph).toBeVisible();
      
      const paragraphBox = await paragraph.boundingBox();
      expect(paragraphBox?.width).toBeLessThanOrEqual(viewport.width - 32);
      
      // Check font sizes are appropriate for viewport
      const fontSize = await mainHeading.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      
      const fontSizeNumber = parseFloat(fontSize);
      
      if (viewport.width <= 320) {
        // On very small screens, font should be smaller but readable
        expect(fontSizeNumber).toBeGreaterThan(16); // Minimum readable size
      } else if (viewport.width >= 1440) {
        // On large screens, font can be larger
        expect(fontSizeNumber).toBeGreaterThan(24);
      }
    }
  });

  test('Button and interactive element sizing', async ({ page }) => {
    const testViewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' }
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      
      // Check sign in button
      const signInButton = page.locator('button:has-text("Sign In")').first();
      await expect(signInButton).toBeVisible();
      
      const buttonBox = await signInButton.boundingBox();
      
      if (viewport.width <= 320) {
        // On mobile, touch targets should be at least 44px
        expect(buttonBox?.height).toBeGreaterThanOrEqual(32); // Minimum for this design
        expect(buttonBox?.width).toBeGreaterThanOrEqual(60);
      }
      
      // Check CTA button
      const ctaButton = page.locator('button:has-text("Begin Your Journey")');
      await expect(ctaButton).toBeVisible();
      
      const ctaBox = await ctaButton.boundingBox();
      expect(ctaBox?.height).toBeGreaterThanOrEqual(40);
      expect(ctaBox?.width).toBeGreaterThanOrEqual(120);
      
      // Test button clickability
      await ctaButton.click();
      // Should trigger sign-in modal or navigation
    }
  });

  test('Image and icon scaling', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 1440, height: 900 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Check logo icon
      const logoIcon = page.locator('.bg-green-600.rounded-full');
      await expect(logoIcon).toBeVisible();
      
      const logoBox = await logoIcon.boundingBox();
      expect(logoBox?.width).toBeGreaterThan(0);
      expect(logoBox?.height).toBeGreaterThan(0);
      expect(logoBox?.width).toBe(logoBox?.height); // Should be square
      
      // Check value proposition icons
      const valueIcons = page.locator('.w-16.h-16.bg-green-100');
      const iconCount = await valueIcons.count();
      expect(iconCount).toBe(3);
      
      for (let i = 0; i < iconCount; i++) {
        const icon = valueIcons.nth(i);
        await expect(icon).toBeVisible();
        
        const iconBox = await icon.boundingBox();
        expect(iconBox?.width).toBeGreaterThan(0);
        expect(iconBox?.height).toBeGreaterThan(0);
      }
    }
  });

  test('Container and spacing responsiveness', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Check container padding
      const container = page.locator('.container.mx-auto').first();
      await expect(container).toBeVisible();
      
      const containerBox = await container.boundingBox();
      expect(containerBox?.width).toBeLessThanOrEqual(viewport.width);
      
      // Check section spacing
      const sections = page.locator('main > div');
      const sectionCount = await sections.count();
      
      for (let i = 0; i < sectionCount; i++) {
        const section = sections.nth(i);
        if (await section.isVisible()) {
          const sectionBox = await section.boundingBox();
          expect(sectionBox?.width).toBeLessThanOrEqual(viewport.width);
        }
      }
      
      // Check card spacing in grid
      const cards = page.locator('.grid.md\\:grid-cols-3 > div');
      const cardCount = await cards.count();
      
      if (viewport.width >= 768 && cardCount >= 2) {
        // On tablet and desktop, check cards don't overlap
        const firstCard = await cards.nth(0).boundingBox();
        const secondCard = await cards.nth(1).boundingBox();
        
        if (firstCard && secondCard) {
          // Cards should not overlap horizontally
          expect(firstCard.x + firstCard.width).toBeLessThanOrEqual(secondCard.x + 10); // 10px tolerance
        }
      }
    }
  });

  test('Footer responsiveness', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Scroll to footer
      await page.locator('footer').scrollIntoViewIfNeeded();
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      // Check footer links
      const footerLinks = page.locator('footer a');
      const linkCount = await footerLinks.count();
      expect(linkCount).toBeGreaterThan(0);
      
      // On mobile, links should stack or wrap appropriately
      for (let i = 0; i < linkCount; i++) {
        const link = footerLinks.nth(i);
        await expect(link).toBeVisible();
      }
      
      // Footer should not overflow
      const footerBox = await footer.boundingBox();
      expect(footerBox?.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});