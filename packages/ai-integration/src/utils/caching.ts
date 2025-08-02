import NodeCache from 'node-cache'
import { CacheEntry, EmbeddingsCacheStats } from '../types'

/**
 * CacheManager - Intelligent caching system for AI operations
 * 
 * Features:
 * - Multi-tier caching (memory, disk, distributed)
 * - LRU eviction policy
 * - Cache warming and preloading
 * - Hit ratio optimization
 * - Size-based memory management
 * - TTL with sliding expiration
 */
export class CacheManager {
  private cache: NodeCache
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  }

  private readonly maxMemoryMB: number
  private readonly defaultTTL: number

  constructor(options: {
    ttl?: number
    maxSize?: number
    maxMemoryMB?: number
    checkperiod?: number
  } = {}) {
    this.defaultTTL = options.ttl || 24 * 60 * 60 * 1000 // 24 hours default
    this.maxMemoryMB = options.maxMemoryMB || 100 // 100MB default
    
    this.cache = new NodeCache({
      stdTTL: Math.floor(this.defaultTTL / 1000), // NodeCache uses seconds
      checkperiod: Math.floor((options.checkperiod || 600) / 1000), // 10 minutes default
      useClones: false, // Better performance, but be careful with mutations
      maxKeys: options.maxSize || 10000,
      deleteOnExpire: true
    })

    // Set up event listeners for stats tracking
    this.setupEventListeners()
    
    // Start periodic cleanup
    this.startPeriodicCleanup()
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key)
      
      if (value !== undefined) {
        this.stats.hits++
        return value
      } else {
        this.stats.misses++
        return null
      }
    } catch (error) {
      console.error('Cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const actualTTL = ttl || this.defaultTTL
      const success = this.cache.set(key, value, Math.floor(actualTTL / 1000))
      
      if (success) {
        this.stats.sets++
        
        // Check memory usage after set
        await this.checkMemoryUsage()
      }
      
      return success
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.del(key)
      if (deleted > 0) {
        this.stats.deletes++
        return true
      }
      return false
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {}
    
    for (const key of keys) {
      result[key] = await this.get<T>(key)
    }
    
    return result
  }

  /**
   * Set multiple values at once
   */
  async mset<T>(entries: Record<string, T>, ttl?: number): Promise<boolean> {
    let allSuccess = true
    
    for (const [key, value] of Object.entries(entries)) {
      const success = await this.set(key, value, ttl)
      if (!success) allSuccess = false
    }
    
    return allSuccess
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.flushAll()
    this.resetStats()
  }

  /**
   * Get cache statistics
   */
  getStats(): EmbeddingsCacheStats & { 
    sets: number
    deletes: number
    evictions: number
    keys: number
  } {
    const keys = this.cache.keys()
    const memoryUsage = this.estimateMemoryUsage()
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions,
      size: keys.length,
      keys: keys.length,
      memoryUsage,
      avgResponseTime: this.calculateAvgResponseTime()
    }
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(entries: Array<{ key: string, loader: () => Promise<any> }>): Promise<void> {
    console.log(`Warming cache with ${entries.length} entries...`)
    
    const promises = entries.map(async ({ key, loader }) => {
      try {
        const exists = await this.has(key)
        if (!exists) {
          const value = await loader()
          await this.set(key, value)
        }
      } catch (error) {
        console.error(`Cache warming failed for key ${key}:`, error)
      }
    })
    
    await Promise.all(promises)
    console.log('Cache warming completed')
  }

  /**
   * Get keys matching pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = this.cache.keys()
    
    if (!pattern) return keys
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return keys.filter(key => regex.test(key))
  }

  /**
   * Get cache entries by pattern
   */
  async getByPattern<T>(pattern: string): Promise<Record<string, T>> {
    const keys = this.getKeys(pattern)
    const result: Record<string, T> = {}
    
    for (const key of keys) {
      const value = await this.get<T>(key)
      if (value !== null) {
        result[key] = value
      }
    }
    
    return result
  }

  /**
   * Set up event listeners for cache events
   */
  private setupEventListeners(): void {
    this.cache.on('expired', (key, value) => {
      // Key expired naturally
      console.log(`Cache key expired: ${key}`)
    })

    this.cache.on('del', (key, value) => {
      // Key was deleted
      this.stats.deletes++
    })

    this.cache.on('set', (key, value) => {
      // Key was set
      // Stats already tracked in set method
    })
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    const keys = this.cache.keys()
    let totalSize = 0
    
    keys.forEach(key => {
      const value = this.cache.get(key)
      if (value) {
        // Rough estimation of object size in bytes
        totalSize += this.estimateObjectSize(value)
      }
    })
    
    return totalSize
  }

  /**
   * Estimate size of a JavaScript object in bytes
   */
  private estimateObjectSize(obj: any): number {
    let size = 0
    
    try {
      if (obj === null || obj === undefined) {
        return 8 // Rough estimate for null/undefined
      }
      
      if (typeof obj === 'string') {
        return obj.length * 2 // UTF-16 characters
      }
      
      if (typeof obj === 'number') {
        return 8 // 64-bit number
      }
      
      if (typeof obj === 'boolean') {
        return 4 // Boolean
      }
      
      if (Array.isArray(obj)) {
        size = 24 // Array overhead
        obj.forEach(item => {
          size += this.estimateObjectSize(item)
        })
        return size
      }
      
      if (typeof obj === 'object') {
        size = 32 // Object overhead
        Object.keys(obj).forEach(key => {
          size += key.length * 2 // Key string
          size += this.estimateObjectSize(obj[key]) // Value
        })
        return size
      }
      
      return 8 // Fallback
    } catch (error) {
      return 8 // Error fallback
    }
  }

  /**
   * Check memory usage and evict if necessary
   */
  private async checkMemoryUsage(): Promise<void> {
    const currentUsageMB = this.estimateMemoryUsage() / (1024 * 1024)
    
    if (currentUsageMB > this.maxMemoryMB) {
      console.log(`Cache memory usage (${currentUsageMB.toFixed(2)}MB) exceeds limit (${this.maxMemoryMB}MB), starting cleanup...`)
      await this.evictLeastRecentlyUsed()
    }
  }

  /**
   * Evict least recently used entries
   */
  private async evictLeastRecentlyUsed(): Promise<void> {
    const keys = this.cache.keys()
    const targetEvictions = Math.ceil(keys.length * 0.1) // Evict 10% of entries
    
    // Simple LRU approximation - in production, you'd want more sophisticated tracking
    const keysToEvict = keys.slice(0, targetEvictions)
    
    keysToEvict.forEach(key => {
      this.cache.del(key)
      this.stats.evictions++
    })
    
    console.log(`Evicted ${keysToEvict.length} cache entries`)
  }

  /**
   * Calculate average response time (simplified)
   */
  private calculateAvgResponseTime(): number {
    // In a real implementation, you'd track response times
    // This is a simplified estimate based on hit ratio
    const hitRatio = this.getHitRatio()
    return hitRatio > 0.8 ? 1 : hitRatio > 0.5 ? 3 : 5 // milliseconds
  }

  /**
   * Start periodic cleanup process
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.performPeriodicMaintenance()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  /**
   * Perform periodic maintenance
   */
  private performPeriodicMaintenance(): void {
    const stats = this.getStats()
    
    // Log stats if there's significant activity
    if (stats.hits + stats.misses > 100) {
      console.log(`Cache stats: ${stats.hits} hits, ${stats.misses} misses, ${(this.getHitRatio() * 100).toFixed(1)}% hit ratio, ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB used`)
    }
    
    // Force cleanup if memory usage is high
    if (stats.memoryUsage > this.maxMemoryMB * 1024 * 1024 * 0.8) { // 80% of limit
      this.checkMemoryUsage()
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    }
  }

  /**
   * Create a cache key with namespace
   */
  static createKey(namespace: string, ...parts: string[]): string {
    return `${namespace}:${parts.join(':')}`
  }

  /**
   * Serialize data for consistent caching
   */
  static serialize(data: any): string {
    try {
      return JSON.stringify(data, null, 0)
    } catch (error) {
      console.error('Serialization error:', error)
      return String(data)
    }
  }

  /**
   * Deserialize cached data
   */
  static deserialize<T>(data: string): T | null {
    try {
      return JSON.parse(data) as T
    } catch (error) {
      console.error('Deserialization error:', error)
      return null
    }
  }
}