'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type: 'text' | 'photo' | 'audio'
  moderation_status: 'approved' | 'flagged' | 'guardian_review'
  moderation_notes?: string
  reply_to_id?: string
  read_at?: string
  sender: {
    id: string
    first_name: string
    avatar_url?: string
  }
  reply_to?: {
    id: string
    content: string
    sender: {
      first_name: string
    }
  }
}

interface Participant {
  id: string
  first_name: string
  avatar_url?: string
  is_online: boolean
  last_seen?: string
  is_typing: boolean
}

interface Conversation {
  id: string
  match_status: 'pending' | 'accepted' | 'expired'
  guardian_approval_required: boolean
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseRealTimeMessagesReturn {
  messages: Message[]
  participant: Participant | null
  conversation: Conversation | null
  isLoading: boolean
  error: string | null
  connectionStatus: ConnectionStatus
}

// Mock data for development
const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Assalamu alaikum! Thank you for your interest in getting to know me better.',
    sender_id: 'user-2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    message_type: 'text',
    moderation_status: 'approved',
    sender: {
      id: 'user-2',
      first_name: 'Aisha',
      avatar_url: undefined
    }
  },
  {
    id: '2',
    content: 'Wa alaikum assalam! I appreciate your message. I would love to learn more about your faith journey and family background.',
    sender_id: 'current-user',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    message_type: 'text',
    moderation_status: 'approved',
    sender: {
      id: 'current-user',
      first_name: 'You',
      avatar_url: undefined
    }
  },
  {
    id: '3',
    content: 'That sounds wonderful! I come from a practicing family and we maintain regular prayers and Islamic values. What about your religious practices?',
    sender_id: 'user-2',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    message_type: 'text',
    moderation_status: 'approved',
    sender: {
      id: 'user-2',
      first_name: 'Aisha',
      avatar_url: undefined
    }
  },
  {
    id: '4',
    content: 'Alhamdulillah, I try to maintain my five daily prayers and read Quran regularly. Family is very important to me as well. Perhaps we could arrange a meeting with our families present?',
    sender_id: 'current-user',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    message_type: 'text',
    moderation_status: 'guardian_review',
    moderation_notes: 'Consider involving your guardian before making meeting arrangements as per Islamic guidelines.',
    sender: {
      id: 'current-user',
      first_name: 'You',
      avatar_url: undefined
    }
  },
  {
    id: '5',
    content: 'That would be perfect! I would love for our families to meet. Let me speak with my father about arranging something appropriate.',
    sender_id: 'user-2',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    message_type: 'text',
    moderation_status: 'approved',
    sender: {
      id: 'user-2',
      first_name: 'Aisha',
      avatar_url: undefined
    }
  }
]

const MOCK_PARTICIPANT: Participant = {
  id: 'user-2',
  first_name: 'Aisha',
  avatar_url: undefined,
  is_online: true,
  is_typing: false
}

const MOCK_CONVERSATION: Conversation = {
  id: '1',
  match_status: 'accepted',
  guardian_approval_required: true
}

export function useRealTimeMessages(conversationId: string): UseRealTimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  
  const subscriptionRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!conversationId) return

    const loadConversationData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setConnectionStatus('connecting')

        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 800))

        // In production, this would be Supabase queries:
        /*
        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            created_at,
            message_type,
            moderation_status,
            moderation_notes,
            reply_to_id,
            read_at,
            sender:users(id, first_name, avatar_url),
            reply_to:messages(id, content, sender:users(first_name))
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        // Load conversation details
        const { data: conversationData, error: convError } = await supabase
          .from('conversations')
          .select(`
            id,
            user1_id,
            user2_id,
            match_status,
            guardian_approval_required,
            user1:users!user1_id(id, first_name, avatar_url, is_online, last_seen),
            user2:users!user2_id(id, first_name, avatar_url, is_online, last_seen)
          `)
          .eq('id', conversationId)
          .single()
        */

        // Mock data for development
        setMessages(MOCK_MESSAGES)
        setParticipant(MOCK_PARTICIPANT)
        setConversation(MOCK_CONVERSATION)
        setConnectionStatus('connected')

        // Setup real-time subscription
        setupRealtimeSubscription()

      } catch (err) {
        console.error('Failed to load conversation:', err)
        setError('Failed to load conversation. Please try again.')
        setConnectionStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      // In production, this would be a Supabase real-time subscription:
      /*
      subscriptionRef.current = supabase
        .channel(`conversation-${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const updatedMessage = payload.new as Message
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ))
        })
        .on('presence', { event: 'sync' }, () => {
          // Handle user presence updates
        })
        .on('broadcast', { event: 'typing' }, (payload) => {
          handleTypingIndicator(payload)
        })
        .subscribe()
      */

      // Mock real-time simulation
      const interval = setInterval(() => {
        // Simulate random typing
        if (Math.random() < 0.1) {
          setParticipant(prev => prev ? { ...prev, is_typing: true } : null)
          setTimeout(() => {
            setParticipant(prev => prev ? { ...prev, is_typing: false } : null)
          }, 3000)
        }
      }, 10000)

      return () => clearInterval(interval)
    }

    loadConversationData()

    return () => {
      if (subscriptionRef.current) {
        // supabase.removeChannel(subscriptionRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversationId])

  const handleTypingIndicator = (payload: any) => {
    const { user_id, is_typing } = payload.payload
    
    if (user_id !== participant?.id) return

    setParticipant(prev => prev ? { ...prev, is_typing } : null)

    if (is_typing) {
      // Clear typing after 3 seconds of no activity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setParticipant(prev => prev ? { ...prev, is_typing: false } : null)
      }, 3000)
    }
  }

  // Add new message to local state (called after successful send)
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  // Update message status (read receipts, moderation status)
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }

  return {
    messages,
    participant,
    conversation,
    isLoading,
    error,
    connectionStatus
  }
}