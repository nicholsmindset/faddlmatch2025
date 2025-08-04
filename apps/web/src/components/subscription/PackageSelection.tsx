/**
 * 📦 Package Selection Component - Premium UI/UX
 * Post-onboarding subscription selection for FADDL Match
 * Enhanced with sophisticated animations, accessibility, and Islamic design
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { 
  Heart, 
  Shield, 
  Sparkles, 
  Star,
  Check, 
  ArrowRight,
  MessageCircle,
  Users,
  Crown,
  Video,
  Calendar,
  Zap,
  Award,
  Lock,
  Unlock,
  ChevronDown,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { SUBSCRIPTION_PLANS, formatPrice, SubscriptionPlanId } from '@/lib/stripe'
import { cn } from '@/lib/utils'
import { 
  ButtonDelight, 
  FloatingParticles, 
  IslamicPattern, 
  WisdomQuote,
  SubscriptionGlow,
  CrescentCelebration,
  SuccessConfetti
} from '@/components/ui/DelightfulAnimations'

interface PackageSelectionProps {
  onComplete?: () => void
  className?: string
}

/**
 * 🎨 Enhanced plan features with Islamic messaging and premium UX
 */
const ENHANCED_PLAN_FEATURES = {
  INTENTION: {
    icon: Heart,
    color: 'emerald',
    highlight: 'Perfect for beginners',
    tagline: 'Start your halal journey',
    description: 'Essential features to begin your Islamic matrimonial journey with dignity and privacy.',
    features: [
      { icon: Users, text: '5 daily matches curated by our Islamic algorithm', highlight: true },
      { icon: MessageCircle, text: 'Basic halal messaging with family oversight' },
      { icon: Shield, text: 'Standard compatibility filters' },
      { icon: Heart, text: 'Profile creation with Islamic values focus' },
      { icon: Check, text: 'Community guidelines adherence' },
      { icon: Info, text: 'Basic customer support' }
    ],
    limitations: [
      'Limited daily matches',
      'Basic messaging only',
      'Standard filters'
    ],
    popularityScore: 1
  },
  PATIENCE: {
    icon: Star,
    color: 'blue',
    highlight: 'Most popular for serious seekers',
    tagline: 'Unlock advanced matching',
    description: 'Comprehensive features for those committed to finding their ideal Islamic partner.',
    features: [
      { icon: Zap, text: 'Unlimited daily matches with advanced Islamic compatibility', highlight: true },
      { icon: Award, text: 'See who has shown interest in your profile', highlight: true },
      { icon: Shield, text: 'Advanced filters: sect, prayer frequency, hijab preference' },
      { icon: Crown, text: 'Priority customer support with Islamic counselors' },
      { icon: MessageCircle, text: 'Enhanced messaging with read receipts' },
      { icon: Heart, text: 'Islamic compatibility scoring algorithm' },
      { icon: Sparkles, text: 'Profile boost feature (2x visibility)' },
      { icon: Users, text: 'Family involvement tools' }
    ],
    benefits: [
      'Find your match 3x faster',
      'Advanced Islamic compatibility',
      'Priority support'
    ],
    popularityScore: 3
  },
  RELIANCE: {
    icon: Crown,
    color: 'purple',
    highlight: 'Premium experience for committed users',
    tagline: 'Complete matrimonial solution',
    description: 'The ultimate halal matrimonial experience with dedicated support and exclusive features.',
    features: [
      { icon: Crown, text: 'Everything included in Patience plan', highlight: true },
      { icon: Video, text: 'Halal-supervised video calls with family present', highlight: true },
      { icon: Sparkles, text: 'Weekly profile boost (5x visibility)', highlight: true },
      { icon: Calendar, text: 'Family meeting scheduler and coordination' },
      { icon: MessageCircle, text: 'Dedicated Islamic marriage advisor chat' },
      { icon: Zap, text: 'Priority matching algorithm (shown first)' },
      { icon: Shield, text: 'Guardian communication and approval tools' },
      { icon: Users, text: 'Exclusive community events and webinars' },
      { icon: Heart, text: 'Marriage preparation resources' },
      { icon: Award, text: 'Pre-marital counseling session included' }
    ],
    benefits: [
      'Dedicated marriage advisor',
      'Family coordination tools',
      'Exclusive community access'
    ],
    popularityScore: 2
  }
}

/**
 * 🎨 Enhanced color themes with sophisticated gradients and states
 */
