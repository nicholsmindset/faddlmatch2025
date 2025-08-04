/**
 * 🎉 Subscription Delights - Special moments and Easter eggs
 * Celebrates subscription milestones, anniversaries, and engagement
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Heart, 
  Gift, 
  Star, 
  Trophy, 
  Crown,
  Sparkles,
  MessageSquare,
  Users,
  Zap,
  Award,
  Coffee,
  Moon,
  Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  CrescentCelebration,
  SuccessConfetti,
  MilestoneCelebration,
  ButtonDelight,
  WisdomQuote
} from '@/components/ui/DelightfulAnimations'

interface SubscriptionDelight {
  id: string
  type: 'milestone' | 'anniversary' | 'achievement' | 'seasonal'
  title: string
  message: string
  icon: React.ComponentType<any>
  celebration?: boolean
  reward?: string
  trigger: () => boolean
}

// Islamic calendar events and special occasions
const ISLAMIC_OCCASIONS = {
  ramadan: {
    name: 'Ramadan Kareem',
    greeting: 'May Allah bless your search during this holy month 🌙',
    color: 'from-purple-600 to-indigo-600'
  },
  eid: {
    name: 'Eid Mubarak',
    greeting: 'Wishing you and your future spouse a blessed Eid! 🌟',
    color: 'from-green-600 to-teal-600'
  },
  friday: {
    name: 'Jummah Mubarak',
    greeting: 'May your prayers be answered this blessed Friday 🤲',
    color: 'from-blue-600 to-indigo-600'
  }
}

// Subscription delights configuration
const SUBSCRIPTION_DELIGHTS: SubscriptionDelight[] = [
  // Milestone celebrations
  {
    id: 'first-week',
    type: 'milestone',
    title: 'One Week Strong! 💪',
    message: 'You\'ve been actively searching for a week. Your dedication is inspiring!',
    icon: Calendar,
    celebration: true,
    reward: 'Extra profile boost this week',
    trigger: () => {
      const subscriptionDate = localStorage.getItem('subscription-date')
      if (!subscriptionDate) return false
      const daysSince = Math.floor((Date.now() - new Date(subscriptionDate).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince === 7 && !localStorage.getItem('first-week-celebrated')
    }
  },
  {
    id: 'first-month',
    type: 'anniversary',
    title: 'One Month Anniversary! 🎉',
    message: 'Alhamdulillah! You\'ve completed your first month on FADDL Match. May Allah reward your patience.',
    icon: Trophy,
    celebration: true,
    reward: 'Premium features for the weekend',
    trigger: () => {
      const subscriptionDate = localStorage.getItem('subscription-date')
      if (!subscriptionDate) return false
      const daysSince = Math.floor((Date.now() - new Date(subscriptionDate).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince === 30 && !localStorage.getItem('first-month-celebrated')
    }
  },
  // Achievement celebrations
  {
    id: 'profile-complete',
    type: 'achievement',
    title: 'Profile Mastery! ✨',
    message: 'Your profile is now complete and attracting quality matches. Well done!',
    icon: Star,
    celebration: true,
    reward: '2x profile visibility for 24 hours',
    trigger: () => {
      const profileCompletion = localStorage.getItem('profile-completion')
      return profileCompletion === '100' && !localStorage.getItem('profile-complete-celebrated')
    }
  },
  {
    id: 'first-match',
    type: 'achievement',
    title: 'First Match! 💝',
    message: 'SubhanAllah! You\'ve received your first match. This could be the beginning of something beautiful.',
    icon: Heart,
    celebration: true,
    reward: 'Free premium messaging for this match',
    trigger: () => {
      const matchCount = localStorage.getItem('total-matches') || '0'
      return parseInt(matchCount) >= 1 && !localStorage.getItem('first-match-celebrated')
    }
  },
  // Seasonal delights
  {
    id: 'friday-blessing',
    type: 'seasonal',
    title: 'Jummah Mubarak! 🕌',
    message: 'May your duas be answered and your search be blessed this Friday.',
    icon: Moon,
    celebration: false,
    trigger: () => {
      const today = new Date()
      const isFriday = today.getDay() === 5
      const hasSeenTodaysFriday = localStorage.getItem('friday-blessing-' + today.toDateString())
      return isFriday && !hasSeenTodaysFriday
    }
  }
]

// Easter eggs for power users
const EASTER_EGGS = {
  konami: {
    sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
    reward: 'You found the secret code! Enjoy a week of premium features! 🎮',
    celebration: true
  },
  rapidClicks: {
    threshold: 10,
    timeframe: 3000, // 3 seconds
    reward: 'Wow, you\'re enthusiastic! Here\'s a special blessing for your energy! ⚡',
    celebration: true
  }
}

export function SubscriptionDelights() {
  const [activeDelight, setActiveDelight] = useState<SubscriptionDelight | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [konamiSequence, setKonamiSequence] = useState<string[]>([])
  const [rapidClickCount, setRapidClickCount] = useState(0)
  const [rapidClickTimer, setRapidClickTimer] = useState<NodeJS.Timeout | null>(null)

  // Check for active delights
  useEffect(() => {
    const checkDelights = () => {
      for (const delight of SUBSCRIPTION_DELIGHTS) {
        if (delight.trigger()) {
          setActiveDelight(delight)
          if (delight.celebration) {
            setShowCelebration(true)
            setShowConfetti(true)
          }
          // Mark as seen
          localStorage.setItem(delight.id + '-celebrated', 'true')
          break
        }
      }
    }

    checkDelights()
    
    // Check periodically
    const interval = setInterval(checkDelights, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Konami code detection
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const newSequence = [...konamiSequence, event.code].slice(-EASTER_EGGS.konami.sequence.length)
      setKonamiSequence(newSequence)
      
      if (newSequence.join(',') === EASTER_EGGS.konami.sequence.join(',')) {
        setActiveDelight({
          id: 'konami',
          type: 'achievement',
          title: 'Secret Code Unlocked! 🎮',
          message: EASTER_EGGS.konami.reward,
          icon: Zap,
          celebration: true,
          trigger: () => false
        })
        setShowCelebration(true)
        setShowConfetti(true)
        setKonamiSequence([])
        localStorage.setItem('konami-unlocked', 'true')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [konamiSequence])

  // Rapid click detection
  const handleRapidClick = () => {
    setRapidClickCount(prev => prev + 1)
    
    if (rapidClickTimer) {
      clearTimeout(rapidClickTimer)
    }
    
    const timer = setTimeout(() => {
      if (rapidClickCount >= EASTER_EGGS.rapidClicks.threshold) {
        setActiveDelight({
          id: 'rapid-clicks',
          type: 'achievement',
          title: 'Energy Overload! ⚡',
          message: EASTER_EGGS.rapidClicks.reward,
          icon: Coffee,
          celebration: true,
          trigger: () => false
        })
        setShowCelebration(true)
        setShowConfetti(true)
        localStorage.setItem('rapid-clicks-unlocked', 'true')
      }
      setRapidClickCount(0)
    }, EASTER_EGGS.rapidClicks.timeframe)
    
    setRapidClickTimer(timer)
  }

  // Special occasion checker
  const getSpecialOccasion = () => {
    const today = new Date()
    const day = today.getDay()
    const month = today.getMonth() + 1
    const date = today.getDate()
    
    // Friday check
    if (day === 5) {
      return ISLAMIC_OCCASIONS.friday
    }
    
    // Add more Islamic calendar checks here
    // This would ideally integrate with an Islamic calendar API
    
    return null
  }

  const specialOccasion = getSpecialOccasion()

  return (
    <>
      {/* Main celebration modal */}
      <MilestoneCelebration
        milestone={activeDelight?.message || ''}
        show={showCelebration}
        onComplete={() => {
          setShowCelebration(false)
          setShowConfetti(false)
          setActiveDelight(null)
        }}
      />

      {/* Confetti effect */}
      <SuccessConfetti trigger={showConfetti} />

      {/* Special occasion banner */}
      {specialOccasion && (
        <motion.div
          className={cn(
            'fixed top-4 right-4 z-40 max-w-sm p-4 rounded-2xl shadow-lg text-white',
            'bg-gradient-to-r', specialOccasion.color
          )}
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 20,
            delay: 2 // Show after page load
          }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Moon className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="font-bold text-sm">{specialOccasion.name}</h3>
              <p className="text-xs opacity-90">{specialOccasion.greeting}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hidden rapid click detector */}
      <div
        className="fixed bottom-4 right-4 w-8 h-8 opacity-0 cursor-pointer z-50"
        onClick={handleRapidClick}
        title="🤔"
      />

      {/* Usage streak indicator */}
      <StreakIndicator />

      {/* Daily motivation quotes */}
      <DailyMotivation />
    </>
  )
}

