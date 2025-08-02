/**
 * Real-time API Types for FADDL Match
 * Enterprise-grade type definitions for real-time features
 */

import type { Database } from '@faddlmatch/types'

// Connection Management Types
export interface RealtimeConnectionConfig {
  maxRetries: number
  retryDelay: number
  heartbeatInterval: number
  reconnectTimeout: number
  maxConcurrentConnections: number
  connectionPoolSize: number
}

export interface ConnectionHealth {
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  latency: number
  lastHeartbeat: Date
  reconnectAttempts: number
  connectionId: string
  bandwidth: number
}

// Real-time Event Types
export interface BaseRealtimeEvent {
  id: string
  type: string
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export interface MessageEvent extends BaseRealtimeEvent {
  type: 'message:new' | 'message:updated' | 'message:delivered' | 'message:read'
  conversationId: string
  senderId: string
  recipientId: string
  content?: string
  messageType: Database['public']['Enums']['message_type']
  moderationStatus?: Database['public']['Enums']['moderation_status']
}

export interface MatchEvent extends BaseRealtimeEvent {
  type: 'match:new' | 'match:updated' | 'match:mutual' | 'match:expired'
  matchId: string
  userIds: [string, string]
  compatibilityScore: number
  status: Database['public']['Enums']['match_status']
}

export interface GuardianEvent extends BaseRealtimeEvent {
  type: 'guardian:approval_request' | 'guardian:approval_response' | 'guardian:invite'
  guardianId: string
  matchId?: string
  approved?: boolean
  notes?: string
}

export interface PresenceEvent extends BaseRealtimeEvent {
  type: 'presence:join' | 'presence:leave' | 'presence:typing' | 'presence:online'
  conversationId?: string
  isTyping?: boolean
  lastSeen?: Date
}

export interface NotificationEvent extends BaseRealtimeEvent {
  type: 'notification:new' | 'notification:read'
  title: string
  message: string
  category: 'match' | 'message' | 'guardian' | 'system'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
}

export type RealtimeEvent = 
  | MessageEvent 
  | MatchEvent 
  | GuardianEvent 
  | PresenceEvent 
  | NotificationEvent

// Subscription Types
export interface SubscriptionOptions {
  channel: string
  userId: string
  filters?: Record<string, any>
  rateLimiting?: {
    maxEventsPerSecond: number
    burstLimit: number
  }
  retryPolicy?: {
    maxRetries: number
    backoffMultiplier: number
    initialDelay: number
  }
}

export interface ChannelSubscription {
  id: string
  channel: string
  userId: string
  isActive: boolean
  lastActivity: Date
  eventCount: number
  filters?: Record<string, any>
  unsubscribe: () => Promise<void>
}

// Performance Metrics
export interface PerformanceMetrics {
  connectionLatency: number
  messageDeliveryTime: number
  subscriptionCount: number
  eventThroughput: number
  errorRate: number
  reconnectionRate: number
  bandwidth: {
    incoming: number
    outgoing: number
  }
}

// Error Handling
export interface RealtimeError {
  code: string
  message: string
  details?: any
  timestamp: Date
  recoverable: boolean
  retryAfter?: number
}

// Circuit Breaker Types
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureTime?: Date
  nextAttemptTime?: Date
  successCount: number
}

// Rate Limiting Types
export interface RateLimitState {
  tokensRemaining: number
  resetTime: Date
  requestCount: number
  isThrottled: boolean
}

// Caching Types
export interface CacheEntry<T = any> {
  data: T
  timestamp: Date
  ttl: number
  hits: number
}

export interface CacheOptions {
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'ttl'
}

// Islamic Compliance Types
export interface ComplianceValidation {
  contentScore: number
  flags: string[]
  approved: boolean
  reviewRequired: boolean
  moderatorNotes?: string
}

export interface GuardianPermissions {
  canViewMessages: boolean
  canApproveMatches: boolean
  requiresApproval: boolean
  notificationPreferences: {
    newMatches: boolean
    messageActivity: boolean
    profileUpdates: boolean
  }
}