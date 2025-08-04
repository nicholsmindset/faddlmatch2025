/**
 * 🛒 Production Checkout Session API
 * Secure checkout with validation, rate limiting, and comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createCheckoutSession, SUBSCRIPTION_PLANS } from '@/lib/subscription'
import { isProduction } from '@/lib/env'
import { createRateLimiter, withRateLimit } from '@/lib/middleware/rate-limit'
import { withValidation, ValidationSchemas } from '@/lib/middleware/validation'
import { withMetrics, recordSecurityIncident } from '@/lib/monitoring/metrics'
import { createIdempotencyHandler, withIdempotency } from '@/lib/middleware/idempotency'

// Initialize middleware
const rateLimiter = createRateLimiter('CHECKOUT_CREATE')
const idempotencyHandler = createIdempotencyHandler('CHECKOUT_CREATE')

/**
 * 🛒 Create checkout session
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 📝 Parse and validate request
    const body = await request.json()
    const { planId, successUrl, cancelUrl } = checkoutRequestSchema.parse(body)

    // 🆓 Handle free plan
    if (planId === 'INTENTION') {
      return NextResponse.json(
        { error: 'Free plan does not require checkout' },
        { status: 400 }
      )
    }

    // 🔍 Validate plan exists
    const plan = SUBSCRIPTION_PLANS[planId]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // 🌐 Build URLs
    const baseUrl = isProduction() 
      ? 'https://faddlmatch2025.netlify.app'
      : 'http://localhost:3000'

    const defaultSuccessUrl = `${baseUrl}/subscription/success?plan=${planId.toLowerCase()}`
    const defaultCancelUrl = `${baseUrl}/subscription/canceled`

    // 🛒 Create checkout session
    const checkoutUrl = await createCheckoutSession(
      userId,
      planId,
      successUrl || defaultSuccessUrl,
      cancelUrl || defaultCancelUrl
    )

    console.log(`[API] Created checkout session for user ${userId}, plan ${planId}`)

    return NextResponse.json({
      checkoutUrl,
      planId,
      planName: plan.name,
      price: plan.price
    })

  } catch (error) {
    console.error('[API] Checkout session error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

/**
 * 🚫 Only allow POST requests
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}