/**
 * 🎯 Subscription Management Service
 * Secure subscription handling for FADDL Match Islamic matrimonial platform
 */

import { createClient } from './supabase/client'
import { createAdminClient } from './supabase/server'
import { getStripeServer } from './stripe'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
  getPlanById
} from './stripe'
import type {
  SubscriptionPlanId,
  UserSubscription
} from './stripe'

/**
 * 📊 Database subscription interface
 */
export interface DatabaseSubscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  canceled_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 🔄 Convert database subscription to app format
 */
function mapDatabaseSubscription(dbSub: DatabaseSubscription): UserSubscription {
  return {
    id: dbSub.id,
    userId: dbSub.user_id,
    stripeCustomerId: dbSub.stripe_customer_id,
    stripeSubscriptionId: dbSub.stripe_subscription_id,
    stripePriceId: dbSub.stripe_price_id,
    planId: dbSub.plan_id.toUpperCase() as SubscriptionPlanId,
    status: dbSub.status as SubscriptionStatus,
    currentPeriodStart: new Date(dbSub.current_period_start),
    currentPeriodEnd: new Date(dbSub.current_period_end),
    canceledAt: dbSub.canceled_at ? new Date(dbSub.canceled_at) : null,
    createdAt: new Date(dbSub.created_at),
    updatedAt: new Date(dbSub.updated_at)
  }
}

/**
 * 👤 Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // TODO: Implement proper database integration
    // For now, return null to indicate free plan
    console.log(`[SUBSCRIPTION] Getting subscription for user ${userId} - returning free plan`)
    return null
  } catch (error) {
    console.error('[SUBSCRIPTION] Error fetching user subscription:', error)
    return null // Return null instead of throwing to prevent 500 errors
  }
}

/**
 * 🆕 Create new subscription record
 */
export async function createSubscription(
  userId: string,
  stripeCustomerId: string,
  planId: SubscriptionPlanId,
  stripeSubscriptionId?: string,
  stripePriceId?: string
): Promise<UserSubscription> {
  try {
    const supabase = createAdminClient()
    const plan = getPlanById(planId)
    
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`)
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month from now

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId || null,
      stripe_price_id: stripePriceId || plan.stripePriceId,
      plan_id: planId.toLowerCase(),
      status: planId === 'INTENTION' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.INCOMPLETE,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      canceled_at: null
    }

    const { data, error } = await (supabase as any)
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDatabaseSubscription(data)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error creating subscription:', error)
    throw new Error('Failed to create subscription')
  }
}

/**
 * 🔄 Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
  metadata?: {
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
    canceledAt?: Date | null
  }
): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (metadata?.currentPeriodStart) {
      updateData.current_period_start = metadata.currentPeriodStart.toISOString()
    }

    if (metadata?.currentPeriodEnd) {
      updateData.current_period_end = metadata.currentPeriodEnd.toISOString()
    }

    if (metadata?.canceledAt !== undefined) {
      updateData.canceled_at = metadata.canceledAt ? metadata.canceledAt.toISOString() : null
    }

    const { error } = await (supabase as any)
      .from('user_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      throw error
    }

    console.log(`[SUBSCRIPTION] Updated subscription ${subscriptionId} to status: ${status}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error updating subscription:', error)
    throw new Error('Failed to update subscription')
  }
}

/**
 * 💳 Create Stripe customer
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  try {
    const stripe = getStripeServer()
    
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
        platform: 'faddl-match',
        createdAt: new Date().toISOString()
      }
    })

    console.log(`[STRIPE] Created customer ${customer.id} for user ${userId}`)
    return customer.id
  } catch (error) {
    console.error('[STRIPE] Error creating customer:', error)
    throw new Error('Failed to create Stripe customer')
  }
}

/**
 * 🛒 Create checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  planId: SubscriptionPlanId,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const stripe = getStripeServer()
    const plan = getPlanById(planId)
    
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`)
    }

    if (!plan.stripePriceId) {
      throw new Error(`No Stripe price ID configured for plan: ${planId}`)
    }

    console.log(`[STRIPE] Creating checkout session for user ${userId}, plan ${planId}`)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: undefined, // Let Stripe collect email
      metadata: {
        userId,
        planId,
        platform: 'faddl-match',
        createdAt: new Date().toISOString()
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
          platform: 'faddl-match'
        }
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${planId.toLowerCase()}`,
      cancel_url: `${cancelUrl}?canceled=true&plan=${planId.toLowerCase()}`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'always',
    })

    if (!session.url) {
      throw new Error('Failed to create checkout session URL')
    }

    console.log(`[STRIPE] Created checkout session ${session.id} for user ${userId}`)
    return session.url
  } catch (error) {
    console.error('[STRIPE] Error creating checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}

/**
 * 🔄 Create customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const stripe = getStripeServer()
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    })

    return session.url
  } catch (error) {
    console.error('[STRIPE] Error creating portal session:', error)
    throw new Error('Failed to create customer portal session')
  }
}

/**
 * ❌ Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    const stripe = getStripeServer()
    
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    // Update local database
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.CANCELED, {
      canceledAt: new Date()
    })

    console.log(`[SUBSCRIPTION] Canceled subscription ${subscriptionId}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error canceling subscription:', error)
    throw new Error('Failed to cancel subscription')
  }
}

/**
 * ↩️ Reactivate subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<void> {
  try {
    const stripe = getStripeServer()
    
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })

    // Update local database
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.ACTIVE, {
      canceledAt: null
    })

    console.log(`[SUBSCRIPTION] Reactivated subscription ${subscriptionId}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error reactivating subscription:', error)
    throw new Error('Failed to reactivate subscription')
  }
}

/**
 * 📊 Get subscription analytics for user
 */
export async function getSubscriptionAnalytics(userId: string) {
  try {
    const subscription = await getUserSubscription(userId)
    
    if (!subscription) {
      return {
        hasActiveSubscription: false,
        planId: 'INTENTION' as SubscriptionPlanId,
        status: SubscriptionStatus.ACTIVE,
        daysRemaining: 0,
        features: SUBSCRIPTION_PLANS.INTENTION.features
      }
    }

    const plan = getPlanById(subscription.planId)
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ))

    return {
      hasActiveSubscription: subscription.status === SubscriptionStatus.ACTIVE,
      planId: subscription.planId,
      status: subscription.status,
      daysRemaining,
      features: plan?.features || [],
      currentPeriodEnd: subscription.currentPeriodEnd,
      canceledAt: subscription.canceledAt
    }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting analytics:', error)
    throw new Error('Failed to get subscription analytics')
  }
}

/**
 * Re-export essential Stripe types and constants
 */
export { SUBSCRIPTION_PLANS, SubscriptionStatus, getPlanById } from './stripe'
export type { SubscriptionPlanId, SubscriptionPlan, UserSubscription } from './stripe'