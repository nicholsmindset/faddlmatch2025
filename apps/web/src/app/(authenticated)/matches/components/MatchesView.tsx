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
    bio: 'Practicing Muslimah seeking a kind and practicing husband for marriage...',
    compatibility: { score: 92, strengths: ['Same religious level', 'Similar interests', 'Compatible age'] },
    lastActive: new Date(),
    verified: true,
    premiumMember: true,
    religiousLevel: 'practicing',
    educationLevel: 'bachelors'
  },
  // Add more mock profiles...
]

export function MatchesView() {
  const [activeTab, setActiveTab] = useState('daily')

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
                We found {mockMatches.length} compatible profiles based on your preferences.
              </p>
            </motion.div>
          )}

          {/* Match Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ProfileCard
                  profile={match}
                  onLike={() => console.log('Liked:', match.id)}
                  onPass={() => console.log('Passed:', match.id)}
                  onMessage={() => console.log('Message:', match.id)}
                  variant="grid"
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}