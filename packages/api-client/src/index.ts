/**
 * FADDL Match API Client
 * TypeScript client for interacting with Supabase Edge Functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@faddlmatch/types'

export interface ApiClientConfig {
  supabaseUrl: string
  supabaseKey: string
  authToken?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  [key: string]: any
}

// Request/Response Types
export interface CreateProfileRequest {
  userId: string
  basicInfo: {
    age: number
    gender: 'male' | 'female'
    location_city: string
    location_country: string
    bio: string
  }
  religiousInfo: {
    religious_level: 'learning' | 'practicing' | 'devout'
    prayer_frequency: 'rarely' | 'sometimes' | 'regularly' | 'always'
    hijab_preference?: 'required' | 'preferred' | 'optional'
    beard_preference?: 'required' | 'preferred' | 'optional'
  }
  personalInfo: {
    education_level: 'high_school' | 'bachelors' | 'masters' | 'doctorate'
    occupation: string
    interests: string[]
    languages: string[]
    seeking_marriage_timeline: 'immediately' | 'within_year' | 'within_two_years' | 'when_ready'
  }
  familyInfo: {
    guardian_enabled: boolean
    guardian_email?: string
    family_values: string[]
    children_preference: 'definitely' | 'probably' | 'maybe' | 'no'
  }
  preferences: {
    age_range: [number, number]
    location_radius_km?: number
    education_preference?: string[]
    religious_level_preference?: string[]
  }
}

export interface MatchGenerationRequest {
  userId: string
  limit?: number
  filters?: {
    ageRange?: [number, number]
    locationRadius?: number
    educationLevel?: string[]
    religiousLevel?: string[]
  }
}

export interface SendMessageRequest {
  conversationId: string
  content: string
  messageType?: 'text' | 'photo' | 'audio'
  replyToId?: string
}

export interface UserSyncRequest {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
}

export class FaddlMatchApiClient {
  private supabase: SupabaseClient<Database>
  private authToken?: string
  private baseUrl: string

  constructor(config: ApiClientConfig) {
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey)
    this.authToken = config.authToken
    this.baseUrl = `${config.supabaseUrl}/functions/v1`
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string): void {
    this.authToken = token
  }

  /**
   * Make authenticated request to Edge Function
   */
  private async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/${endpoint}`
      
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      }

      if (this.authToken) {
        requestHeaders['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          ...data
        }
      }

      return {
        success: true,
        data,
        ...data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // Authentication & User Management
  /**
   * Sync Clerk user with Supabase
   */
  async syncUser(request: UserSyncRequest): Promise<ApiResponse> {
    return this.makeRequest('auth-sync-user', 'POST', request)
  }

  // Profile Management
  /**
   * Create user profile
   */
  async createProfile(request: CreateProfileRequest): Promise<ApiResponse> {
    return this.makeRequest('profile-create', 'POST', request)
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<CreateProfileRequest>): Promise<ApiResponse> {
    return this.makeRequest('profile-update', 'POST', { userId, ...updates })
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      }
    }
  }

  // Matching System
  /**
   * Generate matches for user
   */
  async generateMatches(request: MatchGenerationRequest): Promise<ApiResponse> {
    return this.makeRequest('matches-generate', 'POST', request)
  }

  /**
   * Respond to a match (accept/reject)
   */
  async respondToMatch(matchId: string, response: 'accepted' | 'rejected'): Promise<ApiResponse> {
    return this.makeRequest('matches-respond', 'POST', { matchId, response })
  }

  /**
   * Get potential matches
   */
  async getPotentialMatches(userId: string, limit: number = 10): Promise<ApiResponse> {
    return this.makeRequest('matches-potential', 'POST', { userId, limit })
  }

  // Messaging System
  /**
   * Send message
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse> {
    return this.makeRequest('messages-send', 'POST', request)
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string, limit: number = 50): Promise<ApiResponse> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          id,
          content,
          message_type,
          created_at,
          sender:users(id, first_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversation'
      }
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesRead(conversationId: string, userId: string): Promise<ApiResponse> {
    return this.makeRequest('messages-mark-read', 'POST', { conversationId, userId })
  }

  // Guardian System
  /**
   * Invite guardian
   */
  async inviteGuardian(guardianEmail: string, userId: string): Promise<ApiResponse> {
    return this.makeRequest('guardian-invite', 'POST', { guardianEmail, userId })
  }

  /**
   * Guardian approve match
   */
  async guardianApproveMatch(matchId: string, approved: boolean, notes?: string): Promise<ApiResponse> {
    return this.makeRequest('guardian-approve', 'POST', { matchId, approved, notes })
  }

  // Analytics & Tracking
  /**
   * Track user event
   */
  async trackEvent(userId: string, eventType: string, eventData?: any): Promise<ApiResponse> {
    return this.makeRequest('analytics-track', 'POST', { userId, eventType, eventData })
  }

  // Direct Supabase Access (for complex queries)
  /**
   * Get Supabase client for direct access
   */
  getSupabaseClient(): SupabaseClient<Database> {
    return this.supabase
  }

  // Real-time subscriptions
  /**
   * Subscribe to new matches
   */
  subscribeToMatches(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  /**
   * Subscribe to new messages
   */
  subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe()
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.supabase.removeAllChannels()
  }
}

// Export factory function
export function createFaddlMatchClient(config: ApiClientConfig): FaddlMatchApiClient {
  return new FaddlMatchApiClient(config)
}

// Export types
export type {
  Database,
  ApiClientConfig,
  ApiResponse,
  CreateProfileRequest,
  MatchGenerationRequest,
  SendMessageRequest,
  UserSyncRequest
}

export default FaddlMatchApiClient