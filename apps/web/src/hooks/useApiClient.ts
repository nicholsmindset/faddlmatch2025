/**
 * React hook for FADDL Match API Client
 */

'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useMemo } from 'react'
import { createFaddlMatchClient, FaddlMatchApiClient } from '@/lib/api-client'

export function useApiClient(): FaddlMatchApiClient | null {
  const { getToken, isLoaded } = useAuth()

  const client = useMemo(() => {
    if (!isLoaded) return null

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing Supabase environment variables')
      return null
    }

    return createFaddlMatchClient({
      supabaseUrl,
      supabaseKey,
    })
  }, [isLoaded])

  // Update auth token when available
  useEffect(() => {
    if (!client) return

    const updateToken = async () => {
      try {
        const token = await getToken({ template: 'supabase' })
        if (token) {
          client.setAuthToken(token)
        }
      } catch (error) {
        console.error('Failed to get auth token:', error)
      }
    }

    updateToken()
  }, [client, getToken])

  return client
}