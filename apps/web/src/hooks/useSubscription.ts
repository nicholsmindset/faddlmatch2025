/**
 * 🎯 Subscription Management Hook
 * React hook for managing user subscriptions and billing
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { SubscriptionPlanId, SubscriptionStatus } from '@/lib/stripe'

interface SubscriptionData {
  hasActiveSubscription: boolean
  planId: SubscriptionPlanId
  status: SubscriptionStatus
  daysRemaining: number
  features: string[]
  currentPeriodEnd: Date | null
  canceledAt: Date | null
  subscription: {
    id: string
    stripeCustomerId: string
    stripeSubscriptionId: string | null
    status: string
  } | null
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createCheckoutSession: (planId: SubscriptionPlanId) => Promise<void>
  openCustomerPortal: () => Promise<void>
  hasAccess: (feature: string) => boolean
  isFeatureEnabled: (feature: string) => boolean
}

/**
 * 🎯 Feature access mapping by plan
 */
const PLAN_FEATURES = {
  INTENTION: [
    'basic_matches',
    'basic_messaging',
    'standard_filters',
    'profile_creation'
  ],
  PATIENCE: [
    'basic_matches',
    'basic_messaging', 
    'standard_filters',
    'profile_creation',
    'unlimited_matches',
    'see_who_likes_you',
    'advanced_filters',
    'priority_support',
    'enhanced_messaging'
  ],
  RELIANCE: [
    'basic_matches',
    'basic_messaging',
    'standard_filters', 
    'profile_creation',
    'unlimited_matches',
    'see_who_likes_you',
    'advanced_filters',
    'priority_support',
    'enhanced_messaging',
    'video_calls',
    'profile_boost',
    'family_scheduler',
    'advisor_chat',
    'priority_matching'
  ]
}

/**
 * 🎯 Main subscription hook
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user, isLoaded } = useUser()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * 📊 Fetch subscription data
   */
  const fetchSubscription = useCallback(async () => {
    if (!isLoaded || !user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/subscriptions/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const data = await response.json()
      
      // Parse dates
      const parsedData: SubscriptionData = {
        ...data,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        canceledAt: data.canceledAt ? new Date(data.canceledAt) : null
      }

      setSubscription(parsedData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Subscription fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, user])

  /**
   * 🔄 Initial data fetch
   */
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  /**
   * 🛒 Create checkout session
   */
  const createCheckoutSession = useCallback(async (planId: SubscriptionPlanId) => {
    if (!user) {
      toast.error('Please sign in to continue')
      return
    }

    if (planId === 'INTENTION') {
      toast.info('You are already on the free plan')
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId.toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      setError(message)
      toast.error(message)
      console.error('Checkout error:', err)
    }
  }, [user])

  /**
   * 🏛️ Open customer portal
   */
  const openCustomerPortal = useCallback(async () => {
    if (!subscription?.subscription?.stripeCustomerId) {
      toast.error('No subscription found')
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal')
      }

      // Redirect to Stripe customer portal
      window.location.href = data.portalUrl

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portal access failed'
      setError(message)
      toast.error(message)
      console.error('Portal error:', err)
    }
  }, [subscription])

  /**
   * 🔐 Check if user has access to a feature
   */
  const hasAccess = useCallback((feature: string): boolean => {
    if (!subscription) {
      // Default to free plan features
      return PLAN_FEATURES.INTENTION.includes(feature)
    }

    const planFeatures = PLAN_FEATURES[subscription.planId] || PLAN_FEATURES.INTENTION
    
    // Check if subscription is active and feature is included
    return subscription.hasActiveSubscription && planFeatures.includes(feature)
  }, [subscription])

  /**
   * ✨ Check if feature is enabled (considering subscription status)
   */
  const isFeatureEnabled = useCallback((feature: string): boolean => {
    if (!subscription) {
      return PLAN_FEATURES.INTENTION.includes(feature)
    }

    // For canceled subscriptions, allow access until period end
    const isAccessible = subscription.hasActiveSubscription || 
      (subscription.status === SubscriptionStatus.CANCELED && 
       subscription.currentPeriodEnd && 
       new Date() < subscription.currentPeriodEnd)

    if (!isAccessible) {
      return PLAN_FEATURES.INTENTION.includes(feature)
    }

    const planFeatures = PLAN_FEATURES[subscription.planId] || PLAN_FEATURES.INTENTION
    return planFeatures.includes(feature)
  }, [subscription])

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    createCheckoutSession,
    openCustomerPortal,
    hasAccess,
    isFeatureEnabled
  }
}

/**
 * 🎯 Subscription status hook
 */
export function useSubscriptionStatus() {
  const { subscription, loading } = useSubscription()

  return {
    isLoading: loading,
    hasActiveSubscription: subscription?.hasActiveSubscription || false,
    planId: subscription?.planId || 'INTENTION',
    status: subscription?.status || SubscriptionStatus.ACTIVE,
    daysRemaining: subscription?.daysRemaining || 0,
    isPaidPlan: subscription?.planId !== 'INTENTION',
    isFreePlan: subscription?.planId === 'INTENTION',
    isCanceled: subscription?.status === SubscriptionStatus.CANCELED,
    isPastDue: subscription?.status === SubscriptionStatus.PAST_DUE
  }
}

/**
 * 🔐 Feature access hook
 */
export function useFeatureAccess(feature: string) {
  const { hasAccess, isFeatureEnabled, subscription, loading } = useSubscription()

  return {
    hasAccess: hasAccess(feature),
    isEnabled: isFeatureEnabled(feature),
    loading,
    requiresUpgrade: !hasAccess(feature) && subscription?.planId === 'INTENTION',
    currentPlan: subscription?.planId || 'INTENTION'
  }
}

export default useSubscription