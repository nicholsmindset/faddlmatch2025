/**
 * 🎣 Production Stripe Webhook Handler
 * Bulletproof webhook processing with idempotency, monitoring, and error recovery
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
import { createRateLimiter, withRateLimit } from '@/lib/middleware/rate-limit'
import { createIdempotencyHandler, withIdempotency } from '@/lib/middleware/idempotency'
import { withMetrics, recordWebhookProcessed, recordSecurityIncident } from '@/lib/monitoring/metrics'
import { createAdminClient } from '@/lib/supabase/server'

// Initialize middleware
const rateLimiter = createRateLimiter('WEBHOOK')
const idempotencyHandler = createIdempotencyHandler('STRIPE_WEBHOOK')

/**
 * 🔐 Enhanced webhook signature verification with security monitoring
 */
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  const startTime = Date.now()
  
  try {
    const stripe = getStripeServer()
    const event = stripe.webhooks.constructEvent(body, signature, secret)
    
    console.log(`[WEBHOOK] Signature verified successfully (${Date.now() - startTime}ms)`, {
      eventId: event.id,
      eventType: event.type,
      created: new Date(event.created * 1000).toISOString()
    })
    
    return event
  } catch (error) {
    const verificationTime = Date.now() - startTime
    console.error(`[WEBHOOK] Signature verification failed (${verificationTime}ms):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      signatureLength: signature.length,
      bodyLength: body.length
    })
    
    // Record security incident
    recordSecurityIncident('webhook_sig')
    
    throw new Error('Invalid webhook signature')
  }
}

/**
 * 📝 Log webhook event to audit trail
 */
async function logWebhookEvent(
  event: Stripe.Event,
  success: boolean,
  error?: Error
): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    await supabase
      .from('subscription_events')
      .insert({
        user_id: event.data.object.metadata?.userId || null,
        subscription_id: null, // Will be updated by handlers if needed
        event_type: event.type,
        event_data: {
          id: event.id,
          created: event.created,
          data: event.data.object,
          success,
          error: error ? {
            message: error.message,
            stack: error.stack?.substring(0, 1000)
          } : null
        },
        stripe_event_id: event.id
      })
    
    console.log(`[WEBHOOK] Event logged to audit trail: ${event.id}`)
  } catch (logError) {
    console.error('[WEBHOOK] Failed to log event to audit trail:', logError)
    // Don't throw - logging failure shouldn't break webhook processing
  }
}

/**
 * 🎯 Handle subscription created with comprehensive error handling
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const startTime = Date.now()
  const userId = subscription.metadata.userId
  const planId = subscription.metadata.planId
  const customerId = subscription.customer as string

  try {
    // Validate required metadata
    if (!userId || !planId) {
      const error = new Error(`Missing required metadata - userId: ${!!userId}, planId: ${!!planId}`)
      console.error('[WEBHOOK] Subscription created validation failed:', {
        subscriptionId: subscription.id,
        customerId,
        metadata: subscription.metadata
      })
      throw error
    }

    console.log(`[WEBHOOK] Processing subscription created`, {
      userId,
      planId,
      subscriptionId: subscription.id,
      customerId,
      amount: subscription.items.data[0]?.price.unit_amount,
      currency: subscription.items.data[0]?.price.currency
    })

    // Create subscription with transaction safety
    await createSubscription(
      userId,
      customerId,
      planId.toUpperCase() as any,
      subscription.id,
      subscription.items.data[0]?.price.id
    )

    // Update to active status with period information
    await updateSubscriptionStatus(subscription.id, SubscriptionStatus.ACTIVE, {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    })

    // Record business metrics
    const amount = subscription.items.data[0]?.price.unit_amount || 0
    recordWebhookProcessed('customer.subscription.created', Date.now() - startTime, true)
    
    console.log(`[WEBHOOK] Successfully created subscription`, {
      userId,
      subscriptionId: subscription.id,
      processingTime: Date.now() - startTime
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[WEBHOOK] Error handling subscription created:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      subscriptionId: subscription.id,
      processingTime
    })
    
    recordWebhookProcessed('customer.subscription.created', processingTime, false)
    throw error
  }
}

/**
 * 🔄 Handle subscription updated with status change tracking
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const startTime = Date.now()
  const userId = subscription.metadata.userId
  const previousStatus = subscription.metadata.previousStatus
  const newStatus = mapStripeStatus(subscription.status)

  try {
    console.log(`[WEBHOOK] Processing subscription updated`, {
      userId,
      subscriptionId: subscription.id,
      statusChange: `${previousStatus || 'unknown'} → ${newStatus}`,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    })

    // Update subscription with comprehensive metadata
    await updateSubscriptionStatus(subscription.id, newStatus, {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
    })

    // Log significant status changes
    if (previousStatus && previousStatus !== newStatus) {
      console.log(`[WEBHOOK] Subscription status changed`, {
        subscriptionId: subscription.id,
        userId,
        from: previousStatus,
        to: newStatus,
        reason: subscription.cancel_at_period_end ? 'user_cancellation' : 'stripe_update'
      })
    }

    recordWebhookProcessed('customer.subscription.updated', Date.now() - startTime, true)
    
    console.log(`[WEBHOOK] Successfully updated subscription ${subscription.id} to status ${newStatus}`)
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[WEBHOOK] Error handling subscription updated:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      subscriptionId: subscription.id,
      processingTime
    })
    
    recordWebhookProcessed('customer.subscription.updated', processingTime, false)
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
 * 💰 Handle payment succeeded with revenue tracking
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const startTime = Date.now()
  
  try {
    if (!invoice.subscription) {
      console.log('[WEBHOOK] Payment succeeded for non-subscription invoice, skipping')
      return
    }

    const subscriptionId = invoice.subscription as string
    const amountPaid = invoice.amount_paid || 0
    const currency = invoice.currency
    
    console.log(`[WEBHOOK] Processing payment succeeded`, {
      subscriptionId,
      invoiceId: invoice.id,
      amountPaid,
      currency,
      paymentIntent: invoice.payment_intent
    })

    // Ensure subscription is active
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.ACTIVE)

    // Log payment to audit trail
    try {
      const supabase = createAdminClient()
      await supabase
        .from('payment_history')
        .insert({
          user_id: invoice.customer_email ? `email:${invoice.customer_email}` : null,
          stripe_payment_intent_id: invoice.payment_intent as string || null,
          stripe_invoice_id: invoice.id,
          amount_paid: amountPaid,
          currency,
          payment_status: 'succeeded',
          payment_method: 'stripe',
          description: `Subscription payment - ${invoice.description || 'Monthly billing'}`,
          metadata: {
            subscriptionId,
            invoiceNumber: invoice.number,
            webhookProcessed: true
          }
        })
    } catch (logError) {
      console.error('[WEBHOOK] Failed to log payment to history:', logError)
    }

    recordWebhookProcessed('invoice.payment_succeeded', Date.now() - startTime, true)
    
    console.log(`[WEBHOOK] Successfully processed payment for subscription ${subscriptionId}`)
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[WEBHOOK] Error handling payment succeeded:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      invoiceId: invoice.id,
      processingTime
    })
    
    recordWebhookProcessed('invoice.payment_succeeded', processingTime, false)
    throw error
  }
}

/**
 * 💸 Handle payment failed with retry logic monitoring
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const startTime = Date.now()
  
  try {
    if (!invoice.subscription) {
      console.log('[WEBHOOK] Payment failed for non-subscription invoice, skipping')
      return
    }

    const subscriptionId = invoice.subscription as string
    const attemptCount = invoice.attempt_count || 1
    const nextPaymentAttempt = invoice.next_payment_attempt
    
    console.log(`[WEBHOOK] Processing payment failed`, {
      subscriptionId,
      invoiceId: invoice.id,
      attemptCount,
      nextPaymentAttempt: nextPaymentAttempt ? new Date(nextPaymentAttempt * 1000).toISOString() : null,
      lastFinalizationError: invoice.last_finalization_error?.message
    })

    // Mark subscription as past due
    await updateSubscriptionStatus(subscriptionId, SubscriptionStatus.PAST_DUE)

    // Log failed payment to audit trail
    try {
      const supabase = createAdminClient()
      await supabase
        .from('payment_history')
        .insert({
          user_id: invoice.customer_email ? `email:${invoice.customer_email}` : null,
          stripe_invoice_id: invoice.id,
          amount_paid: invoice.amount_due || 0,
          currency: invoice.currency,
          payment_status: 'failed',
          payment_method: 'stripe',
          description: `Failed subscription payment - Attempt ${attemptCount}`,
          metadata: {
            subscriptionId,
            attemptCount,
            failureReason: invoice.last_finalization_error?.message || 'Unknown',
            nextRetry: nextPaymentAttempt ? new Date(nextPaymentAttempt * 1000).toISOString() : null
          }
        })
    } catch (logError) {
      console.error('[WEBHOOK] Failed to log payment failure:', logError)
    }

    // Alert on multiple failures
    if (attemptCount >= 3) {
      console.error(`[WEBHOOK] CRITICAL: Multiple payment failures for subscription ${subscriptionId}`, {
        attemptCount,
        subscriptionId,
        invoiceId: invoice.id
      })
    }

    recordWebhookProcessed('invoice.payment_failed', Date.now() - startTime, true)
    
    console.log(`[WEBHOOK] Successfully processed payment failure for subscription ${subscriptionId}`)
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[WEBHOOK] Error handling payment failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      invoiceId: invoice.id,
      processingTime
    })
    
    recordWebhookProcessed('invoice.payment_failed', processingTime, false)
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
 * 📝 Production webhook handler with comprehensive middleware
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[WEBHOOK] ${requestId} - Incoming webhook request`)
  
  return withRateLimit(request, rateLimiter, async () => {
    return withMetrics('/api/webhooks/stripe', 'POST', async () => {
      return withIdempotency(
        request,
        idempotencyHandler,
        async () => {
          let event: Stripe.Event | null = null
          
          try {
            // Parse request
            const body = await request.text()
            const headersList = await headers()
            const signature = headersList.get('stripe-signature')

            // Validate signature header
            if (!signature) {
              console.error(`[WEBHOOK] ${requestId} - Missing stripe-signature header`)
              recordSecurityIncident('validation')
              return {
                response: { error: 'Missing stripe-signature header' },
                statusCode: 400
              }
            }

            // Verify webhook signature
            const { webhookSecret } = getStripeConfig()
            event = await verifyWebhookSignature(body, signature, webhookSecret)

            console.log(`[WEBHOOK] ${requestId} - Processing event: ${event.type} (${event.id})`)

            // Process the event with error handling
            let processingError: Error | null = null
            try {
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
                  console.log(`[WEBHOOK] ${requestId} - Unhandled event type: ${event.type}`)
              }
            } catch (handlerError) {
              processingError = handlerError as Error
              throw handlerError
            } finally {
              // Always log the event to audit trail
              await logWebhookEvent(event, !processingError, processingError || undefined)
            }

            const processingTime = Date.now() - startTime
            console.log(`[WEBHOOK] ${requestId} - Successfully processed event: ${event.type} (${event.id}) in ${processingTime}ms`)
            
            return {
              response: { 
                received: true, 
                eventId: event.id, 
                eventType: event.type,
                processingTime
              },
              statusCode: 200
            }

          } catch (error) {
            const processingTime = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error'
            
            console.error(`[WEBHOOK] ${requestId} - Error processing webhook:`, {
              error: errorMessage,
              eventId: event?.id,
              eventType: event?.type,
              processingTime,
              stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
            })
            
            // Log failed webhook event if we have the event
            if (event) {
              await logWebhookEvent(event, false, error as Error)
            }
            
            // Return appropriate error response
            const isSignatureError = errorMessage.includes('signature')
            const statusCode = isSignatureError ? 400 : 500
            
            return {
              response: { 
                error: 'Webhook processing failed',
                details: isSignatureError ? 'Invalid signature' : 'Internal processing error',
                requestId,
                processingTime
              },
              statusCode
            }
          }
        }
      )
    })
  })
  .then(result => {
    return NextResponse.json(result.response, { 
      status: result.statusCode,
      headers: {
        'X-Request-ID': requestId,
        'X-Processing-Time': (Date.now() - startTime).toString()
      }
    })
  })
  .catch(error => {
    const processingTime = Date.now() - startTime
    console.error(`[WEBHOOK] ${requestId} - Middleware error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    })
    
    // Handle rate limiting errors
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: error.headers?.['Retry-After'] || '60',
          requestId
        },
        { 
          status: 429,
          headers: error.headers || {}
        }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        requestId,
        processingTime
      },
      { status: 500 }
    )
  })
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