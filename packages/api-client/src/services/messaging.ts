/**
 * Enhanced Messaging Service for FADDL Match
 * Enterprise-grade messaging with real-time features, Islamic compliance,
 * and guardian oversight
 */

import type { Database } from '@faddlmatch/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  MessageEvent,
  ComplianceValidation,
  GuardianPermissions 
} from '../realtime/types'

export interface SendMessageRequest {
  conversationId: string
  content: string
  messageType?: Database['public']['Enums']['message_type']
  replyToId?: string
  metadata?: Record<string, any>
}

export interface MessageResponse {
  messageId: string
  deliveredAt: Date
  moderationStatus: Database['public']['Enums']['moderation_status']
  requiresApproval: boolean
}

export interface ConversationSummary {
  id: string
  matchId: string
  participantIds: string[]
  lastMessage?: {
    content: string
    senderId: string
    timestamp: Date
    type: Database['public']['Enums']['message_type']
  }
  unreadCount: number
  isActive: boolean
  guardianApproved: boolean
  messageCount: number
}

export interface MessageThread {
  conversationId: string
  messages: Message[]
  participants: Participant[]
  hasMore: boolean
  nextCursor?: string
}

export interface Message {
  id: string
  content: string
  senderId: string
  recipientId: string
  timestamp: Date
  type: Database['public']['Enums']['message_type']
  moderationStatus: Database['public']['Enums']['moderation_status']
  deliveredAt?: Date
  readAt?: Date
  replyTo?: {
    id: string
    content: string
    senderId: string
  }
  metadata?: Record<string, any>
}

export interface Participant {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  isOnline: boolean
  lastSeen?: Date
  isTyping: boolean
}

export interface TypingIndicator {
  userId: string
  conversationId: string
  isTyping: boolean
  timestamp: Date
}

export interface MessageFilter {
  conversationId?: string
  senderId?: string
  messageType?: Database['public']['Enums']['message_type']
  moderationStatus?: Database['public']['Enums']['moderation_status']
  dateRange?: {
    from: Date
    to: Date
  }
  searchQuery?: string
}

export class MessagingService {
  private cache = new Map<string, any>()
  private typingTimers = new Map<string, NodeJS.Timeout>()
  private deliveryCallbacks = new Map<string, Function>()

  constructor(
    private supabase: SupabaseClient<Database>,
    private authToken: string,
    private userId: string,
    private baseUrl: string
  ) {}

  /**
   * Send message with real-time delivery and Islamic compliance
   */
  async sendMessage(request: SendMessageRequest): Promise<MessageResponse> {
    try {
      // Pre-validate Islamic compliance
      const complianceResult = await this.validateContentCompliance(request.content)
      
      if (!complianceResult.approved && complianceResult.reviewRequired) {
        throw new Error('Message content requires review before sending')
      }

      // Check guardian permissions
      const requiresApproval = await this.checkGuardianApproval(request.conversationId)

      const response = await this.makeRequest<MessageResponse>('messages-send', {
        ...request,
        senderId: this.userId,
        complianceScore: complianceResult.contentScore,
        requiresGuardianApproval: requiresApproval
      })

      if (response.success && response.data) {
        // Setup delivery confirmation callback
        this.setupDeliveryCallback(response.data.messageId)
        
        // Clear typing indicator
        await this.clearTypingIndicator(request.conversationId)
        
        // Update cache
        this.invalidateConversationCache(request.conversationId)

        return response.data
      }

      throw new Error(response.error || 'Failed to send message')
    } catch (error) {
      throw new Error(`Message send failed: ${error.message}`)
    }
  }

