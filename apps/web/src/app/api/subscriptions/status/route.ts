/**
 * 📊 Subscription Status API
 * Get current subscription status and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserSubscription, getSubscriptionAnalytics } from '@/lib/subscription'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'

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
    
    // 📦 Add plan details for frontend
    const planDetails = SUBSCRIPTION_PLANS[analytics.planId]
    
    const enhancedAnalytics = {
      ...analytics,
      planDetails: {
        name: planDetails?.name || 'Unknown',
        price: planDetails?.price || 0,
        currency: planDetails?.currency || 'sgd',
        features: planDetails?.features || [],
        description: planDetails?.description || ''
      },
      billing: {
        nextBilling: analytics.currentPeriodEnd,
        autoRenewal: !analytics.canceledAt,
        daysUntilRenewal: analytics.daysRemaining
      },
      usage: {
        // This would be populated from actual usage tracking
        dailyMatches: analytics.planId === 'INTENTION' ? 5 : 'unlimited',
        messagesLeft: analytics.planId === 'INTENTION' ? 50 : 'unlimited',
        profileBoosts: analytics.planId === 'RELIANCE' ? 4 : 0
      },
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
    }

    console.log(`[API] Retrieved subscription status for user ${userId}: ${analytics.planId} (${analytics.status})`)

    return NextResponse.json(enhancedAnalytics)

  } catch (error) {
    console.error('[API] Subscription status error:', error)
    
    // Return default free plan status on error
    return NextResponse.json({
      hasActiveSubscription: false,
      planId: 'INTENTION',
      status: 'active',
      daysRemaining: 0,
      features: SUBSCRIPTION_PLANS.INTENTION.features,
      planDetails: {
        name: 'Intention',
        price: 0,
        currency: 'sgd',
        features: SUBSCRIPTION_PLANS.INTENTION.features,
        description: 'Perfect for starting your matrimonial journey'
      },
      billing: {
        nextBilling: null,
        autoRenewal: false,
        daysUntilRenewal: 0
      },
      usage: {
        dailyMatches: 5,
        messagesLeft: 50,
        profileBoosts: 0
      },
      subscription: null,
      error: 'Could not fetch subscription details, showing free plan'
    })
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