#!/usr/bin/env node

/**
 * 🔍 FADDL Match Production Environment Validator
 * Validates all environment variables and configurations for production deployment
 */

const requiredEnvVars = {
  // Production Configuration
  'NODE_ENV': {
    required: true,
    expectedValue: 'production',
    description: 'Must be set to production'
  },
  'NEXT_PUBLIC_APP_URL': {
    required: true,
    expectedValue: 'https://faddlmatch.com',
    description: 'Production app URL'
  },

  // Clerk Authentication
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': {
    required: true,
    pattern: /^pk_live_/,
    description: 'Clerk publishable key (must start with pk_live_)'
  },
  'CLERK_SECRET_KEY': {
    required: true,
    pattern: /^sk_live_/,
    description: 'Clerk secret key (must start with sk_live_)'
  },
  'CLERK_WEBHOOK_SECRET': {
    required: true,
    pattern: /^whsec_/,
    description: 'Clerk webhook secret (must start with whsec_)'
  },
  'NEXT_PUBLIC_CLERK_DOMAIN': {
    required: true,
    expectedValue: 'clerk.faddlmatch.com',
    description: 'Clerk custom domain'
  },
  'CLERK_ACCOUNT_PORTAL_URL': {
    required: true,
    expectedValue: 'https://accounts.faddlmatch.com',
    description: 'Clerk account portal URL'
  },

  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': {
    required: true,
    pattern: /^https:\/\/.*\.supabase\.co$/,
    description: 'Supabase project URL'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    required: true,
    pattern: /^eyJ/,
    description: 'Supabase anonymous key (JWT)'
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    required: true,
    pattern: /^eyJ/,
    description: 'Supabase service role key (JWT)'
  },

  // Stripe
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
    required: true,
    pattern: /^pk_live_/,
    description: 'Stripe publishable key (must start with pk_live_)'
  },
  'STRIPE_SECRET_KEY': {
    required: true,
    pattern: /^sk_live_/,
    description: 'Stripe secret key (must start with sk_live_)'
  },
  'STRIPE_WEBHOOK_SECRET': {
    required: true,
    pattern: /^whsec_/,
    description: 'Stripe webhook secret (must start with whsec_)'
  },
  'STRIPE_PATIENCE_PRICE_ID': {
    required: true,
    pattern: /^price_/,
    description: 'Stripe price ID for Patience plan'
  },
  'STRIPE_RELIANCE_PRICE_ID': {
    required: true,
    pattern: /^price_/,
    description: 'Stripe price ID for Reliance plan'
  },

  // OpenAI (Optional)
  'OPENAI_API_KEY': {
    required: false,
    pattern: /^sk-/,
    description: 'OpenAI API key for AI features (optional)'
  },

  // Security Configuration
  'RATE_LIMIT_ENABLED': {
    required: true,
    expectedValue: 'true',
    description: 'Rate limiting must be enabled'
  },
  'SESSION_MAX_AGE': {
    required: true,
    pattern: /^\d+$/,
    description: 'Session max age in milliseconds'
  },
  'WEBHOOK_TIMESTAMP_TOLERANCE': {
    required: true,
    pattern: /^\d+$/,
    description: 'Webhook timestamp tolerance in seconds'
  }
}

function validateEnvironment() {
  console.log('🔍 FADDL Match Production Environment Validation')
  console.log('================================================')
  console.log('')

  let isValid = true
  const warnings = []
  const errors = []

  // Check each required environment variable
  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key]
    
    if (!value) {
      if (config.required) {
        errors.push(`❌ Missing required variable: ${key}`)
        errors.push(`   Description: ${config.description}`)
        isValid = false
      } else {
        warnings.push(`⚠️  Optional variable missing: ${key}`)
        warnings.push(`   Description: ${config.description}`)
      }
      return
    }

    // Check expected value
    if (config.expectedValue && value !== config.expectedValue) {
      errors.push(`❌ Invalid value for ${key}`)
      errors.push(`   Expected: ${config.expectedValue}`)
      errors.push(`   Got: ${value}`)
      isValid = false
      return
    }

    // Check pattern
    if (config.pattern && !config.pattern.test(value)) {
      errors.push(`❌ Invalid format for ${key}`)
      errors.push(`   Description: ${config.description}`)
      errors.push(`   Pattern: ${config.pattern}`)
      isValid = false
      return
    }

    console.log(`✅ ${key}: Valid`)
  })

  console.log('')

  // Display warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:')
    warnings.forEach(warning => console.log(warning))
    console.log('')
  }

  // Display errors
  if (errors.length > 0) {
    console.log('❌ Errors:')
    errors.forEach(error => console.log(error))
    console.log('')
  }

  // Additional security checks
  console.log('🔒 Security Validation:')
  
  // Check key lengths
  const clerkSecret = process.env.CLERK_SECRET_KEY
  if (clerkSecret && clerkSecret.length < 40) {
    errors.push('❌ CLERK_SECRET_KEY appears too short (security risk)')
    isValid = false
  } else if (clerkSecret) {
    console.log('✅ Clerk secret key length: Adequate')
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (stripeSecret && stripeSecret.length < 40) {
    errors.push('❌ STRIPE_SECRET_KEY appears too short (security risk)')
    isValid = false
  } else if (stripeSecret) {
    console.log('✅ Stripe secret key length: Adequate')
  }

  console.log('')

  // Final result
  if (isValid) {
    console.log('🎉 Environment validation PASSED!')
    console.log('✅ All required variables are present and valid')
    console.log('🚀 Your application is ready for production deployment')
    process.exit(0)
  } else {
    console.log('💥 Environment validation FAILED!')
    console.log('❌ Please fix the errors above before deploying to production')
    console.log('')
    console.log('📖 Refer to PRODUCTION_LAUNCH_GUIDE.md for setup instructions')
    process.exit(1)
  }
}

// Load environment variables from .env files if running locally
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config()
    console.log('📁 Loaded local .env file for validation')
  } catch (e) {
    console.log('ℹ️  No .env file found (this is expected in production)')
  }
}

validateEnvironment()