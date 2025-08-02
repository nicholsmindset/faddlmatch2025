import { 
  AIConfig,
  ProfileEmbeddings,
  SimilarityScore,
  ConversationContext,
  ConversationSuggestion,
  ConversationAnalysis,
  ContentModerationRequest,
  ModerationResult,
  PersonalizationContext,
  ProfileEnhancementSuggestion,
  MatchExplanation,
  AIMetrics,
  AIIntegrationError
} from './types'

import { EmbeddingsManager, SimilarityMatcher } from './embeddings'
import { ConversationIntelligence } from './conversation'
import { ContentModerationSystem } from './moderation'
import { ProfileEnhancementSystem, MatchExplanationGenerator } from './personalization'
import { CacheManager, ErrorHandler, CostOptimizer } from './utils'

import type { 
  UserProfile, 
  PartnerPreferences,
  CompleteUserProfile 
} from '@faddl-match/types'

/**
 * AIIntegrationSystem - Main orchestrator for all AI features
 * 
 * This is the primary interface for the FADDL Match AI integration system.
 * It coordinates all AI-powered features while maintaining Islamic compliance,
 * cultural sensitivity, and cost optimization.
 * 
 * Features:
 * - Profile embeddings and semantic matching
 * - Conversation intelligence and guidance
 * - Content moderation with Islamic compliance
 * - Profile enhancement suggestions
 * - Match explanations and compatibility analysis
 * - Cost optimization and performance monitoring
 */
export class AIIntegrationSystem {
  private embeddingsManager: EmbeddingsManager
  private similarityMatcher: SimilarityMatcher
  private conversationIntelligence: ConversationIntelligence
  private moderationSystem: ContentModerationSystem
  private profileEnhancement: ProfileEnhancementSystem
  private matchExplanationGenerator: MatchExplanationGenerator
  private cacheManager: CacheManager
  private errorHandler: ErrorHandler
  private costOptimizer: CostOptimizer

  constructor(private config: AIConfig) {
    // Initialize core components
    this.embeddingsManager = new EmbeddingsManager(config)
    this.similarityMatcher = new SimilarityMatcher(config)
    this.conversationIntelligence = new ConversationIntelligence(config)
    this.moderationSystem = new ContentModerationSystem(config)
    this.profileEnhancement = new ProfileEnhancementSystem(config)
    this.matchExplanationGenerator = new MatchExplanationGenerator(config)
    
    // Initialize utility systems
    this.cacheManager = new CacheManager(config.cache)
    this.errorHandler = new ErrorHandler()
    this.costOptimizer = new CostOptimizer({
      daily: 200, // $200 daily budget
      monthly: 5000, // $5000 monthly budget
      embeddings: 75,
      completions: 100,
      moderations: 25
    })
  }

  // ==============================================
  // Profile Embeddings & Matching
  // ==============================================

  /**
   * Generate embeddings for a user profile
   */
  async generateProfileEmbedding(
    profile: UserProfile,
    preferences: PartnerPreferences
  ): Promise<ProfileEmbeddings> {
    return this.errorHandler.executeWithRetry(
      () => this.embeddingsManager.generateProfileEmbedding(profile, preferences),
      'profile_embedding_generation'
    )
  }

  /**
   * Get cached profile embeddings
   */
  async getProfileEmbeddings(profileId: string): Promise<ProfileEmbeddings | null> {
    return this.embeddingsManager.getProfileEmbeddings(profileId)
  }

