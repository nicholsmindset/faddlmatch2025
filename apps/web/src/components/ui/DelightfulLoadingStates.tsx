/**
 * ⏳ Delightful Loading States
 * Islamic-themed loading animations and transitions for FADDL Match
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, Crown, Sparkles, Moon, Sun, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Prayer beads loading animation
export const PrayerBeadsLoading = ({ 
  size = 'md', 
  message = 'Loading...',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string 
}) => {
  const sizes = {
    sm: { container: 'w-16 h-16', bead: 'w-2 h-2', text: 'text-sm' },
    md: { container: 'w-24 h-24', bead: 'w-3 h-3', text: 'text-base' },
    lg: { container: 'w-32 h-32', bead: 'w-4 h-4', text: 'text-lg' }
  }

  const currentSize = sizes[size]

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className={cn('relative', currentSize.container)}>
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) * Math.PI / 180
          const radius = size === 'sm' ? 24 : size === 'md' ? 36 : 48
          
          return (
            <motion.div
              key={i}
              className={cn(
                'absolute rounded-full bg-gradient-to-r from-green-400 to-blue-400',
                currentSize.bead
              )}
              style={{
                left: `calc(50% + ${Math.cos(angle) * radius}px - ${size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px'})`,
                top: `calc(50% + ${Math.sin(angle) * radius}px - ${size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px'})`,
              }}
              animate={{
                scale: [0.6, 1.2, 0.6],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )
        })}
      </div>
      <motion.p
        className={cn('text-gray-600 font-medium', currentSize.text)}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// Crescent moon loading animation
export const CrescentLoading = ({ 
  message = 'Processing...',
  className 
}: { 
  message?: string
  className?: string 
}) => (
  <div className={cn('flex flex-col items-center justify-center space-y-6', className)}>
    <div className="relative w-20 h-20">
      {/* Moon */}
      <motion.div
        className="absolute inset-0 text-4xl flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        🌙
      </motion.div>
      
      {/* Star */}
      <motion.div
        className="absolute -top-2 -right-2 text-2xl"
        animate={{ 
          rotate: [0, -20, 20, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        ⭐
      </motion.div>
      
      {/* Orbiting sparkles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-xs"
          style={{
            left: '50%',
            top: '50%',
          }}
          animate={{
            rotate: 360,
            x: Math.cos(i * 120 * Math.PI / 180) * 35,
            y: Math.sin(i * 120 * Math.PI / 180) * 35,
          }}
          transition={{
            duration: 4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
    
    <motion.p
      className="text-gray-600 font-medium text-center max-w-xs"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {message}
    </motion.p>
  </div>
)

// Heart pulse loading for matches
export const HeartPulseLoading = ({ 
  message = 'Finding your perfect match...',
  className 
}: { 
  message?: string
  className?: string 
}) => (
  <div className={cn('flex flex-col items-center justify-center space-y-6', className)}>
    <div className="relative">
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="text-6xl"
      >
        💝
      </motion.div>
      
      {/* Pulse rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border-2 border-pink-300 rounded-full"
          animate={{ 
            scale: [1, 2.5, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{ 
            duration: 2, 
            delay: i * 0.6,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
    
    <motion.p
      className="text-gray-600 font-medium text-center max-w-sm"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {message}
    </motion.p>
  </div>
)

// Payment processing animation
export const PaymentProcessingLoading = ({ 
  step = 1,
  totalSteps = 3,
  className 
}: { 
  step?: number
  totalSteps?: number
  className?: string 
}) => {
  const steps = [
    { icon: '🔐', label: 'Securing your payment' },
    { icon: '💳', label: 'Processing transaction' },
    { icon: '✅', label: 'Activating your subscription' }
  ]

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-8 p-8', className)}>
      {/* Main loading animation */}
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 border-4 border-blue-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {steps[step - 1]?.icon}
          </motion.div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="space-y-4 text-center max-w-md">
        <motion.h3
          className="text-xl font-bold text-gray-900"
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {steps[step - 1]?.label}
        </motion.h3>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        
        <p className="text-gray-600 text-sm">
          Step {step} of {totalSteps} • This usually takes a few seconds
        </p>
      </div>

      {/* Security badge */}
      <motion.div
        className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={ { delay: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔒
        </motion.div>
        <span className="text-sm font-medium">256-bit SSL Encrypted</span>
      </motion.div>
    </div>
  )
}

// Skeleton loading with Islamic patterns
export const IslamicSkeleton = ({ 
  lines = 3,
  className 
}: { 
  lines?: number
  className?: string 
}) => (
  <div className={cn('space-y-4', className)}>
    {[...Array(lines)].map((_, i) => (
      <div key={i} className="relative">
        <motion.div
          className="h-4 bg-gray-200 rounded-full overflow-hidden"
          style={{ width: `${100 - (i * 10)}%` }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
      </div>
    ))}
  </div>
)

// Success transition animation
export const SuccessTransition = ({ 
  show,
  onComplete,
  message = 'Success!',
  className 
}: { 
  show: boolean
  onComplete?: () => void
  message?: string
  className?: string 
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className={cn('fixed inset-0 bg-white flex items-center justify-center z-50', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={() => {
          if (show) {
            setTimeout(() => {
              onComplete?.()
            }, 2000)
          }
        }}
      >
        <div className="text-center">
          {/* Success checkmark animation */}
          <motion.div
            className="relative w-32 h-32 mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="absolute inset-0 bg-green-100 rounded-full flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-6xl"
              >
                ✅
              </motion.div>
            </div>
            
            {/* Celebration particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos(i * 45 * Math.PI / 180) * 80,
                  y: Math.sin(i * 45 * Math.PI / 180) * 80,
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 + i * 0.1,
                }}
              />
            ))}
          </motion.div>

          <motion.h2
            className="text-3xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {message}
          </motion.h2>

          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Taking you to your dashboard...
          </motion.p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Typing indicator for messages
export const TypingIndicator = ({ 
  className,
  dots = 3 
}: { 
  className?: string
  dots?: number 
}) => (
  <div className={cn('flex items-center space-x-1', className)}>
    <span className="text-gray-500 text-sm">Typing</span>
    {[...Array(dots)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-gray-400 rounded-full"
        animate={{ 
          y: [0, -4, 0],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{ 
          duration: 0.8, 
          delay: i * 0.2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
)

// Loading overlay component
export const LoadingOverlay = ({ 
  show,
  type = 'prayer-beads',
  message = 'Loading...',
  className 
}: { 
  show: boolean
  type?: 'prayer-beads' | 'crescent' | 'heart-pulse' | 'payment'
  message?: string
  className?: string 
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'crescent':
        return <CrescentLoading message={message} />
      case 'heart-pulse':
        return <HeartPulseLoading message={message} />
      case 'payment':
        return <PaymentProcessingLoading />
      default:
        return <PrayerBeadsLoading message={message} size="lg" />
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderLoader()}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default {
  PrayerBeadsLoading,
  CrescentLoading,
  HeartPulseLoading,
  PaymentProcessingLoading,
  IslamicSkeleton,
  SuccessTransition,
  TypingIndicator,
  LoadingOverlay
}