const COLOR_THEMES = {
  emerald: {
    gradient: 'from-emerald-50 via-green-50 to-teal-50',
    gradientHover: 'from-emerald-100 via-green-100 to-teal-100',
    border: 'border-emerald-200',
    borderHover: 'border-emerald-300',
    button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
    text: 'text-emerald-600',
    textSecondary: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
    shadow: 'shadow-emerald-200/50',
    ring: 'ring-emerald-200'
  },
  blue: {
    gradient: 'from-blue-50 via-indigo-50 to-sky-50',
    gradientHover: 'from-blue-100 via-indigo-100 to-sky-100',
    border: 'border-blue-300 ring-2 ring-blue-200',
    borderHover: 'border-blue-400 ring-blue-300',
    button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    text: 'text-blue-600',
    textSecondary: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-800',
    shadow: 'shadow-blue-200/50',
    ring: 'ring-blue-200'
  },
  purple: {
    gradient: 'from-purple-50 via-violet-50 to-indigo-50',
    gradientHover: 'from-purple-100 via-violet-100 to-indigo-100',
    border: 'border-purple-200',
    borderHover: 'border-purple-300',
    button: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700',
    text: 'text-purple-600',
    textSecondary: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-800',
    shadow: 'shadow-purple-200/50',
    ring: 'ring-purple-200'
  }
}

/**
 * 🎬 Premium animation variants
 */
const ANIMATION_VARIANTS = {
  cardContainer: {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: { 
      y: -8, 
      scale: 1.02,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  },
  feature: {
    hidden: { opacity: 0, x: -20, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    })
  },
  badge: {
    initial: { scale: 0, rotate: -10 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 25,
        delay: 0.2 
      }
    }
  },
  button: {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.98 },
    loading: { 
      scale: [1, 1.02, 1],
      transition: { duration: 1.5, repeat: Infinity }
    }
  }
}

