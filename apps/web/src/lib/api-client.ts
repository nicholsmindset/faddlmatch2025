/**
 * FADDL Match API Client
 * Simplified client for web app integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

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
  private supabase: SupabaseClient
  private authToken?: string
  private baseUrl: string

  constructor(config: {
    supabaseUrl: string
    supabaseKey: string
    authToken?: string
  }) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
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
        }
      }

      return {
        success: true,
        data,
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
  async generateMatches(request: { userId: string; limit?: number }): Promise<ApiResponse> {
    return this.makeRequest('matches-generate', 'POST', request)
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
   * Get Supabase client for direct access
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase
  }
}

// Export factory function
export function createFaddlMatchClient(config: {
  supabaseUrl: string
  supabaseKey: string
  authToken?: string
}): FaddlMatchApiClient {
  return new FaddlMatchApiClient(config)
}