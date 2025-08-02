/**
 * Notifications Service for FADDL Match
 * Comprehensive notification system with real-time delivery,
 * Islamic compliance, and intelligent prioritization
 */

import type { Database } from '@faddlmatch/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationEvent } from '../realtime/types'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  priority: NotificationPriority
  status: 'unread' | 'read' | 'dismissed' | 'archived'
  metadata: NotificationMetadata
  actionUrl?: string
  actionLabel?: string
  createdAt: Date
  readAt?: Date
  expiresAt?: Date
  sourceId?: string
  imageUrl?: string
  sound?: string
  isCompliant: boolean
  requiresAction: boolean
}

export type NotificationType = 
  | 'match_new' 
  | 'match_mutual' 
  | 'match_expired'
  | 'message_new' 
  | 'message_read'
  | 'guardian_approval_request'
  | 'guardian_approval_response'
  | 'guardian_invite'
  | 'profile_view'
  | 'subscription_expiry'
  | 'compliance_alert'
  | 'security_alert'
  | 'system_update'
  | 'maintenance'
  | 'promotion'

export type NotificationCategory = 
  | 'matches' 
  | 'messages' 
  | 'guardian' 
  | 'profile' 
  | 'system' 
  | 'security' 
  | 'compliance'
  | 'marketing'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface NotificationMetadata {
  matchId?: string
  conversationId?: string
  senderId?: string
  guardianId?: string
  profileId?: string
  complianceScore?: number
  actionData?: Record<string, any>
  customData?: Record<string, any>
}

export interface NotificationPreferences {
  enabled: boolean
  categories: {
    [K in NotificationCategory]: {
      enabled: boolean
      push: boolean
      email: boolean
      sms: boolean
      inApp: boolean
      sound: boolean
      vibration: boolean
      priority: NotificationPriority
      quietHours?: {
        enabled: boolean
        startTime: string
        endTime: string
      }
    }
  }
  globalSettings: {
    doNotDisturb: boolean
    quietHours: {
      enabled: boolean
      startTime: string
      endTime: string
      timezone: string
    }
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
    batchNotifications: boolean
    soundEnabled: boolean
    vibrationEnabled: boolean
  }
  islamicSettings: {
    prayerTimeQuiet: boolean
    fridayQuiet: boolean
    ramadanMode: boolean
    halalContentOnly: boolean
  }
}

export interface NotificationTemplate {
  id: string
  type: NotificationType
  category: NotificationCategory
  titleTemplate: string
  messageTemplate: string
  actionTemplate?: string
  priority: NotificationPriority
  isCustomizable: boolean
  variables: string[]
  islamicCompliant: boolean
  supportedLanguages: string[]
}

export interface NotificationBatch {
  id: string
  userId: string
  notifications: Notification[]
  summary: string
  totalCount: number
  unreadCount: number
  highPriorityCount: number
  createdAt: Date
  deliveredAt?: Date
}

export interface NotificationStatistics {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
  byPriority: Record<NotificationPriority, number>
  deliveryRate: number
  readRate: number
  clickThroughRate: number
  averageTimeToRead: number
  preferences: {
    pushEnabled: boolean
    emailEnabled: boolean
    smsEnabled: boolean
  }
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userId: string
  deviceType: 'web' | 'ios' | 'android'
  isActive: boolean
  createdAt: Date
}

export class NotificationsService {
  private cache = new Map<string, any>()
  private notificationCallbacks = new Set<(notification: Notification) => void>()
  private batchCallbacks = new Set<(batch: NotificationBatch) => void>()
  private pushSubscription?: PushSubscription
  private templates = new Map<NotificationType, NotificationTemplate>()

