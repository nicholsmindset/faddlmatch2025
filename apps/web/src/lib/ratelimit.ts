/**
 * 🚦 Rate Limiting Utility for FADDL Match
 * Enterprise-grade rate limiting with Redis-like interface
 */

interface RateLimitConfig {
  requests: number
  window: string // e.g., '1m', '1h', '1d'
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

// In-memory store for development/fallback
// In production, this should use Redis or similar persistent store
const memoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Parse time window string to milliseconds
 */
function parseWindow(window: string): number {
  const unit = window.slice(-1)
  const value = parseInt(window.slice(0, -1))
  
  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: throw new Error(`Invalid time window: ${window}`)
  }
}

/**
 * 🛡️ Rate limiting function
 * 
 * @param key - Unique identifier for the rate limit (e.g., IP, user ID)
 * @param config - Rate limit configuration
 * @returns Promise<RateLimitResult>
 */
export async function ratelimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowMs = parseWindow(config.window)
  const now = Date.now()
  const resetTime = now + windowMs
  
  try {
    // 🔍 Get current count from store
    const current = memoryStore.get(key)
    
    if (!current || now > current.resetTime) {
      // 🆕 First request or window expired
      memoryStore.set(key, { count: 1, resetTime })
      
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests - 1,
        reset: new Date(resetTime)
      }
    }
    
    // 📊 Check if limit exceeded
    if (current.count >= config.requests) {
      return {
        success: false,
        limit: config.requests,
        remaining: 0,
        reset: new Date(current.resetTime)
      }
    }
    
    // ✅ Increment counter
    current.count++
    memoryStore.set(key, current)
    
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - current.count,
      reset: new Date(current.resetTime)
    }
    
  } catch (error) {
    console.error('[RATELIMIT] Error checking rate limit:', error)
    
    // 🚨 Fail open for availability (or fail closed for security)
    // In production, you might want to fail closed (return false)
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: new Date(resetTime)
    }
  }
}

/**
 * 🧹 Cleanup expired entries (run periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) {
      memoryStore.delete(key)
    }
  }
}

/**
 * 📊 Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalKeys: number
  memoryUsage: number
} {
  return {
    totalKeys: memoryStore.size,
    memoryUsage: JSON.stringify([...memoryStore.entries()]).length
  }
}

// 🔄 Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

/**
 * 🎯 Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // 🌐 Public endpoints
  public: { requests: 100, window: '1m' },
  
  // 🔐 Authentication endpoints
  auth: { requests: 20, window: '1m' },
  
  // 👤 Authenticated users
  authenticated: { requests: 1000, window: '1m' },
  
  // 🛡️ High-security endpoints
  security: { requests: 200, window: '1m' },
  
  // 💬 Messaging endpoints
  messaging: { requests: 50, window: '1m' },
  
  // 🔍 Search endpoints
  search: { requests: 100, window: '1m' },
  
  // 📤 Upload endpoints
  upload: { requests: 10, window: '1m' },
  
  // 📧 Email endpoints
  email: { requests: 5, window: '1h' },
  
  // 🚨 Critical operations
  critical: { requests: 10, window: '1h' }
} as const

/**
 * 🎭 Helper function for different user types
 */
export async function rateLimitByUserType(
  userId: string | null,
  endpoint: keyof typeof rateLimitConfigs,
  ip: string
): Promise<RateLimitResult> {
  const config = rateLimitConfigs[endpoint]
  const key = userId ? `user:${userId}:${endpoint}` : `ip:${ip}:${endpoint}`
  
  return ratelimit(key, config)
}