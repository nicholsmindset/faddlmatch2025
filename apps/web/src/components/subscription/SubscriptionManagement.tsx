/**
 * ⚙️ Subscription Management Component
 * Comprehensive subscription management interface for FADDL Match users
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Calendar, 
  Shield, 
  Crown, 
  Star, 
  Heart,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  ArrowRight,
  Gift,
  Sparkles,
  Award
} from 'lucide-react'
import { formatPrice, SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  ButtonDelight,
  BreathingCard,
  IslamicPattern,
  MilestoneCelebration
} from '@/components/ui/DelightfulAnimations'

interface SubscriptionManagementProps {
  className?: string
  compact?: boolean
}

/**
 * 🎨 Plan icons and themes
 */
const PLAN_ICONS = {
  INTENTION: Heart,
  PATIENCE: Star,
  RELIANCE: Crown
}

const PLAN_THEMES = {
  INTENTION: {
    gradient: 'from-green-100 to-emerald-100',
    border: 'border-green-200',
    text: 'text-green-700',
    bg: 'bg-green-50'
  },
  PATIENCE: {
    gradient: 'from-blue-100 to-indigo-100',
    border: 'border-blue-200',
    text: 'text-blue-700',
    bg: 'bg-blue-50'
  },
  RELIANCE: {
    gradient: 'from-purple-100 to-violet-100',
    border: 'border-purple-200',
    text: 'text-purple-700',
    bg: 'bg-purple-50'
  }
}

