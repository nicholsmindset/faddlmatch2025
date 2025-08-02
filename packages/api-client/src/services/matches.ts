/**
 * Enhanced Matches Service for FADDL Match
 * Comprehensive matching system with real-time notifications,
 * compatibility scoring, and Islamic compliance features
 */

import type { Database } from '@faddlmatch/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MatchEvent } from '../realtime/types'

export interface Match {
  id: string
  userAId: string
  userBId: string
  compatibilityScore: number
  scoreBreakdown: CompatibilityBreakdown
  status: Database['public']['Enums']['match_status']
  matchedAt: Date
  expiresAt: Date
  userAStatus: Database['public']['Enums']['match_status']
  userBStatus: Database['public']['Enums']['match_status']
  userARespondedAt?: Date
  userBRespondedAt?: Date
  otherUser: MatchUser
  conversationId?: string
  guardianApprovalRequired: boolean
  guardianApprovalStatus?: 'pending' | 'approved' | 'rejected'
}

export interface MatchUser {
  id: string
  firstName: string
  lastName: string
  age: number
  location: string
  occupation?: string
  education?: string
  bio?: string
  photos: UserPhoto[]
  religiousProfile: ReligiousProfile
  interests: string[]
  languages: string[]
}

export interface UserPhoto {
  id: string
  url: string
  blurUrl?: string
  isPrimary: boolean
  moderationStatus: Database['public']['Enums']['moderation_status']
}

export interface ReligiousProfile {
  prayerFrequency: Database['public']['Enums']['prayer_frequency']
  modestDress: Database['public']['Enums']['prayer_frequency']
  religiousLevel: string
  islamicValues: string[]
  seekingMarriageTimeline: string
}

export interface CompatibilityBreakdown {
  overall: number
  religious: number
  lifestyle: number
  personality: number
  values: number
  preferences: number
  factors: {
    ageCompatibility: number
    locationCompatibility: number
    educationCompatibility: number
    religiousCompatibility: number
    interestCompatibility: number
    valueCompatibility: number
    familyGoalsCompatibility: number
  }
}

export interface MatchFilters {
  ageRange?: [number, number]
  locationRadius?: number
  educationLevels?: string[]
  religiousLevels?: string[]
  maritalStatuses?: Database['public']['Enums']['marital_status'][]
  hasChildren?: boolean
  wantsChildren?: boolean
  languages?: string[]
  minCompatibilityScore?: number
  interests?: string[]
}

export interface MatchPreferences {
  ageRange: [number, number]
  locationRadius: number
  dealBreakers: string[]
  topQualities: string[]
  religiousRequirements: {
    minPrayerFrequency: Database['public']['Enums']['prayer_frequency']
    modestDressRequired: boolean
    islamicValuesImportance: number
  }
  familyPreferences: {
    acceptChildren: boolean
    wantMoreChildren?: boolean
    familySize?: number
  }
  lifestylePreferences: {
    educationImportance: number
    careerImportance: number
    personalityTraits: string[]
  }
}

export interface DailyMatches {
  date: Date
  matches: Match[]
  totalAvailable: number
  refreshTime: Date
  qualityScore: number
  preferences: MatchPreferences
}

export interface MatchStatistics {
  totalMatches: number
  mutualMatches: number
  pendingMatches: number
  rejectedMatches: number
  expiredMatches: number
  averageCompatibilityScore: number
  responseRate: number
  successRate: number
  dailyMatchHistory: {
    date: Date
    count: number
    quality: number
  }[]
}

export interface MatchResponse {
  matchId: string
  response: 'accepted' | 'rejected' | 'maybe'
  timestamp: Date
  isMutual: boolean
  conversationId?: string
}

export class MatchesService {
  private cache = new Map<string, any>()
  private matchCallbacks = new Set<(match: Match) => void>()
  private responseCallbacks = new Set<(response: MatchResponse) => void>()

  constructor(
    private supabase: SupabaseClient<Database>,
    private authToken: string,
    private userId: string,
    private baseUrl: string
  ) {}

