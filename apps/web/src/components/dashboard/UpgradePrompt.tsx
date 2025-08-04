/**
 * 💎 Upgrade Prompt Component
 * Strategic upgrade touchpoints for free users
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Crown, Sparkles, Heart, Users, Eye } from 'lucide-react'

interface UpgradePromptProps {
  type: 'daily-limit' | 'profile-views' | 'messaging' | 'features' | 'success-story'
  className?: string
}

export function UpgradePrompt({ type, className = '' }: UpgradePromptProps) {
  const promptConfig = {
    'daily-limit': {
      icon: Heart,
      title: "You've seen your 5 daily matches!",
      description: "Upgrade to Patience for unlimited matches and see who likes you.",
      buttonText: "Unlock Unlimited Matches",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50"
    },
    'profile-views': {
      icon: Eye,
      title: "3 people viewed your profile today!",
      description: "Upgrade to see who's interested in you and connect meaningfully.",
      buttonText: "See Who Likes You",
      color: "from-green-500 to-green-600", 
      borderColor: "border-green-200",
      bgColor: "bg-green-50"
    },
    'messaging': {
      icon: Users,
      title: "Ready to start meaningful conversations?",
      description: "Upgrade to unlock enhanced messaging and connect with your matches.",
      buttonText: "Upgrade for Messaging",
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-200", 
      bgColor: "bg-purple-50"
    },
    'features': {
      icon: Star,
      title: "Unlock Premium Features",
      description: "Advanced filters, priority support, and enhanced matching await you.",
      buttonText: "Explore Premium",
      color: "from-orange-500 to-orange-600",
      borderColor: "border-orange-200",
      bgColor: "bg-orange-50"
    },
    'success-story': {
      icon: Crown,
      title: "Sarah found her husband in 2 weeks!",
      description: "Join thousands who found their perfect match with our premium features.",
      buttonText: "Start Your Success Story",
      color: "from-pink-500 to-pink-600",
      borderColor: "border-pink-200",
      bgColor: "bg-pink-50"
    }
  }

  const config = promptConfig[type]
  const IconComponent = config.icon

  return (
    <motion.div
      className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center flex-shrink-0`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-2">{config.title}</h3>
          <p className="text-gray-600 text-sm mb-4">{config.description}</p>
          
          <Link href="/subscription">
            <button className={`inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${config.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5`}>
              <span>{config.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Islamic values note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Sparkles className="w-3 h-3" />
          <span>All features designed with Islamic values and halal guidelines</span>
        </div>
      </div>
    </motion.div>
  )
}

export default UpgradePrompt