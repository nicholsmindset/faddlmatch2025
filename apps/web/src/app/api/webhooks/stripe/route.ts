/**
 * 🎣 Stripe Webhook Handler
 * Secure webhook processing for subscription events
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripeServer } from '@/lib/stripe'
import { getStripeConfig } from '@/lib/env'
import {
  updateSubscriptionStatus,
  createSubscription,
  SubscriptionStatus
} from '@/lib/subscription'

/**
 * 🔐 Verify webhook signature
 */
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  try {
    const stripe = getStripeServer()
    return stripe.webhooks.constructEvent(body, signature, secret)
  } catch (error) {
    console.error('[WEBHOOK] Signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

/**
 * 🎯 Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const userId = subscription.metadata.userId
    const planId = subscription.metadata.planId
    const customerId = subscription.customer as string

    if (!userId || !planId) {
      throw new Error('Missing required metadata: userId or planId')
    }

    console.log(`[WEBHOOK] Processing subscription created for user ${userId}, plan ${planId}`)

    await createSubscription(
      userId,
      customerId,
      planId.toUpperCase() as any,
      subscription.id,
      subscription.items.data[0]?.price.id
    )

    // Update to active status
    await updateSubscriptionStatus(subscription.id, SubscriptionStatus.ACTIVE, {
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
    })

    console.log(`[WEBHOOK] Successfully created subscription for user ${userId}`)
  } catch (error) {
    console.error('[WEBHOOK] Error handling subscription created:', error)
    throw error
  }
}

/**
 * 🔄 Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const userId = subscription.metadata.userId
    console.log(`[WEBHOOK] Processing subscription updated for user ${userId}`)

    const status = mapStripeStatus(subscription.status)
    
    await updateSubscriptionStatus(subscription.id, status, {
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null
    })

    console.log(`[WEBHOOK] Successfully updated subscription ${subscription.id} to status ${status}`)
  } catch (error) {
    console.error('[WEBHOOK] Error handling subscription updated:', error)
    throw error
  }
}

/**
 * ❌ Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    const userId = subscription.metadata.userId
    console.log(`[WEBHOOK] Processing subscription deleted for user ${userId}`)

    await updateSubscriptionStatus(subscription.id, SubscriptionStatus.CANCELED, {
      canceledAt: new Date()
    })

    console.log(`[WEBHOOK] Successfully processed subscription deletion for user ${userId}`)
  } catch (error) {
    console.error('[WEBHOOK] Error handling subscription deleted:', error)
    throw error
  }
}

/**
 * 💰 Handle payment succeeded
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    if (!invoice.subscription) {
      return // Not a subscription payment
    }

    const subscriptionId = invoice.subscription as string
    console.log(`[WEBHOOK] Processing payment succeeded for subscription ${subscriptionId}`)

    // Ensure subscription is active
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.ACTIVE)

    console.log(`[WEBHOOK] Successfully processed payment for subscription ${subscriptionId}`)
  } catch (error) {
    console.error('[WEBHOOK] Error handling payment succeeded:', error)
    throw error
  }
}

/**
 * 💸 Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    if (!invoice.subscription) {
      return // Not a subscription payment
    }

    const subscriptionId = invoice.subscription as string
    console.log(`[WEBHOOK] Processing payment failed for subscription ${subscriptionId}`)

    // Mark subscription as past due
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.PAST_DUE)

    console.log(`[WEBHOOK] Successfully processed payment failure for subscription ${subscriptionId}`)
  } catch (error) {
    console.error('[WEBHOOK] Error handling payment failed:', error)
    throw error
  }
}

/**
 * ✅ Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const userId = session.metadata?.userId
    const planId = session.metadata?.planId

    if (!userId || !planId) {
      console.log('[WEBHOOK] Checkout session missing metadata, skipping')
      return
    }

    console.log(`[WEBHOOK] Processing checkout completed for user ${userId}, plan ${planId}`)

    if (session.subscription) {
      // Subscription checkout - will be handled by subscription.created webhook
      console.log(`[WEBHOOK] Subscription checkout completed, subscription: ${session.subscription}`)
    } else {
      // One-time payment (if needed for future features)
      console.log(`[WEBHOOK] One-time payment completed for user ${userId}`)
    }
  } catch (error) {
    console.error('[WEBHOOK] Error handling checkout completed:', error)
    throw error
  }
}

/**
 * 🔄 Map Stripe status to our subscription status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE
    case 'canceled':
      return SubscriptionStatus.CANCELED
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE_EXPIRED
    case 'past_due':
      return SubscriptionStatus.PAST_DUE
    case 'trialing':
      return SubscriptionStatus.TRIALING
    case 'unpaid':
      return SubscriptionStatus.UNPAID
    case 'paused':
      return SubscriptionStatus.PAUSED
    default:
      return SubscriptionStatus.INCOMPLETE
  }
}

/**
 * 📝 Main webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('[WEBHOOK] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const { webhookSecret } = getStripeConfig()
    const event = await verifyWebhookSignature(body, signature, webhookSecret)

    console.log(`[WEBHOOK] Processing event: ${event.type} (${event.id})`)

    // Process the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }

    console.log(`[WEBHOOK] Successfully processed event: ${event.type} (${event.id})`)
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
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

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}