  constructor(
    private supabase: SupabaseClient<Database>,
    private authToken: string,
    private userId: string,
    private baseUrl: string
  ) {
    this.initializeTemplates()
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getNotifications(
    options: {
      category?: NotificationCategory
      status?: 'unread' | 'read' | 'dismissed' | 'archived'
      priority?: NotificationPriority
      limit?: number
      offset?: number
      since?: Date
    } = {}
  ): Promise<{ notifications: Notification[]; total: number; hasMore: boolean }> {
    const { 
      category, 
      status = 'unread', 
      priority, 
      limit = 50, 
      offset = 0, 
      since 
    } = options

    const cacheKey = `notifications:${this.userId}:${JSON.stringify(options)}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      let query = this.supabase
        .from('user_notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (category) {
        query = query.eq('category', category)
      }

      if (status !== 'unread') {
        query = query.eq('status', status)
      } else {
        query = query.in('status', ['unread', 'read'])
      }

      if (priority) {
        query = query.eq('priority', priority)
      }

      if (since) {
        query = query.gte('created_at', since.toISOString())
      }

      const { data: notifications, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      const transformedNotifications = (notifications || []).map(this.transformNotification)
      const result = {
        notifications: transformedNotifications,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }

      // Cache for 2 minutes
      this.cache.set(cacheKey, result)
      setTimeout(() => this.cache.delete(cacheKey), 120000)

      return result
    } catch (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const cacheKey = `unread_count:${this.userId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { count, error } = await this.supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'unread')

      if (error) {
        throw new Error(error.message)
      }

      const unreadCount = count || 0

      // Cache for 30 seconds
      this.cache.set(cacheKey, unreadCount)
      setTimeout(() => this.cache.delete(cacheKey), 30000)

      return unreadCount
    } catch (error) {
      return 0
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', this.userId)

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate caches
      this.invalidateNotificationCaches()
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .in('id', notificationIds)
        .eq('user_id', this.userId)

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate caches
      this.invalidateNotificationCaches()
    } catch (error) {
      throw new Error(`Failed to mark notifications as read: ${error.message}`)
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(category?: NotificationCategory): Promise<void> {
    try {
      let query = this.supabase
        .from('user_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .eq('status', 'unread')

      if (category) {
        query = query.eq('category', category)
      }

      const { error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate caches
      this.invalidateNotificationCaches()
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .update({
          status: 'dismissed',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', this.userId)

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate caches
      this.invalidateNotificationCaches()
    } catch (error) {
      throw new Error(`Failed to dismiss notification: ${error.message}`)
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', this.userId)

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate caches
      this.invalidateNotificationCaches()
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`)
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const cacheKey = `preferences:${this.userId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: preferences, error } = await this.supabase
        .from('user_notification_preferences')
        .select('preferences')
        .eq('user_id', this.userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw new Error(error.message)
      }

      const notificationPreferences = preferences?.preferences || this.getDefaultPreferences()

      // Cache for 10 minutes
      this.cache.set(cacheKey, notificationPreferences)
      setTimeout(() => this.cache.delete(cacheKey), 600000)

      return notificationPreferences
    } catch (error) {
      return this.getDefaultPreferences()
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPreferences = await this.getPreferences()
      const updatedPreferences = { ...currentPreferences, ...preferences }

      const { error } = await this.supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: this.userId,
          preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate cache
      this.cache.delete(`preferences:${this.userId}`)
    } catch (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`)
    }
  }

  /**
   * Send notification (admin/system use)
   */
  async sendNotification(
    targetUserId: string,
    type: NotificationType,
    data: {
      title: string
      message: string
      priority?: NotificationPriority
      actionUrl?: string
      actionLabel?: string
      metadata?: NotificationMetadata
      expiresAt?: Date
    }
  ): Promise<string> {
    try {
      const response = await this.makeRequest<{ notificationId: string }>('notifications-send', {
        targetUserId,
        senderId: this.userId,
        type,
        ...data,
        timestamp: new Date().toISOString()
      })

      if (response.success && response.data) {
        return response.data.notificationId
      }

      throw new Error(response.error || 'Failed to send notification')
    } catch (error) {
      throw new Error(`Failed to send notification: ${error.message}`)
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<NotificationStatistics> {
    const cacheKey = `stats:${this.userId}:${timeframe}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await this.makeRequest<NotificationStatistics>('notifications-statistics', {
        userId: this.userId,
        timeframe
      })

      if (response.success && response.data) {
        // Cache for 1 hour
        this.cache.set(cacheKey, response.data)
        setTimeout(() => this.cache.delete(cacheKey), 3600000)
        
        return response.data
      }

      // Fallback statistics
      return this.calculateFallbackStatistics()
    } catch (error) {
      return this.calculateFallbackStatistics()
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription: Omit<PushSubscription, 'userId' | 'isActive' | 'createdAt'>): Promise<void> {
    try {
      const response = await this.makeRequest('notifications-push-subscribe', {
        userId: this.userId,
        subscription: {
          ...subscription,
          userId: this.userId,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      this.pushSubscription = {
        ...subscription,
        userId: this.userId,
        isActive: true,
        createdAt: new Date()
      }
    } catch (error) {
      throw new Error(`Failed to subscribe to push notifications: ${error.message}`)
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<void> {
    try {
      const response = await this.makeRequest('notifications-push-unsubscribe', {
        userId: this.userId
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      this.pushSubscription = undefined
    } catch (error) {
      throw new Error(`Failed to unsubscribe from push notifications: ${error.message}`)
    }
  }

  /**
   * Test notification delivery
   */
  async testNotification(type: NotificationType): Promise<void> {
    try {
      const template = this.templates.get(type)
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`)
      }

      await this.sendNotification(this.userId, type, {
        title: `Test: ${template.titleTemplate}`,
        message: `Test: ${template.messageTemplate}`,
        priority: 'low',
        metadata: { test: true }
      })
    } catch (error) {
      throw new Error(`Failed to send test notification: ${error.message}`)
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.notificationCallbacks.add(callback)
    
    return () => {
      this.notificationCallbacks.delete(callback)
    }
  }

  /**
   * Subscribe to notification batches
   */
  onNotificationBatch(callback: (batch: NotificationBatch) => void): () => void {
    this.batchCallbacks.add(callback)
    
    return () => {
      this.batchCallbacks.delete(callback)
    }
  }

  /**
   * Handle real-time notification event
   */
  handleRealtimeNotification(event: NotificationEvent): void {
    const notification = this.transformNotificationEvent(event)
    this.emitNotification(notification)
    
    // Invalidate caches
    this.invalidateNotificationCaches()
  }

  /**
   * Transform database notification to API notification
   */
  private transformNotification = (dbNotification: any): Notification => ({
    id: dbNotification.id,
    userId: dbNotification.user_id,
    type: dbNotification.type,
    category: dbNotification.category,
    title: dbNotification.title,
    message: dbNotification.message,
    priority: dbNotification.priority,
    status: dbNotification.status,
    metadata: dbNotification.metadata || {},
    actionUrl: dbNotification.action_url,
    actionLabel: dbNotification.action_label,
    createdAt: new Date(dbNotification.created_at),
    readAt: dbNotification.read_at ? new Date(dbNotification.read_at) : undefined,
    expiresAt: dbNotification.expires_at ? new Date(dbNotification.expires_at) : undefined,
    sourceId: dbNotification.source_id,
    imageUrl: dbNotification.image_url,
    sound: dbNotification.sound,
    isCompliant: dbNotification.is_compliant ?? true,
    requiresAction: dbNotification.requires_action ?? false
  })

  /**
   * Transform notification event to notification
   */
  private transformNotificationEvent(event: NotificationEvent): Notification {
    return {
      id: event.id,
      userId: event.userId || this.userId,
      type: event.type.split(':')[1] as NotificationType,
      category: event.category,
      title: event.title,
      message: event.message,
      priority: event.priority,
      status: 'unread',
      metadata: event.metadata || {},
      actionUrl: event.actionUrl,
      createdAt: event.timestamp,
      isCompliant: true,
      requiresAction: false
    }
  }

  /**
   * Emit notification to subscribers
   */
  private emitNotification(notification: Notification): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('Notification callback error:', error)
      }
    })
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    const defaultCategorySettings = {
      enabled: true,
      push: true,
      email: true,
      sms: false,
      inApp: true,
      sound: true,
      vibration: true,
      priority: 'normal' as NotificationPriority
    }

    return {
      enabled: true,
      categories: {
        matches: { ...defaultCategorySettings, priority: 'high' },
        messages: { ...defaultCategorySettings, priority: 'high' },
        guardian: { ...defaultCategorySettings, priority: 'urgent' },
        profile: { ...defaultCategorySettings, priority: 'normal' },
        system: { ...defaultCategorySettings, priority: 'normal', sound: false },
        security: { ...defaultCategorySettings, priority: 'urgent' },
        compliance: { ...defaultCategorySettings, priority: 'high' },
        marketing: { ...defaultCategorySettings, priority: 'low', email: false, push: false }
      },
      globalSettings: {
        doNotDisturb: false,
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '07:00',
          timezone: 'Asia/Singapore'
        },
        frequency: 'immediate',
        batchNotifications: false,
        soundEnabled: true,
        vibrationEnabled: true
      },
      islamicSettings: {
        prayerTimeQuiet: true,
        fridayQuiet: true,
        ramadanMode: false,
        halalContentOnly: true
      }
    }
  }

  /**
   * Calculate fallback statistics
   */
  private calculateFallbackStatistics(): NotificationStatistics {
    return {
      total: 0,
      unread: 0,
      byCategory: {
        matches: 0,
        messages: 0,
        guardian: 0,
        profile: 0,
        system: 0,
        security: 0,
        compliance: 0,
        marketing: 0
      },
      byPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0
      },
      deliveryRate: 100,
      readRate: 0,
      clickThroughRate: 0,
      averageTimeToRead: 0,
      preferences: {
        pushEnabled: false,
        emailEnabled: false,
        smsEnabled: false
      }
    }
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'match_new',
        type: 'match_new',
        category: 'matches',
        titleTemplate: 'New Match Found!',
        messageTemplate: 'You have a new potential match with {{compatibility}}% compatibility',
        priority: 'high',
        isCustomizable: true,
        variables: ['compatibility', 'name'],
        islamicCompliant: true,
        supportedLanguages: ['en', 'ms', 'ar']
      },
      {
        id: 'match_mutual',
        type: 'match_mutual',
        category: 'matches',
        titleTemplate: 'It\'s a Match!',
        messageTemplate: 'You and {{name}} both liked each other. Start chatting now!',
        actionTemplate: 'Start Conversation',
        priority: 'high',
        isCustomizable: true,
        variables: ['name'],
        islamicCompliant: true,
        supportedLanguages: ['en', 'ms', 'ar']
      },
      {
        id: 'message_new',
        type: 'message_new',
        category: 'messages',
        titleTemplate: 'New Message',
        messageTemplate: '{{sender}} sent you a message',
        priority: 'high',
        isCustomizable: true,
        variables: ['sender'],
        islamicCompliant: true,
        supportedLanguages: ['en', 'ms', 'ar']
      },
      {
        id: 'guardian_approval_request',
        type: 'guardian_approval_request',
        category: 'guardian',
        titleTemplate: 'Guardian Approval Required',
        messageTemplate: 'Your guardian needs to approve a new match',
        priority: 'urgent',
        isCustomizable: false,
        variables: ['matchName'],
        islamicCompliant: true,
        supportedLanguages: ['en', 'ms', 'ar']
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.type, template)
    })
  }

  /**
   * Invalidate notification caches
   */
  private invalidateNotificationCaches(): void {
    for (const key of this.cache.keys()) {
      if (key.includes('notifications') || key.includes('unread_count')) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Make authenticated request to Edge Function
   */
  private async makeRequest<T = any>(
    endpoint: string,
    body?: any
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: body ? JSON.stringify(body) : undefined
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.notificationCallbacks.clear()
    this.batchCallbacks.clear()
    this.cache.clear()
  }
}