  /**
   * Get daily matches for user
   */
  async getDailyMatches(): Promise<DailyMatches> {
    const cacheKey = `daily_matches:${this.userId}:${new Date().toDateString()}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await this.makeRequest<DailyMatches>('matches-generate', {
        userId: this.userId,
        limit: 10,
        refreshDaily: true
      })

      if (response.success && response.data) {
        // Cache for 1 hour
        this.cache.set(cacheKey, response.data)
        setTimeout(() => this.cache.delete(cacheKey), 3600000)
        
        return response.data
      }

      throw new Error(response.error || 'Failed to generate daily matches')
    } catch (error) {
      throw new Error(`Failed to get daily matches: ${error.message}`)
    }
  }

  /**
   * Get potential matches with filters
   */
  async getPotentialMatches(
    filters?: MatchFilters,
    limit: number = 20
  ): Promise<Match[]> {
    try {
      const response = await this.makeRequest<{ matches: Match[] }>('matches-potential', {
        userId: this.userId,
        filters,
        limit
      })

      if (response.success && response.data) {
        return response.data.matches
      }

      throw new Error(response.error || 'Failed to get potential matches')
    } catch (error) {
      throw new Error(`Failed to get potential matches: ${error.message}`)
    }
  }

  /**
   * Respond to a match (accept/reject/maybe)
   */
  async respondToMatch(
    matchId: string,
    response: 'accepted' | 'rejected' | 'maybe'
  ): Promise<MatchResponse> {
    try {
      const apiResponse = await this.makeRequest<MatchResponse>('matches-respond', {
        matchId,
        userId: this.userId,
        response,
        timestamp: new Date().toISOString()
      })

      if (apiResponse.success && apiResponse.data) {
        // Invalidate cache
        this.invalidateMatchCaches()
        
        // Emit response event
        this.emitMatchResponse(apiResponse.data)
        
        return apiResponse.data
      }

      throw new Error(apiResponse.error || 'Failed to respond to match')
    } catch (error) {
      throw new Error(`Failed to respond to match: ${error.message}`)
    }
  }

  /**
   * Get user's match history
   */
  async getMatchHistory(
    status?: Database['public']['Enums']['match_status'],
    limit: number = 50
  ): Promise<Match[]> {
    const cacheKey = `match_history:${this.userId}:${status || 'all'}:${limit}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      let query = this.supabase
        .from('matches')
        .select(`
          id,
          user_a_id,
          user_b_id,
          compatibility_score,
          score_breakdown,
          matched_at,
          expires_at,
          user_a_status,
          user_b_status,
          user_a_responded_at,
          user_b_responded_at,
          conversations (
            id,
            guardian_approved
          )
        `)
        .or(`user_a_id.eq.${this.userId},user_b_id.eq.${this.userId}`)
        .order('matched_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.or(`user_a_status.eq.${status},user_b_status.eq.${status}`)
      }

      const { data: matches, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      const transformedMatches = await Promise.all(
        (matches || []).map(match => this.transformMatch(match))
      )

      // Cache for 10 minutes
      this.cache.set(cacheKey, transformedMatches)
      setTimeout(() => this.cache.delete(cacheKey), 600000)

      return transformedMatches
    } catch (error) {
      throw new Error(`Failed to get match history: ${error.message}`)
    }
  }

  /**
   * Get mutual matches (both users accepted)
   */
  async getMutualMatches(limit: number = 50): Promise<Match[]> {
    try {
      const { data: matches, error } = await this.supabase
        .from('matches')
        .select(`
          id,
          user_a_id,
          user_b_id,
          compatibility_score,
          score_breakdown,
          matched_at,
          expires_at,
          user_a_status,
          user_b_status,
          user_a_responded_at,
          user_b_responded_at,
          conversations (
            id,
            guardian_approved
          )
        `)
        .or(`user_a_id.eq.${this.userId},user_b_id.eq.${this.userId}`)
        .eq('user_a_status', 'mutual')
        .eq('user_b_status', 'mutual')
        .order('matched_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      return Promise.all(
        (matches || []).map(match => this.transformMatch(match))
      )
    } catch (error) {
      throw new Error(`Failed to get mutual matches: ${error.message}`)
    }
  }

