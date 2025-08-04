/**
 * ✅ Subscription Success Page - Premium Experience
 * Enhanced confirmation page with sophisticated animations and Islamic theming
 */

'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { CheckCircle, Heart, ArrowRight, Sparkles, Star, Crown, Gift, Users, Shield, Award, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { cn } from '@/lib/utils'
import { 
  CrescentCelebration,
  SuccessConfetti,
  ButtonDelight,
  FloatingParticles,
  IslamicPattern,
  WisdomQuote
} from '@/components/ui/DelightfulAnimations'
import SubscriptionDelights from '@/components/subscription/SubscriptionDelights'

/**
 * 🎆 Enhanced animation variants for premium experience
 */
const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  },
  badge: {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: 0.5
      }
    }
  },
  celebration: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }
}

/**
 * 🎉 Enhanced success page content with premium UX
 */
function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'patience'
  const [countdown, setCountdown] = useState(10)
  const [showConfetti, setShowConfetti] = useState(true)
  const [showCelebration, setShowCelebration] = useState(true)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  
  // Set subscription date for milestones
  useEffect(() => {
    if (planId !== 'intention') {
      localStorage.setItem('subscription-date', new Date().toISOString())
    }
  }, [planId])
  
  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS]
  
  // Enhanced celebration sequence
  useEffect(() => {
    const sequence = [
      { delay: 3000, action: () => setShowConfetti(false) },
      { delay: 4000, action: () => setShowCelebration(false) },
      { delay: 5000, action: () => setShowWelcomeMessage(true) }
    ]
    
    const timers = sequence.map(({ delay, action }) => 
      setTimeout(action, delay)
    )
    
    return () => timers.forEach(clearTimeout)
  }, [])
  
  // Enhanced auto-redirect with better UX
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Smooth transition announcement
          const announcement = new CustomEvent('page-transition', {
            detail: { destination: 'dashboard', message: 'Taking you to your dashboard...' }
          })
          window.dispatchEvent(announcement)
          
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [router])
  
  const planThemes = {
    patience: {
      icon: Star,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      color: 'blue'
    },
    reliance: {
      icon: Crown,
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-50',
      color: 'purple'
    },
    intention: {
      icon: Heart,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50',
      color: 'emerald'
    }
  }
  
  const planTheme = planThemes[planId as keyof typeof planThemes] || planThemes.patience
  const PlanIcon = planTheme.icon
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl" />
      </div>
      
      {/* Confetti Effect */}
      {showConfetti && !shouldReduceMotion && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: 0,
                scale: Math.random() * 0.8 + 0.5
              }}
              animate={{
                y: window.innerHeight + 100,
                rotate: 360,
                transition: {
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 2,
                  ease: 'easeOut'
                }
              }}
            />
          ))}
        </div>
      )}
      
      <motion.div 
        className="max-w-4xl mx-auto text-center relative z-20"
        variants={shouldReduceMotion ? {} : ANIMATION_VARIANTS.container}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Success Animation */}
        <motion.div
          variants={shouldReduceMotion ? {} : ANIMATION_VARIANTS.celebration}
          initial="initial"
          animate="animate"
          className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-100 via-emerald-100 to-blue-100 rounded-full mb-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-200/50 to-blue-200/50 rounded-full animate-ping" />
          <div className="absolute inset-2 bg-white rounded-full shadow-inner" />
          <CheckCircle className="w-20 h-20 text-green-600 relative z-10 drop-shadow-lg" />
          
          {/* Floating particles around success icon */}
          {!shouldReduceMotion && [...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: [0, Math.cos(i * 60 * Math.PI/180) * 60],
                y: [0, Math.sin(i * 60 * Math.PI/180) * 60],
              }}
              transition={{
                duration: 2,
                delay: 1 + i * 0.1,
                repeat: Infinity,
                repeatDelay: 3
              }}
            />
          ))}
        </motion.div>

        {/* Enhanced Main Heading */}
        <motion.div
          variants={shouldReduceMotion ? {} : ANIMATION_VARIANTS.item}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="block text-3xl md:text-4xl font-normal text-green-600 mb-2">
              Alhamdulillah!
            </span>
            Welcome to Your{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Halal Journey!
            </span>
            <span className="text-4xl md:text-5xl ml-4">🎉</span>
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Your <strong className={`text-${planTheme.color}-600`}>{plan?.name}</strong> subscription has been successfully activated.
          </motion.p>
          
          <motion.p 
            className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            May Allah bless you in finding your perfect match through this halal platform. 
            Your journey towards a blessed Islamic marriage begins now.
          </motion.p>
          
          {/* Enhanced Plan Badge */}
          <motion.div 
            className={cn(
              'inline-flex items-center space-x-3 px-8 py-4 rounded-2xl shadow-xl border-2 mb-12 backdrop-blur-sm',
              `bg-gradient-to-r ${planTheme.bgGradient} border-${planTheme.color}-200`
            )}
            variants={shouldReduceMotion ? {} : ANIMATION_VARIANTS.badge}
            initial="hidden"
            animate="visible"
          >
            <div className={`p-2 bg-${planTheme.color}-100 rounded-full`}>
              <PlanIcon className={`w-6 h-6 text-${planTheme.color}-600`} />
            </div>
            <span className="font-bold text-gray-900 text-lg">
              {plan?.name} Plan Active
            </span>
            <div className="flex space-x-1">
              <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
          </motion.div>
        </motion.div>

        {/* Success Details */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl p-10 shadow-xl border border-gray-200 mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Your Islamic Marriage Journey Starts Now!
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Discover Matches</h3>
              <p className="text-gray-600">
                Browse Islamic-compatible profiles curated by our advanced algorithm
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Connect Safely</h3>
              <p className="text-gray-600">
                Use halal-compliant messaging and family-supervised features
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-purple-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Find Your Match</h3>
              <p className="text-gray-600">
                Build meaningful relationships leading to blessed Islamic marriage
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Islamic Blessing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
          className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-8 mb-8 border border-green-200"
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Islamic Blessing</span>
            <Heart className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-gray-700 italic">
            "And among His signs is that He created for you mates from among yourselves, 
            that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
          </p>
          <p className="text-sm text-gray-600 mt-2">- Quran 30:21</p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <Link href="/dashboard?welcome=true">
            <ButtonDelight 
              variant="primary" 
              className="px-10 py-5 text-lg font-bold"
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Go to Dashboard
              <ArrowRight className="w-6 h-6 ml-2" />
            </ButtonDelight>
          </Link>
          
          <Link href="/matches">
            <ButtonDelight 
              variant="secondary" 
              className="px-10 py-5 text-lg font-bold bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
            >
              <Heart className="w-6 h-6 mr-2" />
              Start Browsing Matches
              <Star className="w-6 h-6 ml-2" />
            </ButtonDelight>
          </Link>
        </motion.div>
        
        {/* Auto-redirect countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-8 p-4 bg-white/80 rounded-xl border border-gray-200"
        >
          <p className="text-gray-600 text-sm">
            Automatically redirecting to your dashboard in <strong>{countdown}</strong> seconds...
          </p>
        </motion.div>

        {/* Support Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 mb-2">
            Need help getting started? Our Islamic marriage support team is here for you.
          </p>
          <Link
            href="/support"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact Islamic Marriage Support
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * 📄 Main page component with Suspense boundary
 */
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your success page...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}