export function SubscriptionManagement({ className, compact = false }: SubscriptionManagementProps) {
  const { subscription, loading, error, refetch, openCustomerPortal } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showLoyaltyBadge, setShowLoyaltyBadge] = useState(false)
  
  // Show loyalty badge for long-term subscribers
  React.useEffect(() => {
    if (subscription?.daysRemaining && subscription.daysRemaining > 30) {
      const isLoyalCustomer = !localStorage.getItem('loyalty-badge-shown')
      if (isLoyalCustomer) {
        setTimeout(() => {
          setShowLoyaltyBadge(true)
          localStorage.setItem('loyalty-badge-shown', 'true')
        }, 2000)
      }
    }
  }, [subscription])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
      toast.success('Subscription status updated')
    } catch (err) {
      toast.error('Failed to refresh subscription status')
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(true)
  }

  const handleManageBilling = async () => {
    try {
      await openCustomerPortal()
    } catch (err) {
      toast.error('Failed to open billing portal')
    }
  }

  if (loading) {
    return (
      <div className={cn('bg-white rounded-2xl p-6 shadow-sm border border-gray-200', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('bg-red-50 rounded-2xl p-6 border border-red-200', className)}>
        <div className="flex items-center space-x-2 text-red-700 mb-4">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">Subscription Status Error</h3>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  const currentPlan = SUBSCRIPTION_PLANS[subscription.planId]
  const theme = PLAN_THEMES[subscription.planId] || PLAN_THEMES.INTENTION
  const IconComponent = PLAN_ICONS[subscription.planId] || Heart

  return (
    <>
      {/* Loyalty celebration */}
      <MilestoneCelebration
        milestone="Thank you for being a loyal FADDL Match member! Your dedication to finding your perfect match is inspiring."
        show={showLoyaltyBadge}
        onComplete={() => setShowLoyaltyBadge(false)}
      />
      
      <BreathingCard className={cn('bg-white rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden', className)}>
        {/* Subtle Islamic pattern background */}
        <IslamicPattern className="text-green-100 opacity-20" />
        {/* Enhanced Header with delightful animations */}
        <motion.div 
          className={cn('p-6 rounded-t-2xl bg-gradient-to-r relative z-10', theme.gradient, theme.border, 'border-b')}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={cn('p-3 rounded-full bg-white shadow-sm', theme.text)}
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <IconComponent className="w-6 h-6" />
              </motion.div>
              <div>
                <motion.h2 
                  className="text-xl font-bold text-gray-900 flex items-center space-x-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span>{currentPlan?.name} Plan</span>
                  {subscription.planId === 'RELIANCE' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring' }}
                    >
                      👑
                    </motion.span>
                  )}
                </motion.h2>
                <motion.p 
                  className={cn('text-sm', theme.text)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {subscription.hasActiveSubscription ? 'Active Subscription ✨' : 'Free Plan'}
                </motion.p>
              </div>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Refresh subscription status"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Content */}
        <motion.div 
          className="p-6 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Current Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Plan Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900">{currentPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(currentPlan?.price || 0, currentPlan?.currency)}
                    {currentPlan?.price > 0 && `/${currentPlan?.interval}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    subscription.hasActiveSubscription 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {subscription.hasActiveSubscription ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      'Free Plan'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {subscription.hasActiveSubscription && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Billing Information</h3>
                <div className="space-y-2 text-sm">
                  {subscription.billing?.nextBilling && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next billing:</span>
                      <span className="font-medium text-gray-900">
                        {subscription.billing.nextBilling.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto-renewal:</span>
                    <span className={cn(
                      'font-medium',
                      subscription.billing?.autoRenewal ? 'text-green-600' : 'text-orange-600'
                    )}>
                      {subscription.billing?.autoRenewal ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days remaining:</span>
                    <span className="font-medium text-gray-900">{subscription.daysRemaining}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Current Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPlan?.features.slice(0, compact ? 4 : undefined).map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
              {compact && currentPlan?.features.length > 4 && (
                <div className="text-sm text-gray-500 col-span-2">
                  +{currentPlan.features.length - 4} more features
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          {subscription.usage && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Usage This Month</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn('p-4 rounded-lg', theme.bg)}>
                  <div className="text-2xl font-bold text-gray-900">
                    {subscription.usage.dailyMatches}
                  </div>
                  <div className="text-sm text-gray-600">Daily Matches</div>
                </div>
                <div className={cn('p-4 rounded-lg', theme.bg)}>
                  <div className="text-2xl font-bold text-gray-900">
                    {subscription.usage.messagesLeft}
                  </div>
                  <div className="text-sm text-gray-600">Messages Available</div>
                </div>
                <div className={cn('p-4 rounded-lg', theme.bg)}>
                  <div className="text-2xl font-bold text-gray-900">
                    {subscription.usage.profileBoosts}
                  </div>
                  <div className="text-sm text-gray-600">Profile Boosts Left</div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons with delightful interactions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {subscription.planId === 'INTENTION' ? (
              <ButtonDelight
                onClick={handleUpgrade}
                variant="primary"
                className="px-6 py-3 font-semibold"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade Plan
                <Sparkles className="w-5 h-5 ml-2" />
              </ButtonDelight>
            ) : (
              <ButtonDelight
                onClick={handleManageBilling}
                variant="secondary"
                className="px-6 py-3 font-semibold bg-gray-900 hover:bg-gray-800"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Manage Billing
                <ExternalLink className="w-4 h-4 ml-2" />
              </ButtonDelight>
            )}
            
            {subscription.planId !== 'RELIANCE' && (
              <motion.button
                onClick={handleUpgrade}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/30 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Gift className="w-5 h-5 mr-2" />
                Upgrade to Premium
                <Award className="w-5 h-5 ml-2" />
              </motion.button>
            )}
          </div>

          {/* Enhanced Islamic Message with gentle animation */}
          <motion.div 
            className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.div 
              className="flex items-center space-x-2 mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Shield className="w-5 h-5 text-green-600" />
              </motion.div>
              <span className="font-medium text-gray-900">Halal Guarantee</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: 'spring' }}
                className="text-green-600"
              >
                ✨
              </motion.span>
            </motion.div>
            <motion.p 
              className="text-sm text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              All our features are designed to be completely Shariah-compliant. 
              May Allah bless your journey to find your ideal marriage partner.
            </motion.p>
          </motion.div>
        </motion.div>
      </BreathingCard>

      {/* Enhanced Upgrade Modal with delightful animations */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-green-200 to-blue-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <motion.h3 
                  className="text-2xl font-bold text-gray-900 flex items-center space-x-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Crown className="w-6 h-6 text-purple-600" />
                  <span>Upgrade Your Plan</span>
                </motion.h3>
                <motion.button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <motion.p 
                className="text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Ready to unlock more features and find your perfect match faster? 
                Upgrade to get unlimited matches, advanced filters, and much more! 🚀
              </motion.p>
              
              <div className="flex flex-col gap-4 relative z-10">
                <ButtonDelight
                  onClick={() => {
                    setShowUpgradeModal(false)
                    window.location.href = '/pricing'
                  }}
                  variant="primary"
                  className="w-full py-4 font-semibold text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  View All Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </ButtonDelight>
                <motion.button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors rounded-xl hover:bg-gray-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Maybe Later
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SubscriptionManagement