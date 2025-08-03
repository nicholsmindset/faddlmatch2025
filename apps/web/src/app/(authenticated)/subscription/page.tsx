/**
 * 📊 Subscription Management Page
 * Manage current subscription and view billing information
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { 
  CreditCard, 
  Calendar, 
  Settings, 
  Download, 
  AlertCircle,
  CheckCircle,
  Clock,
  Crown
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice, SUBSCRIPTION_PLANS, SubscriptionPlanId } from '@/lib/stripe'
import PricingSection from '@/components/subscription/PricingSection'
import { cn } from '@/lib/utils'

interface SubscriptionData {
  hasActiveSubscription: boolean
  planId: SubscriptionPlanId
  status: string
  daysRemaining: number
  features: string[]
  currentPeriodEnd: string
  canceledAt: string | null
  subscription: {
    id: string
    stripeCustomerId: string
    stripeSubscriptionId: string
    status: string
  } | null
}

/**
 * 🎨 Status color mapping
 */
const statusColors = {
  active: 'text-green-600 bg-green-100',
  canceled: 'text-red-600 bg-red-100',
  past_due: 'text-orange-600 bg-orange-100',
  incomplete: 'text-yellow-600 bg-yellow-100',
  trialing: 'text-blue-600 bg-blue-100'
}

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  /**
   * 📊 Fetch subscription data
   */
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionData()
    }
  }, [isLoaded, user])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      } else {
        throw new Error('Failed to fetch subscription data')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('Failed to load subscription information')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 🏛️ Open customer portal
   */
  const openCustomerPortal = async () => {
    if (!subscriptionData?.subscription?.stripeCustomerId) {
      toast.error('No subscription found')
      return
    }

    setPortalLoading(true)
    try {
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
      if (response.ok) {
        window.location.href = data.portalUrl
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Failed to open customer portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentPlan = subscriptionData ? SUBSCRIPTION_PLANS[subscriptionData.planId] : SUBSCRIPTION_PLANS.INTENTION

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your FADDL Match subscription and billing information
          </p>
        </motion.div>

        {/* Current Subscription Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentPlan.name} Plan
                </h2>
                <p className="text-gray-600">
                  {currentPlan.description}
                </p>
              </div>
            </div>
            
            {subscriptionData?.status && (
              <div className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold capitalize',
                statusColors[subscriptionData.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100'
              )}>
                {subscriptionData.status.replace('_', ' ')}
              </div>
            )}
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Price</p>
                <p className="font-semibold text-gray-900">
                  {formatPrice(currentPlan.price, currentPlan.currency)}
                </p>
              </div>
            </div>
            
            {subscriptionData?.currentPeriodEnd && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Next Billing Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Days Remaining</p>
                <p className="font-semibold text-gray-900">
                  {subscriptionData?.daysRemaining || 'Unlimited'}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Notice */}
          {subscriptionData?.canceledAt && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Subscription Canceled</h3>
                  <p className="text-orange-700 text-sm">
                    Your subscription will remain active until{' '}
                    {subscriptionData.currentPeriodEnd ? 
                      new Date(subscriptionData.currentPeriodEnd).toLocaleDateString() : 
                      'the end of your billing period'
                    }.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {subscriptionData?.subscription?.stripeCustomerId && (
              <motion.button
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {portalLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    <span>Manage Billing</span>
                  </>
                )}
              </motion.button>
            )}
            
            <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download Invoice</span>
            </button>
          </div>
        </motion.div>

        {/* Current Plan Features */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Your Plan Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade/Downgrade Options */}
        {subscriptionData?.planId !== 'RELIANCE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Upgrade Your Plan
            </h3>
            <PricingSection showHeader={false} />
          </motion.div>
        )}
      </div>
    </div>
  )
}