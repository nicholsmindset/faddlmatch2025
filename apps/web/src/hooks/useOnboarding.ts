import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
// import { createFaddlMatchClient } from '@faddlmatch/api-client' // TODO: Fix API client build

interface OnboardingData {
  basicInfo?: {
    firstName: string
    lastName: string
    yearOfBirth: number
    gender: 'male' | 'female'
    location: string
    bio: string
  }
  religiousInfo?: {
    religious_level: 'learning' | 'practicing' | 'devout'
    prayer_frequency: 'rarely' | 'sometimes' | 'regularly' | 'always'
    hijab_preference?: 'required' | 'preferred' | 'optional'
    beard_preference?: 'required' | 'preferred' | 'optional'
  }
  personalInfo?: {
    education_level: 'high_school' | 'bachelors' | 'masters' | 'doctorate'
    occupation: string
    interests: string[]
    languages: string[]
    seeking_marriage_timeline: 'immediately' | 'within_year' | 'within_two_years' | 'when_ready'
  }
  familyInfo?: {
    guardian_enabled: boolean
    guardian_email?: string
    family_values: string[]
    children_preference: 'definitely' | 'probably' | 'maybe' | 'no'
  }
  preferences?: {
    age_range: [number, number]
    location_radius_km?: number
    education_preference?: string[]
    religious_level_preference?: string[]
  }
  photos?: Array<{
    url: string
    visibility: 'public' | 'matches' | 'guardian_only'
  }>
}

export function useOnboarding() {
  const { user } = useUser()
  const [data, setData] = useState<OnboardingData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize API client - TODO: Fix API client package
  // const apiClient = createFaddlMatchClient({
  //   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   authToken: user?.id // In production, use proper JWT token
  // })

  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    setData(prev => ({
      ...prev,
      ...newData
    }))
  }, [])

  const submitProfile = useCallback(async () => {
    if (!user || !data.basicInfo) {
      throw new Error('Missing required user information')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Re-enable API client once package is fixed
      // First sync user with Supabase
      // await apiClient.syncUser({
      //   userId: user.id,
      //   email: user.emailAddresses[0]?.emailAddress || '',
      //   firstName: user.firstName || data.basicInfo.firstName,
      //   lastName: user.lastName || data.basicInfo.lastName,
      //   imageUrl: user.imageUrl
      // })

      // Create profile
      const profileData = {
        userId: user.id,
        basicInfo: {
          age: new Date().getFullYear() - data.basicInfo!.yearOfBirth,
          gender: data.basicInfo!.gender,
          location_city: data.basicInfo!.location,
          location_country: 'Singapore', // Default for FADDL Match
          bio: data.basicInfo!.bio
        },
        religiousInfo: data.religiousInfo || {
          religious_level: 'practicing',
          prayer_frequency: 'regularly'
        },
        personalInfo: data.personalInfo || {
          education_level: 'bachelors',
          occupation: 'Not specified',
          interests: [],
          languages: ['English'],
          seeking_marriage_timeline: 'when_ready'
        },
        familyInfo: data.familyInfo || {
          guardian_enabled: false,
          family_values: [],
          children_preference: 'maybe'
        },
        preferences: data.preferences || {
          age_range: [18, 40]
        }
      }

      // const result = await apiClient.createProfile(profileData)
      // 
      // if (!result.success) {
      //   throw new Error(result.error || 'Failed to create profile')
      // }

      // Temporary: Just log success for now
      console.log('Profile data prepared:', profileData)

      return { id: 'temp-profile-id', ...profileData }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [user, data])

  const calculateCompletionPercentage = useCallback(() => {
    let completed = 0
    const total = 5 // Number of steps

    if (data.basicInfo) completed++
    if (data.religiousInfo) completed++
    if (data.personalInfo) completed++
    if (data.familyInfo) completed++
    if (data.preferences) completed++

    return Math.round((completed / total) * 100)
  }, [data])

  return {
    data,
    updateData,
    submitProfile,
    isSubmitting,
    error,
    completionPercentage: calculateCompletionPercentage()
  }
}