// Streak indicator component
function StreakIndicator() {
  const [streak, setStreak] = useState(0)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)

  useEffect(() => {
    const lastVisit = localStorage.getItem('last-visit-date')
    const today = new Date().toDateString()
    const currentStreak = parseInt(localStorage.getItem('visit-streak') || '0')

    if (lastVisit === today) {
      setStreak(currentStreak)
      return
    }

    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit)
      const todayDate = new Date()
      const diffTime = Math.abs(todayDate.getTime() - lastVisitDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        const newStreak = currentStreak + 1
        setStreak(newStreak)
        localStorage.setItem('visit-streak', newStreak.toString())
        
        // Celebrate significant streaks
        if (newStreak % 7 === 0 && newStreak > 0) {
          setShowStreakCelebration(true)
        }
      } else {
        // Streak broken
        setStreak(1)
        localStorage.setItem('visit-streak', '1')
      }
    } else {
      // First visit
      setStreak(1)
      localStorage.setItem('visit-streak', '1')
    }

    localStorage.setItem('last-visit-date', today)
  }, [])

  if (streak < 3) return null

  return (
    <>
      <motion.div
        className="fixed top-4 left-4 z-40 bg-white rounded-full p-3 shadow-lg border-2 border-green-200"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1 }}
        whileHover={{ scale: 1.1 }}
      >
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          >
            <Zap className="w-5 h-5 text-green-600" />
          </motion.div>
          <div className="text-sm">
            <div className="font-bold text-gray-900">{streak} day streak!</div>
            <div className="text-xs text-gray-500">Keep it up! 🔥</div>
          </div>
        </div>
      </motion.div>

      <MilestoneCelebration
        milestone={`Amazing! You've maintained a ${streak} day streak! Your consistency will surely be rewarded. 🔥`}
        show={showStreakCelebration}
        onComplete={() => setShowStreakCelebration(false)}
      />
    </>
  )
}

