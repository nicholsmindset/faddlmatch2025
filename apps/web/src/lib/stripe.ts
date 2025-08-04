/**
 * 💳 Stripe Client Configuration
 * Secure Stripe integration for FADDL Match subscription system
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import StripeServer from 'stripe'
import { getStripeConfig } from './env'

/**
 * 🌐 Client-side Stripe instance (browser)
 */
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const { publishableKey } = getStripeConfig()
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

/**
 * 🔐 Server-side Stripe instance
 */
let stripeServerInstance: StripeServer | null = null

export const getStripeServer = (): StripeServer => {
  if (!stripeServerInstance) {
    const { secretKey } = getStripeConfig()
    stripeServerInstance = new StripeServer(secretKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  }
  return stripeServerInstance
}

/**
 * 📦 Subscription Product Configuration
 * Islamic matrimonial platform pricing packages
 */
export const SUBSCRIPTION_PLANS = {
  INTENTION: {
    id: 'intention',
    name: 'Intention',
    description: 'Perfect for starting your matrimonial journey',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '5 daily matches',
      'Basic messaging',
      'Standard filters',
      'Profile creation'
    ],
    stripePriceId: null, // Free plan - no Stripe price needed
    isPopular: false,
    isHalal: true
  },
  PATIENCE: {
    id: 'patience',
    name: 'Patience',
    description: 'Most popular choice for serious seekers',
    price: 29,
    currency: 'sgd',
    interval: 'month',
    features: [
      'Unlimited matches',
      'See who likes you',
      'Advanced filters',
      'Priority support',
      'Enhanced messaging'
    ],
    stripePriceId: process.env.STRIPE_PATIENCE_PRICE_ID || 'price_patience_monthly',
    isPopular: true,
    isHalal: true
  },
  RELIANCE: {
    id: 'reliance',
    name: 'Reliance',
    description: 'Premium experience for committed users',
    price: 59,
    currency: 'sgd',
    interval: 'month',
    features: [
      'Everything in Patience',
      'Video calls (Halal supervised)',
      'Profile boost',
      'Family scheduler',
      'Advisor chat',
      'Priority matching'
    ],
    stripePriceId: process.env.STRIPE_RELIANCE_PRICE_ID || 'price_reliance_monthly',
    isPopular: false,
    isHalal: true
  }
} as const

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[SubscriptionPlanId]

/**
 * 🎯 Get plan by ID
 */
export const getPlanById = (planId: string): SubscriptionPlan | null => {
  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as SubscriptionPlanId]
  return plan || null
}

/**
 * 💰 Format price for display
 */
export const formatPrice = (price: number, currency: string = 'sgd'): string => {
  if (price === 0) return 'Free'
  
  // Use Singapore locale for SGD, US locale for others
  const locale = currency.toLowerCase() === 'sgd' ? 'en-SG' : 'en-US'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * 🕌 Islamic compliance validation
 */
export const validateIslamicCompliance = (plan: SubscriptionPlan): boolean => {
  // All plans in FADDL Match are designed to be Halal-compliant
  return plan.isHalal && true
}

/**
 * 📊 Subscription status types
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
  PAUSED = 'paused'
}

/**
 * 👤 User subscription interface
 */
export interface UserSubscription {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  planId: SubscriptionPlanId
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  canceledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 🔄 Subscription events for webhooks
 */
export enum StripeEventType {
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed'
}