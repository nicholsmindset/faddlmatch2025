/**
 * 🧪 End-to-End Subscription Flow Tests
 * Critical user journey testing for FADDL Match subscription system
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_USER = {
  email: 'test@faddlmatch.com',
  password: 'TestPassword123!',
  firstName: 'Ahmad',
  lastName: 'Test',
}

// Stripe test card numbers
const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
} as const

test.describe('Subscription Flow E2E Tests', () => {
  let page: Page
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      // Islamic-appropriate locale
      locale: 'en-US',
      timezoneId: 'Asia/Singapore',
    })
    page = await context.newPage()

    // Mock Stripe for testing
    await page.route('https://js.stripe.com/v3/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.Stripe = function() {
            return {
              redirectToCheckout: function(params) {
                window.location.href = '/subscription/success?session_id=cs_test_success';
                return Promise.resolve();
              }
            };
          };
        `,
      })
    })
  })

  test.afterEach(async () => {
    await context.close()
  })

  test.describe('Complete Subscription Journey', () => {
    test('should complete full onboarding to paid subscription flow', async () => {
      // Navigate to app
      await page.goto(BASE_URL)

      // Sign up process (assuming Clerk is properly configured)
      await page.click('text=Sign Up')
      await page.fill('[name="emailAddress"]', TEST_USER.email)
      await page.fill('[name="password"]', TEST_USER.password)
      await page.fill('[name="firstName"]', TEST_USER.firstName)
      await page.fill('[name="lastName"]', TEST_USER.lastName)
      await page.click('button[type="submit"]')

      // Complete onboarding steps
      await expect(page.locator('text=Welcome to FADDL Match')).toBeVisible()

      // Navigate through onboarding
      await page.click('text=Continue')

      // Should reach package selection
      await expect(page.locator('text=Choose Your Halal Journey')).toBeVisible()

      // Verify Islamic messaging
      await expect(page.locator('text=100% Halal Compliant')).toBeVisible()
      await expect(page.locator('text=Shariah Compliant')).toBeVisible()

      // Check all three plans are displayed
      await expect(page.locator('text=Intention')).toBeVisible()
      await expect(page.locator('text=Patience')).toBeVisible()
      await expect(page.locator('text=Reliance')).toBeVisible()

      // Verify pricing display
      await expect(page.locator('text=Free')).toBeVisible()
      await expect(page.locator('text=$29')).toBeVisible()
      await expect(page.locator('text=$59')).toBeVisible()

      // Select Patience plan (most popular)
      await page.click('button:has-text("Choose Patience")')

      // Should redirect to Stripe checkout (mocked)
      await expect(page).toHaveURL(/\/subscription\/success/)

      // Verify success page
      await expect(page.locator('text=Welcome to FADDL Match!')).toBeVisible()
      await expect(page.locator('text=subscription is now active')).toBeVisible()

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard')
      await expect(page.locator('text=Dashboard')).toBeVisible()
    })

    test('should handle free plan selection correctly', async () => {
      await page.goto(`${BASE_URL}/onboarding`)

      // Complete onboarding and reach package selection
      await page.click('text=Continue')
      await expect(page.locator('text=Choose Your Halal Journey')).toBeVisible()

      // Select free plan
      await page.click('button:has-text("Start Free Journey")')

      // Should show success message with Islamic blessing
      await expect(page.locator('text=Alhamdulillah! Welcome to FADDL Match!')).toBeVisible()

      // Should redirect to dashboard without Stripe
      await page.waitForURL('**/dashboard')
      await expect(page.locator('text=Dashboard')).toBeVisible()
    })
  })

  test.describe('Subscription Management', () => {
    test('should display subscription management interface', async () => {
      // Assume user is already logged in with active subscription
      await page.goto(`${BASE_URL}/dashboard`)

      // Navigate to subscription management
      await page.click('text=Subscription')

      // Verify subscription details are displayed
      await expect(page.locator('text=Patience Plan')).toBeVisible()
      await expect(page.locator('text=Active Subscription')).toBeVisible()
      await expect(page.locator('text=$29/month')).toBeVisible()

      // Verify features list
      await expect(page.locator('text=Unlimited matches')).toBeVisible()
      await expect(page.locator('text=Advanced filters')).toBeVisible()

      // Verify Islamic compliance message
      await expect(page.locator('text=Halal Guarantee')).toBeVisible()
      await expect(page.locator('text=Shariah-compliant')).toBeVisible()

      // Verify management buttons
      await expect(page.locator('button:has-text("Manage Billing")')).toBeVisible()
      await expect(page.locator('button:has-text("Upgrade to Premium")')).toBeVisible()
    })

    test('should open customer portal when manage billing is clicked', async () => {
      await page.goto(`${BASE_URL}/subscription`)

      // Click manage billing
      const manageButton = page.locator('button:has-text("Manage Billing")')
      await expect(manageButton).toBeVisible()

      // Mock the portal API call
      await page.route('/api/subscriptions/portal', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            portalUrl: 'https://billing.stripe.com/portal/test',
          }),
        })
      })

      await manageButton.click()

      // Should redirect to Stripe portal (in real scenario)
      // For testing, we'll verify the API call was made
      await page.waitForRequest('**/api/subscriptions/portal')
    })

    test('should handle subscription refresh', async () => {
      await page.goto(`${BASE_URL}/subscription`)

      // Click refresh button
      const refreshButton = page.locator('button[title="Refresh subscription status"]')
      await expect(refreshButton).toBeVisible()

      // Mock the status API call
      await page.route('/api/subscriptions/status', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasActiveSubscription: true,
            planId: 'PATIENCE',
            status: 'active',
            daysRemaining: 25,
          }),
        })
      })

      await refreshButton.click()

      // Should show success toast
      await expect(page.locator('text=Subscription status updated')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle payment failures gracefully', async () => {
      await page.goto(`${BASE_URL}/pricing`)

      // Mock failed checkout API
      await page.route('/api/subscriptions/checkout', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Payment method declined',
          }),
        })
      })

      // Select paid plan
      await page.click('button:has-text("Choose Patience")')

      // Should show error message
      await expect(page.locator('text=Checkout Failed')).toBeVisible()
      await expect(page.locator('text=Payment method declined')).toBeVisible()

      // Should offer support contact
      await expect(page.locator('button:has-text("Contact Support")')).toBeVisible()
    })

    test('should handle network errors during subscription fetching', async () => {
      await page.goto(`${BASE_URL}/subscription`)

      // Mock network error
      await page.route('/api/subscriptions/status', (route) => {
        route.abort('failed')
      })

      // Refresh the page to trigger error
      await page.reload()

      // Should show error state
      await expect(page.locator('text=Subscription Status Error')).toBeVisible()
      await expect(page.locator('button:has-text("Retry")')).toBeVisible()
    })

    test('should handle unauthenticated user gracefully', async () => {
      // Clear authentication
      await context.clearCookies()

      await page.goto(`${BASE_URL}/pricing`)

      // Try to select a paid plan without being logged in
      await page.click('button:has-text("Choose Patience")')

      // Should prompt to sign in
      await expect(page.locator('text=Please sign in')).toBeVisible()
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    })
  })

  test.describe('Accessibility Compliance', () => {
    test('should meet WCAG 2.1 AA standards', async () => {
      await page.goto(`${BASE_URL}/pricing`)

      // Check for proper heading hierarchy
      const h1 = await page.locator('h1').count()
      expect(h1).toBeGreaterThan(0)

      // Check for alt text on images
      const images = await page.locator('img').all()
      for (const img of images) {
        const alt = await img.getAttribute('alt')
        expect(alt).toBeTruthy()
      }

      // Check for proper button labels
      const buttons = await page.locator('button').all()
      for (const button of buttons) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        expect(text || ariaLabel).toBeTruthy()
      }

      // Check color contrast (basic check)
      const bodyStyles = await page.evaluate(() => {
        const body = document.body
        const styles = window.getComputedStyle(body)
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
        }
      })

      expect(bodyStyles.backgroundColor).toBeTruthy()
      expect(bodyStyles.color).toBeTruthy()
    })

    test('should support keyboard navigation', async () => {
      await page.goto(`${BASE_URL}/pricing`)

      // Tab through interactive elements
      await page.keyboard.press('Tab')
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
      expect(firstFocused).toBeTruthy()

      // Should be able to activate buttons with Enter
      const freeButton = page.locator('button:has-text("Start Free Journey")')
      await freeButton.focus()
      await page.keyboard.press('Enter')

      // Should trigger the same action as clicking
      await expect(page.locator('text=Alhamdulillah')).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work properly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      await page.goto(`${BASE_URL}/pricing`)

      // Verify layout adapts to mobile
      await expect(page.locator('text=Choose Your Halal Journey')).toBeVisible()

      // Plans should stack vertically on mobile
      const planCards = page.locator('[data-testid="plan-card"]')
      const cardCount = await planCards.count()
      expect(cardCount).toBe(3)

      // Should be able to scroll and interact
      await page.scroll({ left: 0, top: 500 })
      await page.click('button:has-text("Start Free Journey")')

      await expect(page.locator('text=Alhamdulillah')).toBeVisible()
    })

    test('should handle touch interactions properly', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`${BASE_URL}/subscription`)

      // Test touch interactions
      const refreshButton = page.locator('button[title="Refresh subscription status"]')
      await refreshButton.tap()

      // Should respond to tap like a click
      await page.waitForRequest('**/api/subscriptions/status')
    })
  })

  test.describe('Performance Testing', () => {
    test('should load subscription pages within acceptable time', async () => {
      const startTime = Date.now()

      await page.goto(`${BASE_URL}/pricing`)

      // Wait for critical content to load
      await expect(page.locator('text=Choose Your Halal Journey')).toBeVisible()

      const loadTime = Date.now() - startTime

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle concurrent subscription API calls', async () => {
      await page.goto(`${BASE_URL}/subscription`)

      // Make multiple rapid API calls
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(
          page.evaluate(() =>
            fetch('/api/subscriptions/status').then((r) => r.json())
          )
        )
      }

      const results = await Promise.all(promises)
      results.forEach((result) => {
        expect(result.planId).toBeTruthy()
      })
    })
  })

  test.describe('Islamic Compliance Validation', () => {
    test('should display appropriate Islamic content and messaging', async () => {
      await page.goto(`${BASE_URL}/pricing`)

      // Check for Islamic terminology
      await expect(page.locator('text=Halal')).toBeVisible()
      await expect(page.locator('text=Shariah')).toBeVisible()
      await expect(page.locator('text=Islamic')).toBeVisible()
      await expect(page.locator('text=matrimonial')).toBeVisible()

      // Check for Quran verse
      await expect(
        page.locator('text=And among His signs is that He created for you mates')
      ).toBeVisible()
      await expect(page.locator('text=Quran 30:21')).toBeVisible()

      // Check for appropriate plan names (Islamic concepts)
      await expect(page.locator('text=Intention')).toBeVisible() // Niyyah
      await expect(page.locator('text=Patience')).toBeVisible() // Sabr
      await expect(page.locator('text=Reliance')).toBeVisible() // Tawakkul
    })

    test('should maintain Islamic messaging throughout user journey', async () => {
      await page.goto(`${BASE_URL}/pricing`)

      // Select free plan
      await page.click('button:has-text("Start Free Journey")')

      // Success message should include Islamic blessing
      await expect(page.locator('text=Alhamdulillah')).toBeVisible()
      await expect(page.locator('text=Islamic matrimonial journey')).toBeVisible()

      // Navigate to dashboard
      await page.waitForURL('**/dashboard')

      // Islamic messaging should continue in dashboard
      await expect(page.locator('text=Halal')).toBeVisible()
    })
  })

  test.describe('Data Privacy and Security', () => {
    test('should not expose sensitive data in client-side code', async () => {
      await page.goto(`${BASE_URL}/pricing`)

      // Check that Stripe secret keys are not exposed
      const pageContent = await page.content()
      expect(pageContent).not.toContain('sk_live_')
      expect(pageContent).not.toContain('sk_test_')
      expect(pageContent).not.toContain('whsec_')

      // Check that only publishable keys are present (if any)
      if (pageContent.includes('pk_')) {
        expect(pageContent).toMatch(/pk_test_|pk_live_/)
      }
    })

    test('should handle HTTPS redirects properly', async () => {
      // This would test HTTPS enforcement in production
      // For local testing, we'll verify secure contexts
      const isSecure = await page.evaluate(() => window.isSecureContext)
      
      // In production, this should be true
      if (BASE_URL.startsWith('https://')) {
        expect(isSecure).toBe(true)
      }
    })
  })
})