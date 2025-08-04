'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Sparkles, Heart, Clock, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Keep mock data as fallback
const mockMatches = [
  {
    id: '1',
    name: 'Aisha Rahman',
    age: 26,
    location: 'Singapore Central',
    profession: 'Teacher',
    photos: [{ url: '/api/placeholder/400/600', visibility: 'public' as const }],
    bio: 'Practicing Muslimah seeking a kind and practicing husband for marriage. Love teaching and helping children learn.',
    compatibility: { score: 92, strengths: ['Same religious level', 'Similar interests', 'Compatible age'] },
    lastActive: new Date(),
    verified: true,
    premiumMember: true,
    religiousLevel: 'practicing',
    educationLevel: 'bachelors'
  },
  {
    id: '2',
    name: 'Fatima Al-Zahra',
    age: 24,
    location: 'Singapore East',
    profession: 'Doctor',
    photos: [{ url: '/api/placeholder/400/600', visibility: 'public' as const }],
    bio: 'Medical doctor who believes in the importance of family and faith. Looking for a partner who shares Islamic values.',
    compatibility: { score: 88, strengths: ['Education compatibility', 'Religious alignment', 'Family values'] },
    lastActive: new Date(Date.now() - 3600000),
    verified: true,
    premiumMember: false,
    religiousLevel: 'devout',
    educationLevel: 'masters'
  },
  {
    id: '3',
    name: 'Zara Malik',
    age: 28,
    location: 'Singapore West',
    profession: 'Engineer',
    photos: [{ url: '/api/placeholder/400/600', visibility: 'public' as const }],
    bio: 'Software engineer with a passion for technology and Islamic studies. Seeking a life partner for both Dunya and Akhirah.',
    compatibility: { score: 85, strengths: ['Career compatibility', 'Age range', 'Shared interests'] },
    lastActive: new Date(Date.now() - 7200000),
    verified: true,
    premiumMember: true,
    religiousLevel: 'practicing',
    educationLevel: 'masters'
  },
  {
    id: '4',
    name: 'Mariam Hassan',
    age: 30,
    location: 'Singapore North',
    profession: 'Pharmacist',
    photos: [{ url: '/api/placeholder/400/600', visibility: 'public' as const }],
    bio: 'Pharmacist who values Islamic principles and family life. Looking for a practicing Muslim for a blessed marriage.',
    compatibility: { score: 79, strengths: ['Religious compatibility', 'Professional background', 'Age compatibility'] },
    lastActive: new Date(Date.now() - 14400000),
    verified: true,
    premiumMember: true,
    religiousLevel: 'practicing',
    educationLevel: 'bachelors'
  }
]

export function MatchesView() {
  const [activeTab, setActiveTab] = useState('daily')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch matches from API
  const fetchMatches = async (type: string = 'daily') => {
    try {
      setLoading(true)
      const response = await fetch(`/api/matches?type=${type}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      
      const data = await response.json()
      setMatches(data.matches || mockMatches) // Fallback to mock data
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches(mockMatches) // Use mock data on error
      toast.error('Failed to load matches. Using demo data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches(activeTab)
  }, [activeTab])

  const handleLike = async (profileId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'like',
          targetUserId: profileId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to express interest')
      }

      const data = await response.json()
      
      if (data.isMutualMatch) {
        toast.success('🎉 It\'s a match! You can now start messaging.')
      } else {
        toast.success('Interest expressed! They will be notified if there\'s mutual interest.')
      }
      
      // Remove from current matches view
      setMatches(prev => prev.filter(m => m.id !== profileId))
      
    } catch (error) {
      console.error('Failed to express interest:', error)
      toast.error('Failed to express interest. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePass = async (profileId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'pass',
          targetUserId: profileId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to pass profile')
      }
      
      // Remove from current matches
      setMatches(prev => prev.filter(m => m.id !== profileId))
      toast.success('Profile passed')
      
    } catch (error) {
      console.error('Failed to pass on profile:', error)
      toast.error('Failed to pass. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMessage = async (profileId: string) => {
    try {
      // Navigate to messages with this profile
      window.location.href = `/messages?conversation=${profileId}`
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  // API handles filtering, so we just return matches
  const filteredMatches = matches

  return (
    <div className="space-y-6">
      {/* Match Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="daily" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="mutual" className="gap-2">
            <Heart className="h-4 w-4" />
            Mutual
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="nearby" className="gap-2">
            <Users className="h-4 w-4" />
            Nearby
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Welcome Message */}
          {activeTab === 'daily' && filteredMatches.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg bg-primary-50 p-4"
            >
              <h2 className="mb-1 text-lg font-semibold text-primary-900">
                Today's Matches Are Ready! 🌟
              </h2>
              <p className="text-sm text-primary-700">
                We found {filteredMatches.length} compatible profiles based on your preferences.
              </p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-neutral-600">Loading matches...</span>
            </div>
          )}

          {/* Match Grid */}
          {!loading && filteredMatches.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ProfileCard
                  profile={{
                    ...match,
                    name: `${match.first_name} ${match.last_name}`,
                    lastActive: new Date(match.last_active),
                    premiumMember: match.premium_member,
                    religiousLevel: match.religious_level,
                    educationLevel: match.education_level
                  }}
                  onLike={() => handleLike(match.id)}
                  onPass={() => handlePass(match.id)}
                  onMessage={() => handleMessage(match.id)}
                  variant="grid"
                  loading={actionLoading}
                />
                </motion.div>
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No matches found
              </h3>
              <p className="text-neutral-600">
                {activeTab === 'mutual' && 'No mutual interests yet. Keep liking profiles!'}
                {activeTab === 'recent' && 'No recently active matches.'}
                {activeTab === 'nearby' && 'No nearby matches found.'}
                {activeTab === 'daily' && 'Check back later for new matches!'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}