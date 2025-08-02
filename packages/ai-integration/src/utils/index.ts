export { CacheManager } from './caching'
export { ErrorHandler } from './error-handling'
export { CostOptimizer } from './cost-optimization'

// Re-export relevant types
export type {
  AIMetrics,
  CacheEntry,
  EmbeddingsCacheStats,
  AIIntegrationError,
  EmbeddingError,
  ModerationError,
  ConversationError
} from '../types'