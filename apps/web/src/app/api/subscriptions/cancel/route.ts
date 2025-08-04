/**
 * ❌ Subscription Cancellation API
 * Handle subscription cancellation requests for FADDL Match
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
const cancelRequestSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  reason: z.string().optional(),
  feedback: z.string().optional()
})

/**
 * ❌ Cancel subscription
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
    const { subscriptionId, reason, feedback } = cancelRequestSchema.parse(body)

    // 🔍 Verify user owns this subscription
    const userSubscription = await getUserSubscription(userId)
    if (!userSubscription || userSubscription.stripeSubscriptionId !== subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription not found or not owned by user' },
        { status: 404 }
      )
    }

    // 🚫 Check if already canceled
    if (userSubscription.status === SubscriptionStatus.CANCELED) {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    // 💳 Cancel subscription in Stripe (at period end)
    const stripe = getStripeServer()
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        canceledBy: userId,
        cancelReason: reason || 'User requested',
        canceledAt: new Date().toISOString()
      }
    })

    // 📊 Update local database
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.CANCELED, {
      canceledAt: new Date(),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
    })

    console.log(`[API] Canceled subscription ${subscriptionId} for user ${userId}`)

    // 📧 Log feedback if provided
    if (feedback) {
      console.log(`[FEEDBACK] Cancellation feedback from ${userId}: ${feedback}`)
      // Here you could send to analytics service, save to database, etc.
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully',
      canceledAt: new Date().toISOString(),
      periodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      details: {
        accessUntil: new Date(updatedSubscription.current_period_end * 1000),
        refundEligible: false, // Typically no refunds for cancellations
        reactivationDeadline: new Date(updatedSubscription.current_period_end * 1000)
      }
    })

  } catch (error) {
    console.error('[API] Subscription cancellation error:', error)

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
      { error: 'Failed to cancel subscription' },
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