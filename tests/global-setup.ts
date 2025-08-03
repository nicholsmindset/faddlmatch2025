/**
 * Global setup for authentication security testing
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up authentication security test environment...')
  
  // Validate environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'CLERK_WEBHOOK_SECRET'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`)
    console.warn('Some tests may fail or be skipped')
  }
  
  // Set test-specific environment variables
  process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
  process.env.NODE_ENV = 'test'
  
  // Create test browser for setup tasks
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Health check
    console.log('🏥 Performing health check...')
    const response = await page.request.get(`${process.env.TEST_BASE_URL}/api/health`)
    
    if (response.status() !== 200) {
      console.warn(`⚠️ Health check failed with status ${response.status()}`)
    } else {
      console.log('✅ Application is healthy')
    }
    
    // Pre-warm the application
    console.log('🔥 Pre-warming application...')
    await page.goto(process.env.TEST_BASE_URL)
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

export default globalSetup