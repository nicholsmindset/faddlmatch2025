'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useUserContext } from '@/contexts/UserContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Settings,
  Search,
  User,
  Shield,
  Gift,
  Star,
  Crown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MilestoneCelebration,
  FloatingParticles,
  IslamicPattern,
  WisdomQuote,
  BreathingCard,
  ButtonDelight
} from '@/components/ui/DelightfulAnimations'

export function DashboardContent() {
  const { user } = useUser()
  const { profile, loading } = useUserContext()
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneText, setMilestoneText] = useState('')
  
  // Check if this is user's first dashboard visit after subscription
  useEffect(() => {
    const isFirstDashboardVisit = !localStorage.getItem('dashboard-visited')
    const hasJustSubscribed = new URLSearchParams(window.location.search).get('welcome') === 'true'
    
    if (isFirstDashboardVisit && hasJustSubscribed) {
      setIsFirstVisit(true)
      setMilestoneText('Welcome to your FADDL Match dashboard! Your journey begins now.')
      setShowMilestone(true)
      localStorage.setItem('dashboard-visited', 'true')
    }
    
    // Show milestone for significant progress
    if (stats.profileCompletion === 100 && !localStorage.getItem('profile-complete-celebrated')) {
      setTimeout(() => {
        setMilestoneText('Profile completed! You\'re now ready to find amazing matches.')
        setShowMilestone(true)
        localStorage.setItem('profile-complete-celebrated', 'true')
      }, 2000)
    }
  }, [])

  // Mock data for demonstration
  const stats = {
    newMatches: 3,
    messages: 2,
    profileViews: 12,
    profileCompletion: 85
  }

  const recentMatches = [
    {
      id: '1',
      name: 'Sister Fatima',
      age: 32,
      location: 'Central Singapore',
      ethnicity: 'Malay',
      compatibility: 95,
      photo: '/api/placeholder/64/64'
    },
    {
      id: '2',
      name: 'Sister Aisha',
      age: 28,
      location: 'East Singapore',
      ethnicity: 'Indian',
      compatibility: 88,
      photo: '/api/placeholder/64/64'
    },
    {
      id: '3',
      name: 'Sister Zara',
      age: 30,
      location: 'West Singapore',
      ethnicity: 'Arabic',
      compatibility: 82,
      photo: '/api/placeholder/64/64'
    }
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'match',
      message: 'New match with Sister Aisha',
      time: '2 hours ago',
      color: 'bg-islamic-green'
    },
    {
      id: '2',
      type: 'message',
      message: 'Message from Brother Ahmad',
      time: '4 hours ago',
      color: 'bg-islamic-gold'
    },
    {
      id: '3',
      type: 'view',
      message: 'Profile viewed by 3 people',
      time: '1 day ago',
      color: 'bg-blue-500'
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-islamic-green"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Delightful background elements */}
      <IslamicPattern className="text-green-200 opacity-30" />
      <FloatingParticles count={8} className="opacity-20" />
      
      {/* Milestone celebration */}
      <MilestoneCelebration 
        milestone={milestoneText}
        show={showMilestone}
        onComplete={() => setShowMilestone(false)}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Enhanced Header with delightful greeting */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <motion.h1 
              className="text-3xl font-bold text-neutral-900 flex items-center space-x-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span>Assalamu Alaikum, {user?.firstName || 'Sister/Brother'}</span>
              {isFirstVisit && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="text-2xl"
                >
                  🎉
                </motion.span>
              )}
            </motion.h1>
            <motion.p 
              className="text-neutral-600 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isFirstVisit 
                ? 'Welcome to your halal matrimonial journey! Let\'s find your perfect match.' 
                : 'Welcome back to your matrimonial journey'
              }
            </motion.p>
          </div>
          
          {/* Enhanced profile completion prompt */}
          {stats.profileCompletion < 100 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/profile">
                <ButtonDelight variant="primary" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Complete Profile
                  <Sparkles className="h-4 w-4" />
                </ButtonDelight>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Quick Stats with delightful animations */}
        <motion.div 
          className="grid md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/matches">
            <BreathingCard className="group">
              <motion.div 
                className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden"
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Subtle shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-neutral-600">New Matches</p>
                    <motion.p 
                      className="text-2xl font-bold text-neutral-900"
                      key={stats.newMatches}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {stats.newMatches}
                    </motion.p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-islamic-green/10 rounded-full flex items-center justify-center"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Heart className="w-6 h-6 text-islamic-green" />
                  </motion.div>
                </div>
              </motion.div>
            </BreathingCard>
          </Link>

          <Link href="/messages">
            <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Messages</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.messages}</p>
                </div>
                <div className="w-12 h-12 bg-islamic-gold/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-islamic-gold" />
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Profile Views</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.profileViews}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <Link href="/profile">
            <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Profile Complete</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.profileCompletion}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Matches */}
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">Today's Matches</h2>
                <Link href="/matches" className="text-islamic-green hover:text-islamic-green/80 transition-colors flex items-center gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center space-x-4 p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-neutral-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">{match.name}</h3>
                      <p className="text-sm text-neutral-600">{match.age} years • {match.location} • {match.ethnicity}</p>
                      <p className="text-sm text-islamic-green font-medium">{match.compatibility}% compatibility</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="primary">
                        Interest
                      </Button>
                      <Button size="sm" variant="outline">
                        Pass
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Recent Activity</h2>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
                    <div>
                      <p className="text-neutral-900">{activity.message}</p>
                      <p className="text-sm text-neutral-600">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Islamic Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <WisdomQuote
                quote="And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
                author="- Quran 30:21"
                className="text-sm border-0 bg-gradient-to-br from-islamic-green/10 to-islamic-gold/10"
              />
            </motion.div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link href="/profile" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <User className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Edit Profile</span>
                </Link>
                
                <Link href="/search" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Search className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Search Matches</span>
                </Link>
                
                <Link href="/messages" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <MessageCircle className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Messages</span>
                </Link>
                
                <Link href="/guardian" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Guardian</span>
                </Link>
                
                <Link href="/settings" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Settings</span>
                </Link>
              </div>
            </div>

            {/* Enhanced Profile Completion */}
            <motion.div 
              className="bg-white rounded-xl p-6 border border-neutral-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="font-semibold text-neutral-900">Complete Your Profile</h3>
                {stats.profileCompletion === 100 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                  >
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Profile Progress</span>
                  <motion.span 
                    className="text-sm font-semibold text-islamic-green"
                    key={stats.profileCompletion}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    {stats.profileCompletion}%
                  </motion.span>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-islamic-green to-green-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.profileCompletion}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  />
                </div>
                
                <div className="text-xs text-neutral-600 space-y-1">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>✓ Basic information complete</motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>✓ Photos uploaded</motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>! Add more about your preferences</motion.p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}