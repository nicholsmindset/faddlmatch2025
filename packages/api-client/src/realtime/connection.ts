/**
 * Real-time Connection Manager for FADDL Match
 * Enterprise-grade WebSocket connection management with automatic reconnection,
 * circuit breaker pattern, and performance optimization
 */

import { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js'
import type { 
  RealtimeConnectionConfig, 
  ConnectionHealth, 
  CircuitBreakerState,
  PerformanceMetrics,
  RealtimeError 
} from './types'

export class RealtimeConnectionManager {
  private client: RealtimeClient
  private connections = new Map<string, RealtimeChannel>()
  private config: RealtimeConnectionConfig
  private health: ConnectionHealth
  private circuitBreaker: CircuitBreakerState
  private metrics: PerformanceMetrics
  private eventListeners = new Map<string, Set<Function>>()
  private heartbeatInterval?: NodeJS.Timeout
  private reconnectTimeout?: NodeJS.Timeout
  private performanceMonitor?: NodeJS.Timeout

  private readonly DEFAULT_CONFIG: RealtimeConnectionConfig = {
    maxRetries: 5,
    retryDelay: 1000,
    heartbeatInterval: 30000,
    reconnectTimeout: 5000,
    maxConcurrentConnections: 10,
    connectionPoolSize: 5
  }

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private authToken: string,
    config?: Partial<RealtimeConnectionConfig>
  ) {
    this.config = { ...this.DEFAULT_CONFIG, ...config }
    this.initializeClient()
    this.initializeHealth()
    this.initializeCircuitBreaker()
    this.initializeMetrics()
    this.startPerformanceMonitoring()
  }

  private initializeClient(): void {
    this.client = new RealtimeClient(
      `${this.supabaseUrl.replace('http', 'ws')}/realtime/v1`,
      {
        apikey: this.supabaseKey,
        params: {
          eventsPerSecond: 100,
          apikey: this.supabaseKey
        },
        transport: WebSocket,
        timeout: 10000,
        heartbeatIntervalMs: this.config.heartbeatInterval,
        reconnectAfterMs: (tries: number) => {
          return Math.min(tries * this.config.retryDelay, 30000)
        }
      }
    )

    // Set auth token
    this.client.setAuth(this.authToken)

    // Setup connection event handlers
    this.client.onOpen(() => this.handleConnectionOpen())
    this.client.onClose(() => this.handleConnectionClose())
    this.client.onError((error) => this.handleConnectionError(error))
  }

  private initializeHealth(): void {
    this.health = {
      status: 'disconnected',
      latency: 0,
      lastHeartbeat: new Date(),
      reconnectAttempts: 0,
      connectionId: this.generateConnectionId(),
      bandwidth: 0
    }
  }

  private initializeCircuitBreaker(): void {
    this.circuitBreaker = {
      state: 'closed',
      failureCount: 0,
      successCount: 0
    }
  }

  private initializeMetrics(): void {
    this.metrics = {
      connectionLatency: 0,
      messageDeliveryTime: 0,
      subscriptionCount: 0,
      eventThroughput: 0,
      errorRate: 0,
      reconnectionRate: 0,
      bandwidth: {
        incoming: 0,
        outgoing: 0
      }
    }
  }

  /**
   * Connect to Supabase Realtime
   */
  async connect(): Promise<void> {
    if (this.circuitBreaker.state === 'open') {
      throw new Error('Circuit breaker is open - connection unavailable')
    }

    try {
      this.health.status = 'connecting'
      const startTime = Date.now()
      
      await this.client.connect()
      
      this.health.latency = Date.now() - startTime
      this.health.status = 'connected'
      this.health.reconnectAttempts = 0
      
      this.updateCircuitBreakerSuccess()
      this.startHeartbeat()
      
      this.emit('connection:established', this.health)
    } catch (error) {
      this.updateCircuitBreakerFailure()
      this.health.status = 'error'
      throw this.createRealtimeError('CONNECTION_FAILED', error)
    }
  }

  /**
   * Disconnect from Supabase Realtime
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat()
    this.stopPerformanceMonitoring()
    
    // Unsubscribe from all channels
    for (const [channelId, channel] of this.connections) {
      await this.unsubscribeFromChannel(channelId)
    }
    
    this.client.disconnect()
    this.health.status = 'disconnected'
    
    this.emit('connection:closed', this.health)
  }

  /**
   * Subscribe to a real-time channel with enterprise features
   */
  async subscribeToChannel(
    channelName: string,
    userId: string,
    filters?: Record<string, any>
  ): Promise<string> {
    if (this.connections.size >= this.config.maxConcurrentConnections) {
      throw new Error('Maximum concurrent connections reached')
    }

    const channelId = this.generateChannelId(channelName, userId)
    
    try {
      const channel = this.client.channel(channelName, {
        config: {
          presence: { key: userId },
          broadcast: { self: false },
          postgres_changes: filters ? [filters] : undefined
        }
      })

      // Setup channel event handlers
      channel.on('presence', { event: 'sync' }, (payload) => {
        this.handlePresenceSync(channelId, payload)
      })

      channel.on('presence', { event: 'join' }, (payload) => {
        this.handlePresenceJoin(channelId, payload)
      })

      channel.on('presence', { event: 'leave' }, (payload) => {
        this.handlePresenceLeave(channelId, payload)
      })

      channel.on('broadcast', { event: '*' }, (payload) => {
        this.handleBroadcast(channelId, payload)
      })

      if (filters) {
        channel.on('postgres_changes', filters, (payload) => {
          this.handleDatabaseChange(channelId, payload)
        })
      }

      await channel.subscribe()
      
      this.connections.set(channelId, channel)
      this.metrics.subscriptionCount = this.connections.size
      
      this.emit('channel:subscribed', { channelId, channelName, userId })
      
      return channelId
    } catch (error) {
      throw this.createRealtimeError('SUBSCRIPTION_FAILED', error)
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribeFromChannel(channelId: string): Promise<void> {
    const channel = this.connections.get(channelId)
    if (channel) {
      await channel.unsubscribe()
      this.connections.delete(channelId)
      this.metrics.subscriptionCount = this.connections.size
      
      this.emit('channel:unsubscribed', { channelId })
    }
  }

  /**
   * Send real-time message to channel
   */
  async sendToChannel(
    channelId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = this.connections.get(channelId)
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`)
    }

    const startTime = Date.now()
    
    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload
      })
      
      const deliveryTime = Date.now() - startTime
      this.metrics.messageDeliveryTime = deliveryTime
      this.metrics.bandwidth.outgoing += JSON.stringify(payload).length
      
    } catch (error) {
      throw this.createRealtimeError('SEND_FAILED', error)
    }
  }

  /**
   * Get connection health status
   */
  getHealth(): ConnectionHealth {
    return { ...this.health }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Update authentication token
   */
  updateAuthToken(token: string): void {
    this.authToken = token
    this.client.setAuth(token)
  }

  /**
   * Handle connection open
   */
  private handleConnectionOpen(): void {
    this.health.status = 'connected'
    this.health.lastHeartbeat = new Date()
    this.emit('connection:open', this.health)
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(): void {
    this.health.status = 'disconnected'
    this.stopHeartbeat()
    
    if (this.health.reconnectAttempts < this.config.maxRetries) {
      this.scheduleReconnect()
    }
    
    this.emit('connection:close', this.health)
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: any): void {
    this.health.status = 'error'
    this.updateCircuitBreakerFailure()
    this.metrics.errorRate++
    
    const realtimeError = this.createRealtimeError('CONNECTION_ERROR', error)
    this.emit('connection:error', realtimeError)
  }

  /**
   * Schedule automatic reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    const delay = Math.min(
      this.config.retryDelay * Math.pow(2, this.health.reconnectAttempts),
      30000
    )

    this.reconnectTimeout = setTimeout(async () => {
      this.health.reconnectAttempts++
      this.metrics.reconnectionRate++
      
      try {
        await this.connect()
      } catch (error) {
        if (this.health.reconnectAttempts < this.config.maxRetries) {
          this.scheduleReconnect()
        }
      }
    }, delay)
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const startTime = Date.now()
      
      this.client.sendHeartbeat()
      
      // Monitor heartbeat response
      const checkHeartbeat = () => {
        const latency = Date.now() - startTime
        this.health.latency = latency
        this.health.lastHeartbeat = new Date()
        
        if (latency > 5000) {
          this.emit('connection:high_latency', { latency })
        }
      }
      
      setTimeout(checkHeartbeat, 100)
    }, this.config.heartbeatInterval)
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      this.updatePerformanceMetrics()
      this.emit('performance:update', this.metrics)
    }, 60000) // Update every minute
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
      this.performanceMonitor = undefined
    }
  }

  /**
   * Update circuit breaker on success
   */
  private updateCircuitBreakerSuccess(): void {
    this.circuitBreaker.successCount++
    this.circuitBreaker.failureCount = 0
    
    if (this.circuitBreaker.state === 'half-open' && 
        this.circuitBreaker.successCount >= 3) {
      this.circuitBreaker.state = 'closed'
    }
  }

  /**
   * Update circuit breaker on failure
   */
  private updateCircuitBreakerFailure(): void {
    this.circuitBreaker.failureCount++
    this.circuitBreaker.lastFailureTime = new Date()
    
    if (this.circuitBreaker.failureCount >= 5) {
      this.circuitBreaker.state = 'open'
      this.circuitBreaker.nextAttemptTime = new Date(Date.now() + 60000) // 1 minute
    }
  }

  /**
   * Handle presence sync events
   */
  private handlePresenceSync(channelId: string, payload: any): void {
    this.emit('presence:sync', { channelId, payload })
  }

  /**
   * Handle presence join events
   */
  private handlePresenceJoin(channelId: string, payload: any): void {
    this.emit('presence:join', { channelId, payload })
  }

  /**
   * Handle presence leave events
   */
  private handlePresenceLeave(channelId: string, payload: any): void {
    this.emit('presence:leave', { channelId, payload })
  }

  /**
   * Handle broadcast events
   */
  private handleBroadcast(channelId: string, payload: any): void {
    this.metrics.bandwidth.incoming += JSON.stringify(payload).length
    this.emit('broadcast', { channelId, payload })
  }

  /**
   * Handle database change events
   */
  private handleDatabaseChange(channelId: string, payload: any): void {
    this.metrics.eventThroughput++
    this.emit('database:change', { channelId, payload })
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Calculate error rate (errors per minute)
    this.metrics.errorRate = this.metrics.errorRate * 0.9 // Decay rate
    
    // Calculate event throughput (events per second)
    this.metrics.eventThroughput = this.metrics.eventThroughput * 0.9 // Decay rate
    
    // Reset bandwidth counters
    this.metrics.bandwidth.incoming = 0
    this.metrics.bandwidth.outgoing = 0
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique channel ID
   */
  private generateChannelId(channelName: string, userId: string): string {
    return `${channelName}_${userId}_${Date.now()}`
  }

  /**
   * Create standardized error
   */
  private createRealtimeError(code: string, error: any): RealtimeError {
    return {
      code,
      message: error.message || 'Unknown error',
      details: error,
      timestamp: new Date(),
      recoverable: code !== 'CONNECTION_FAILED'
    }
  }

  /**
   * Event emitter functionality
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.disconnect()
    this.eventListeners.clear()
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
  }
}