/**
 * 💰 Pricing Section Component
 * Complete pricing display for FADDL Match Islamic matrimonial platform
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Heart, Shield, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '@/lib/stripe'
import PricingCard from './PricingCard'
import { cn } from '@/lib/utils'

interface UserSubscriptionStatus {
  hasActiveSubscription: boolean
  planId: SubscriptionPlanId
  status: string
  daysRemaining: number
  features: string[]
}

interface PricingSectionProps {
  showHeader?: boolean
  className?: string
}

export function PricingSection({ 
  showHeader = true, 
  className 
}: PricingSectionProps) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus | null>(null)

  /**
   * 📊 Fetch user's subscription status
   */
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionStatus()
    }
  }, [isLoaded, user])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
    }
  }

  /**
   * 🛒 Handle plan selection
   */
  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      // Show a more Islamic-friendly message for sign-in
      toast.error('Please sign in to begin your halal journey')
      // Redirect to sign-in with return URL
      const returnUrl = encodeURIComponent(window.location.pathname)
      router.push(`/sign-in?redirect_url=${returnUrl}`)
      return
    }

    if (planId === 'intention') {
      // Free plan - check if user needs onboarding or go to dashboard
      const hasCompletedOnboarding = user.publicMetadata?.onboardingCompleted
      if (!hasCompletedOnboarding) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
      return
    }

    setLoading(planId)

    try {
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

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  /**
   * 🎯 Get current plan ID
   */
  const getCurrentPlanId = (): string => {
    return subscriptionStatus?.planId?.toLowerCase() || 'intention'
  }

  return (
    <section className={cn('py-16 px-4', className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {showHeader && (
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Halal Journey
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Find your perfect match with our Islamic-compliant matrimonial platform. 
              All plans designed to respect Islamic values and facilitate meaningful connections.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="flex items-center space-x-2 text-gray-600">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">100% Halal Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">10,000+ Success Stories</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">50,000+ Active Members</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <PricingCard
                plan={plan}
                isCurrentPlan={getCurrentPlanId() === plan.id}
                onSelectPlan={handleSelectPlan}
                loading={loading === plan.id}
              />
            </motion.div>
          ))}
        </div>

        {/* Current Subscription Status */}
        {subscriptionStatus && subscriptionStatus.hasActiveSubscription && (
          <motion.div
            className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Current Subscription Status
              </h3>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-700">
                <span>Plan: <strong>{subscriptionStatus.planId}</strong></span>
                <span>Status: <strong className="capitalize">{subscriptionStatus.status}</strong></span>
                {subscriptionStatus.daysRemaining > 0 && (
                  <span>Days Remaining: <strong>{subscriptionStatus.daysRemaining}</strong></span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          className="mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                Is FADDL Match truly Halal?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes, all features are designed with Islamic principles in mind. 
                Video calls include family supervision options, and we maintain strict privacy standards.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h4>
              <p className="text-gray-600 text-sm">
                Absolutely. You can cancel your subscription at any time through your account settings 
                or the customer portal. No hidden fees or cancellation charges.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards and debit cards through our secure Stripe integration. 
                All payments are processed securely and your financial information is never stored.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes, we offer a 30-day money-back guarantee for all paid subscriptions. 
                If you're not satisfied, contact our support team for a full refund.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p className="text-gray-600 mb-4">
            Need help choosing the right plan or have questions?
          </p>
          <button className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
            <span>Contact our support team</span>
            <Heart className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default PricingSection