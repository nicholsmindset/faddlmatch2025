'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Heart, Star } from 'lucide-react'

interface PricingSectionProps {
  showHeader?: boolean
  className?: string
}

export function PricingSection({ showHeader = true, className = '' }: PricingSectionProps) {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      duration: 'forever',
      description: 'Start your journey',
      features: [
        'Create complete profile',
        'Browse verified profiles',
        'Basic matching algorithm',
        'Limited daily matches (3)',
        'Basic communication',
        'Family involvement features'
      ],
      cta: 'Start Free',
      popular: false,
      icon: Heart
    },
    {
      name: 'Premium',
      price: '$29',
      duration: 'month',
      description: 'Enhanced experience',
      features: [
        'Everything in Free',
        'Unlimited daily matches',
        'Advanced matching algorithm',
        'Priority profile visibility',
        'Enhanced messaging features',
        'Video call introduction',
        'Guardian dashboard access',
        'Profile boost twice monthly'
      ],
      cta: 'Upgrade to Premium',
      popular: true,
      icon: Star
    },
    {
      name: 'Executive',
      price: '$99',
      duration: 'month',
      description: 'Complete matrimonial experience',
      features: [
        'Everything in Premium',
        'Personal matrimonial advisor',
        'Priority customer support',
        'Advanced compatibility reports',
        'Exclusive executive member matches',
        'Professional photo guidance',
        'Profile optimization consultation',
        'Success guarantee program'
      ],
      cta: 'Go Executive',
      popular: false,
      icon: Crown
    }
  ]

  return (
    <div className={className}>
      {showHeader && (
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Journey
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade when you're ready to enhance your matrimonial experience
          </p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => {
          const IconComponent = plan.icon
          return (
            <motion.div
              key={plan.name}
              className={`relative p-8 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 transform scale-105'
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  plan.popular ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-8 h-8 ${
                    plan.popular ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => window.location.href = '/matches'}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-green-300'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        className="text-center mt-12 p-6 bg-green-50 rounded-2xl max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-green-800 font-medium">
          💝 <strong>Special Launch Offer:</strong> Get 50% off Premium for your first 3 months when you upgrade within 7 days of joining!
        </p>
      </motion.div>
    </div>
  )
}