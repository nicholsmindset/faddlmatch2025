'use client'

import { useState, useCallback } from 'react'

interface SendMessageRequest {
  conversationId: string
  content: string
  messageType?: 'text' | 'photo' | 'audio'
  replyToId?: string
}

interface SendMessageResponse {
  success: boolean
  message?: any
  moderation?: {
    approved: boolean
    warning?: string
    requires_guardian_review: boolean
  }
  rate_limit?: {
    remaining: number
    reset_at: string
  }
  error?: string
  flagged_content?: string[]
  guidelines?: string[]
}

interface UseMessageActionsReturn {
  sendMessage: (content: string, replyToId?: string) => Promise<boolean>
  markAsRead: () => Promise<void>
  isSending: boolean
  error: string | null
  rateLimit: {
    remaining: number
    resetAt: string | null
  }
}

export function useMessageActions(conversationId: string): UseMessageActionsReturn {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState({
    remaining: 50,
    resetAt: null as string | null
  })

  const sendMessage = useCallback(async (content: string, replyToId?: string): Promise<boolean> => {
    try {
      setIsSending(true)
      setError(null)

      // Validate content before sending
      if (!content.trim()) {
        setError('Message cannot be empty')
        return false
      }

      if (content.length > 500) {
        setError('Message is too long (maximum 500 characters)')
        return false
      }

      // Prepare request
      const requestData: SendMessageRequest = {
        conversationId,
        content: content.trim(),
        messageType: 'text',
        replyToId
      }

      // In production, this would call the Supabase Edge Function:
      /*
      const response = await fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'X-User-ID': currentUserId
        },
        body: JSON.stringify(requestData)
      })

      const result: SendMessageResponse = await response.json()
      */

      // Mock API response for development
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate moderation check
      const hasForbiddenContent = /\b(dating|kiss|hug|touch|meet\s+alone)\b/i.test(content)
      const hasContactInfo = /\b(\d{10,}|[\w\.-]+@[\w\.-]+\.\w+)\b/.test(content)
      const hasSocialMedia = /\b(instagram|facebook|snapchat|whatsapp|telegram|@\w+)\b/i.test(content)

      if (hasForbiddenContent || hasContactInfo || hasSocialMedia) {
        const flaggedTerms = []
        if (hasForbiddenContent) flaggedTerms.push('inappropriate language')
        if (hasContactInfo) flaggedTerms.push('contact information')
        if (hasSocialMedia) flaggedTerms.push('social media references')

        setError(`Message violates Islamic communication guidelines: ${flaggedTerms.join(', ')}`)
        return false
      }

      // Simulate rate limiting
      const newRemaining = Math.max(0, rateLimit.remaining - 1)
      setRateLimit({
        remaining: newRemaining,
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      })

      if (newRemaining === 0) {
        setError('Rate limit exceeded. Please wait before sending another message.')
        return false
      }

      // Success - in production, the real-time subscription would handle adding the message to the UI
      console.log('Message sent successfully:', requestData)
      return true

    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Please try again.')
      return false
    } finally {
      setIsSending(false)
    }
  }, [conversationId, rateLimit.remaining])

  const markAsRead = useCallback(async (): Promise<void> => {
    try {
      // In production, this would call a Supabase function:
      /*
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .is('read_at', null)
        .neq('sender_id', currentUserId)
      */

      console.log('Messages marked as read for conversation:', conversationId)
    } catch (err) {
      console.error('Failed to mark messages as read:', err)
    }
  }, [conversationId])

  // Reset error when conversation changes
  useState(() => {
    setError(null)
  }, [conversationId])

  return {
    sendMessage,
    markAsRead,
    isSending,
    error,
    rateLimit
  }
}