  /**
   * Get match statistics for user
   */
  async getMatchStatistics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<MatchStatistics> {
    const cacheKey = `match_stats:${this.userId}:${timeframe}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await this.makeRequest<MatchStatistics>('matches-statistics', {
        userId: this.userId,
        timeframe
      })

      if (response.success && response.data) {
        // Cache for 1 hour
        this.cache.set(cacheKey, response.data)
        setTimeout(() => this.cache.delete(cacheKey), 3600000)
        
        return response.data
      }

      // Fallback to direct database query
      return this.calculateStatisticsFromDatabase(timeframe)
    } catch (error) {
      return this.calculateStatisticsFromDatabase(timeframe)
    }
  }

  /**
   * Update match preferences
   */
  async updateMatchPreferences(preferences: Partial<MatchPreferences>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('partner_preferences')
        .upsert({
          user_id: this.userId,
          ...this.transformPreferencesToDatabase(preferences),
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate caches
      this.invalidateMatchCaches()
    } catch (error) {
      throw new Error(`Failed to update match preferences: ${error.message}`)
    }
  }

  /**
   * Get current match preferences
   */
  async getMatchPreferences(): Promise<MatchPreferences> {
    const cacheKey = `preferences:${this.userId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: preferences, error } = await this.supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw new Error(error.message)
      }

      const matchPreferences = preferences 
        ? this.transformPreferencesFromDatabase(preferences)
        : this.getDefaultPreferences()

      // Cache for 30 minutes
      this.cache.set(cacheKey, matchPreferences)
      setTimeout(() => this.cache.delete(cacheKey), 1800000)

