'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Sparkles, Heart, Clock, Users } from 'lucide-react'

// Mock data - replace with API integration
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
  const [matches, setMatches] = useState(mockMatches)
  const [loading, setLoading] = useState(false)

  const handleLike = async (profileId: string) => {
    setLoading(true)
    try {
      // In a real app, this would call the API to record the interest
      console.log('Expressing interest in profile:', profileId)
      
      // Show success feedback
      alert('Interest expressed! They will be notified if there\'s mutual interest.')
      
      // Optionally remove from current view or mark as liked
      // setMatches(prev => prev.filter(m => m.id !== profileId))
      
    } catch (error) {
      console.error('Failed to express interest:', error)
      alert('Failed to express interest. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePass = async (profileId: string) => {
    setLoading(true)
    try {
      // In a real app, this would call the API to record the pass
      console.log('Passing on profile:', profileId)
      
      // Remove from current matches
      setMatches(prev => prev.filter(m => m.id !== profileId))
      
    } catch (error) {
      console.error('Failed to pass on profile:', error)
      alert('Failed to pass. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = async (profileId: string) => {
    try {
      // In a real app, this would navigate to messaging or check if messaging is allowed
      console.log('Starting conversation with profile:', profileId)
      
      // Check if they've mutually liked first
      alert('You can only message after both parties have expressed interest. Please like their profile first!')
      
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  const getFilteredMatches = () => {
    // Filter matches based on active tab
    switch (activeTab) {
      case 'daily':
        return matches // All matches for daily view
      case 'mutual':
        return matches.filter(m => m.id === '1') // Mock: only show mutual interests
      case 'recent':
        return matches.filter(m => Date.now() - m.lastActive.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      case 'nearby':
        return matches.filter(m => m.location.includes('Singapore')) // Same city
      default:
        return matches
    }
  }

  const filteredMatches = getFilteredMatches()

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
          {activeTab === 'daily' && mockMatches.length > 0 && (
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

          {/* Match Grid */}
          {filteredMatches.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ProfileCard
                  profile={match}
                  onLike={() => handleLike(match.id)}
                  onPass={() => handlePass(match.id)}
                  onMessage={() => handleMessage(match.id)}
                  variant="grid"
                />
                </motion.div>
              ))}
            </div>
          ) : (
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