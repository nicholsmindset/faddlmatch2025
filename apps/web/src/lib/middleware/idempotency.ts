/**
 * 🔄 Idempotency Middleware for Webhooks and Critical Operations
 * Prevents duplicate processing of Stripe webhooks and subscription operations
 */

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

interface IdempotencyRecord {
  key: string
  response: any
  statusCode: number
  createdAt: number
  expiresAt: number
}

interface IdempotencyConfig {
  ttlMs: number
  keyGenerator?: (request: NextRequest) => string
  enableForMethods?: string[]
  skipPaths?: string[]
}

/**
 * 🗄️ In-memory idempotency store with TTL
 */
class IdempotencyStore {
  private store = new Map<string, IdempotencyRecord>()
  private cleanup: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 10 minutes
    this.cleanup = setInterval(() => this.cleanupExpired(), 10 * 60 * 1000)
  }

  private cleanupExpired(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[IDEMPOTENCY] Cleaned up ${cleanedCount} expired records`)
    }
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const record = this.store.get(key)
    if (!record) return null

    // Check if expired
    if (Date.now() > record.expiresAt) {
      this.store.delete(key)
      return null
    }

    return record
  }

  async set(key: string, response: any, statusCode: number, ttlMs: number): Promise<void> {
    const now = Date.now()
    const record: IdempotencyRecord = {
      key,
      response,
      statusCode,
      createdAt: now,
      expiresAt: now + ttlMs,
    }

    this.store.set(key, record)
    
    // Log storage for monitoring
    console.log(`[IDEMPOTENCY] Stored response for key: ${key.substring(0, 20)}...`)
  }

  async exists(key: string): Promise<boolean> {
    const record = await this.get(key)
    return record !== null
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  getStats(): { totalRecords: number; storeSize: number } {
    return {
      totalRecords: this.store.size,
      storeSize: this.estimateMemoryUsage(),
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in bytes
    let size = 0
    for (const record of this.store.values()) {
      size += JSON.stringify(record).length * 2 // UTF-16 approximation
    }
    return size
  }

  destroy(): void {
    clearInterval(this.cleanup)
    this.store.clear()
  }
}

// Global store instance
const idempotencyStore = new IdempotencyStore()

/**
 * 🔑 Default idempotency key generators
 */
export const IdempotencyKeyGenerators = {
  /**
   * Generate key for Stripe webhooks using event ID
   */
  stripeWebhook: (request: NextRequest): string => {
    const signature = request.headers.get('stripe-signature') || ''
    const timestamp = signature.split(',').find(part => part.includes('t='))?.split('=')[1] || ''
    return `stripe:webhook:${timestamp}:${createHash('sha256').update(signature).digest('hex').substring(0, 16)}`
  },

  /**
   * Generate key for subscription operations using user ID and operation
   */
  subscriptionOperation: (request: NextRequest, operation: string): string => {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const timestamp = Math.floor(Date.now() / 60000) // 1-minute window
    return `subscription:${operation}:${userId}:${timestamp}`
  },

  /**
   * Generate key for checkout operations
   */
  checkoutOperation: (request: NextRequest): string => {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const planId = request.headers.get('x-plan-id') || 'unknown'
    const timestamp = Math.floor(Date.now() / 300000) // 5-minute window
    return `checkout:${userId}:${planId}:${timestamp}`
  },

  /**
   * Generate key based on request body hash
   */
  bodyHash: (request: NextRequest, body: any): string => {
    const bodyStr = JSON.stringify(body)
    const hash = createHash('sha256').update(bodyStr).digest('hex').substring(0, 16)
    const userId = request.headers.get('x-user-id') || 'anonymous'
    return `body:${userId}:${hash}`
  },

  /**
   * Generate key for payment operations
   */
  paymentOperation: (request: NextRequest, paymentIntentId: string): string => {
    return `payment:${paymentIntentId}`
  },
}

/**
 * 🔄 Idempotency configurations for different endpoints
 */
export const IDEMPOTENCY_CONFIGS = {
  // Stripe webhooks - long TTL to prevent reprocessing
  STRIPE_WEBHOOK: {
    ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    keyGenerator: IdempotencyKeyGenerators.stripeWebhook,
    enableForMethods: ['POST'],
  },

  // Subscription creation - medium TTL
  SUBSCRIPTION_CREATE: {
    ttlMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (req: NextRequest) => 
      IdempotencyKeyGenerators.subscriptionOperation(req, 'create'),
    enableForMethods: ['POST'],
  },

  // Checkout creation - short TTL but important for preventing double charges
  CHECKOUT_CREATE: {
    ttlMs: 30 * 60 * 1000, // 30 minutes
    keyGenerator: IdempotencyKeyGenerators.checkoutOperation,
    enableForMethods: ['POST'],
  },

  // Subscription modifications - medium TTL
  SUBSCRIPTION_MODIFY: {
    ttlMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (req: NextRequest) => 
      IdempotencyKeyGenerators.subscriptionOperation(req, 'modify'),
    enableForMethods: ['POST', 'PUT', 'PATCH'],
  },

  // Payment processing - long TTL
  PAYMENT_PROCESS: {
    ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    keyGenerator: (req: NextRequest) => {
      const paymentId = req.headers.get('x-payment-id') || 'unknown'
      return IdempotencyKeyGenerators.paymentOperation(req, paymentId)
    },
    enableForMethods: ['POST'],
  },
} as const

/**
 * 🔄 Production idempotency handler
 */
export class IdempotencyHandler {
  private config: IdempotencyConfig

  constructor(config: IdempotencyConfig) {
    this.config = config
  }

  /**
   * Check if request should be processed or return cached response
   */
  async checkIdempotency(request: NextRequest, body?: any): Promise<{
    shouldProcess: boolean
    cachedResponse?: any
    cachedStatusCode?: number
    idempotencyKey: string
  }> {
    // Skip if method not enabled
    const method = request.method.toUpperCase()
    if (this.config.enableForMethods && !this.config.enableForMethods.includes(method)) {
      return {
        shouldProcess: true,
        idempotencyKey: '',
      }
    }

    // Generate idempotency key
    const idempotencyKey = this.config.keyGenerator ? 
      this.config.keyGenerator(request) : 
      this.generateDefaultKey(request, body)

    // Check for existing record
    const existingRecord = await idempotencyStore.get(idempotencyKey)
    
    if (existingRecord) {
      console.log(`[IDEMPOTENCY] Found cached response for key: ${idempotencyKey}`)
      return {
        shouldProcess: false,
        cachedResponse: existingRecord.response,
        cachedStatusCode: existingRecord.statusCode,
        idempotencyKey,
      }
    }

    return {
      shouldProcess: true,
      idempotencyKey,
    }
  }

  /**
   * Store response for future idempotency checks
   */
  async storeResponse(
    idempotencyKey: string, 
    response: any, 
    statusCode: number
  ): Promise<void> {
    if (!idempotencyKey) return

    await idempotencyStore.set(
      idempotencyKey, 
      response, 
      statusCode, 
      this.config.ttlMs
    )
  }

  /**
   * Generate default idempotency key
   */
  private generateDefaultKey(request: NextRequest, body?: any): string {
    const method = request.method
    const pathname = new URL(request.url).pathname
    const userId = request.headers.get('x-user-id') || 'anonymous'
    
    let keyComponents = [method, pathname, userId]
    
    if (body) {
      const bodyHash = createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex')
        .substring(0, 16)
      keyComponents.push(bodyHash)
    }
    
    // Add timestamp for time-based windowing
    const windowMs = 5 * 60 * 1000 // 5-minute window
    const timeWindow = Math.floor(Date.now() / windowMs)
    keyComponents.push(timeWindow.toString())
    
    return keyComponents.join(':')
  }
}

/**
 * 🎯 Create idempotency handler for specific endpoint type
 */
export function createIdempotencyHandler(
  type: keyof typeof IDEMPOTENCY_CONFIGS
): IdempotencyHandler {
  const config = IDEMPOTENCY_CONFIGS[type]
  return new IdempotencyHandler(config)
}

/**
 * 🔄 Idempotency middleware for API routes
 */
export async function withIdempotency<T>(
  request: NextRequest,
  handler: IdempotencyHandler,
  processor: () => Promise<{ response: T; statusCode: number }>,
  body?: any
): Promise<{ response: T; statusCode: number; wasIdempotent: boolean }> {
  const startTime = Date.now()
  
  try {
    // Check idempotency
    const idempotencyResult = await handler.checkIdempotency(request, body)
    
    if (!idempotencyResult.shouldProcess) {
      console.log(`[IDEMPOTENCY] Returning cached response (${Date.now() - startTime}ms)`)
      return {
        response: idempotencyResult.cachedResponse,
        statusCode: idempotencyResult.cachedStatusCode || 200,
        wasIdempotent: true,
      }
    }

    // Process the request
    const result = await processor()
    
    // Store the response for future idempotency
    await handler.storeResponse(
      idempotencyResult.idempotencyKey,
      result.response,
      result.statusCode
    )
    
    console.log(`[IDEMPOTENCY] Processed and stored response (${Date.now() - startTime}ms)`)
    
    return {
      ...result,
      wasIdempotent: false,
    }
    
  } catch (error) {
    console.error('[IDEMPOTENCY] Error in idempotency middleware:', error)
    
    // Don't store error responses for idempotency
    throw error
  }
}

/**
 * 🧹 Cleanup and monitoring functions
 */
export function getIdempotencyStats(): {
  totalRecords: number
  storeSize: number
  memoryUsageMB: number
} {
  const stats = idempotencyStore.getStats()
  return {
    ...stats,
    memoryUsageMB: Math.round(stats.storeSize / (1024 * 1024) * 100) / 100,
  }
}

export function clearIdempotencyCache(): void {
  idempotencyStore.destroy()
  console.log('[IDEMPOTENCY] Cache cleared')
}

/**
 * 📊 Idempotency analytics
 */
export interface IdempotencyAnalytics {
  totalRequests: number
  idempotentResponses: number
  cacheMissRate: number
  averageResponseTime: number
  cacheHitRate: number
}

class IdempotencyAnalytics {
  private totalRequests = 0
  private idempotentResponses = 0
  private responseTimes: number[] = []

  recordRequest(wasIdempotent: boolean, responseTime: number): void {
    this.totalRequests++
    this.responseTimes.push(responseTime)
    
    if (wasIdempotent) {
      this.idempotentResponses++
    }
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }
  }

  getAnalytics(): IdempotencyAnalytics {
    const cacheHitRate = this.totalRequests > 0 ? 
      (this.idempotentResponses / this.totalRequests) * 100 : 0
    
    const averageResponseTime = this.responseTimes.length > 0 ?
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0

    return {
      totalRequests: this.totalRequests,
      idempotentResponses: this.idempotentResponses,
      cacheMissRate: 100 - cacheHitRate,
      averageResponseTime,
      cacheHitRate,
    }
  }

  reset(): void {
    this.totalRequests = 0
    this.idempotentResponses = 0
    this.responseTimes = []
  }
}

export const idempotencyAnalytics = new IdempotencyAnalytics()