  /**
   * Find similar profiles using semantic matching
   */
  async findSimilarProfiles(
    userId: string,
    limit: number = 20,
    minCompatibility: number = 0.5
  ): Promise<SimilarityScore[]> {
    return this.errorHandler.executeWithRetry(async () => {
      // Get user's embeddings
      const userEmbeddings = await this.embeddingsManager.getProfileEmbeddings(userId)
      if (!userEmbeddings) {
        throw new AIIntegrationError('User embeddings not found', 'EMBEDDINGS_NOT_FOUND')
      }

      // This would integrate with your database to get candidate profiles
      // For now, returning empty array - implement based on your database structure
      const candidateProfiles: Array<{
        profile: UserProfile
        preferences: PartnerPreferences
        embeddings: ProfileEmbeddings
      }> = []

      const similarities: SimilarityScore[] = []

      for (const candidate of candidateProfiles) {
        const similarity = await this.similarityMatcher.calculateSimilarity(
          userEmbeddings,
          candidate.embeddings,
          await this.getUserProfile(userId), // You'll need to implement this
          candidate.profile,
          await this.getUserPreferences(userId), // You'll need to implement this
          candidate.preferences
        )

        if (similarity.overallScore >= minCompatibility) {
          similarities.push(similarity)
        }
      }

      // Sort by overall score and return top matches
      return similarities
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit)

    }, 'similarity_matching')
  }

  /**
   * Calculate compatibility between two specific profiles
   */
  async calculateProfileCompatibility(
    profile1Id: string,
    profile2Id: string
  ): Promise<SimilarityScore> {
    return this.errorHandler.executeWithRetry(async () => {
      const [embeddings1, embeddings2] = await Promise.all([
        this.embeddingsManager.getProfileEmbeddings(profile1Id),
        this.embeddingsManager.getProfileEmbeddings(profile2Id)
      ])

      if (!embeddings1 || !embeddings2) {
        throw new AIIntegrationError('Profile embeddings not found', 'EMBEDDINGS_NOT_FOUND')
      }

      const [profile1, profile2, prefs1, prefs2] = await Promise.all([
        this.getUserProfile(profile1Id),
        this.getUserProfile(profile2Id),
        this.getUserPreferences(profile1Id),
        this.getUserPreferences(profile2Id)
      ])

      return this.similarityMatcher.calculateSimilarity(
        embeddings1,
        embeddings2,
        profile1,
        profile2,
        prefs1,
        prefs2
      )
    }, 'compatibility_calculation')
  }

  // ==============================================
  // Conversation Intelligence
  // ==============================================

  /**
   * Generate conversation suggestions
   */
  async generateConversationSuggestions(
    context: ConversationContext,
    requestingUserId: string,
    recipientProfile: UserProfile
  ): Promise<ConversationSuggestion[]> {
    return this.errorHandler.executeWithRetry(
      () => this.conversationIntelligence.generateConversationSuggestions(
        context,
        requestingUserId,
        recipientProfile
      ),
      'conversation_suggestions'
    )
  }

  /**
   * Analyze conversation content
   */
  async analyzeConversation(
    message: string,
    context: ConversationContext,
    senderProfile: UserProfile
  ): Promise<ConversationAnalysis> {
    return this.errorHandler.executeWithRetry(
      () => this.conversationIntelligence.analyzeConversation(
        message,
        context,
        senderProfile
      ),
      'conversation_analysis'
    )
  }

  /**
   * Adapt message for cultural context
   */
  async adaptMessageForCulture(
    message: string,
    senderCulture: string,
    recipientCulture: string,
    language?: string
  ): Promise<string> {
    return this.conversationIntelligence.adaptMessageForCulture(
      message,
      senderCulture,
      recipientCulture,
      language
    )
  }

  // ==============================================
  // Content Moderation
  // ==============================================

  /**
   * Moderate content for Islamic compliance and appropriateness
   */
  async moderateContent(request: ContentModerationRequest): Promise<ModerationResult> {
    return this.errorHandler.executeWithRetry(
      () => this.moderationSystem.moderateContent(request),
      'content_moderation'
    )
  }

  /**
   * Batch moderate multiple content items
   */
  async moderateContentBatch(requests: ContentModerationRequest[]): Promise<ModerationResult[]> {
    return this.errorHandler.executeWithRetry(
      () => this.moderationSystem.moderateContentBatch(requests),
      'batch_content_moderation'
    )
  }

  // ==============================================
  // Profile Enhancement
  // ==============================================

  /**
   * Get profile enhancement suggestions
   */
  async getProfileEnhancementSuggestions(
    context: PersonalizationContext
  ): Promise<ProfileEnhancementSuggestion[]> {
    return this.errorHandler.executeWithRetry(
      () => this.profileEnhancement.generateEnhancementSuggestions(context),
      'profile_enhancement'
    )
  }

  /**
   * Calculate profile completeness score
   */
  calculateProfileCompleteness(profile: UserProfile): number {
    return this.profileEnhancement.calculateProfileCompleteness(profile)
  }

  // ==============================================
  // Match Explanations
  // ==============================================

  /**
   * Generate detailed match explanation
   */
  async generateMatchExplanation(
    similarity: SimilarityScore,
    userProfile: UserProfile,
    matchProfile: UserProfile,
    userPreferences: PartnerPreferences,
    matchPreferences: PartnerPreferences
  ): Promise<MatchExplanation> {
    return this.errorHandler.executeWithRetry(
      () => this.matchExplanationGenerator.generateMatchExplanation(
        similarity,
        userProfile,
        matchProfile,
        userPreferences,
        matchPreferences
      ),
      'match_explanation'
    )
  }

  /**
   * Generate display-friendly match explanation
   */
  async generateDisplayExplanation(
    matchExplanation: MatchExplanation,
    isHighCompatibility: boolean
  ): Promise<string> {
    return this.matchExplanationGenerator.generateDisplayExplanation(
      matchExplanation,
      isHighCompatibility
    )
  }

  // ==============================================
  // System Management
  // ==============================================

  /**
   * Get comprehensive AI system metrics
   */
  async getSystemMetrics(): Promise<AIMetrics> {
    const baseMetrics = this.costOptimizer.getMetrics()
    const cacheStats = this.cacheManager.getStats()
    const errorStats = this.errorHandler.getErrorStats()

    return {
      requests: {
        total: baseMetrics.requests.total,
        successful: baseMetrics.requests.successful,
        failed: errorStats.totalErrors,
        avgResponseTime: baseMetrics.requests.avgResponseTime
      },
      costs: baseMetrics.costs,
      cache: {
        hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses || 1),
        size: cacheStats.size,
        evictions: cacheStats.evictions || 0
      },
      performance: {
        p95ResponseTime: baseMetrics.performance.p95ResponseTime,
        errorRate: errorStats.totalErrors / (baseMetrics.requests.total || 1),
        concurrentRequests: baseMetrics.performance.concurrentRequests
      }
    }
  }

  /**
   * Get cost optimization report
   */
  async getCostOptimizationReport() {
    return this.costOptimizer.getCostOptimizationReport()
  }

  /**
   * Clear system caches (for maintenance)
   */
  async clearCaches(): Promise<void> {
    await Promise.all([
      this.cacheManager.clear(),
      this.embeddingsManager.clearCache()
    ])
  }

  /**
   * Health check for all AI systems
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    components: Record<string, 'up' | 'down' | 'degraded'>
    timestamp: string
  }> {
    const components: Record<string, 'up' | 'down' | 'degraded'> = {}
    
    try {
      // Test embeddings system
      await this.embeddingsManager.getCacheStats()
      components.embeddings = 'up'
    } catch {
      components.embeddings = 'down'
    }

    try {
      // Test moderation system
      const testModeration = await this.moderationSystem.moderateContent({
        content: 'test message',
        contentType: 'message',
        userId: 'health-check',
        context: {},
        culturalContext: {
          primaryLanguage: 'english',
          culturalBackground: 'mixed',
          religiousLevel: 'often'
        }
      })
      components.moderation = testModeration ? 'up' : 'degraded'
    } catch {
      components.moderation = 'down'
    }

    // Test cache system
    components.cache = 'up' // Cache is always available locally

    // Test cost optimizer
    try {
      this.costOptimizer.getMetrics()
      components.costOptimizer = 'up'
    } catch {
      components.costOptimizer = 'degraded'
    }

    // Determine overall status
    const downComponents = Object.values(components).filter(status => status === 'down').length
    const degradedComponents = Object.values(components).filter(status => status === 'degraded').length
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (downComponents === 0 && degradedComponents === 0) {
      status = 'healthy'
    } else if (downComponents <= 1) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return {
      status,
      components,
      timestamp: new Date().toISOString()
    }
  }

  // ==============================================
  // Helper Methods (to be implemented based on your database)
  // ==============================================

  /**
   * Get user profile - implement based on your database
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    // This should fetch from your Supabase database
    throw new Error('getUserProfile not implemented - connect to your database')
  }

  /**
   * Get user preferences - implement based on your database
   */
  private async getUserPreferences(userId: string): Promise<PartnerPreferences> {
    // This should fetch from your Supabase database
    throw new Error('getUserPreferences not implemented - connect to your database')
  }

  /**
   * Track operation cost with optimizer
   */
  private trackCost(
    operation: 'embeddings' | 'completions' | 'moderations',
    cost: number,
    metadata?: any
  ): void {
    this.costOptimizer.trackCost(operation, cost, metadata)
  }
}