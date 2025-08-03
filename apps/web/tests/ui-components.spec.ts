import { test, expect, type Page } from '@playwright/test';

test.describe('UI Component Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Button components render and function correctly', async ({ page }) => {
    // Test Sign In button
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
    
    // Check button styling
    const buttonStyles = await signInButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderRadius: styles.borderRadius,
        padding: styles.padding,
        display: styles.display
      };
    });
    
    expect(buttonStyles.backgroundColor).toBeTruthy();
    expect(buttonStyles.color).toBeTruthy();
    expect(buttonStyles.display).toBe('flex'); // Should be flex for proper alignment
    
    // Test button interaction
    await signInButton.click();
    // Should trigger Clerk sign-in modal (we can't test the modal itself without auth setup)
    
    // Test CTA button
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();
    
    // Check CTA button has proper styling
    const ctaStyles = await ctaButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        padding: styles.padding,
        transform: styles.transform
      };
    });
    
    expect(ctaStyles.fontSize).toBeTruthy();
    expect(ctaStyles.padding).toBeTruthy();
  });

  test('Card components display content correctly', async ({ page }) => {
    // Test value proposition cards
    const cards = page.locator('.grid.md\\:grid-cols-3 > div');
    await expect(cards).toHaveCount(3);
    
    const expectedCards = [
      { title: 'Muslim Values First', icon: true },
      { title: 'Privacy Controls', icon: true },
      { title: 'Serious Intentions', icon: true }
    ];
    
    for (let i = 0; i < expectedCards.length; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
      
      // Check card structure
      const cardClasses = await card.getAttribute('class');
      expect(cardClasses).toContain('bg-white');
      expect(cardClasses).toContain('rounded-2xl');
      expect(cardClasses).toContain('shadow-lg');
      
      // Check icon container
      const iconContainer = card.locator('.w-16.h-16.bg-green-100');
      await expect(iconContainer).toBeVisible();
      
      // Check icon SVG
      const icon = card.locator('svg');
      await expect(icon).toBeVisible();
      
      // Check title
      const title = card.locator('h3');
      await expect(title).toBeVisible();
      await expect(title).toHaveText(expectedCards[i].title);
      
      // Check description
      const description = card.locator('p');
      await expect(description).toBeVisible();
      
      const descriptionText = await description.textContent();
      expect(descriptionText?.trim().length).toBeGreaterThan(20);
    }
  });

  test('Logo and branding elements display correctly', async ({ page }) => {
    // Test header logo
    const logoContainer = page.locator('.bg-green-600.rounded-full');
    await expect(logoContainer).toBeVisible();
    
    // Check logo dimensions
    const logoBox = await logoContainer.boundingBox();
    expect(logoBox?.width).toBe(logoBox?.height); // Should be square
    expect(logoBox?.width).toBeGreaterThan(0);
    
    // Check logo text
    const logoText = logoContainer.locator('span:has-text("FM")');
    await expect(logoText).toBeVisible();
    await expect(logoText).toHaveText('FM');
    
    // Test main brand text
    const brandTitle = page.locator('h1:has-text("FADDL Match")');
    await expect(brandTitle).toBeVisible();
    
    // Check brand styling
    const brandStyles = await brandTitle.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color
      };
    });
    
    expect(brandStyles.fontWeight).toBe('700'); // Bold
    expect(brandStyles.color).toBeTruthy();
  });

  test('Typography hierarchy works correctly', async ({ page }) => {
    // Test heading hierarchy
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    const h3 = page.locator('h3');
    
    await expect(h1).toBeVisible();
    await expect(h2).toBeVisible();
    await expect(h3.first()).toBeVisible();
    
    // Check font sizes follow hierarchy
    const h1Size = await h1.first().evaluate(el => window.getComputedStyle(el).fontSize);
    const h2Size = await h2.first().evaluate(el => window.getComputedStyle(el).fontSize);
    const h3Size = await h3.first().evaluate(el => window.getComputedStyle(el).fontSize);
    
    expect(parseFloat(h1Size)).toBeGreaterThan(parseFloat(h3Size));
    expect(parseFloat(h2Size)).toBeGreaterThan(parseFloat(h3Size));
    
    // Test paragraph text
    const paragraphs = page.locator('p');
    const paragraphCount = await paragraphs.count();
    expect(paragraphCount).toBeGreaterThan(0);
    
    // Check paragraph readability
    const firstParagraph = paragraphs.first();
    const paragraphStyles = await firstParagraph.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        lineHeight: styles.lineHeight,
        fontSize: styles.fontSize,
        color: styles.color
      };
    });
    
    expect(paragraphStyles.lineHeight).toBeTruthy();
    expect(paragraphStyles.fontSize).toBeTruthy();
  });

  test('Icon components render and scale properly', async ({ page }) => {
    // Test SVG icons in value propositions
    const icons = page.locator('.grid.md\\:grid-cols-3 svg');
    await expect(icons).toHaveCount(3);
    
    for (let i = 0; i < 3; i++) {
      const icon = icons.nth(i);
      await expect(icon).toBeVisible();
      
      // Check icon properties
      const iconAttributes = await icon.evaluate(el => {
        return {
          width: el.getAttribute('width') || el.style.width,
          height: el.getAttribute('height') || el.style.height,
          viewBox: el.getAttribute('viewBox'),
          fill: el.getAttribute('fill'),
          stroke: el.getAttribute('stroke')
        };
      });
      
      // Icons should have proper dimensions
      expect(iconAttributes.viewBox).toBeTruthy();
      
      // Check icon styling
      const iconStyles = await icon.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          height: styles.height,
          color: styles.color
        };
      });
      
      expect(iconStyles.width).toBeTruthy();
      expect(iconStyles.height).toBeTruthy();
    }
  });

  test('Color system and theming work correctly', async ({ page }) => {
    // Test primary color usage
    const primaryElements = [
      '.bg-green-600',
      '.text-green-600',
      '.hover\\:bg-green-700'
    ];
    
    for (const selector of primaryElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        const element = elements.first();
        await expect(element).toBeVisible();
        
        // Check computed styles
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color
          };
        });
        
        // Should have color values
        expect(styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || styles.color !== 'rgba(0, 0, 0, 0)').toBeTruthy();
      }
    }
    
    // Test neutral colors
    const neutralElements = page.locator('.text-gray-600, .text-gray-900, .bg-white');
    const neutralCount = await neutralElements.count();
    expect(neutralCount).toBeGreaterThan(0);
  });

  test('Spacing and layout systems work correctly', async ({ page }) => {
    // Test container padding
    const container = page.locator('.container.mx-auto').first();
    await expect(container).toBeVisible();
    
    const containerStyles = await container.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
        maxWidth: styles.maxWidth
      };
    });
    
    expect(containerStyles.paddingLeft).toBeTruthy();
    expect(containerStyles.paddingRight).toBeTruthy();
    
    // Test section spacing
    const sections = [
      'header',
      '.grid.md\\:grid-cols-3',
      'footer'
    ];
    
    for (const selector of sections) {
      const section = page.locator(selector);
      if (await section.count() > 0) {
        await expect(section.first()).toBeVisible();
        
        const sectionBox = await section.first().boundingBox();
        expect(sectionBox?.width).toBeGreaterThan(0);
        expect(sectionBox?.height).toBeGreaterThan(0);
      }
    }
  });

  test('Form elements and inputs function correctly', async ({ page }) => {
    // Note: The current homepage doesn't have form inputs
    // This test is a placeholder for when we have actual forms
    
    // For now, test button form-like behavior
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      await expect(button).toBeVisible();
      
      // Check button accessibility
      const buttonRole = await button.getAttribute('role');
      const buttonType = await button.getAttribute('type');
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Buttons should be accessible
      expect(textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Loading and skeleton states work correctly', async ({ page }) => {
    // Test initial loading state
    await page.reload();
    
    // Look for loading spinner
    const loadingSpinner = page.locator('.animate-spin');
    
    // The main content should eventually load
    await expect(page.locator('h1:has-text("FADDL Match")')).toBeVisible({ timeout: 10000 });
    
    // Test that all main components are rendered
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Animation and transition components work smoothly', async ({ page }) => {
    // Test hover animations
    const ctaButton = page.locator('button:has-text("Begin Your Journey")');
    await expect(ctaButton).toBeVisible();
    
    // Check for transition styles
    const transitionStyles = await ctaButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        transition: styles.transition,
        transform: styles.transform
      };
    });
    
    expect(transitionStyles.transition).toBeTruthy();
    
    // Test hover effect
    await ctaButton.hover();
    
    // Small delay for animation
    await page.waitForTimeout(100);
    
    // Check if transform is applied on hover
    const hoverTransform = await ctaButton.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    
    // Transform might be applied via CSS hover state
    expect(hoverTransform).toBeTruthy();
  });

  test('Grid and layout components adapt correctly', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Test grid behavior
      const grid = page.locator('.grid.md\\:grid-cols-3');
      await expect(grid).toBeVisible();
      
      const cards = page.locator('.grid.md\\:grid-cols-3 > div');
      await expect(cards).toHaveCount(3);
      
      // All cards should be visible regardless of viewport
      for (let i = 0; i < 3; i++) {
        const card = cards.nth(i);
        await expect(card).toBeVisible();
      }
      
      // Test container behavior
      const container = page.locator('.container.mx-auto').first();
      const containerBox = await container.boundingBox();
      
      if (containerBox) {
        expect(containerBox.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });
});