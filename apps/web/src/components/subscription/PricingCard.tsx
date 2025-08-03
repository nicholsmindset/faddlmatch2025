/**
 * 💳 Pricing Card Component
 * Islamic-compliant subscription pricing display for FADDL Match
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Star, Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubscriptionPlan, formatPrice } from '@/lib/stripe'

interface PricingCardProps {
  plan: SubscriptionPlan
  isCurrentPlan?: boolean
  onSelectPlan: (planId: string) => void
  loading?: boolean
  className?: string
}

/**
 * 🎨 Plan icon mapping
 */
const planIcons = {
  intention: Heart,
  patience: Star,
  reliance: Sparkles
}

/**
 * 🎨 Plan color themes
 */
const planThemes = {
  intention: {
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800'
  },
  patience: {
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800'
  },
  reliance: {
    gradient: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    icon: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-800'
  }
}

export function PricingCard({
  plan,
  isCurrentPlan = false,
  onSelectPlan,
  loading = false,
  className
}: PricingCardProps) {
  const theme = planThemes[plan.id as keyof typeof planThemes]
  const IconComponent = planIcons[plan.id as keyof typeof planIcons]

  const handleSelectPlan = () => {
    if (!loading && !isCurrentPlan) {
      onSelectPlan(plan.id)
    }
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl p-8 shadow-lg transition-all duration-300',
        `bg-gradient-to-br ${theme.gradient}`,
        theme.border,
        'border-2',
        plan.isPopular && 'ring-2 ring-blue-500 ring-offset-4',
        'hover:shadow-xl hover:scale-105',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className={cn('px-4 py-2 rounded-full text-sm font-semibold', theme.badge)}>
            ⭐ Most Popular
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 right-4">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ✓ Current Plan
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-full mb-4', theme.icon)}>
          <IconComponent size={32} />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        
        {/* Price */}
        <div className="mb-2">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(plan.price, plan.currency)}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-600 ml-2">/{plan.interval}</span>
          )}
        </div>
        
        {plan.price === 0 && (
          <p className="text-sm text-gray-500">Start your halal journey</p>
        )}
      </div>

      {/* Features List */}
      <div className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <motion.div
            key={index}
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex-shrink-0">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
            </div>
            <span className="text-gray-700 text-sm">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* Islamic Compliance Badge */}
      <div className="flex items-center justify-center space-x-2 mb-6 p-3 bg-white/50 rounded-lg border border-white/20">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-700">
          🕌 Halal & Shariah Compliant
        </span>
      </div>

      {/* Action Button */}
      <motion.button
        onClick={handleSelectPlan}
        disabled={loading || isCurrentPlan}
        className={cn(
          'w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200',
          theme.button,
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:shadow-lg transform hover:scale-105 active:scale-95'
        )}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : plan.price === 0 ? (
          'Start Free'
        ) : (
          `Choose ${plan.name}`
        )}
      </motion.button>

      {/* Terms Note */}
      {plan.price > 0 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          No commitment • Cancel anytime • 30-day money-back guarantee
        </p>
      )}
    </motion.div>
  )
}

export default PricingCard