// Daily motivation component
function DailyMotivation() {
  const [showMotivation, setShowMotivation] = useState(false)
  const [motivationQuote, setMotivationQuote] = useState('')

  const motivationalQuotes = [
    {
      text: "Have patience. All things are difficult before they become easy.",
      author: "- Saadi"
    },
    {
      text: "Allah does not burden a soul beyond that it can bear.",
      author: "- Quran 2:286"
    },
    {
      text: "Trust in Allah, but tie your camel.",
      author: "- Prophet Muhammad (PBUH)"
    },
    {
      text: "The best of people are those who are most beneficial to others.",
      author: "- Prophet Muhammad (PBUH)"
    }
  ]

  useEffect(() => {
    const lastMotivation = localStorage.getItem('last-motivation-date')
    const today = new Date().toDateString()

    if (lastMotivation !== today) {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      setMotivationQuote(randomQuote.text + ' ' + randomQuote.author)
      
      // Show after 10 seconds of page load
      setTimeout(() => {
        setShowMotivation(true)
        localStorage.setItem('last-motivation-date', today)
      }, 10000)
    }
  }, [])

  return (
    <AnimatePresence>
      {showMotivation && (
        <motion.div
          className="fixed bottom-4 left-4 z-40 max-w-sm"
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 shadow-lg border border-green-200 relative">
            <button
              onClick={() => setShowMotivation(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <Star className="w-4 h-4" />
            </button>
            
            <div className="flex items-start space-x-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Heart className="w-6 h-6 text-green-600 mt-1" />
              </motion.div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Daily Inspiration</h4>
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  {motivationQuote}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SubscriptionDelights