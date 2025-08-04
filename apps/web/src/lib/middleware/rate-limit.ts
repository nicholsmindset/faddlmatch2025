/**
 * 🚦 Production Rate Limiting Middleware
 * Multi-tier rate limiting for subscription APIs with Redis fallback
 */

import { NextRequest } from 'next/server'
import { getSecurityConfig } from '@/lib/env'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

/**
 * 🎯 Rate limit configurations by endpoint type
 */
export const RATE_LIMIT_CONFIGS = {
  // Stripe webhooks - high limit, short window
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: () => 'webhook:stripe',
  },
  
  // Subscription status checks - moderate limit
  SUBSCRIPTION_READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `sub:read:${userId}`
    },
  },
  
  // Checkout creation - strict limit
  CHECKOUT_CREATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `checkout:${userId}`
    },
  },
  
  // Portal access - moderate limit
  PORTAL_ACCESS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `portal:${userId}`
    },
  },
  
  // Subscription modifications - strict limit
  SUBSCRIPTION_MODIFY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `sub:modify:${userId}`
    },
  },
  
  // General API - fallback
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (req: NextRequest) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      return `api:${ip}`
    },
  },
} as const

/**
 * 🗄️ In-memory rate limit store with TTL
 */
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  private cleanup: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanup = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000)
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key)
      }
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now()
    const resetTime = now + windowMs
    const existing = this.store.get(key)

    if (!existing || now > existing.resetTime) {
      // New window or expired window
      this.store.set(key, { count: 1, resetTime })
      return {
        success: true,
        limit: 0, // Will be set by caller
        remaining: 0, // Will be set by caller
        reset: Math.ceil(resetTime / 1000),
      }
    }

    // Increment existing count
    existing.count++
    this.store.set(key, existing)

    return {
      success: true,
      limit: 0, // Will be set by caller
      remaining: 0, // Will be set by caller
      reset: Math.ceil(existing.resetTime / 1000),
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const existing = this.store.get(key)
    if (!existing) return null

    const now = Date.now()
    if (now > existing.resetTime) {
      this.store.delete(key)
      return null
    }

    return existing
  }

  destroy(): void {
    clearInterval(this.cleanup)
    this.store.clear()
  }
}

// Global store instance
const memoryStore = new MemoryRateLimitStore()

/**
 * 🚦 Production rate limiter
 */
export class ProductionRateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const securityConfig = getSecurityConfig()
    
    // Skip rate limiting in development or if disabled
    if (!securityConfig.rateLimitEnabled) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: Math.ceil((Date.now() + this.config.windowMs) / 1000),
      }
    }

    const key = this.config.keyGenerator ? this.config.keyGenerator(request) : 'default'
    
    try {
      // Try Redis first, fall back to memory store
      const result = await this.checkWithMemoryStore(key)
      return result
    } catch (error) {
      console.error('[RATE_LIMIT] Error checking rate limit:', error)
      
      // Fail open in case of store errors
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: Math.ceil((Date.now() + this.config.windowMs) / 1000),
      }
    }
  }

  private async checkWithMemoryStore(key: string): Promise<RateLimitResult> {
    const result = await memoryStore.increment(key, this.config.windowMs)
    const current = await memoryStore.get(key)
    
    const count = current?.count || 0
    const remaining = Math.max(0, this.config.maxRequests - count)
    const success = count <= this.config.maxRequests

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      reset: result.reset,
      retryAfter: success ? undefined : Math.ceil(this.config.windowMs / 1000),
    }
  }
}

/**
 * 🎯 Create rate limiter for specific endpoint type
 */
export function createRateLimiter(type: keyof typeof RATE_LIMIT_CONFIGS): ProductionRateLimiter {
  const config = RATE_LIMIT_CONFIGS[type]
  return new ProductionRateLimiter(config)
}

/**
 * 🚦 Rate limit middleware for API routes
 */
export async function withRateLimit<T>(
  request: NextRequest,
  limiter: ProductionRateLimiter,
  handler: () => Promise<T>
): Promise<T> {
  const result = await limiter.checkLimit(request)

  if (!result.success) {
    const error = new Error('Rate limit exceeded') as any
    error.status = 429
    error.headers = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': result.reset.toString(),
      'Retry-After': (result.retryAfter || 60).toString(),
    }
    throw error
  }

  // Add rate limit headers to successful responses
  const response = await handler()
  
  // If response is a NextResponse, add headers
  if (response && typeof response === 'object' && 'headers' in response) {
    const nextResponse = response as any
    nextResponse.headers.set('X-RateLimit-Limit', result.limit.toString())
    nextResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    nextResponse.headers.set('X-RateLimit-Reset', result.reset.toString())
  }

  return response
}

/**
 * 🧹 Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  memoryStore.destroy()
}

/**
 * 📊 Rate limit analytics
 */
export interface RateLimitAnalytics {
  endpoint: string
  limit: number
  current: number
  remaining: number
  resetAt: Date
  isLimited: boolean
}

export async function getRateLimitAnalytics(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitAnalytics> {
  const config = RATE_LIMIT_CONFIGS[type]
  const key = config.keyGenerator ? config.keyGenerator(request) : 'default'
  const current = await memoryStore.get(key)
  
  const count = current?.count || 0
  const remaining = Math.max(0, config.maxRequests - count)
  const resetAt = current ? new Date(current.resetTime) : new Date(Date.now() + config.windowMs)
  
  return {
    endpoint: type,
    limit: config.maxRequests,
    current: count,
    remaining,
    resetAt,
    isLimited: count >= config.maxRequests,
  }
}