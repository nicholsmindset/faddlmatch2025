'use client'

import { useState, useEffect } from 'react'

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

// Mock data for development - replace with actual Supabase integration
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participant: {
      id: 'user-2',
      first_name: 'Aisha',
      avatar_url: undefined,
      is_online: true,
      last_seen: undefined
    },
    last_message: {
      content: 'Assalamu alaikum! Thank you for your interest. I would love to get to know you better.',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      sender_id: 'user-2',
      moderation_status: 'approved'
    },
    unread_count: 2,
    match_status: 'accepted',
    guardian_approval_required: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: '2',
    participant: {
      id: 'user-3',
      first_name: 'Fatima',
      avatar_url: undefined,
      is_online: false,
      last_seen: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    last_message: {
      content: 'I appreciate your message. May Allah guide us both in making the right decision.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      sender_id: 'current-user',
      moderation_status: 'approved'
    },
    unread_count: 0,
    match_status: 'accepted',
    guardian_approval_required: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: '3',
    participant: {
      id: 'user-4',
      first_name: 'Khadija',
      avatar_url: undefined,
      is_online: false,
      last_seen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    last_message: {
      content: 'This message requires guardian review before being delivered.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      sender_id: 'user-4',
      moderation_status: 'guardian_review'
    },
    unread_count: 1,
    match_status: 'accepted',
    guardian_approval_required: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  },
  {
    id: '4',
    participant: {
      id: 'user-5',
      first_name: 'Maryam',
      avatar_url: undefined,
      is_online: false,
      last_seen: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
    },
    last_message: undefined,
    unread_count: 0,
    match_status: 'pending',
    guardian_approval_required: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
]

export function useMessages(): UseMessagesReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/messages')
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || MOCK_CONVERSATIONS)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError('Failed to load conversations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0)

  return {
    conversations,
    isLoading,
    error,
    unreadCount,
    refetch: fetchConversations
  }
}