export function PackageSelection({ onComplete, className }: PackageSelectionProps) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('patience')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})
  const [showCelebration, setShowCelebration] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  /**
   * 🛒 Enhanced plan selection with accessibility and error handling
   */
  const handleSelectPlan = useCallback(async (planId: string) => {
    // Clear previous errors
    setErrors({})
    setSuccessMessage('')
    if (!user) {
      const errorMessage = 'Please sign in to continue your halal matrimonial journey'
      setErrors({ auth: errorMessage })
      toast.error(errorMessage, {
        description: 'Your profile will be saved and ready when you return',
        action: {
          label: 'Sign In',
          onClick: () => router.push('/sign-in')
        }
      })
      return
    }

    // Handle free plan with enhanced feedback and celebration
    if (planId === 'intention') {
      setSuccessMessage('Welcome to your halal journey!')
      setShowCelebration(true)
      setShowConfetti(true)
      
      toast.success('Alhamdulillah! Welcome to FADDL Match! 🎉', {
        description: 'Starting your free Islamic matrimonial journey...',
        duration: 3000
      })
      
      // Celebrate for 2 seconds then transition
      setTimeout(() => {
        setShowCelebration(false)
        setShowConfetti(false)
        onComplete?.()
        router.push('/dashboard')
      }, 2500)
      return
    }

    setLoading(planId)

    try {
      // Enhanced loading state with progress indication
      toast.loading('Preparing your secure checkout...', {
        description: 'This may take a few moments',
        id: 'checkout-loading'
      })

      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId.toUpperCase(),
          returnUrl: window.location.origin + '/subscription/success',
          metadata: {
            userId: user.id,
            selectedAt: new Date().toISOString()
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Dismiss loading toast
      toast.dismiss('checkout-loading')
      
      // Enhanced success message with Islamic blessing
      toast.success('Redirecting to secure payment', {
        description: 'May Allah facilitate your journey to finding your perfect match',
        duration: 3000
      })
      
      // Add slight delay for better UX
      setTimeout(() => {
        window.location.href = data.checkoutUrl
      }, 1000)

    } catch (error) {
      console.error('Checkout error:', error)
      toast.dismiss('checkout-loading')
      
      const errorMessage = error instanceof Error ? error.message : 'Payment setup failed'
      setErrors({ checkout: errorMessage })
      
      toast.error('Checkout Failed', {
        description: errorMessage + '. Please try again or contact our support team.',
        action: {
          label: 'Contact Support',
          onClick: () => window.open('/support', '_blank')
        }
      })
    } finally {
      setLoading(null)
    }
  }, [user, router, onComplete])

  /**
   * 🔄 Toggle feature expansion for better mobile UX
   */
  const toggleFeatures = useCallback((planId: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }))
  }, [])

  /**
   * 🎯 Enhanced plan card component
   */
  const PlanCard = ({ planKey }: { planKey: keyof typeof SUBSCRIPTION_PLANS }) => {
    const plan = SUBSCRIPTION_PLANS[planKey]
    const enhanced = ENHANCED_PLAN_FEATURES[planKey]
    const theme = COLOR_THEMES[enhanced.color as keyof typeof COLOR_THEMES]
    const IconComponent = enhanced.icon
    const isPopular = plan.isPopular
    const isSelected = selectedPlan === planKey.toLowerCase()
    const isLoading = loading === planKey.toLowerCase()

    return (
      <motion.div
        className={cn(
          'relative rounded-3xl p-8 transition-all duration-300 cursor-pointer overflow-hidden',
          `bg-gradient-to-br ${theme.gradient}`,
          theme.border,
          'border-2',
          isPopular && 'ring-2 ring-blue-400 ring-offset-4',
          isSelected && 'scale-105 shadow-2xl',
          !isSelected && 'hover:scale-102 hover:shadow-xl',
          className
        )}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onClick={() => setSelectedPlan(planKey.toLowerCase())}
        whileHover={{ y: -5 }}
      >
        {/* Subtle glow effect for selected plan */}
        {isSelected && (
          <SubscriptionGlow 
            tier={planKey.toLowerCase() as 'intention' | 'patience' | 'reliance'} 
            className="blur-xl" 
          />
        )}
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
              ⭐ Most Popular Choice
            </div>
          </div>
        )}

        {/* Plan Header */}
        <div className="text-center mb-8">
          <div className={cn('inline-flex items-center justify-center w-20 h-20 rounded-full mb-6', 
            `bg-white shadow-lg ${theme.text}`
          )}>
            <IconComponent size={36} />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 mb-2">{enhanced.highlight}</p>
          
          {/* Price */}
          <div className="mb-4">
            <span className="text-5xl font-bold text-gray-900">
              {formatPrice(plan.price, plan.currency)}
            </span>
            {plan.price > 0 && (
              <span className="text-gray-600 ml-2 text-lg">/{plan.interval}</span>
            )}
          </div>
        </div>

        {/* Enhanced Features List with delightful animations */}
        <div className="space-y-4 mb-8">
          {enhanced.features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-start space-x-3 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <motion.div 
                className="flex-shrink-0 mt-1"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <Check className="w-5 h-5 text-green-500 group-hover:text-green-600" />
              </motion.div>
              <span className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900 transition-colors">
                {typeof feature === 'string' ? feature : feature.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Islamic Compliance Badge */}
        <div className="flex items-center justify-center space-x-2 mb-6 p-4 bg-white/80 rounded-2xl border border-white/40">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-gray-700">
            🕌 100% Halal & Shariah Compliant
          </span>
        </div>

        {/* Delightful Action Button */}
        <ButtonDelight
          onClick={() => handleSelectPlan(planKey.toLowerCase())}
          loading={isLoading}
          variant={plan.price === 0 ? 'success' : 'primary'}
          className="w-full py-4 px-6 text-lg font-bold"
        >
          {plan.price === 0 ? (
            <>
              <Heart className="w-5 h-5 mr-2" />
              Start Free Journey
              <Sparkles className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Choose {plan.name}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </ButtonDelight>

        {/* Money-back guarantee */}
        {plan.price > 0 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            30-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Delightful background elements */}
      <IslamicPattern className="text-blue-200" />
      <FloatingParticles count={12} className="opacity-30" />
      
      {/* Success celebration */}
      <CrescentCelebration trigger={showCelebration} />
      <SuccessConfetti trigger={showConfetti} />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Profile Complete!
            </span>
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Halal Journey
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your profile is ready! Now select the perfect plan to unlock powerful features 
            and connect with compatible Islamic partners who share your values.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-gray-600">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">100% Halal Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">10,000+ Success Stories</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">50,000+ Active Members</span>
            </div>
          </div>
        </motion.div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {(Object.keys(SUBSCRIPTION_PLANS) as Array<keyof typeof SUBSCRIPTION_PLANS>).map((planKey) => (
            <PlanCard key={planKey} planKey={planKey} />
          ))}
        </div>

        {/* Why Choose FADDL Match */}
        <motion.div
          className="bg-white rounded-3xl p-12 shadow-xl border border-gray-200 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose FADDL Match for Your Islamic Marriage Journey?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Halal Compliant</h3>
              <p className="text-gray-600 text-sm">Every feature designed with Islamic principles</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Family Focused</h3>
              <p className="text-gray-600 text-sm">Tools for family involvement and approval</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe Communication</h3>
              <p className="text-gray-600 text-sm">Supervised messaging and video calls</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Success Stories</h3>
              <p className="text-gray-600 text-sm">Thousands of happy Islamic marriages</p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Islamic Wisdom Quote */}
        <WisdomQuote
          quote="And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
          author="- Quran 30:21"
          className="text-lg"
        />
      </div>
    </div>
  )
}

export default PackageSelection