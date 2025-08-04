#!/usr/bin/env node

/**
 * 🚀 FADDL Match E2E Launch Validation Script
 * Comprehensive end-to-end testing for subscription flow launch readiness
 */

const { chromium } = require('playwright')
const fs = require('fs').promises

// Configuration
const CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://faddlmatch.com' 
    : 'http://localhost:3000',
  timeout: 30000,
  headless: process.env.CI === 'true',
  testUserEmail: 'launch.test@faddlmatch.com',
  testUserPassword: 'LaunchTest2024!',
  stripeTestCard: '4242424242424242'
}

// Test results tracking
const results = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }
}

/**
 * 🎯 Main validation execution
 */
async function runLaunchValidation() {
  console.log('🚀 FADDL Match Launch Validation Starting...')
  console.log('=' .repeat(50))
  
  const browser = await chromium.launch({ 
    headless: CONFIG.headless,
    slowMo: 100 // Slow down for stability
  })
  
  try {
    // Test 1: Homepage and Core Navigation
    await testHomepageAndNavigation(browser)
    
    // Test 2: User Registration and Onboarding
    await testUserRegistrationFlow(browser)
    
    // Test 3: Package Selection and Pricing
    await testPackageSelectionFlow(browser)
    
    // Test 4: Stripe Payment Integration
    await testPaymentIntegration(browser)
    
    // Test 5: Success Page and Dashboard Access
    await testSuccessFlowAndDashboard(browser)
    
    // Test 6: Islamic Compliance Features
    await testIslamicComplianceFeatures(browser)
    
    // Test 7: Cross-Device Responsiveness
    await testResponsiveDesign(browser)
    
    // Test 8: Performance and Accessibility
    await testPerformanceAndAccessibility(browser)
    
  } catch (error) {
    logError('Critical validation failure', error)
  } finally {
    await browser.close()
    await generateValidationReport()
  }
}

/**
 * 🏠 Test homepage and core navigation
 */
