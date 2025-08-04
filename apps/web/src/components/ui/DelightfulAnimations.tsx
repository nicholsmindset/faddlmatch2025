/**
 * ✨ Delightful Animations for FADDL Match
 * Culturally-sensitive Islamic-themed micro-interactions and whimsical elements
 */

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'framer-motion'
import { Sparkles, Star, Heart, Gift, Crown, Zap, Award, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Islamic-inspired geometric patterns for background elements
export const IslamicPattern = ({ className }: { className?: string }) => (
  <div className={cn('absolute inset-0 opacity-5 pointer-events-none', className)}>
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <defs>
        <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M30,0 L45,15 L30,30 L15,15 Z M0,30 L15,45 L30,30 L15,15 Z M30,30 L45,45 L60,30 L45,15 Z M30,30 L15,45 L0,60 L15,45 Z"
            fill="currentColor"
            opacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
    </svg>
  </div>
)

// Floating particles animation
export const FloatingParticles = ({ count = 15, className }: { count?: number; className?: string }) => {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) return null

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-70"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: -20,
            scale: Math.random() * 0.8 + 0.5,
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 100 : 800,
            x: [
              Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            ],
            rotate: 360,
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// Prayer beads animation for loading states
export const PrayerBeadsLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'absolute rounded-full bg-gradient-to-r from-green-400 to-blue-400',
              sizeClasses[size]
            )}
            style={{
              left: `${Math.cos(i * 45 * Math.PI / 180) * 20}px`,
              top: `${Math.sin(i * 45 * Math.PI / 180) * 20}px`,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Crescent moon and star celebration animation
export const CrescentCelebration = ({ trigger, className }: { trigger: boolean; className?: string }) => {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) return null

  return (
    <AnimatePresence>
      {trigger && (
        <div className={cn('absolute inset-0 pointer-events-none flex items-center justify-center', className)}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.8, ease: 'backOut' }}
            className="relative"
          >
            {/* Crescent moon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="text-6xl"
            >
              🌙
            </motion.div>
            
            {/* Star */}
            <motion.div
              className="absolute -top-2 -right-2 text-3xl"
              animate={{ 
                rotate: [0, -20, 20, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              ⭐
            </motion.div>
            
            {/* Sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg"
                style={{
                  left: `${Math.cos(i * 60 * Math.PI / 180) * 80}px`,
                  top: `${Math.sin(i * 60 * Math.PI / 180) * 80}px`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                ✨
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Gentle pulse animation for buttons
export const ButtonDelight = ({ 
  children, 
  onClick, 
  className,
  variant = 'primary',
  loading = false,
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'success'
  loading?: boolean
  [key: string]: any
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
    success: 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
  }

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl',
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <>
            <PrayerBeadsLoader size="sm" />
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </div>
    </motion.button>
  )
}

// Success confetti burst
export const SuccessConfetti = ({ trigger, className }: { trigger: boolean; className?: string }) => {
  const shouldReduceMotion = useReducedMotion()
  
  if (shouldReduceMotion) return null

  return (
    <AnimatePresence>
      {trigger && (
        <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: '50vw',
                y: '50vh',
                rotate: 0,
                scale: 0,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 200}vw`,
                y: `${100 + Math.random() * 20}vh`,
                rotate: Math.random() * 720,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: 'easeOut',
              }}
            >
              <div className={cn(
                'w-3 h-3 rounded-full',
                i % 4 === 0 ? 'bg-green-400' :
                i % 4 === 1 ? 'bg-blue-400' :
                i % 4 === 2 ? 'bg-purple-400' : 'bg-yellow-400'
              )} />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// Islamic geometric border animation
export const IslamicBorder = ({ className, animate = true }: { className?: string; animate?: boolean }) => (
  <div className={cn('relative', className)}>
    <div className="absolute inset-0 rounded-3xl overflow-hidden">
      <motion.div
        className="absolute inset-0 border-2 border-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-3xl"
        animate={animate ? {
          background: [
            'linear-gradient(0deg, #10b981, #3b82f6, #8b5cf6, #10b981)',
            'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6, #10b981)',
            'linear-gradient(180deg, #10b981, #3b82f6, #8b5cf6, #10b981)',
            'linear-gradient(270deg, #10b981, #3b82f6, #8b5cf6, #10b981)',
          ]
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  </div>
)

// Milestone celebration component
export const MilestoneCelebration = ({ 
  milestone, 
  show, 
  onComplete 
}: { 
  milestone: string
  show: boolean
  onComplete?: () => void 
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CrescentCelebration trigger={true} />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Milestone Achieved! 🎉
              </h2>
              <p className="text-gray-600">
                {milestone}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm text-gray-500"
            >
              May Allah bless your journey ✨
            </motion.div>
          </motion.div>
          
          <SuccessConfetti trigger={true} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Gentle breathing animation for cards
export const BreathingCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      className={className}
      animate={shouldReduceMotion ? {} : {
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Wisdom quote animator
export const WisdomQuote = ({ quote, author, className }: { 
  quote: string
  author: string
  className?: string 
}) => (
  <motion.div
    className={cn('text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200', className)}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: 'spring' }}
      className="flex items-center justify-center space-x-2 mb-4"
    >
      <Heart className="w-5 h-5 text-green-600" />
      <span className="font-semibold text-gray-900">Islamic Wisdom</span>
      <Heart className="w-5 h-5 text-green-600" />
    </motion.div>
    
    <motion.p
      className="text-gray-700 italic mb-2 leading-relaxed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      {quote}
    </motion.p>
    
    <motion.p
      className="text-gray-600 font-medium text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      {author}
    </motion.p>
  </motion.div>
)

// Subscription tier glow effect
export const SubscriptionGlow = ({ tier, className }: { tier: 'intention' | 'patience' | 'reliance'; className?: string }) => {
  const glowColors = {
    intention: 'shadow-green-400/50',
    patience: 'shadow-blue-400/50',
    reliance: 'shadow-purple-400/50'
  }
  
  return (
    <div className={cn('absolute inset-0 rounded-3xl animate-pulse', glowColors[tier], className)} />
  )
}