/**
 * Real-time Subscription Manager for FADDL Match
 * Manages multiple real-time subscriptions with intelligent filtering,
 * rate limiting, and Islamic compliance monitoring
 */

import { RealtimeConnectionManager } from './connection'
import type { 
  SubscriptionOptions,
  ChannelSubscription,
  RealtimeEvent,
  MessageEvent,
  MatchEvent,
  GuardianEvent,
  PresenceEvent,
  NotificationEvent,
  RateLimitState,
  ComplianceValidation,
  GuardianPermissions
} from './types'

export class RealtimeSubscriptionManager {
  private subscriptions = new Map<string, ChannelSubscription>()
  private rateLimitStates = new Map<string, RateLimitState>()
  private eventQueue = new Map<string, RealtimeEvent[]>()
  private complianceCache = new Map<string, ComplianceValidation>()
  private guardianPermissions = new Map<string, GuardianPermissions>()
  private eventHandlers = new Map<string, Set<Function>>()

  constructor(
    private connectionManager: RealtimeConnectionManager,
    private userId: string,
    private isGuardian: boolean = false
  ) {
    this.setupConnectionEventHandlers()
  }

  /**
   * Subscribe to user-specific messages
   */
  async subscribeToMessages(
    conversationId: string,
    options?: Partial<SubscriptionOptions>
  ): Promise<string> {
    const subscriptionOptions: SubscriptionOptions = {
      channel: `conversation:${conversationId}`,
      userId: this.userId,
      filters: {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      rateLimiting: {
        maxEventsPerSecond: 10,
        burstLimit: 50
      },
      ...options
    }

    return this.createSubscription(subscriptionOptions, (event) => {
      this.handleMessageEvent(event as MessageEvent)
    })
  }

  /**
   * Subscribe to match updates
   */
  async subscribeToMatches(
    options?: Partial<SubscriptionOptions>
  ): Promise<string> {
    const subscriptionOptions: SubscriptionOptions = {
      channel: `matches:${this.userId}`,
      userId: this.userId,
      filters: {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `user_a_id=eq.${this.userId},user_b_id=eq.${this.userId}`
      },
      rateLimiting: {
        maxEventsPerSecond: 5,
        burstLimit: 20
      },
      ...options
    }

    return this.createSubscription(subscriptionOptions, (event) => {
      this.handleMatchEvent(event as MatchEvent)
    })
  }

  /**
   * Subscribe to guardian notifications (if user is guardian)
   */
  async subscribeToGuardianNotifications(
    guardianId: string,
    options?: Partial<SubscriptionOptions>
  ): Promise<string> {
    if (!this.isGuardian) {
      throw new Error('User is not authorized as guardian')
    }

    const subscriptionOptions: SubscriptionOptions = {
      channel: `guardian:${guardianId}`,
      userId: this.userId,
      filters: {
        event: '*',
        schema: 'public',
        table: 'guardian_approvals',
        filter: `guardian_id=eq.${guardianId}`
      },
      rateLimiting: {
        maxEventsPerSecond: 3,
        burstLimit: 10
      },
      ...options
    }

    return this.createSubscription(subscriptionOptions, (event) => {
      this.handleGuardianEvent(event as GuardianEvent)
    })
  }

  /**
   * Subscribe to presence updates (typing indicators, online status)
   */
  async subscribeToPresence(
    conversationId: string,
    options?: Partial<SubscriptionOptions>
  ): Promise<string> {
    const subscriptionOptions: SubscriptionOptions = {
      channel: `presence:${conversationId}`,
      userId: this.userId,
      rateLimiting: {
        maxEventsPerSecond: 20,
        burstLimit: 100
      },
      ...options
    }

    return this.createSubscription(subscriptionOptions, (event) => {
      this.handlePresenceEvent(event as PresenceEvent)
    })
  }

  /**
   * Subscribe to system notifications
   */
  async subscribeToNotifications(
    options?: Partial<SubscriptionOptions>
  ): Promise<string> {
    const subscriptionOptions: SubscriptionOptions = {
      channel: `notifications:${this.userId}`,
      userId: this.userId,
      filters: {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${this.userId}`
      },
      rateLimiting: {
        maxEventsPerSecond: 2,
        burstLimit: 10
      },
      ...options
    }

    return this.createSubscription(subscriptionOptions, (event) => {
      this.handleNotificationEvent(event as NotificationEvent)
    })
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    conversationId: string,
    isTyping: boolean
  ): Promise<void> {
    const channelId = this.findChannelByConversation(conversationId)
    if (channelId) {
      await this.connectionManager.sendToChannel(channelId, 'typing', {
        userId: this.userId,
        isTyping,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Send presence update (online/offline)
   */
  async sendPresenceUpdate(
    conversationId: string,
    status: 'online' | 'offline'
  ): Promise<void> {
    const channelId = this.findChannelByConversation(conversationId)
    if (channelId) {
      await this.connectionManager.sendToChannel(channelId, 'presence', {
        userId: this.userId,
        status,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Unsubscribe from specific subscription
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      await subscription.unsubscribe()
      this.subscriptions.delete(subscriptionId)
      this.rateLimitStates.delete(subscriptionId)
      this.eventQueue.delete(subscriptionId)
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys())
      .map(id => this.unsubscribe(id))
    
    await Promise.all(unsubscribePromises)
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(subscriptionId: string): ChannelSubscription | undefined {
    return this.subscriptions.get(subscriptionId)
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): ChannelSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive)
  }

  /**
   * Create and manage subscription
   */
  private async createSubscription(
    options: SubscriptionOptions,
    eventHandler: (event: RealtimeEvent) => void
  ): Promise<string> {
    // Check rate limiting
    if (this.isRateLimited(options.channel)) {
      throw new Error(`Rate limit exceeded for channel: ${options.channel}`)
    }

    try {
      const channelId = await this.connectionManager.subscribeToChannel(
        options.channel,
        options.userId,
        options.filters
      )

      const subscription: ChannelSubscription = {
        id: channelId,
        channel: options.channel,
        userId: options.userId,
        isActive: true,
        lastActivity: new Date(),
        eventCount: 0,
        filters: options.filters,
        unsubscribe: async () => {
          await this.connectionManager.unsubscribeFromChannel(channelId)
          this.subscriptions.delete(channelId)
        }
      }

      this.subscriptions.set(channelId, subscription)
      this.initializeRateLimit(channelId, options.rateLimiting)
      this.eventQueue.set(channelId, [])

      // Register event handler
      this.on(`channel:${channelId}`, eventHandler)

      return channelId
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`)
    }
  }

  /**
   * Handle message events with Islamic compliance
   */
  private async handleMessageEvent(event: MessageEvent): Promise<void> {
    // Check Islamic compliance
    const isCompliant = await this.validateIslamicCompliance(
      event.content || '',
      'message'
    )

    if (!isCompliant.approved && isCompliant.reviewRequired) {
      // Queue for guardian review
      await this.queueForGuardianReview(event)
      return
    }

    // Check guardian permissions for message viewing
    if (await this.requiresGuardianApproval(event.conversationId, 'message')) {
      await this.notifyGuardianOfActivity(event)
    }

    this.emit('message:received', event)
  }

  /**
   * Handle match events
   */
  private async handleMatchEvent(event: MatchEvent): Promise<void> {
    // Check if guardian approval is required
    if (await this.requiresGuardianApproval(event.matchId, 'match')) {
      await this.requestGuardianApproval(event)
    }

    this.emit('match:updated', event)
  }

  /**
   * Handle guardian events
   */
  private async handleGuardianEvent(event: GuardianEvent): Promise<void> {
    // Validate guardian permissions
    const permissions = await this.getGuardianPermissions(event.userId || '')
    
    if (!permissions.canApproveMatches && event.type === 'guardian:approval_request') {
      throw new Error('Guardian not authorized for match approvals')
    }

    this.emit('guardian:activity', event)
  }

  /**
   * Handle presence events
   */
  private async handlePresenceEvent(event: PresenceEvent): Promise<void> {
    // Update user presence cache
    if (event.conversationId) {
      this.updatePresenceCache(event.conversationId, event)
    }

    this.emit('presence:updated', event)
  }

  /**
   * Handle notification events
   */
  private async handleNotificationEvent(event: NotificationEvent): Promise<void> {
    // Check notification preferences and delivery rules
    if (await this.shouldDeliverNotification(event)) {
      this.emit('notification:received', event)
    }
  }

  /**
   * Validate Islamic compliance of content
   */
  private async validateIslamicCompliance(
    content: string,
    contentType: 'message' | 'profile' | 'media'
  ): Promise<ComplianceValidation> {
    const cacheKey = `${contentType}:${this.hashContent(content)}`
    
    // Check cache first
    if (this.complianceCache.has(cacheKey)) {
      return this.complianceCache.get(cacheKey)!
    }

    // Simulate Islamic compliance check
    // In production, this would call a compliance service
    const validation: ComplianceValidation = {
      contentScore: Math.random() * 100,
      flags: [],
      approved: true,
      reviewRequired: false
    }

    // Simple heuristic checks
    const inappropriateWords = ['inappropriate', 'haram', 'dating']
    const flags = inappropriateWords.filter(word => 
      content.toLowerCase().includes(word)
    )

    if (flags.length > 0) {
      validation.flags = flags
      validation.approved = false
      validation.reviewRequired = true
      validation.contentScore = 30
    }

    // Cache the result
    this.complianceCache.set(cacheKey, validation)
    
    // Expire cache after 1 hour
    setTimeout(() => {
      this.complianceCache.delete(cacheKey)
    }, 3600000)

    return validation
  }

  /**
   * Check if guardian approval is required
   */
  private async requiresGuardianApproval(
    resourceId: string,
    action: 'match' | 'message'
  ): Promise<boolean> {
    const permissions = await this.getGuardianPermissions(this.userId)
    
    switch (action) {
      case 'match':
        return permissions.requiresApproval
      case 'message':
        return permissions.canViewMessages && permissions.requiresApproval
      default:
        return false
    }
  }

  /**
   * Get guardian permissions for user
   */
  private async getGuardianPermissions(userId: string): Promise<GuardianPermissions> {
    if (this.guardianPermissions.has(userId)) {
      return this.guardianPermissions.get(userId)!
    }

    // Default permissions - in production, fetch from database
    const permissions: GuardianPermissions = {
      canViewMessages: true,
      canApproveMatches: true,
      requiresApproval: false,
      notificationPreferences: {
        newMatches: true,
        messageActivity: false,
        profileUpdates: true
      }
    }

    this.guardianPermissions.set(userId, permissions)
    return permissions
  }

  /**
   * Initialize rate limiting for subscription
   */
  private initializeRateLimit(
    subscriptionId: string,
    rateLimiting?: { maxEventsPerSecond: number; burstLimit: number }
  ): void {
    if (rateLimiting) {
      this.rateLimitStates.set(subscriptionId, {
        tokensRemaining: rateLimiting.burstLimit,
        resetTime: new Date(Date.now() + 1000),
        requestCount: 0,
        isThrottled: false
      })
    }
  }

  /**
   * Check if subscription is rate limited
   */
  private isRateLimited(channel: string): boolean {
    const state = this.rateLimitStates.get(channel)
    if (!state) return false

    const now = new Date()
    
    // Reset if time window passed
    if (now >= state.resetTime) {
      state.tokensRemaining = 50 // Default burst limit
      state.resetTime = new Date(now.getTime() + 1000)
      state.requestCount = 0
      state.isThrottled = false
    }

    return state.isThrottled || state.tokensRemaining <= 0
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionEventHandlers(): void {
    this.connectionManager.on('database:change', (data) => {
      this.handleDatabaseChange(data.channelId, data.payload)
    })

    this.connectionManager.on('broadcast', (data) => {
      this.handleBroadcast(data.channelId, data.payload)
    })

    this.connectionManager.on('presence:join', (data) => {
      this.handlePresenceJoin(data.channelId, data.payload)
    })

    this.connectionManager.on('presence:leave', (data) => {
      this.handlePresenceLeave(data.channelId, data.payload)
    })

    this.connectionManager.on('connection:error', (error) => {
      this.emit('subscription:error', error)
    })
  }

  /**
   * Handle database changes
   */
  private handleDatabaseChange(channelId: string, payload: any): void {
    const subscription = this.subscriptions.get(channelId)
    if (subscription) {
      subscription.eventCount++
      subscription.lastActivity = new Date()
      
      this.emit(`channel:${channelId}`, this.transformPayload(payload))
    }
  }

  /**
   * Handle broadcast messages
   */
  private handleBroadcast(channelId: string, payload: any): void {
    this.emit(`channel:${channelId}`, payload)
  }

  /**
   * Handle presence join
   */
  private handlePresenceJoin(channelId: string, payload: any): void {
    const presenceEvent: PresenceEvent = {
      id: `presence_${Date.now()}`,
      type: 'presence:join',
      timestamp: new Date(),
      userId: payload.user_id,
      conversationId: this.extractConversationId(channelId)
    }
    
    this.emit(`channel:${channelId}`, presenceEvent)
  }

  /**
   * Handle presence leave
   */
  private handlePresenceLeave(channelId: string, payload: any): void {
    const presenceEvent: PresenceEvent = {
      id: `presence_${Date.now()}`,
      type: 'presence:leave',
      timestamp: new Date(),
      userId: payload.user_id,
      conversationId: this.extractConversationId(channelId)
    }
    
    this.emit(`channel:${channelId}`, presenceEvent)
  }

  /**
   * Transform database payload to event
   */
  private transformPayload(payload: any): RealtimeEvent {
    const eventType = `${payload.table}:${payload.eventType.toLowerCase()}`
    
    return {
      id: payload.new?.id || payload.old?.id || `event_${Date.now()}`,
      type: eventType,
      timestamp: new Date(),
      userId: payload.new?.user_id || payload.old?.user_id,
      metadata: {
        table: payload.table,
        eventType: payload.eventType,
        old: payload.old,
        new: payload.new
      }
    }
  }

  /**
   * Extract conversation ID from channel ID
   */
  private extractConversationId(channelId: string): string | undefined {
    const match = channelId.match(/conversation:([^_]+)/)
    return match ? match[1] : undefined
  }

  /**
   * Find channel by conversation
   */
  private findChannelByConversation(conversationId: string): string | undefined {
    for (const [channelId, subscription] of this.subscriptions) {
      if (subscription.channel.includes(conversationId)) {
        return channelId
      }
    }
    return undefined
  }

  /**
   * Hash content for cache key
   */
  private hashContent(content: string): string {
    // Simple hash function - in production use crypto
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }

  /**
   * Queue content for guardian review
   */
  private async queueForGuardianReview(event: RealtimeEvent): Promise<void> {
    // Implementation would queue for guardian review
    this.emit('guardian:review_required', event)
  }

  /**
   * Notify guardian of activity
   */
  private async notifyGuardianOfActivity(event: RealtimeEvent): Promise<void> {
    // Implementation would notify guardian
    this.emit('guardian:activity_notification', event)
  }

  /**
   * Request guardian approval
   */
  private async requestGuardianApproval(event: RealtimeEvent): Promise<void> {
    // Implementation would request guardian approval
    this.emit('guardian:approval_requested', event)
  }

  /**
   * Update presence cache
   */
  private updatePresenceCache(conversationId: string, event: PresenceEvent): void {
    // Implementation would update presence cache
  }

  /**
   * Check if notification should be delivered
   */
  private async shouldDeliverNotification(event: NotificationEvent): Promise<boolean> {
    // Check user preferences, do not disturb, etc.
    return true
  }

  /**
   * Event emitter functionality
   */
  on(event: string, listener: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(listener)
  }

  off(event: string, listener: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(listener)
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('Event handler error:', error)
        }
      })
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.unsubscribeAll()
    this.eventHandlers.clear()
    this.rateLimitStates.clear()
    this.eventQueue.clear()
    this.complianceCache.clear()
    this.guardianPermissions.clear()
  }
}