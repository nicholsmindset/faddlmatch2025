'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useUserContext } from '@/contexts/UserContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
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
  Shield
} from 'lucide-react'
import { useState, useEffect } from 'react'

export function DashboardContent() {
  const { user } = useUser()
  const { user: contextUser, isLoading: loading } = useUserContext()
  const [userPlan, setUserPlan] = useState('intention') // Default to free plan
  const [isNewUser, setIsNewUser] = useState(false)

  // Fetch user's subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscriptions/status')
        if (response.ok) {
          const data = await response.json()
          setUserPlan(data.planId.toLowerCase())
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error)
      }
    }

    // Check if user is new (from URL params)
    const urlParams = new URLSearchParams(window.location.search)
    setIsNewUser(urlParams.get('newUser') === 'true')

    if (user) {
      fetchSubscriptionStatus()
    }
  }, [user])

  // Mock data for demonstration - adjust based on plan
  const stats = {
    newMatches: userPlan === 'intention' ? 3 : 8, // Free users see limited matches
    messages: userPlan === 'intention' ? 0 : 2, // Free users can't message
    profileViews: 12,
    profileCompletion: 85,
    dailyMatchesUsed: userPlan === 'intention' ? 3 : 0, // Track daily limit for free users
    dailyMatchesLimit: userPlan === 'intention' ? 5 : 999
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-neutral-900">
                Assalamu Alaikum, {user?.firstName || 'Sister/Brother'}
              </h1>
              <Badge 
                variant={userPlan === 'intention' ? 'secondary' : 'primary'}
                className={`${
                  userPlan === 'intention' 
                    ? 'bg-gray-100 text-gray-700' 
                    : userPlan === 'patience'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
              </Badge>
            </div>
            <p className="text-neutral-600 mt-1">
              {isNewUser ? 'Welcome to your new halal journey!' : 'Welcome back to your matrimonial journey'}
            </p>
          </div>
          
          {/* Check for incomplete profile */}
          {stats.profileCompletion < 100 && (
            <Link href="/profile">
              <Button variant="primary" className="gap-2">
                <Settings className="h-4 w-4" />
                Complete Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link href="/matches">
            <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">New Matches</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.newMatches}</p>
                </div>
                <div className="w-12 h-12 bg-islamic-green/10 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-islamic-green" />
                </div>
              </div>
            </div>
          </Link>

          {userPlan === 'intention' ? (
            <Link href="/subscription">
              <div className="bg-white rounded-xl p-6 border border-orange-200 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  Upgrade
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Messages</p>
                    <p className="text-2xl font-bold text-neutral-900">Locked</p>
                    <p className="text-xs text-orange-600 mt-1">Upgrade to message</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
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
          )}

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
                      <Button size="sm" variant="secondary">
                        Pass
                      </Button>
                    </div>
                  </div>
                ))}
              
              {/* Daily Matches Limit Notice for Free Users */}
              {userPlan === 'intention' && stats.dailyMatchesUsed >= stats.dailyMatchesLimit && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-orange-800">
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Daily limit reached!</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    You've seen all 5 of today's matches. Upgrade for unlimited matches!
                  </p>
                </div>
              )}
            </div>

            {/* Upgrade Prompts for Free Users */}
            {userPlan === 'intention' && (
              <div className="space-y-6">
                {/* Daily Limit Upgrade Prompt */}
                {stats.dailyMatchesUsed >= 3 && (
                  <UpgradePrompt type="daily-limit" />
                )}
                
                {/* Profile Views Upgrade Prompt */}
                {stats.profileViews > 0 && (
                  <UpgradePrompt type="profile-views" />
                )}
                
                {/* Success Story Prompt for New Users */}
                {isNewUser && (
                  <UpgradePrompt type="success-story" />
                )}
              </div>
            )}

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
            {/* Islamic Quote */}
            <div className="bg-gradient-to-br from-islamic-green/10 to-islamic-gold/10 rounded-xl p-6 border border-neutral-100">
              <h3 className="font-semibold text-neutral-900 mb-3">Daily Reminder</h3>
              <p className="text-neutral-700 italic text-sm leading-relaxed">
                "And among His signs is that He created for you mates from among yourselves, 
                that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
              </p>
              <p className="text-xs text-neutral-600 mt-3">- Quran 30:21</p>
            </div>

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

            {/* Profile Completion */}
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <h3 className="font-semibold text-neutral-900 mb-4">Complete Your Profile</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Profile Progress</span>
                  <span className="text-sm font-semibold text-islamic-green">{stats.profileCompletion}%</span>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-islamic-green h-2 rounded-full transition-all" 
                    style={{width: `${stats.profileCompletion}%`}}
                  />
                </div>
                
                <div className="text-xs text-neutral-600 space-y-1">
                  <p>✓ Basic information complete</p>
                  <p>✓ Photos uploaded</p>
                  <p>! Add more about your preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}