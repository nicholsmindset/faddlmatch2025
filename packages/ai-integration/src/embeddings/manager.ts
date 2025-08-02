import OpenAI from 'openai'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import pLimit from 'p-limit'
import crypto from 'crypto'
import { 
  ProfileEmbeddings, 
  EmbeddingMetadata, 
  AIConfig,
  EmbeddingError,
  CacheEntry
} from '../types'
import { CacheManager } from '../utils/caching'
import { ErrorHandler } from '../utils/error-handling'
import type { UserProfile, PartnerPreferences } from '@faddl-match/types'

/**
 * EmbeddingsManager - Core system for generating and managing profile embeddings
 * 
 * Handles:
 * - Profile text embedding generation using OpenAI's text-embedding-3-small
 * - Intelligent caching with 24-hour TTL
 * - Rate limiting (10 concurrent requests)
 * - Cost optimization through deduplication
 * - Islamic values-aware text processing
 */
export class EmbeddingsManager {
  private openai: OpenAI
  private supabase: SupabaseClient
  private cache: CacheManager
  private errorHandler: ErrorHandler
  private readonly limit = pLimit(10) // Rate limiting for API calls
  private readonly embeddingModel = 'text-embedding-3-small'
  private readonly dimensions = 1536

  constructor(config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    })
    
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey
    )
    
    this.cache = new CacheManager({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: config.cache.maxSize || 10000
    })
    
    this.errorHandler = new ErrorHandler()
  }

  /**
   * Generate comprehensive embeddings for a user profile
   * Includes profile text, values, interests, lifestyle, and personality vectors
   */
  async generateProfileEmbedding(
    profile: UserProfile,
    preferences: PartnerPreferences
  ): Promise<ProfileEmbeddings> {
    const startTime = Date.now()
    
    try {
      // Create structured text representations
      const textComponents = this.createTextComponents(profile, preferences)
      
      // Generate embeddings for each component in parallel
      const embeddings = await Promise.all([
        this.generateEmbedding(textComponents.profileText, 'profile'),
        this.generateEmbedding(textComponents.values, 'values'),
        this.generateEmbedding(textComponents.interests, 'interests'),
        this.generateEmbedding(textComponents.lifestyle, 'lifestyle'),
        this.generateEmbedding(textComponents.personality, 'personality')
      ])

      const metadata: EmbeddingMetadata = {
        model: this.embeddingModel,
        dimensions: this.dimensions,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        tokenCount: this.estimateTokenCount(Object.values(textComponents).join(' '))
      }

      const result: ProfileEmbeddings = {
        profileId: profile.user_id,
        profileText: embeddings[0],
        values: embeddings[1],
        interests: embeddings[2],
        lifestyle: embeddings[3],
        personality: embeddings[4],
        metadata
      }

      // Store in database for persistence
      await this.storeEmbeddings(result)
      
      // Cache for quick access
      await this.cache.set(`embeddings:${profile.user_id}`, result)

      const processingTime = Date.now() - startTime
      console.log(`Generated embeddings for profile ${profile.user_id} in ${processingTime}ms`)

      return result

    } catch (error) {
      throw this.errorHandler.handle(
        new EmbeddingError(
          `Failed to generate embeddings for profile ${profile.user_id}`,
          { error: error instanceof Error ? error.message : String(error) }
        )
      )
    }
  }

  /**
   * Retrieve cached embeddings or generate new ones
   */
  async getProfileEmbeddings(profileId: string): Promise<ProfileEmbeddings | null> {
    try {
      // Check cache first
      const cached = await this.cache.get(`embeddings:${profileId}`)
      if (cached) {
        return cached as ProfileEmbeddings
      }

      // Check database
      const { data, error } = await this.supabase
        .from('profile_embeddings')
        .select('*')
        .eq('profile_id', profileId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new EmbeddingError('Database error retrieving embeddings', { error })
      }

      if (data) {
        const embeddings = this.parseStoredEmbeddings(data)
        await this.cache.set(`embeddings:${profileId}`, embeddings)
        return embeddings
      }

      return null

    } catch (error) {
      this.errorHandler.log(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  /**
   * Generate embedding for a single text input with caching
   */
  private async generateEmbedding(text: string, type: string): Promise<number[]> {
    const cacheKey = `embedding:${type}:${this.hashText(text)}`
    
    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached as number[]
    }

    try {
      // Rate-limited API call
      const embedding = await this.limit(async () => {
        const response = await this.openai.embeddings.create({
          model: this.embeddingModel,
          input: text,
          dimensions: this.dimensions
        })
        
        return response.data[0].embedding
      })

      // Cache the result
      await this.cache.set(cacheKey, embedding, 7 * 24 * 60 * 60 * 1000) // 7 days

      return embedding

    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        // Exponential backoff for rate limits
        await this.delay(Math.random() * 2000 + 1000)
        return this.generateEmbedding(text, type)
      }
      
      throw new EmbeddingError(
        `Failed to generate ${type} embedding`,
        { text: text.substring(0, 100), error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Create structured text components for embedding generation
   */
  private createTextComponents(
    profile: UserProfile,
    preferences: PartnerPreferences
  ): Record<string, string> {
    return {
      profileText: this.createProfileText(profile),
      values: this.createValuesText(profile, preferences),
      interests: this.createInterestsText(profile),
      lifestyle: this.createLifestyleText(profile),
      personality: this.createPersonalityText(profile)
    }
  }

  /**
   * Create comprehensive profile text for embedding
   */
  private createProfileText(profile: UserProfile): string {
    const components = [
      // Basic demographics with Islamic context
      `${profile.gender} Muslim seeking marriage`,
      `Age ${new Date().getFullYear() - profile.year_of_birth}`,
      `${profile.marital_status} status`,
      profile.has_children ? `Has ${profile.children_count} children` : 'No children',
      
      // Religious practice
      `Prayer frequency: ${profile.prayer_frequency}`,
      `Modest dress: ${profile.modest_dress}`,
      
      // Cultural background
      `Ethnicity: ${profile.ethnicity}`,
      `Languages: ${profile.languages.join(', ')}`,
      `Location: ${profile.location_zone}`,
      
      // Professional and educational
      profile.education && `Education: ${profile.education}`,
      profile.profession && `Profession: ${profile.profession}`,
      
      // Personal description
      profile.bio && `About: ${profile.bio}`,
      
      // Islamic values emphasis
      'Seeking Allah-fearing spouse for halal marriage',
      'Family-oriented with Islamic values'
    ].filter(Boolean)

    return components.join('. ') + '.'
  }

  /**
   * Create Islamic values-focused text
   */
  private createValuesText(profile: UserProfile, preferences: PartnerPreferences): string {
    const values = [
      // Religious values
      `Prayer: ${profile.prayer_frequency}`,
      `Modesty: ${profile.modest_dress}`,
      'Islamic marriage intentions',
      'Halal relationship seeking',
      
      // Family values
      profile.has_children ? 'Open to blended families' : 'Ready for family building',
      preferences.wants_children ? 'Desires children' : 'Family planning flexible',
      
      // Lifestyle values
      'Muslim community engagement',
      'Islamic knowledge seeking',
      'Charitable giving (Zakat)',
      'Sunnah following lifestyle',
      
      // Partnership values
      'Mutual Islamic growth',
      'Family integration important',
      'Guardian involvement respected',
      'Islamic wedding planning'
    ]

    return values.join('. ') + '.'
  }

  /**
   * Create interests and hobbies text
   */
  private createInterestsText(profile: UserProfile): string {
    const interests = [
      // Extract from bio and add Islamic context
      ...(profile.bio ? this.extractInterests(profile.bio) : []),
      
      // Common Islamic interests
      'Quran reading and study',
      'Islamic history and knowledge',
      'Community service and volunteering',
      'Halal food and cooking',
      'Travel to Islamic historical sites',
      'Family gatherings and celebrations',
      'Islamic art and culture'
    ]

    return interests.slice(0, 10).join('. ') + '.'
  }

  /**
   * Create lifestyle-focused text
   */
  private createLifestyleText(profile: UserProfile): string {
    const lifestyle = [
      `${profile.prayer_frequency} prayer practitioner`,
      `${profile.modest_dress} modesty observer`,
      `${profile.location_zone} resident`,
      'Halal lifestyle adherent',
      'Islamic calendar observer',
      'Muslim community participant',
      'Family-oriented individual',
      'Marriage-seeking Muslim'
    ]

    return lifestyle.join('. ') + '.'
  }

  /**
   * Create personality traits text
   */
  private createPersonalityText(profile: UserProfile): string {
    const traits = [
      // Extract personality indicators from bio
      ...(profile.bio ? this.extractPersonality(profile.bio) : []),
      
      // Default Islamic personality traits
      'God-fearing and humble',
      'Family-loving and caring',
      'Community-minded individual',
      'Knowledge-seeking Muslim',
      'Patient and understanding',
      'Respectful of Islamic values'
    ]

    return traits.slice(0, 8).join('. ') + '.'
  }

  /**
   * Extract interests from bio text using simple NLP
   */
  private extractInterests(bio: string): string[] {
    const interestKeywords = [
      'reading', 'travel', 'cooking', 'sports', 'music', 'art', 'photography',
      'hiking', 'fitness', 'learning', 'volunteering', 'gardening', 'writing'
    ]
    
    const found = interestKeywords.filter(keyword => 
      bio.toLowerCase().includes(keyword)
    )
    
    return found.map(interest => `Enjoys ${interest}`)
  }

  /**
   * Extract personality traits from bio text
   */
  private extractPersonality(bio: string): string[] {
    const personalityKeywords = {
      'kind': 'Kind and compassionate',
      'funny': 'Humorous and lighthearted', 
      'serious': 'Serious and focused',
      'outgoing': 'Outgoing and social',
      'quiet': 'Quiet and reflective',
      'ambitious': 'Ambitious and driven',
      'patient': 'Patient and understanding'
    }
    
    const found: string[] = []
    Object.entries(personalityKeywords).forEach(([keyword, trait]) => {
      if (bio.toLowerCase().includes(keyword)) {
        found.push(trait)
      }
    })
    
    return found
  }

  /**
   * Store embeddings in database
   */
  private async storeEmbeddings(embeddings: ProfileEmbeddings): Promise<void> {
    const { error } = await this.supabase
      .from('profile_embeddings')
      .upsert({
        profile_id: embeddings.profileId,
        profile_text: embeddings.profileText,
        values: embeddings.values,
        interests: embeddings.interests,
        lifestyle: embeddings.lifestyle,
        personality: embeddings.personality,
        metadata: embeddings.metadata,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new EmbeddingError('Failed to store embeddings', { error })
    }
  }

  /**
   * Parse stored embeddings from database
   */
  private parseStoredEmbeddings(data: any): ProfileEmbeddings {
    return {
      profileId: data.profile_id,
      profileText: data.profile_text,
      values: data.values,
      interests: data.interests,
      lifestyle: data.lifestyle,
      personality: data.personality,
      metadata: data.metadata
    }
  }

  /**
   * Create hash of text for caching
   */
  private hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16)
  }

  /**
   * Estimate token count for cost calculation
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear cache (for maintenance)
   */
  async clearCache(): Promise<void> {
    await this.cache.clear()
  }
}