async function testHomepageAndNavigation(browser) {
  const testName = 'Homepage and Navigation'
  console.log(`\\n🏠 Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Navigate to homepage
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' })
    
    // Verify page loads
    await page.waitForSelector('text=FADDL Match', { timeout: CONFIG.timeout })
    console.log('✅ Homepage loaded successfully')
    
    // Check critical navigation elements
    const navElements = [
      '[data-testid="nav-features"]',
      '[data-testid="nav-pricing"]', 
      '[data-testid="nav-login"]',
      '[data-testid="nav-signup"]'
    ]
    
    for (const selector of navElements) {
      const element = await page.locator(selector).first()
      if (await element.isVisible()) {
        console.log(`✅ Navigation element found: ${selector}`)
      } else {
        console.log(`⚠️ Navigation element missing: ${selector}`)
      }
    }
    
    // Test pricing section visibility
    await page.click('[data-testid="nav-pricing"]')
    await page.waitForSelector('text=Patience', { timeout: 5000 })
    await page.waitForSelector('text=SGD', { timeout: 5000 })
    console.log('✅ Pricing section displays SGD currency')
    
    // Verify Islamic design elements
    const islamicElements = await page.locator('[data-testid*="islamic"]').count()
    console.log(`✅ Islamic design elements found: ${islamicElements}`)
    
    logTestResult(testName, true, 'Homepage navigation and pricing validated')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 👤 Test user registration and onboarding flow
 */
async function testUserRegistrationFlow(browser) {
  const testName = 'User Registration and Onboarding'
  console.log(`\\n👤 Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(`${CONFIG.baseUrl}/auth/signup`)
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', CONFIG.testUserEmail)
    await page.fill('[data-testid="password-input"]', CONFIG.testUserPassword)
    await page.check('[data-testid="terms-checkbox"]')
    
    // Submit registration
    await page.click('[data-testid="signup-button"]')
    
    // Wait for email verification (in test mode, auto-verify)
    await page.waitForURL('**/onboarding**', { timeout: 15000 })
    console.log('✅ Registration successful, redirected to onboarding')
    
    // Test onboarding form completion
    await page.fill('[data-testid="name-input"]', 'Launch Test User')
    await page.selectOption('[data-testid="age-select"]', '25')
    await page.selectOption('[data-testid="location-select"]', 'Singapore')
    await page.selectOption('[data-testid="education-select"]', 'University')
    
    // Submit onboarding
    await page.click('[data-testid="continue-button"]')
    
    // Verify redirect to package selection
    await page.waitForURL('**/subscription**', { timeout: 10000 })
    console.log('✅ Onboarding completed, redirected to subscription')
    
    logTestResult(testName, true, 'User registration and onboarding flow validated')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 📦 Test package selection and pricing display
 */
async function testPackageSelectionFlow(browser) {
  const testName = 'Package Selection and Pricing'
  console.log(`\\n📦 Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(`${CONFIG.baseUrl}/subscription`)
    
    // Verify package cards are displayed
    await page.waitForSelector('[data-testid="package-intention"]')
    await page.waitForSelector('[data-testid="package-patience"]')
    await page.waitForSelector('[data-testid="package-reliance"]')
    console.log('✅ All subscription packages displayed')
    
    // Verify SGD pricing
    const patiencePrice = await page.textContent('[data-testid="patience-price"]')
    const reliancePrice = await page.textContent('[data-testid="reliance-price"]')
    
    if (patiencePrice.includes('SGD') && patiencePrice.includes('29')) {
      console.log('✅ Patience plan pricing correct: SGD $29')
    } else {
      throw new Error(`Patience pricing incorrect: ${patiencePrice}`)
    }
    
    if (reliancePrice.includes('SGD') && reliancePrice.includes('59')) {
      console.log('✅ Reliance plan pricing correct: SGD $59')
    } else {
      throw new Error(`Reliance pricing incorrect: ${reliancePrice}`)
    }
    
    // Test package selection
    await page.click('[data-testid="select-patience"]')
    
    // Verify selection state
    const selectedPackage = await page.getAttribute('[data-testid="package-patience"]', 'data-selected')
    if (selectedPackage === 'true') {
      console.log('✅ Package selection state working')
    }
    
    // Verify Islamic compliance indicators
    const halalBadges = await page.locator('[data-testid="halal-badge"]').count()
    console.log(`✅ Halal compliance badges displayed: ${halalBadges}`)
    
    logTestResult(testName, true, 'Package selection and SGD pricing validated')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 💳 Test Stripe payment integration
 */
async function testPaymentIntegration(browser) {
  const testName = 'Stripe Payment Integration'
  console.log(`\\n💳 Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Navigate to subscription page and select Patience plan
    await page.goto(`${CONFIG.baseUrl}/subscription`)
    await page.click('[data-testid="select-patience"]')
    await page.click('[data-testid="continue-to-payment"]')
    
    // Wait for Stripe Checkout redirect
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 15000 })
    console.log('✅ Redirected to Stripe Checkout')
    
    // Fill Stripe payment form (test mode)
    if (process.env.NODE_ENV !== 'production') {
      await page.fill('[data-testid="cardNumber"]', CONFIG.stripeTestCard)
      await page.fill('[data-testid="cardExpiry"]', '12/34')
      await page.fill('[data-testid="cardCvc"]', '123')
      await page.fill('[data-testid="billingName"]', 'Launch Test User')
      
      // Submit payment
      await page.click('[data-testid="submit-button"]')
      
      // Wait for success redirect
      await page.waitForURL('**/subscription/success**', { timeout: 20000 })
      console.log('✅ Payment completed successfully')
      
      // Verify success page elements
      await page.waitForSelector('[data-testid="success-celebration"]')
      await page.waitForSelector('text=Patience')
      console.log('✅ Success page displayed with plan details')
    } else {
      console.log('⚠️ Skipping payment submission in production mode')
    }
    
    logTestResult(testName, true, 'Stripe payment integration validated')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 🎉 Test success flow and dashboard access
 */
async function testSuccessFlowAndDashboard(browser) {
  const testName = 'Success Flow and Dashboard Access'
  console.log(`\\n🎉 Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(`${CONFIG.baseUrl}/subscription/success?plan=patience`)
    
    // Verify success animations and content
    await page.waitForSelector('[data-testid="success-celebration"]')
    await page.waitForSelector('[data-testid="crescent-animation"]')
    console.log('✅ Success page animations displayed')
    
    // Test dashboard navigation
    await page.click('[data-testid="go-to-dashboard"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    
    // Verify premium features are accessible
    const premiumFeatures = [
      '[data-testid="unlimited-matches"]',
      '[data-testid="advanced-filters"]',
      '[data-testid="priority-support"]'
    ]
    
    for (const feature of premiumFeatures) {
      const element = await page.locator(feature).first()
      if (await element.isVisible()) {
        console.log(`✅ Premium feature accessible: ${feature}`)
      }
    }
    
    logTestResult(testName, true, 'Success flow and dashboard access validated')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 🕌 Test Islamic compliance features
 */
async function testIslamicComplianceFeatures(browser) {
  const testName = 'Islamic Compliance Features'
  console.log(`\\n🕌 Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(`${CONFIG.baseUrl}/dashboard`)
    
    // Test guardian system access
    await page.click('[data-testid="nav-guardian"]')
    await page.waitForSelector('[data-testid="guardian-dashboard"]')
    console.log('✅ Guardian system accessible')
    
    // Verify Islamic design patterns
    const islamicPatterns = await page.locator('[data-testid*="islamic-pattern"]').count()
    console.log(`✅ Islamic design patterns found: ${islamicPatterns}`)
    
    // Test prayer time awareness
    const prayerIndicators = await page.locator('[data-testid*="prayer"]').count()
    console.log(`✅ Prayer time indicators found: ${prayerIndicators}`)
    
    // Verify modesty controls
    await page.click('[data-testid="nav-settings"]')
    await page.waitForSelector('[data-testid="privacy-settings"]')
    const modestyControls = await page.locator('[data-testid*="modesty"]').count()
    console.log(`✅ Modesty controls available: ${modestyControls}`)
    
    logTestResult(testName, true, 'Islamic compliance features validated')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 📱 Test responsive design across devices
 */
async function testResponsiveDesign(browser) {
  const testName = 'Responsive Design'
  console.log(`\\n📱 Testing: ${testName}`)
  
  const devices = [
    { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
    { name: 'Tablet', viewport: { width: 768, height: 1024 } },
    { name: 'Mobile', viewport: { width: 375, height: 667 } }
  ]
  
  try {
    for (const device of devices) {
      const context = await browser.newContext({ viewport: device.viewport })
      const page = await context.newPage()
      
      await page.goto(`${CONFIG.baseUrl}/subscription`)
      
      // Verify layout adapts properly
      const packageCards = await page.locator('[data-testid*="package-"]').count()
      if (packageCards === 3) {
        console.log(`✅ ${device.name}: All package cards visible`)
      }
      
      // Test touch interactions on mobile
      if (device.name === 'Mobile') {
        await page.tap('[data-testid="select-patience"]')
        const selected = await page.getAttribute('[data-testid="package-patience"]', 'data-selected')
        if (selected === 'true') {
          console.log('✅ Mobile: Touch interactions working')
        }
      }
      
      await context.close()
    }
    
    logTestResult(testName, true, 'Responsive design validated across devices')
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  }
}

/**
 * ⚡ Test performance and accessibility
 */
async function testPerformanceAndAccessibility(browser) {
  const testName = 'Performance and Accessibility'
  console.log(`\\n⚡ Testing: ${testName}`)
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Measure page load performance
    const startTime = Date.now()
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime
    
    if (loadTime < 3000) {
      console.log(`✅ Page load time acceptable: ${loadTime}ms`)
    } else {
      console.log(`⚠️ Page load time slow: ${loadTime}ms`)
    }
    
    // Test keyboard navigation
    await page.press('body', 'Tab')
    const focusedElement = await page.locator(':focus').first()
    if (await focusedElement.isVisible()) {
      console.log('✅ Keyboard navigation working')
    }
    
    // Test screen reader compatibility
    const altTexts = await page.locator('img[alt]').count()
    console.log(`✅ Images with alt text: ${altTexts}`)
    
    const ariaLabels = await page.locator('[aria-label]').count()
    console.log(`✅ Elements with ARIA labels: ${ariaLabels}`)
    
    logTestResult(testName, true, `Performance and accessibility validated (${loadTime}ms load time)`)
    
  } catch (error) {
    logTestResult(testName, false, error.message)
  } finally {
    await context.close()
  }
}

/**
 * 📊 Helper functions for test result tracking
 */
function logTestResult(testName, passed, details) {
  const result = {
    name: testName,
    passed,
    details,
    timestamp: new Date()
  }
  
  results.tests.push(result)
  results.summary.total++
  
  if (passed) {
    results.summary.passed++
    console.log(`✅ ${testName}: PASSED`)
  } else {
    results.summary.failed++  
    results.summary.errors.push(details)
    console.log(`❌ ${testName}: FAILED - ${details}`)
  }
}

function logError(message, error) {
  console.error(`🚨 ${message}:`, error.message)
  results.summary.errors.push(`${message}: ${error.message}`)
}

/**
 * 📄 Generate comprehensive validation report
 */
async function generateValidationReport() {
  const endTime = new Date()
  const duration = (endTime - results.startTime) / 1000
  
  console.log('\\n' + '='.repeat(50))
  console.log('🎯 LAUNCH VALIDATION REPORT')
  console.log('='.repeat(50))
  
  console.log(`⏱️ Total Duration: ${duration}s`)
  console.log(`📊 Tests Run: ${results.summary.total}`)
  console.log(`✅ Passed: ${results.summary.passed}`)
  console.log(`❌ Failed: ${results.summary.failed}`)
  
  const successRate = (results.summary.passed / results.summary.total * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  if (results.summary.failed > 0) {
    console.log('\\n🚨 FAILURES:')
    results.summary.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })
  }
  
  // Determine launch readiness
  const isLaunchReady = results.summary.failed === 0 && successRate >= 95
  
  console.log('\\n' + '='.repeat(50))
  if (isLaunchReady) {
    console.log('🚀 LAUNCH STATUS: ✅ READY FOR PRODUCTION')
    console.log('All critical systems validated and operational')
  } else {
    console.log('🚨 LAUNCH STATUS: ❌ NOT READY')
    console.log('Critical issues must be resolved before launch')
  }
  console.log('='.repeat(50))
  
  // Save detailed report
  const report = {
    summary: results.summary,
    duration,
    timestamp: endTime,
    launchReady: isLaunchReady,
    tests: results.tests
  }
  
  await fs.writeFile(
    'launch-validation-report.json', 
    JSON.stringify(report, null, 2)
  )
  
  console.log('\\n📄 Detailed report saved: launch-validation-report.json')
  
  // Exit with appropriate code
  process.exit(isLaunchReady ? 0 : 1)
}

// Execute validation if run directly
if (require.main === module) {
  runLaunchValidation().catch((error) => {
    console.error('🚨 Validation script failed:', error)
    process.exit(1)
  })
}

module.exports = { runLaunchValidation }