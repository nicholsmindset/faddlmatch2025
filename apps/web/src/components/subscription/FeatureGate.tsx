/**
 * 🚪 Feature Gate Component
 * Controls access to premium features based on subscription status
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { cn } from '@/lib/utils'

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  className?: string
}

interface UpgradePromptProps {
  feature: string
  currentPlan: string
  onUpgrade?: () => void
  className?: string
}

/**
 * 🎨 Feature to plan mapping
 */
const FEATURE_REQUIREMENTS = {
  'unlimited_matches': 'PATIENCE',
  'see_who_likes_you': 'PATIENCE', 
  'advanced_filters': 'PATIENCE',
  'priority_support': 'PATIENCE',
  'enhanced_messaging': 'PATIENCE',
  'video_calls': 'RELIANCE',
  'profile_boost': 'RELIANCE',
  'family_scheduler': 'RELIANCE',
  'advisor_chat': 'RELIANCE',
  'priority_matching': 'RELIANCE'
}

/**
 * 💰 Upgrade prompt component
 */
function UpgradePrompt({ 
  feature, 
  currentPlan, 
  onUpgrade,
  className 
}: UpgradePromptProps) {
  const requiredPlan = FEATURE_REQUIREMENTS[feature as keyof typeof FEATURE_REQUIREMENTS]
  const plan = requiredPlan ? SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS] : null

  if (!plan) {
    return null
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Navigate to pricing page
      window.location.href = '/pricing'
    }
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl p-8 text-center',
        'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
        'border-2 border-blue-200',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Crown className="w-8 h-8 text-white" />
        </motion.div>

        {/* Heading */}
        <motion.h3
          className="text-2xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Upgrade to {plan.name}
        </motion.h3>

        <motion.p
          className="text-gray-600 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Unlock this premium feature and enhance your matrimonial journey
        </motion.p>

        {/* Features preview */}
        <motion.div
          className="bg-white/80 rounded-xl p-4 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              What you'll get with {plan.name}:
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
            {plan.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
            {plan.features.length > 3 && (
              <div className="text-blue-600 font-medium">
                +{plan.features.length - 3} more features
              </div>
            )}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-3xl font-bold text-gray-900">
            ${plan.price}
            <span className="text-lg font-normal text-gray-600">/month</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={handleUpgrade}
          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Upgrade to {plan.name}</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </motion.button>

        {/* Islamic compliance badge */}
        <motion.div
          className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>🕌 100% Halal & Shariah Compliant</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * 🔒 Locked content overlay
 */
function LockedOverlay({ 
  feature, 
  onUpgrade 
}: { 
  feature: string
  onUpgrade?: () => void 
}) {
  return (
    <motion.div
      className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-xl p-6 shadow-xl border border-gray-200 text-center max-w-sm mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">Premium Feature</h3>
        <p className="text-gray-600 text-sm mb-4">
          Upgrade your plan to access this feature
        </p>
        <button
          onClick={onUpgrade || (() => window.location.href = '/pricing')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Upgrade Now
        </button>
      </motion.div>
    </motion.div>
  )
}

/**
 * 🚪 Main feature gate component
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  className
}: FeatureGateProps) {
  const { hasAccess, isEnabled, loading, requiresUpgrade, currentPlan } = useFeatureAccess(feature)

  // Show loading state
  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    )
  }

  // User has access - show content
  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  // Show upgrade prompt for free users
  if (requiresUpgrade && showUpgradePrompt) {
    return (
      <div className={className}>
        <UpgradePrompt
          feature={feature}
          currentPlan={currentPlan}
        />
      </div>
    )
  }

  // Show fallback or locked overlay
  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  // Show children with locked overlay
  return (
    <div className={cn('relative', className)}>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <LockedOverlay feature={feature} />
    </div>
  )
}

/**
 * 🎯 Convenience components for common features
 */
export function VideoCallGate({ children, ...props }: Omit<FeatureGateProps, 'feature'>) {
  return <FeatureGate feature="video_calls" {...props}>{children}</FeatureGate>
}

export function AdvancedFiltersGate({ children, ...props }: Omit<FeatureGateProps, 'feature'>) {
  return <FeatureGate feature="advanced_filters" {...props}>{children}</FeatureGate>
}

export function ProfileBoostGate({ children, ...props }: Omit<FeatureGateProps, 'feature'>) {
  return <FeatureGate feature="profile_boost" {...props}>{children}</FeatureGate>
}

export function UnlimitedMatchesGate({ children, ...props }: Omit<FeatureGateProps, 'feature'>) {
  return <FeatureGate feature="unlimited_matches" {...props}>{children}</FeatureGate>
}

export default FeatureGate