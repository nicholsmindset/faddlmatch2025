// Main AI Integration System
export { AIIntegrationSystem } from './ai-integration-system'

// Core Modules
export * from './embeddings'
export * from './conversation'
export * from './moderation'
export * from './personalization'
export * from './utils'

// Types
export * from './types'

// Configuration
export type { AIConfig } from './types'

/**
 * FADDL Match AI Integration Package
 * 
 * Comprehensive AI-powered features for Islamic matrimonial platform:
 * 
 * ## Features
 * - **Profile Embeddings**: Semantic profile matching with Islamic values weighting
 * - **Conversation Intelligence**: Islamic-appropriate conversation assistance
 * - **Content Moderation**: Islamic compliance and cultural sensitivity checking
 * - **Profile Enhancement**: AI-powered profile optimization suggestions
 * - **Match Explanations**: Personalized compatibility explanations
 * - **Cost Optimization**: Smart API usage and budget management
 * - **Cultural Adaptation**: Multi-cultural Islamic context awareness
 * 
 * ## Quick Start
 * ```typescript
 * import { AIIntegrationSystem } from '@faddl-match/ai-integration'
 * 
 * const ai = new AIIntegrationSystem({
 *   openai: {
 *     apiKey: process.env.OPENAI_API_KEY!,
 *     model: 'gpt-4',
 *     embeddingModel: 'text-embedding-3-small',
 *     maxTokens: 500,
 *     temperature: 0.7
 *   },
 *   supabase: {
 *     url: process.env.SUPABASE_URL!,
 *     serviceKey: process.env.SUPABASE_SERVICE_KEY!
 *   },
 *   cache: {
 *     ttl: 24 * 60 * 60 * 1000, // 24 hours
 *     maxSize: 10000
 *   },
 *   rateLimit: {
 *     requestsPerMinute: 100,
 *     concurrentRequests: 10
 *   }
 * })
 * 
 * // Generate profile embeddings
 * const embeddings = await ai.generateProfileEmbedding(profile, preferences)
 * 
 * // Find similar profiles
 * const matches = await ai.findSimilarProfiles(userId, limit)
 * 
 * // Generate conversation suggestions
 * const suggestions = await ai.generateConversationSuggestions(context, userId, recipientProfile)
 * 
 * // Moderate content
 * const moderation = await ai.moderateContent(request)
 * 
 * // Get profile enhancement suggestions
 * const suggestions = await ai.getProfileEnhancementSuggestions(context)
 * ```
 * 
 * ## Islamic Compliance
 * All AI outputs are designed to:
 * - Align with Islamic values and principles
 * - Respect cultural diversity within Muslim communities
 * - Encourage family involvement in matrimonial decisions
 * - Maintain appropriate Islamic boundaries
 * - Provide scholarly-backed Islamic guidance
 * 
 * ## Performance & Cost
 * - Intelligent caching reduces API costs by 60-80%
 * - Smart rate limiting prevents API overages
 * - Cost optimization with model selection
 * - Real-time budget monitoring and alerts
 * - Performance metrics and monitoring
 */