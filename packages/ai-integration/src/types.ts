import { z } from 'zod'
import type { 
  UserProfile, 
  PartnerPreferences, 
  Gender, 
  PrayerFrequency, 
  MaritalStatus,
  Ethnicity,
  LocationZone 
} from '@faddl-match/types'

// ==============================================
// AI Configuration Types
// ==============================================

export interface AIConfig {
  openai: {
    apiKey: string
    model: string
    embeddingModel: string
    maxTokens: number
    temperature: number
  }
  supabase: {
    url: string
    serviceKey: string
  }
  cache: {
    ttl: number
    maxSize: number
  }
  rateLimit: {
    requestsPerMinute: number
    concurrentRequests: number
  }
}

// ==============================================
// Embeddings Types
// ==============================================

export const EmbeddingMetadataSchema = z.object({
  model: z.string(),
  dimensions: z.number(),
  generatedAt: z.string(),
  version: z.string().optional(),
  tokenCount: z.number().optional()
})

export type EmbeddingMetadata = z.infer<typeof EmbeddingMetadataSchema>

export const ProfileEmbeddingsSchema = z.object({
  profileId: z.string(),
  profileText: z.array(z.number()).length(1536),
  values: z.array(z.number()).length(1536),
  interests: z.array(z.number()).length(1536),
  lifestyle: z.array(z.number()).length(1536),
  personality: z.array(z.number()).length(1536),
  metadata: EmbeddingMetadataSchema
})

export type ProfileEmbeddings = z.infer<typeof ProfileEmbeddingsSchema>

export interface SimilarityScore {
  profileId: string
  overallScore: number
  subscores: {
    values: number
    interests: number
    lifestyle: number
    personality: number
    demographics: number
  }
  explanation: string
  islamicAlignment: number
  culturalCompatibility: number
}

export interface MatchExplanation {
  overallCompatibility: number
  strengths: string[]
  considerations: string[]
  islamicValues: {
    score: number
    alignment: string[]
    areas: string[]
  }
  recommendations: string[]
}

// ==============================================
// Conversation Intelligence Types
// ==============================================

export const ConversationContextSchema = z.object({
  participants: z.array(z.object({
    id: z.string(),
    gender: z.enum(['male', 'female']),
    culturalBackground: z.string(),
    languagePreference: z.string(),
    communicationStyle: z.enum(['formal', 'casual', 'mixed'])
  })),
  stage: z.enum(['introduction', 'getting_to_know', 'family_discussion', 'meeting_planning']),
  guardianInvolved: z.boolean(),
  previousMessages: z.number(),
  lastInteraction: z.string().optional()
})

export type ConversationContext = z.infer<typeof ConversationContextSchema>

export interface ConversationSuggestion {
  type: 'greeting' | 'question' | 'response' | 'topic_change' | 'family_introduction'
  content: string
  culturalContext: string
  islamicGuidance?: string
  confidence: number
  alternatives: string[]
}

export interface ConversationAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'concerned'
  appropriateness: number
  islamicCompliance: number
  culturalSensitivity: number
  escalationNeeded: boolean
  recommendations: string[]
  guardianAlert?: {
    reason: string
    severity: 'low' | 'medium' | 'high'
    suggestedAction: string
  }
}

// ==============================================
// Content Moderation Types
// ==============================================

export const ModerationResultSchema = z.object({
  approved: z.boolean(),
  confidence: z.number().min(0).max(1),
  islamicCompliance: z.object({
    score: z.number().min(0).max(1),
    violations: z.array(z.string()),
    guidance: z.string().optional()
  }),
  culturalSensitivity: z.object({
    score: z.number().min(0).max(1),
    concerns: z.array(z.string()),
    suggestions: z.array(z.string())
  }),
  contentAnalysis: z.object({
    language: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    topics: z.array(z.string()),
    appropriateness: z.number().min(0).max(1)
  }),
  escalation: z.object({
    required: z.boolean(),
    reason: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high']).optional(),
    reviewerType: z.enum(['ai', 'human', 'scholar']).optional()
  })
})

export type ModerationResult = z.infer<typeof ModerationResultSchema>

export interface ContentModerationRequest {
  content: string
  contentType: 'profile' | 'message' | 'photo' | 'bio'
  userId: string
  context: {
    recipientId?: string
    conversationId?: string
    profileSection?: string
  }
  culturalContext: {
    primaryLanguage: string
    culturalBackground: string
    religiousLevel: PrayerFrequency
  }
}

// ==============================================
// Personalization Types
// ==============================================

export interface PersonalizationContext {
  userId: string
  profile: UserProfile
  preferences: PartnerPreferences
  interactionHistory: {
    matchesViewed: number
    messagesExchanged: number
    meetingsArranged: number
    profileCompleteness: number
  }
  culturalAdaptation: {
    primaryLanguage: string
    culturalBackground: string
    communicationStyle: string
    familyInvolvement: 'high' | 'medium' | 'low'
  }
}

export interface ProfileEnhancementSuggestion {
  section: 'bio' | 'interests' | 'values' | 'photos' | 'preferences'
  suggestion: string
  reasoning: string
  islamicGuidance?: string
  culturalConsideration?: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: number
}

export interface IslamicGuidance {
  topic: string
  guidance: string
  source: string
  culturalAdaptation: Record<string, string>
  actionable: boolean
  relevanceScore: number
}

// ==============================================
// Caching and Performance Types
// ==============================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  hitCount: number
  size: number
}

export interface EmbeddingsCacheStats {
  hits: number
  misses: number
  size: number
  memoryUsage: number
  avgResponseTime: number
}

export interface AIMetrics {
  requests: {
    total: number
    successful: number
    failed: number
    avgResponseTime: number
  }
  costs: {
    embeddings: number
    completions: number
    total: number
  }
  cache: {
    hitRate: number
    size: number
    evictions: number
  }
  performance: {
    p95ResponseTime: number
    errorRate: number
    concurrentRequests: number
  }
}

// ==============================================
// Error Types
// ==============================================

export class AIIntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AIIntegrationError'
  }
}

export class EmbeddingError extends AIIntegrationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'EMBEDDING_ERROR', details)
    this.name = 'EmbeddingError'
  }
}

export class ModerationError extends AIIntegrationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'MODERATION_ERROR', details)
    this.name = 'ModerationError'
  }
}

export class ConversationError extends AIIntegrationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONVERSATION_ERROR', details)
    this.name = 'ConversationError'
  }
}

// ==============================================
// Utility Types
// ==============================================

export type IslamicValue = 
  | 'family_oriented'
  | 'prayer_focused'
  | 'halal_lifestyle'
  | 'community_minded'
  | 'knowledge_seeking'
  | 'charity_giving'
  | 'modest_living'
  | 'marriage_minded'

export type CulturalBackground = 
  | 'arab'
  | 'south_asian'
  | 'southeast_asian'
  | 'african'
  | 'turkish'
  | 'persian'
  | 'convert'
  | 'mixed'
  | 'other'

export type CommunicationStyle = 
  | 'direct'
  | 'indirect'
  | 'formal'
  | 'casual'
  | 'family_mediated'

export interface IslamicCompatibilityFactors {
  prayerAlignment: number
  lifestyleAlignment: number
  familyValuesAlignment: number
  religiousKnowledgeBalance: number
  communityInvolvementCompatibility: number
  matrimonialIntentions: number
}