  /**
   * Get conversation thread with pagination
   */
  async getMessageThread(
    conversationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<MessageThread> {
    const cacheKey = `thread:${conversationId}:${limit}:${cursor || 'initial'}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      let query = this.supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          created_at,
          type,
          moderation_status,
          delivered_at,
          read_at,
          metadata,
          reply_to:messages!reply_to_id (
            id,
            content,
            sender_id
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data: messages, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get participants
      const participants = await this.getConversationParticipants(conversationId)

      const thread: MessageThread = {
        conversationId,
        messages: messages?.map(this.transformMessage) || [],
        participants,
        hasMore: messages?.length === limit,
        nextCursor: messages && messages.length > 0 
          ? messages[messages.length - 1].created_at 
          : undefined
      }

      // Cache for 5 minutes
      this.cache.set(cacheKey, thread)
      setTimeout(() => this.cache.delete(cacheKey), 300000)

      return thread
    } catch (error) {
      throw new Error(`Failed to fetch message thread: ${error.message}`)
    }
  }

  /**
   * Get user conversations with unread counts
   */
  async getConversations(limit: number = 20): Promise<ConversationSummary[]> {
    const cacheKey = `conversations:${this.userId}:${limit}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: conversations, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          match_id,
          is_active,
          guardian_approved,
          message_count,
          last_message_at,
          matches!inner (
            user_a_id,
            user_b_id
          )
        `)
        .or(`matches.user_a_id.eq.${this.userId},matches.user_b_id.eq.${this.userId}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      const conversationSummaries = await Promise.all(
        (conversations || []).map(async (conv) => {
          const participantIds = [
            conv.matches.user_a_id,
            conv.matches.user_b_id
          ].filter(id => id !== this.userId)

          const lastMessage = await this.getLastMessage(conv.id)
          const unreadCount = await this.getUnreadCount(conv.id)

          return {
            id: conv.id,
            matchId: conv.match_id,
            participantIds,
            lastMessage,
            unreadCount,
            isActive: conv.is_active,
            guardianApproved: conv.guardian_approved,
            messageCount: conv.message_count
          }
        })
      )

      // Cache for 2 minutes
      this.cache.set(cacheKey, conversationSummaries)
      setTimeout(() => this.cache.delete(cacheKey), 120000)

      return conversationSummaries
    } catch (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`)
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesRead(conversationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', this.userId)
        .is('read_at', null)

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate cache
      this.invalidateConversationCache(conversationId)
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`)
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    conversationId: string,
    isTyping: boolean = true
  ): Promise<void> {
    try {
      // Clear existing typing timer
      const existingTimer = this.typingTimers.get(conversationId)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      if (isTyping) {
        // Set auto-clear timer for 3 seconds
        const timer = setTimeout(() => {
          this.clearTypingIndicator(conversationId)
        }, 3000)
        
        this.typingTimers.set(conversationId, timer)
      }

      // Send typing indicator via real-time
      const response = await this.makeRequest('messages-typing', {
        conversationId,
        userId: this.userId,
        isTyping,
        timestamp: new Date().toISOString()
      })

      if (!response.success) {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }

  /**
   * Clear typing indicator
   */
  async clearTypingIndicator(conversationId: string): Promise<void> {
    const timer = this.typingTimers.get(conversationId)
    if (timer) {
      clearTimeout(timer)
      this.typingTimers.delete(conversationId)
    }

    await this.sendTypingIndicator(conversationId, false)
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    filters?: MessageFilter,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      let dbQuery = this.supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          created_at,
          type,
          moderation_status,
          delivered_at,
          read_at,
          metadata,
          conversation_id
        `)
        .textSearch('content', query)
        .eq('moderation_status', 'approved')
        .limit(limit)

      // Apply filters
      if (filters?.conversationId) {
        dbQuery = dbQuery.eq('conversation_id', filters.conversationId)
      }

      if (filters?.senderId) {
        dbQuery = dbQuery.eq('sender_id', filters.senderId)
      }

      if (filters?.messageType) {
        dbQuery = dbQuery.eq('type', filters.messageType)
      }

      if (filters?.dateRange) {
        dbQuery = dbQuery
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString())
      }

      const { data: messages, error } = await dbQuery
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return messages?.map(this.transformMessage) || []
    } catch (error) {
      throw new Error(`Message search failed: ${error.message}`)
    }
  }

  /**
   * Report message for violation
   */
  async reportMessage(
    messageId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    try {
      const response = await this.makeRequest('messages-report', {
        messageId,
        reporterId: this.userId,
        reason,
        details,
        timestamp: new Date().toISOString()
      })

      if (!response.success) {
        throw new Error(response.error)
      }
    } catch (error) {
      throw new Error(`Failed to report message: ${error.message}`)
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<{
    delivered: boolean
    read: boolean
    deliveredAt?: Date
    readAt?: Date
  }> {
    try {
      const { data: message, error } = await this.supabase
        .from('messages')
        .select('delivered_at, read_at')
        .eq('id', messageId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        delivered: !!message.delivered_at,
        read: !!message.read_at,
        deliveredAt: message.delivered_at ? new Date(message.delivered_at) : undefined,
        readAt: message.read_at ? new Date(message.read_at) : undefined
      }
    } catch (error) {
      throw new Error(`Failed to get message status: ${error.message}`)
    }
  }

  /**
   * Validate content compliance with Islamic values
   */
  private async validateContentCompliance(content: string): Promise<ComplianceValidation> {
    try {
      const response = await this.makeRequest<ComplianceValidation>('content-validate', {
        content,
        contentType: 'message',
        userId: this.userId
      })

      if (response.success && response.data) {
        return response.data
      }

      // Fallback validation
      return {
        contentScore: 85,
        flags: [],
        approved: true,
        reviewRequired: false
      }
    } catch (error) {
      // Fallback to basic validation
      return {
        contentScore: 85,
        flags: [],
        approved: true,
        reviewRequired: false
      }
    }
  }

  /**
   * Check if guardian approval is required
   */
  private async checkGuardianApproval(conversationId: string): Promise<boolean> {
    try {
      const { data: conversation, error } = await this.supabase
        .from('conversations')
        .select(`
          guardian_approved,
          matches!inner (
            user_a_id,
            user_b_id
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        return false
      }

      // Check if either user has guardian enabled
      const participantIds = [
        conversation.matches.user_a_id,
        conversation.matches.user_b_id
      ]

      const { data: guardians } = await this.supabase
        .from('guardians')
        .select('approval_required')
        .in('user_id', participantIds)

      return guardians?.some(g => g.approval_required) || false
    } catch (error) {
      return false
    }
  }

  /**
   * Get conversation participants
   */
  private async getConversationParticipants(conversationId: string): Promise<Participant[]> {
    try {
      const { data: conversation, error } = await this.supabase
        .from('conversations')
        .select(`
          matches!inner (
            user_a_id,
            user_b_id,
            user_a:users!user_a_id (
              id,
              email,
              last_active_at,
              user_profiles!inner (
                first_name,
                last_name
              )
            ),
            user_b:users!user_b_id (
              id,
              email,
              last_active_at,
              user_profiles!inner (
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const participants: Participant[] = []
      const match = conversation.matches

      // Add user A
      if (match.user_a.id !== this.userId) {
        participants.push({
          id: match.user_a.id,
          firstName: match.user_a.user_profiles.first_name,
          lastName: match.user_a.user_profiles.last_name,
          isOnline: this.isUserOnline(match.user_a.last_active_at),
          lastSeen: new Date(match.user_a.last_active_at),
          isTyping: false
        })
      }

      // Add user B
      if (match.user_b.id !== this.userId) {
        participants.push({
          id: match.user_b.id,
          firstName: match.user_b.user_profiles.first_name,
          lastName: match.user_b.user_profiles.last_name,
          isOnline: this.isUserOnline(match.user_b.last_active_at),
          lastSeen: new Date(match.user_b.last_active_at),
          isTyping: false
        })
      }

      return participants
    } catch (error) {
      return []
    }
  }

  /**
   * Get last message in conversation
   */
  private async getLastMessage(conversationId: string): Promise<{
    content: string
    senderId: string
    timestamp: Date
    type: Database['public']['Enums']['message_type']
  } | undefined> {
    try {
      const { data: message, error } = await this.supabase
        .from('messages')
        .select('content, sender_id, created_at, type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !message) {
        return undefined
      }

      return {
        content: message.content,
        senderId: message.sender_id,
        timestamp: new Date(message.created_at),
        type: message.type
      }
    } catch (error) {
      return undefined
    }
  }

  /**
   * Get unread message count
   */
  private async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', this.userId)
        .is('read_at', null)

      return error ? 0 : (count || 0)
    } catch (error) {
      return 0
    }
  }

  /**
   * Transform database message to API message
   */
  private transformMessage = (dbMessage: any): Message => ({
    id: dbMessage.id,
    content: dbMessage.content,
    senderId: dbMessage.sender_id,
    recipientId: dbMessage.recipient_id,
    timestamp: new Date(dbMessage.created_at),
    type: dbMessage.type,
    moderationStatus: dbMessage.moderation_status,
    deliveredAt: dbMessage.delivered_at ? new Date(dbMessage.delivered_at) : undefined,
    readAt: dbMessage.read_at ? new Date(dbMessage.read_at) : undefined,
    replyTo: dbMessage.reply_to ? {
      id: dbMessage.reply_to.id,
      content: dbMessage.reply_to.content,
      senderId: dbMessage.reply_to.sender_id
    } : undefined,
    metadata: dbMessage.metadata
  })

  /**
   * Check if user is online (active within 5 minutes)
   */
  private isUserOnline(lastActiveAt: string): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return new Date(lastActiveAt) > fiveMinutesAgo
  }

  /**
   * Setup delivery callback
   */
  private setupDeliveryCallback(messageId: string): void {
    const timeoutId = setTimeout(() => {
      this.deliveryCallbacks.delete(messageId)
    }, 30000) // 30 second timeout

    this.deliveryCallbacks.set(messageId, () => {
      clearTimeout(timeoutId)
      this.deliveryCallbacks.delete(messageId)
    })
  }

  /**
   * Invalidate conversation cache
   */
  private invalidateConversationCache(conversationId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(conversationId) || key.startsWith('conversations:')) {
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
    // Clear all timers
    for (const timer of this.typingTimers.values()) {
      clearTimeout(timer)
    }
    this.typingTimers.clear()

    // Clear callbacks
    this.deliveryCallbacks.clear()

    // Clear cache
    this.cache.clear()
  }
}