      return matchPreferences
    } catch (error) {
      return this.getDefaultPreferences()
    }
  }

  /**
   * Block a user from appearing in matches
   */
  async blockUser(blockedUserId: string, reason?: string): Promise<void> {
    try {
      const response = await this.makeRequest('matches-block-user', {
        userId: this.userId,
        blockedUserId,
        reason,
        timestamp: new Date().toISOString()
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      // Invalidate caches
      this.invalidateMatchCaches()
    } catch (error) {
      throw new Error(`Failed to block user: ${error.message}`)
    }
  }

  /**
   * Report a match for inappropriate behavior
   */
  async reportMatch(
    matchId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    try {
      const response = await this.makeRequest('matches-report', {
        matchId,
        reporterId: this.userId,
        reason,
        details,
        timestamp: new Date().toISOString()
      })

      if (!response.success) {
        throw new Error(response.error)
      }
    } catch (error) {
      throw new Error(`Failed to report match: ${error.message}`)
    }
  }

  /**
   * Get compatibility analysis between two users
   */
  async getCompatibilityAnalysis(
    otherUserId: string
  ): Promise<{
    score: number
    breakdown: CompatibilityBreakdown
    recommendations: string[]
    strengthAreas: string[]
    concernAreas: string[]
  }> {
    try {
      const response = await this.makeRequest('matches-compatibility-analysis', {
        userId: this.userId,
        otherUserId
      })

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.error || 'Failed to get compatibility analysis')
    } catch (error) {
      throw new Error(`Compatibility analysis failed: ${error.message}`)
    }
  }

  /**
   * Refresh daily matches (premium feature)
   */
  async refreshDailyMatches(): Promise<DailyMatches> {
    try {
      const response = await this.makeRequest<DailyMatches>('matches-refresh', {
        userId: this.userId,
        timestamp: new Date().toISOString()
      })

      if (response.success && response.data) {
        // Clear daily matches cache
        const cacheKey = `daily_matches:${this.userId}:${new Date().toDateString()}`
        this.cache.delete(cacheKey)
        
        return response.data
      }

      throw new Error(response.error || 'Failed to refresh matches')
    } catch (error) {
      throw new Error(`Failed to refresh daily matches: ${error.message}`)
    }
  }

  /**
   * Get match insights and analytics
   */
  async getMatchInsights(): Promise<{
    topCompatibilityFactors: string[]
    improvementAreas: string[]
    profileOptimizationTips: string[]
    successPredictors: string[]
    marketInsights: {
      competitionLevel: number
      demandLevel: number
      profileRanking: number
    }
  }> {
    try {
      const response = await this.makeRequest('matches-insights', {
        userId: this.userId
      })

      if (response.success && response.data) {
        return response.data
      }

      // Fallback insights
      return {
        topCompatibilityFactors: ['Religious values', 'Life goals', 'Education level'],
        improvementAreas: ['Profile completeness', 'Photo quality'],
        profileOptimizationTips: ['Add more interests', 'Complete religious profile'],
        successPredictors: ['Active engagement', 'Complete profile'],
        marketInsights: {
          competitionLevel: 65,
          demandLevel: 78,
          profileRanking: 72
        }
      }
    } catch (error) {
      // Return fallback insights
      return {
        topCompatibilityFactors: ['Religious values', 'Life goals'],
        improvementAreas: ['Profile completeness'],
        profileOptimizationTips: ['Complete your profile'],
        successPredictors: ['Active engagement'],
        marketInsights: {
          competitionLevel: 50,
          demandLevel: 50,
          profileRanking: 50
        }
      }
    }
  }

  /**
   * Subscribe to new match notifications
   */
  onNewMatch(callback: (match: Match) => void): () => void {
    this.matchCallbacks.add(callback)
    
    return () => {
      this.matchCallbacks.delete(callback)
    }
  }

  /**
   * Subscribe to match response notifications
   */
  onMatchResponse(callback: (response: MatchResponse) => void): () => void {
    this.responseCallbacks.add(callback)
    
    return () => {
      this.responseCallbacks.delete(callback)
    }
  }

  /**
   * Emit new match event
   */
  private emitNewMatch(match: Match): void {
    this.matchCallbacks.forEach(callback => {
      try {
        callback(match)
      } catch (error) {
        console.error('Match callback error:', error)
      }
    })
  }

  /**
   * Emit match response event
   */
  private emitMatchResponse(response: MatchResponse): void {
    this.responseCallbacks.forEach(callback => {
      try {
        callback(response)
      } catch (error) {
        console.error('Match response callback error:', error)
      }
    })
  }

  /**
   * Transform database match to API match
   */
  private async transformMatch(dbMatch: any): Promise<Match> {
    const isUserA = dbMatch.user_a_id === this.userId
    const otherUserId = isUserA ? dbMatch.user_b_id : dbMatch.user_a_id
    
    // Get other user's profile
    const otherUser = await this.getUserProfile(otherUserId)
    
    return {
      id: dbMatch.id,
      userAId: dbMatch.user_a_id,
      userBId: dbMatch.user_b_id,
      compatibilityScore: dbMatch.compatibility_score,
      scoreBreakdown: dbMatch.score_breakdown as CompatibilityBreakdown,
      status: isUserA ? dbMatch.user_a_status : dbMatch.user_b_status,
      matchedAt: new Date(dbMatch.matched_at),
      expiresAt: new Date(dbMatch.expires_at),
      userAStatus: dbMatch.user_a_status,
      userBStatus: dbMatch.user_b_status,
      userARespondedAt: dbMatch.user_a_responded_at ? new Date(dbMatch.user_a_responded_at) : undefined,
      userBRespondedAt: dbMatch.user_b_responded_at ? new Date(dbMatch.user_b_responded_at) : undefined,
      otherUser,
      conversationId: dbMatch.conversations?.[0]?.id,
      guardianApprovalRequired: !dbMatch.conversations?.[0]?.guardian_approved,
      guardianApprovalStatus: dbMatch.conversations?.[0]?.guardian_approved ? 'approved' : 'pending'
    }
  }

  /**
   * Get user profile for match display
   */
  private async getUserProfile(userId: string): Promise<MatchUser> {
    const cacheKey = `user_profile:${userId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          year_of_birth,
          location_zone,
          profession,
          education,
          bio,
          languages,
          prayer_frequency,
          modest_dress,
          preferences,
          user_photos (
            id,
            url,
            blur_url,
            is_primary,
            moderation_status
          )
        `)
        .eq('user_id', userId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const currentYear = new Date().getFullYear()
      const age = currentYear - profile.year_of_birth

      const userProfile: MatchUser = {
        id: userId,
        firstName: profile.first_name,
        lastName: profile.last_name,
        age,
        location: profile.location_zone,
        occupation: profile.profession,
        education: profile.education,
        bio: profile.bio,
        photos: profile.user_photos?.map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          blurUrl: photo.blur_url,
          isPrimary: photo.is_primary,
          moderationStatus: photo.moderation_status
        })) || [],
        religiousProfile: {
          prayerFrequency: profile.prayer_frequency,
          modestDress: profile.modest_dress,
          religiousLevel: 'practicing', // Default
          islamicValues: [],
          seekingMarriageTimeline: 'within_year'
        },
        interests: profile.preferences?.interests || [],
        languages: profile.languages
      }

      // Cache for 15 minutes
      this.cache.set(cacheKey, userProfile)
      setTimeout(() => this.cache.delete(cacheKey), 900000)

      return userProfile
    } catch (error) {
      // Return fallback profile
      return {
        id: userId,
        firstName: 'Unknown',
        lastName: 'User',
        age: 25,
        location: 'Unknown',
        photos: [],
        religiousProfile: {
          prayerFrequency: 'usually',
          modestDress: 'usually',
          religiousLevel: 'practicing',
          islamicValues: [],
          seekingMarriageTimeline: 'within_year'
        },
        interests: [],
        languages: []
      }
    }
  }

  /**
   * Calculate statistics from database
   */
  private async calculateStatisticsFromDatabase(timeframe: string): Promise<MatchStatistics> {
    try {
      const timeframeDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365
      const since = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000)

      const { data: matches, error } = await this.supabase
        .from('matches')
        .select('*')
        .or(`user_a_id.eq.${this.userId},user_b_id.eq.${this.userId}`)
        .gte('matched_at', since.toISOString())

      if (error) {
        throw new Error(error.message)
      }

      const total = matches?.length || 0
      const mutual = matches?.filter(m => m.user_a_status === 'mutual' && m.user_b_status === 'mutual').length || 0
      const pending = matches?.filter(m => m.user_a_status === 'pending' || m.user_b_status === 'pending').length || 0
      const rejected = matches?.filter(m => m.user_a_status === 'rejected' || m.user_b_status === 'rejected').length || 0
      const expired = matches?.filter(m => m.user_a_status === 'expired' || m.user_b_status === 'expired').length || 0

      const avgScore = matches && matches.length > 0
        ? matches.reduce((sum, m) => sum + m.compatibility_score, 0) / matches.length
        : 0

      return {
        totalMatches: total,
        mutualMatches: mutual,
        pendingMatches: pending,
        rejectedMatches: rejected,
        expiredMatches: expired,
        averageCompatibilityScore: avgScore,
        responseRate: total > 0 ? ((mutual + rejected) / total) * 100 : 0,
        successRate: total > 0 ? (mutual / total) * 100 : 0,
        dailyMatchHistory: []
      }
    } catch (error) {
      // Return default statistics
      return {
        totalMatches: 0,
        mutualMatches: 0,
        pendingMatches: 0,
        rejectedMatches: 0,
        expiredMatches: 0,
        averageCompatibilityScore: 0,
        responseRate: 0,
        successRate: 0,
        dailyMatchHistory: []
      }
    }
  }

  /**
   * Transform preferences to database format
   */
  private transformPreferencesToDatabase(preferences: Partial<MatchPreferences>): any {
    return {
      min_age: preferences.ageRange?.[0],
      max_age: preferences.ageRange?.[1],
      deal_breakers: preferences.dealBreakers,
      top_qualities: preferences.topQualities,
      min_prayer_frequency: preferences.religiousRequirements?.minPrayerFrequency,
      accept_children: preferences.familyPreferences?.acceptChildren,
      want_more_children: preferences.familyPreferences?.wantMoreChildren
    }
  }

  /**
   * Transform preferences from database format
   */
  private transformPreferencesFromDatabase(dbPreferences: any): MatchPreferences {
    return {
      ageRange: [dbPreferences.min_age || 18, dbPreferences.max_age || 50],
      locationRadius: 50, // Default
      dealBreakers: dbPreferences.deal_breakers || [],
      topQualities: dbPreferences.top_qualities || [],
      religiousRequirements: {
        minPrayerFrequency: dbPreferences.min_prayer_frequency || 'usually',
        modestDressRequired: true,
        islamicValuesImportance: 90
      },
      familyPreferences: {
        acceptChildren: dbPreferences.accept_children ?? true,
        wantMoreChildren: dbPreferences.want_more_children
      },
      lifestylePreferences: {
        educationImportance: 70,
        careerImportance: 60,
        personalityTraits: []
      }
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): MatchPreferences {
    return {
      ageRange: [18, 50],
      locationRadius: 50,
      dealBreakers: [],
      topQualities: [],
      religiousRequirements: {
        minPrayerFrequency: 'usually',
        modestDressRequired: true,
        islamicValuesImportance: 90
      },
      familyPreferences: {
        acceptChildren: true
      },
      lifestylePreferences: {
        educationImportance: 70,
        careerImportance: 60,
        personalityTraits: []
      }
    }
  }

  /**
   * Invalidate match-related caches
   */
  private invalidateMatchCaches(): void {
    for (const key of this.cache.keys()) {
      if (key.includes('match') || key.includes('daily') || key.includes('preferences')) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Make authenticated request to Edge Function
   */
  private async makeRequest<T = any>(
    endpoint: string,
    body?: any
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: body ? JSON.stringify(body) : undefined
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.matchCallbacks.clear()
    this.responseCallbacks.clear()
    this.cache.clear()
  }
}