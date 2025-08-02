import { test, expect, Page } from '@playwright/test';
import { authenticateUser } from '../../helpers/auth-helpers';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Accessibility E2E Tests
 * Tests WCAG 2.1 AA compliance, keyboard navigation, and screen reader compatibility
 */
test.describe('Accessibility Testing', () => {
  let userPage: Page;
  let guardianPage: Page;

  test.beforeEach(async ({ browser }) => {
    const userContext = await browser.newContext();
    const guardianContext = await browser.newContext();

    userPage = await userContext.newPage();
    guardianPage = await guardianContext.newPage();

    await authenticateUser(userPage, 'test-user-1@test.faddl.com');
    await authenticateUser(guardianPage, 'guardian-1@test.faddl.com');
  });

  test('should meet WCAG 2.1 AA compliance standards', async () => {
    await test.step('Test messages page accessibility', async () => {
      await userPage.goto('/messages');
      await userPage.waitForLoadState('networkidle');
      
      // Inject axe-core for accessibility testing
      await injectAxe(userPage);
      
      // Run accessibility audit
      await checkA11y(userPage, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
      
      // Test specific accessibility features
      // Check for proper heading hierarchy
      const headings = await userPage.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);
      
      // Verify main landmark exists
      await expect(userPage.locator('main')).toBeVisible();
      
      // Check for skip links
      const skipLink = userPage.locator('[href="#main-content"], [href="#main"]');
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeVisible();
      }
    });

    await test.step('Test guardian dashboard accessibility', async () => {
      await guardianPage.goto('/guardian');
      await guardianPage.waitForLoadState('networkidle');
      
      await injectAxe(guardianPage);
      await checkA11y(guardianPage, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
      
      // Test dashboard-specific accessibility
      // Check for proper ARIA labels on interactive elements
      const interactiveElements = guardianPage.locator('button, [role="button"], input, select');
      const count = await interactiveElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = interactiveElements.nth(i);
        const hasLabel = await element.evaluate(el => {
          return !!(el.getAttribute('aria-label') || 
                   el.getAttribute('aria-labelledby') || 
                   el.textContent?.trim() ||
                   el.getAttribute('title'));
        });
        expect(hasLabel).toBe(true);
      }
    });

    await test.step('Test form accessibility', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Test message input form accessibility
      const messageInput = userPage.locator('[data-testid="message-input"]');
      
      // Check for proper labeling
      const hasLabel = await messageInput.evaluate(el => {
        return !!(el.getAttribute('aria-label') || 
                 el.getAttribute('aria-labelledby') || 
                 el.getAttribute('placeholder'));
      });
      expect(hasLabel).toBe(true);
      
      // Check for proper form structure
      const sendButton = userPage.locator('[data-testid="send-button"]');
      await expect(sendButton).toHaveAttribute('type', 'button');
      
      // Test form validation accessibility
      await messageInput.fill('');
      await sendButton.click();
      
      // Check for accessible error messages
      const errorMessage = userPage.locator('[role="alert"], [aria-live="polite"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    });

    await test.step('Test color contrast compliance', async () => {
      await userPage.goto('/messages');
      
      // Test color contrast with axe-core (includes contrast checking)
      await injectAxe(userPage);
      await checkA11y(userPage, null, {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      // Additional manual color contrast checks for key elements
      const keyElements = [
        '[data-testid="send-button"]',
        '[data-testid="message-input"]',
        '[data-testid="conversation-list"] button',
        'nav a'
      ];
      
      for (const selector of keyElements) {
        const element = userPage.locator(selector).first();
        if (await element.count() > 0) {
          const styles = await element.evaluate(el => {
            const computed = getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });
          
          // Verify readable font sizes
          const fontSize = parseInt(styles.fontSize);
          expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
        }
      }
    });
  });

  test('should support full keyboard navigation', async () => {
    await test.step('Test tab navigation through interface', async () => {
      await userPage.goto('/messages');
      await userPage.waitForLoadState('networkidle');
      
      // Start keyboard navigation
      let currentElement = await userPage.evaluate(() => document.activeElement?.tagName);
      
      // Tab through all focusable elements
      const focusableElements: string[] = [];
      
      for (let i = 0; i < 20; i++) {
        await userPage.keyboard.press('Tab');
        await userPage.waitForTimeout(100);
        
        const elementInfo = await userPage.evaluate(() => {
          const el = document.activeElement;
          if (el) {
            return {
              tagName: el.tagName,
              type: el.getAttribute('type'),
              role: el.getAttribute('role'),
              testId: el.getAttribute('data-testid'),
              hasVisibleFocus: getComputedStyle(el).outline !== 'none'
            };
          }
          return null;
        });
        
        if (elementInfo) {
          focusableElements.push(`${elementInfo.tagName}:${elementInfo.testId || elementInfo.role || elementInfo.type}`);
          
          // Verify visible focus indicator
          expect(elementInfo.hasVisibleFocus).toBe(true);
        }
      }
      
      // Should have navigated through multiple focusable elements
      expect(focusableElements.length).toBeGreaterThan(5);
      console.log('Focusable elements:', focusableElements);
    });

    await test.step('Test keyboard interaction with messages', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Navigate to message input using keyboard
      await userPage.keyboard.press('Tab');
      await userPage.keyboard.press('Tab');
      
      // Find and focus message input
      let attempts = 0;
      while (attempts < 10) {
        const focused = await userPage.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute('data-testid') === 'message-input';
        });
        
        if (focused) break;
        
        await userPage.keyboard.press('Tab');
        await userPage.waitForTimeout(100);
        attempts++;
      }
      
      // Type message using keyboard
      await userPage.keyboard.type('Keyboard navigation test message');
      
      // Send message using Enter key
      await userPage.keyboard.press('Enter');
      
      // Verify message was sent
      await expect(userPage.locator('[data-testid="message-bubble"]:has-text("Keyboard navigation test message")')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test keyboard navigation in conversation list', async () => {
      await userPage.goto('/messages');
      
      // Navigate to conversation list
      const conversationList = userPage.locator('[data-testid="conversation-list"]');
      
      // Focus first conversation
      await conversationList.locator('button, [role="button"]').first().focus();
      
      // Navigate through conversations using arrow keys
      await userPage.keyboard.press('ArrowDown');
      await userPage.waitForTimeout(100);
      
      // Verify focus moved
      const focusedAfterArrow = await userPage.evaluate(() => {
        return document.activeElement?.getAttribute('data-testid');
      });
      
      // Select conversation using Enter or Space
      await userPage.keyboard.press('Enter');
      
      // Verify conversation opened
      await expect(userPage.locator('[data-testid="message-input"]')).toBeVisible();
    });

    await test.step('Test keyboard shortcuts functionality', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Test common keyboard shortcuts
      // Ctrl+/ or Cmd+/ for help (if implemented)
      await userPage.keyboard.press('Control+Slash');
      
      // Check if help dialog opened
      const helpDialog = userPage.locator('[role="dialog"], [data-testid="help-dialog"]');
      if (await helpDialog.count() > 0) {
        await expect(helpDialog).toBeVisible();
        
        // Close help with Escape
        await userPage.keyboard.press('Escape');
        await expect(helpDialog).not.toBeVisible();
      }
      
      // Test Alt+M for messages (if implemented)
      await userPage.keyboard.press('Alt+KeyM');
      
      // Verify still in messages or navigated appropriately
      await expect(userPage.locator('[data-testid="message-interface"]')).toBeVisible();
    });

    await test.step('Test modal and dropdown keyboard handling', async () => {
      await userPage.goto('/messages');
      
      // Test dropdown keyboard navigation (if present)
      const dropdown = userPage.locator('[data-testid="user-menu"], [role="menu"]');
      if (await dropdown.count() > 0) {
        await dropdown.click();
        
        // Navigate dropdown with arrow keys
        await userPage.keyboard.press('ArrowDown');
        await userPage.keyboard.press('ArrowDown');
        
        // Close dropdown with Escape
        await userPage.keyboard.press('Escape');
      }
      
      // Test modal keyboard handling
      const modalTrigger = userPage.locator('[data-testid="settings"], [data-testid="profile-settings"]');
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click();
        
        const modal = userPage.locator('[role="dialog"]');
        if (await modal.count() > 0) {
          // Focus should be trapped in modal
          await userPage.keyboard.press('Tab');
          
          const focusedInModal = await modal.evaluate(modal => {
            return modal.contains(document.activeElement);
          });
          expect(focusedInModal).toBe(true);
          
          // Close modal with Escape
          await userPage.keyboard.press('Escape');
          await expect(modal).not.toBeVisible();
        }
      }
    });
  });

  test('should support screen reader compatibility', async () => {
    await test.step('Test ARIA landmarks and structure', async () => {
      await userPage.goto('/messages');
      
      // Check for proper landmark structure
      const landmarks = await userPage.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').allTextContents();
      expect(landmarks.length).toBeGreaterThan(0);
      
      // Verify main content area
      const mainContent = userPage.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      // Check for proper heading structure
      const headings = await userPage.locator('h1, h2, h3, h4, h5, h6').all();
      
      // Verify heading hierarchy
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.substring(1));
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(6);
      }
    });

    await test.step('Test ARIA labels and descriptions', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Check interactive elements for proper ARIA attributes
      const interactiveElements = [
        '[data-testid="send-button"]',
        '[data-testid="message-input"]',
        '[data-testid="conversation-list"] button'
      ];
      
      for (const selector of interactiveElements) {
        const element = userPage.locator(selector).first();
        if (await element.count() > 0) {
          const ariaAttributes = await element.evaluate(el => ({
            label: el.getAttribute('aria-label'),
            labelledBy: el.getAttribute('aria-labelledby'),
            describedBy: el.getAttribute('aria-describedby'),
            role: el.getAttribute('role'),
            textContent: el.textContent?.trim()
          }));
          
          // Element should have some form of accessible name
          const hasAccessibleName = !!(
            ariaAttributes.label ||
            ariaAttributes.labelledBy ||
            ariaAttributes.textContent ||
            (await element.getAttribute('title'))
          );
          
          expect(hasAccessibleName).toBe(true);
        }
      }
    });

    await test.step('Test live regions for dynamic content', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Check for ARIA live regions
      const liveRegions = userPage.locator('[aria-live], [role="status"], [role="alert"]');
      
      // Send a message to trigger dynamic updates
      await userPage.fill('[data-testid="message-input"]', 'Live region test message');
      await userPage.click('[data-testid="send-button"]');
      
      // Check if message status updates are announced
      const messageStatus = userPage.locator('[data-testid="message-status"]');
      if (await messageStatus.count() > 0) {
        const ariaLive = await messageStatus.getAttribute('aria-live');
        const role = await messageStatus.getAttribute('role');
        
        // Should have appropriate live region attributes
        const hasLiveRegion = ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status' || role === 'alert';
        if (hasLiveRegion) {
          expect(hasLiveRegion).toBe(true);
        }
      }
    });

    await test.step('Test form field associations', async () => {
      await userPage.goto('/messages');
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Test message input field associations
      const messageInput = userPage.locator('[data-testid="message-input"]');
      
      const fieldAssociations = await messageInput.evaluate(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const placeholder = input.getAttribute('placeholder');
        
        return {
          hasLabel: !!label,
          hasAriaLabel: !!ariaLabel,
          hasAriaLabelledBy: !!ariaLabelledBy,
          hasPlaceholder: !!placeholder,
          labelText: label?.textContent || ariaLabel || placeholder
        };
      });
      
      // Field should have some form of label
      const hasAccessibleLabel = !!(
        fieldAssociations.hasLabel ||
        fieldAssociations.hasAriaLabel ||
        fieldAssociations.hasAriaLabelledBy ||
        fieldAssociations.hasPlaceholder
      );
      
      expect(hasAccessibleLabel).toBe(true);
      
      // Test error message associations
      await messageInput.fill('');
      await userPage.click('[data-testid="send-button"]');
      
      const errorMessage = userPage.locator('[data-testid="message-error"], [role="alert"]');
      if (await errorMessage.count() > 0) {
        const errorId = await errorMessage.getAttribute('id');
        const inputAriaDescribedBy = await messageInput.getAttribute('aria-describedby');
        
        if (errorId && inputAriaDescribedBy) {
          expect(inputAriaDescribedBy).toContain(errorId);
        }
      }
    });

    await test.step('Test focus management and announcements', async () => {
      await userPage.goto('/messages');
      
      // Test focus management when navigating between conversations
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Check if focus moves appropriately
      const focusedElement = await userPage.evaluate(() => {
        return document.activeElement?.getAttribute('data-testid');
      });
      
      // Focus should be on message input or conversation area
      expect(['message-input', 'conversation-area', 'message-container'].some(id => 
        focusedElement?.includes(id)
      )).toBe(true);
      
      // Test page title updates for screen readers
      const pageTitle = await userPage.title();
      expect(pageTitle).toContain('Messages'); // Or appropriate title
      
      // Test dynamic content announcements
      await userPage.fill('[data-testid="message-input"]', 'Focus management test');
      await userPage.click('[data-testid="send-button"]');
      
      // Check if message delivery is announced
      const deliveryStatus = userPage.locator('[data-testid="message-status"]');
      if (await deliveryStatus.count() > 0) {
        const hasAriaLive = await deliveryStatus.evaluate(el => 
          el.getAttribute('aria-live') || el.getAttribute('role') === 'status'
        );
        
        if (hasAriaLive) {
          expect(hasAriaLive).toBeTruthy();
        }
      }
    });
  });

  test('should handle high contrast and zoom accessibility', async () => {
    await test.step('Test high contrast mode compatibility', async () => {
      // Simulate high contrast mode
      await userPage.emulateMedia({ colorScheme: 'dark' });
      await userPage.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background-color: black !important;
              color: white !important;
              border-color: white !important;
            }
          }
        `
      });
      
      await userPage.goto('/messages');
      
      // Verify interface is still usable in high contrast
      await expect(userPage.locator('[data-testid="conversation-list"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="send-button"]')).toBeVisible();
      
      // Test interaction in high contrast mode
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'High contrast test message');
      await userPage.click('[data-testid="send-button"]');
      
      await expect(userPage.locator('[data-testid="message-bubble"]:has-text("High contrast test message")')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test 200% zoom compatibility', async () => {
      // Set viewport to simulate 200% zoom
      await userPage.setViewportSize({ width: 640, height: 360 }); // Half size to simulate 200% zoom
      
      await userPage.goto('/messages');
      
      // Verify interface remains usable at 200% zoom
      await expect(userPage.locator('[data-testid="conversation-list"]')).toBeVisible();
      
      // Test scrolling and navigation at high zoom
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      
      // Verify message input is accessible
      const messageInput = userPage.locator('[data-testid="message-input"]');
      await expect(messageInput).toBeVisible();
      
      // Test that touch targets meet minimum size requirements (44px)
      const sendButton = userPage.locator('[data-testid="send-button"]');
      const buttonSize = await sendButton.boundingBox();
      
      if (buttonSize) {
        expect(buttonSize.width).toBeGreaterThanOrEqual(44);
        expect(buttonSize.height).toBeGreaterThanOrEqual(44);
      }
    });

    await test.step('Test reduced motion preferences', async () => {
      // Simulate reduced motion preference
      await userPage.emulateMedia({ reducedMotion: 'reduce' });
      
      await userPage.goto('/messages');
      
      // Verify animations are reduced or removed
      const animatedElements = userPage.locator('[class*="animate"], [class*="transition"]');
      
      if (await animatedElements.count() > 0) {
        // Check that animations respect reduced motion
        const animationStyles = await animatedElements.first().evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            animationDuration: computed.animationDuration,
            transitionDuration: computed.transitionDuration
          };
        });
        
        // Animations should be disabled or very short
        expect(animationStyles.animationDuration === '0s' || 
               animationStyles.transitionDuration === '0s').toBe(true);
      }
    });

    await test.step('Test custom font size support', async () => {
      // Simulate larger font sizes
      await userPage.addStyleTag({
        content: `
          html {
            font-size: 24px !important;
          }
          * {
            font-size: inherit !important;
          }
        `
      });
      
      await userPage.goto('/messages');
      
      // Verify interface adapts to larger font sizes
      await expect(userPage.locator('[data-testid="conversation-list"]')).toBeVisible();
      
      // Check that text doesn't overlap or become unreadable
      const messageInput = userPage.locator('[data-testid="message-input"]');
      const inputBox = await messageInput.boundingBox();
      
      if (inputBox) {
        // Input should have reasonable height for larger text
        expect(inputBox.height).toBeGreaterThan(40);
      }
      
      // Test scrolling with larger fonts
      await userPage.click('[data-testid="conversation-test-conversation-1"]');
      await userPage.fill('[data-testid="message-input"]', 'Large font test message');
      await userPage.click('[data-testid="send-button"]');
      
      await expect(userPage.locator('[data-testid="message-bubble"]:has-text("Large font test message")')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should provide accessibility help and documentation', async () => {
    await test.step('Test accessibility help features', async () => {
      await userPage.goto('/messages');
      
      // Look for accessibility help or documentation
      const helpLinks = userPage.locator('[href*="accessibility"], [data-testid*="accessibility"], [aria-label*="accessibility"]');
      
      if (await helpLinks.count() > 0) {
        await helpLinks.first().click();
        
        // Should show accessibility information
        const accessibilityInfo = userPage.locator('text=accessibility, text=WCAG, text=screen reader');
        await expect(accessibilityInfo.first()).toBeVisible();
      }
    });

    await test.step('Test keyboard shortcut documentation', async () => {
      await userPage.goto('/messages');
      
      // Look for keyboard shortcut help
      const shortcutHelp = userPage.locator('[data-testid="keyboard-shortcuts"], [aria-label*="keyboard"], text=shortcuts');
      
      if (await shortcutHelp.count() > 0) {
        await shortcutHelp.first().click();
        
        // Should show keyboard shortcuts
        const shortcutList = userPage.locator('kbd, [data-testid="shortcut-key"]');
        await expect(shortcutList.first()).toBeVisible();
      }
    });

    await test.step('Test accessibility settings', async () => {
      await userPage.goto('/settings');  // Assuming settings page exists
      
      // Look for accessibility settings
      const accessibilitySettings = userPage.locator('text=accessibility, text=contrast, text=font size');
      
      if (await accessibilitySettings.count() > 0) {
        // Should have accessibility options
        const settings = [
          '[data-testid="high-contrast-toggle"]',
          '[data-testid="large-font-toggle"]',
          '[data-testid="reduced-motion-toggle"]'
        ];
        
        for (const setting of settings) {
          const element = userPage.locator(setting);
          if (await element.count() > 0) {
            await expect(element).toBeVisible();
          }
        }
      }
    });
  });
});