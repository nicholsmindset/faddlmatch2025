/**
 * ↩️ Subscription Reactivation API
 * Handle subscription reactivation requests for FADDL Match
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getStripeServer } from '@/lib/stripe'
import { getUserSubscription, updateSubscriptionStatus } from '@/lib/subscription'
import { SubscriptionStatus } from '@/lib/stripe'

/**
 * 📝 Request validation schema
 */
const reactivateRequestSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required')
})

/**
 * ↩️ Reactivate subscription
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
    const { subscriptionId } = reactivateRequestSchema.parse(body)

    // 🔍 Verify user owns this subscription
    const userSubscription = await getUserSubscription(userId)
    if (!userSubscription || userSubscription.stripeSubscriptionId !== subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription not found or not owned by user' },
        { status: 404 }
      )
    }

    // ✅ Check if subscription can be reactivated
    if (userSubscription.status !== SubscriptionStatus.CANCELED) {
      return NextResponse.json(
        { error: 'Only canceled subscriptions can be reactivated' },
        { status: 400 }
      )
    }

    // ⏰ Check if reactivation is still possible (before period end)
    const now = new Date()
    if (userSubscription.currentPeriodEnd < now) {
      return NextResponse.json(
        { 
          error: 'Subscription period has already ended. Please create a new subscription.',
          periodEnded: userSubscription.currentPeriodEnd.toISOString(),
          suggestNewSubscription: true
        },
        { status: 400 }
      )
    }

    // 💳 Reactivate subscription in Stripe
    const stripe = getStripeServer()
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
      metadata: {
        reactivatedBy: userId,
        reactivatedAt: new Date().toISOString(),
        originalCanceledAt: userSubscription.canceledAt?.toISOString() || 'unknown'
      }
    })

    // 📊 Update local database
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.ACTIVE, {
      canceledAt: null, // Clear cancellation date
      currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
    })

    console.log(`[API] Reactivated subscription ${subscriptionId} for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
      reactivatedAt: new Date().toISOString(),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      details: {
        status: 'active',
        nextBilling: new Date(updatedSubscription.current_period_end * 1000),
        autoRenewal: true,
        welcomeBack: true
      }
    })

  } catch (error) {
    console.error('[API] Subscription reactivation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Stripe errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any
      if (stripeError.type === 'StripeCardError') {
        return NextResponse.json(
          { error: 'Payment method error', details: stripeError.message },
          { status: 400 }
        )
      }
      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Invalid subscription', details: stripeError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
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