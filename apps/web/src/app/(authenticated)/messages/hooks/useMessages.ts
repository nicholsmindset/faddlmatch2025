'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Conversation {
  id: string
  participant: {
    id: string
    first_name: string
    avatar_url?: string
    is_online: boolean
    last_seen?: string
  }
  last_message?: {
    content: string
    created_at: string
    sender_id: string
    moderation_status: 'approved' | 'flagged' | 'guardian_review'
  }
  unread_count: number
  match_status: 'pending' | 'accepted' | 'expired'
  guardian_approval_required: boolean
  created_at: string
  updated_at: string
}

interface UseMessagesReturn {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  unreadCount: number
  refetch: () => Promise<void>
}

export function useMessages(): UseMessagesReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useAuth()

  const fetchConversations = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/messages')
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      
      // Transform API response to match our interface
      const transformedConversations: Conversation[] = (data.conversations || []).map((conv: any) => ({
        id: conv.id,
        participant: {
          id: conv.userId,
          first_name: conv.userName,
          avatar_url: conv.userAvatar,
          is_online: conv.isOnline,
          last_seen: conv.lastSeen
        },
        last_message: conv.lastMessage ? {
          content: conv.lastMessage.text,
          created_at: conv.lastMessage.timestamp,
          sender_id: conv.lastMessage.senderId,
          moderation_status: 'approved' as const
        } : undefined,
        unread_count: conv.unreadCount,
        match_status: 'accepted' as const, // All conversations are from mutual matches
        guardian_approval_required: true, // Default for Islamic app
        created_at: new Date().toISOString(), // Default value
        updated_at: conv.lastMessage?.timestamp || new Date().toISOString()
      }))

      setConversations(transformedConversations)

    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [userId])

  const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0)

  return {
    conversations,
    isLoading,
    error,
    unreadCount,
    refetch: fetchConversations
  }
}

