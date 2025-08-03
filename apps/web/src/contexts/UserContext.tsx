'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

// For now, we'll use a mock API client until the package is properly built
interface MockApiClient {
  getProfile: (userId: string) => Promise<{ success: boolean; data?: any; error?: string }>
  createProfile: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  updateProfile: (userId: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>
}

interface UserContextType {
  apiClient: MockApiClient | null
  profile: any | null
  loading: boolean
  refetchProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  apiClient: null,
  profile: null,
  loading: false,
  refetchProfile: async () => {}
})

// Mock API client for development
const createMockApiClient = (): MockApiClient => ({
  getProfile: async (userId: string) => {
    // Mock profile data
    return {
      success: true,
      data: {
        id: userId,
        firstName: 'Demo',
        lastName: 'User',
        age: 25,
        gender: 'male',
        location: 'Singapore',
        bio: 'This is a demo profile for development.',
        religious_level: 'practicing',
        prayer_frequency: 'regularly',
        education_level: 'bachelors',
        occupation: 'Software Engineer',
        interests: ['Reading', 'Technology', 'Travel'],
        languages: ['English', 'Malay'],
        seeking_marriage_timeline: 'within_year'
      }
    }
  },
  createProfile: async (data: any) => {
    console.log('Mock: Creating profile', data)
    return { success: true, data: { id: 'mock-profile-id', ...data } }
  },
  updateProfile: async (userId: string, data: any) => {
    console.log('Mock: Updating profile', userId, data)
    return { success: true, data: { id: userId, ...data } }
  }
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser()
  const [apiClient, setApiClient] = useState<MockApiClient | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Initialize API client (mock for now)
  useEffect(() => {
    if (isSignedIn && user) {
      // For development, we'll use a mock client
      const client = createMockApiClient()
      setApiClient(client)
    } else {
      setApiClient(null)
      setProfile(null)
    }
  }, [isSignedIn, user])

  // Fetch user profile
  const fetchProfile = async () => {
    if (!apiClient || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await apiClient.getProfile(user.id)
      if (result.success) {
        setProfile(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (apiClient) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [apiClient])

  const refetchProfile = async () => {
    await fetchProfile()
  }

  return (
    <UserContext.Provider value={{
      apiClient,
      profile,
      loading,
      refetchProfile
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}