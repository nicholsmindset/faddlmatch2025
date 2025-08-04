/**
 * 🏛️ Customer Portal API
 * Create Stripe customer portal sessions for subscription management
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createPortalSession, getUserSubscription } from '@/lib/subscription'
import { isProduction } from '@/lib/env'

/**
 * 📝 Request validation schema
 */
const portalRequestSchema = z.object({
  returnUrl: z.string().url().optional()
})

/**
 * 🏛️ Create customer portal session
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

    // 📝 Parse and validate request (handle empty body)
    let returnUrl: string | undefined
    try {
      const body = await request.json()
      const parsed = portalRequestSchema.parse(body)
      returnUrl = parsed.returnUrl
    } catch (err) {
      // Handle empty body - just use default return URL
      returnUrl = undefined
    }

    // 🔍 Get user's subscription
    const subscription = await getUserSubscription(userId)
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // 🌐 Build return URL
    const baseUrl = isProduction() 
      ? 'https://faddlmatch2025.netlify.app'
      : 'http://localhost:3000'

    const defaultReturnUrl = `${baseUrl}/subscription`

    // 🏛️ Create portal session
    const portalUrl = await createPortalSession(
      subscription.stripeCustomerId,
      returnUrl || defaultReturnUrl
    )

    console.log(`[API] Created portal session for user ${userId}`)

    return NextResponse.json({
      url: portalUrl,
      portalUrl, // Keep both for compatibility
      customerId: subscription.stripeCustomerId,
      success: true
    })

  } catch (error) {
    console.error('[API] Portal session error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
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