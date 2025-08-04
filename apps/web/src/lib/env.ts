/**
 * 🌍 Environment Configuration
 * Centralized environment variable management with validation
 */

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  
  // App Configuration
  APP_URL: string
  
  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  CLERK_WEBHOOK_SECRET: string
  
  // Supabase Database
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  
  // Optional Services
  OPENAI_API_KEY?: string
  
  // Stripe Payment Integration
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  
  // Security Settings
  RATE_LIMIT_ENABLED: boolean
  SESSION_MAX_AGE: number
  WEBHOOK_TIMESTAMP_TOLERANCE: number
}

/**
 * 🔧 Load and validate environment variables
 */
function loadEnvironment(): EnvironmentConfig {
  const env = process.env
  
  // 🚨 Critical validation for production
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  // Stripe variables are optional for now to prevent deployment issues
  const optionalVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]
  
  const missing = requiredVars.filter(key => !env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }
  
  // Log missing optional variables as warnings
  const missingOptional = optionalVars.filter(key => !env[key])
  if (missingOptional.length > 0) {
    console.warn(`[ENV] Missing optional Stripe variables: ${missingOptional.join(', ')}`)
    console.warn('[ENV] Stripe features will be disabled until these are configured')
  }
  
  return {
    NODE_ENV: (env.NODE_ENV as any) || 'development',
    
    // App Configuration
    APP_URL: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    
    // Clerk Authentication
    CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    CLERK_SECRET_KEY: env.CLERK_SECRET_KEY!,
    CLERK_WEBHOOK_SECRET: env.CLERK_WEBHOOK_SECRET!,
    
    // Supabase Database
    SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Optional Services
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    
    // Stripe Payment Integration (optional for now)
    STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY || 'sk_test_placeholder',  
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
    
    // Security Settings
    RATE_LIMIT_ENABLED: env.RATE_LIMIT_ENABLED !== 'false',
    SESSION_MAX_AGE: parseInt(env.SESSION_MAX_AGE || '86400000'), // 24 hours default
    WEBHOOK_TIMESTAMP_TOLERANCE: parseInt(env.WEBHOOK_TIMESTAMP_TOLERANCE || '300') // 5 minutes default
  }
}

/**
 * 🔐 Production security checks
 */
function validateProductionSecurity(config: EnvironmentConfig): void {
  if (config.NODE_ENV === 'production') {
    // 🚨 Production-specific validations
    if (config.APP_URL.includes('localhost')) {
      console.warn('[SECURITY] Production app URL should not use localhost')
    }
    
    if (!config.APP_URL.startsWith('https://')) {
      console.warn('[SECURITY] Production app should use HTTPS')
    }
    
    if (config.CLERK_SECRET_KEY.length < 32) {
      console.warn('[SECURITY] Clerk secret key appears to be too short')
    }
    
    if (config.CLERK_WEBHOOK_SECRET.length < 32) {
      console.warn('[SECURITY] Webhook secret appears to be too short')
    }
    
    // Log security configuration
    console.log('[SECURITY] Production security configuration loaded', {
      timestamp: new Date().toISOString(),
      appUrl: config.APP_URL,
      rateLimitEnabled: config.RATE_LIMIT_ENABLED,
      sessionMaxAge: config.SESSION_MAX_AGE,
      webhookTolerance: config.WEBHOOK_TIMESTAMP_TOLERANCE
    })
  }
}

// 🎯 Export singleton configuration
let _config: EnvironmentConfig | null = null

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!_config) {
    _config = loadEnvironment()
    validateProductionSecurity(_config)
  }
  return _config
}

// 🔍 Convenience exports
export const isProduction = () => getEnvironmentConfig().NODE_ENV === 'production'
export const isDevelopment = () => getEnvironmentConfig().NODE_ENV === 'development'
export const isTest = () => getEnvironmentConfig().NODE_ENV === 'test'

// 🛡️ Security helpers
export const getSecurityConfig = () => {
  const config = getEnvironmentConfig()
  return {
    rateLimitEnabled: config.RATE_LIMIT_ENABLED,
    sessionMaxAge: config.SESSION_MAX_AGE,
    webhookTimestampTolerance: config.WEBHOOK_TIMESTAMP_TOLERANCE,
    isProduction: isProduction()
  }
}

// 🔐 Auth helpers
export const getAuthConfig = () => {
  const config = getEnvironmentConfig()
  return {
    publishableKey: config.CLERK_PUBLISHABLE_KEY,
    secretKey: config.CLERK_SECRET_KEY,
    webhookSecret: config.CLERK_WEBHOOK_SECRET
  }
}

// 🗄️ Database helpers
export const getDatabaseConfig = () => {
  const config = getEnvironmentConfig()
  return {
    url: config.SUPABASE_URL,
    anonKey: config.SUPABASE_ANON_KEY,
    serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY
  }
}

// 💳 Stripe payment helpers
export const getStripeConfig = () => {
  const config = getEnvironmentConfig()
  return {
    publishableKey: config.STRIPE_PUBLISHABLE_KEY,
    secretKey: config.STRIPE_SECRET_KEY,
    webhookSecret: config.STRIPE_WEBHOOK_SECRET
  }
}