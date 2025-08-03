/**
 * 📊 Subscription Status API
 * Get current subscription status and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserSubscription, getSubscriptionAnalytics } from '@/lib/subscription'

/**
 * 📊 Get subscription status
 */
export async function GET(request: NextRequest) {
  try {
    // 🔐 Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 📊 Get subscription analytics
    const analytics = await getSubscriptionAnalytics(userId)
    const subscription = await getUserSubscription(userId)

    console.log(`[API] Retrieved subscription status for user ${userId}`)

    return NextResponse.json({
      ...analytics,
      subscription: subscription ? {
        id: subscription.id,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        canceledAt: subscription.canceledAt
      } : null
    })

  } catch (error) {
    console.error('[API] Subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}

/**
 * 🚫 Only allow GET requests
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}