'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  Filter, 
  MapPin, 
  GraduationCap, 
  Heart, 
  Calendar,
  X,
  Users,
  Star,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'


const educationOptions = [
  { value: 'high_school', label: 'High School' },
  { value: 'bachelors', label: 'Bachelor\'s Degree' },
  { value: 'masters', label: 'Master\'s Degree' },
  { value: 'doctorate', label: 'Doctorate' }
]

const religiousLevelOptions = [
  { value: 'learning', label: 'Learning' },
  { value: 'practicing', label: 'Practicing' },
  { value: 'devout', label: 'Devout' }
]

export function SearchInterface() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  
  // Filter state
  const [filters, setFilters] = useState({
    ageRange: [22, 35] as [number, number],
    location: '',
    education: [] as string[],
    religiousLevel: [] as string[],
    profession: '',
    radius: 50
  })

  const handleSearch = async () => {
    setIsSearching(true)
    
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      if (filters.location) {
        params.append('location', filters.location)
      }
      
      if (filters.education.length > 0) {
        params.append('education', filters.education.join(','))
      }
      
      if (filters.religiousLevel.length > 0) {
        params.append('religious_level', filters.religiousLevel.join(','))
      }
      
      if (filters.profession) {
        params.append('profession', filters.profession)
      }
      
      // Add age range
      params.append('min_age', filters.ageRange[0].toString())
      params.append('max_age', filters.ageRange[1].toString())
      
      // Call the profiles API with search filters
      const response = await fetch(`/api/profiles?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      // Transform API response to match expected format
      const searchResults = (data.profiles || []).map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        age: profile.age,
        location: profile.location,
        profession: profile.profession,
        photos: profile.photos || [],
        bio: profile.bio,
        compatibility: profile.compatibility || { score: 0, strengths: [] },
        lastActive: new Date(profile.last_active),
        verified: profile.verified,
        premiumMember: profile.premium_member,
        religiousLevel: profile.religious_level,
        educationLevel: profile.education_level
      }))
      
      setResults(searchResults)
      
      if (searchResults.length === 0) {
        toast.info('No profiles found matching your criteria. Try adjusting your filters.')
      }
      
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addEducationFilter = (education: string) => {
    if (!filters.education.includes(education)) {
      setFilters(prev => ({
        ...prev,
        education: [...prev.education, education]
      }))
    }
  }

  const removeEducationFilter = (education: string) => {
    setFilters(prev => ({
      ...prev,
      education: prev.education.filter(e => e !== education)
    }))
  }

  const addReligiousFilter = (level: string) => {
    if (!filters.religiousLevel.includes(level)) {
      setFilters(prev => ({
        ...prev,
        religiousLevel: [...prev.religiousLevel, level]
      }))
    }
  }

  const removeReligiousFilter = (level: string) => {
    setFilters(prev => ({
      ...prev,
      religiousLevel: prev.religiousLevel.filter(l => l !== level)
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      ageRange: [22, 35],
      location: '',
      education: [],
      religiousLevel: [],
      profession: '',
      radius: 50
    })
    setSearchQuery('')
  }

  const handleLike = (profileId: string) => {
    console.log('Liked profile:', profileId)
    // In a real app, this would call the API to record the interest
  }

  const handlePass = (profileId: string) => {
    console.log('Passed on profile:', profileId)
    // Remove from results or mark as passed
    setResults(prev => prev.filter(r => r.id !== profileId))
  }

  const handleMessage = (profileId: string) => {
    console.log('Send message to profile:', profileId)
    // In a real app, this would navigate to messaging or start a conversation
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl p-6 border border-neutral-100">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, profession, or location..."
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.education.length > 0 || filters.religiousLevel.length > 0) && (
              <Badge variant="primary" className="ml-1">
                {filters.education.length + filters.religiousLevel.length}
              </Badge>
            )}
          </Button>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="gap-2"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl p-6 border border-neutral-100"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Age Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Age Range
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={filters.ageRange[0]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    ageRange: [parseInt(e.target.value), prev.ageRange[1]]
                  }))}
                  className="w-20"
                  min="18"
                  max="65"
                />
                <span className="text-sm text-neutral-600">to</span>
                <Input
                  type="number"
                  value={filters.ageRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    ageRange: [prev.ageRange[0], parseInt(e.target.value)]
                  }))}
                  className="w-20"
                  min="18"
                  max="65"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Central Singapore"
              />
            </div>

            {/* Search Radius */}
            <div className="space-y-3">
              <Label>Search Radius (km)</Label>
              <Input
                type="number"
                value={filters.radius}
                onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                min="1"
                max="500"
              />
            </div>

            {/* Profession */}
            <div className="space-y-3">
              <Label>Profession</Label>
              <Input
                value={filters.profession}
                onChange={(e) => setFilters(prev => ({ ...prev, profession: e.target.value }))}
                placeholder="e.g., Teacher, Doctor, Engineer"
              />
            </div>
          </div>

          {/* Education Level */}
          <div className="mt-6 space-y-3">
            <Label className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Education Level
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.education.map((edu) => (
                <Badge key={edu} variant="secondary" className="gap-1">
                  {educationOptions.find(e => e.value === edu)?.label}
                  <button
                    onClick={() => removeEducationFilter(edu)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addEducationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add education level" />
              </SelectTrigger>
              <SelectContent>
                {educationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Religious Level */}
          <div className="mt-6 space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Religious Level
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.religiousLevel.map((level) => (
                <Badge key={level} variant="secondary" className="gap-1">
                  {religiousLevelOptions.find(r => r.value === level)?.label}
                  <button
                    onClick={() => removeReligiousFilter(level)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addReligiousFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add religious level" />
              </SelectTrigger>
              <SelectContent>
                {religiousLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="mt-6 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </Button>
            <div className="text-sm text-neutral-600">
              {results.length} profiles match your criteria
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      <div className="space-y-6">
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-islamic-green mx-auto mb-4"></div>
              <p className="text-neutral-600">Searching for matches...</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">
                Search Results ({results.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Star className="h-4 w-4" />
                Sorted by compatibility
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ProfileCard
                    profile={profile}
                    onLike={() => handleLike(profile.id)}
                    onPass={() => handlePass(profile.id)}
                    onMessage={() => handleMessage(profile.id)}
                    variant="grid"
                  />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No matches found</h3>
            <p className="text-neutral-600 mb-4">
              Try adjusting your search criteria or filters to find more profiles
            </p>
            <Button onClick={clearAllFilters} variant="outline">
              Clear Filters and Search Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}