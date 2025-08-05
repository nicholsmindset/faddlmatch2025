'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@clerk/nextjs'

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


export function useRealTimeMessages(matchId: string): UseRealTimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  
  const subscriptionRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { userId } = useAuth()

  useEffect(() => {
    if (!matchId || !userId) return

    const loadConversationData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setConnectionStatus('connecting')

        // Load messages for this match
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            message_text,
            sender_id,
            receiver_id,
            created_at,
            message_type,
            is_read,
            read_at
          `)
          .eq('match_id', matchId)
          .order('created_at', { ascending: true })

        if (messagesError) {
          throw messagesError
        }

        // Get match details and participant info
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select(`
            id,
            user_id,
            matched_user_id,
            mutual_match,
            status,
            user_profile:profiles!matches_user_id_fkey(
              user_id,
              full_name,
              profile_photos
            ),
            matched_profile:profiles!matches_matched_user_id_fkey(
              user_id,
              full_name,
              profile_photos
            )
          `)
          .eq('id', matchId)
          .single()

        if (matchError) {
          throw matchError
        }

        // Determine participant (the other user)
        const isUserInitiator = matchData.user_id === userId
        const otherUserId = isUserInitiator ? matchData.matched_user_id : matchData.user_id
        const otherProfile = isUserInitiator ? matchData.matched_profile : matchData.user_profile

        // Transform messages
        const transformedMessages: Message[] = (messagesData || []).map(msg => ({
          id: msg.id,
          content: msg.message_text,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          message_type: msg.message_type as 'text' | 'photo' | 'audio',
          moderation_status: 'approved' as const,
          read_at: msg.read_at,
          sender: {
            id: msg.sender_id,
            first_name: msg.sender_id === userId ? 'You' : (otherProfile?.full_name?.split(' ')[0] || 'User'),
            avatar_url: msg.sender_id === userId ? undefined : (otherProfile?.profile_photos?.[0] || undefined)
          }
        }))

        setMessages(transformedMessages)
        
        setParticipant({
          id: otherUserId,
          first_name: otherProfile?.full_name?.split(' ')[0] || 'User',
          avatar_url: otherProfile?.profile_photos?.[0] || undefined,
          is_online: false, // TODO: Implement online status
          is_typing: false
        })

        setConversation({
          id: matchId,
          match_status: matchData.mutual_match ? 'accepted' : 'pending',
          guardian_approval_required: true // Default for Islamic app
        })

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
      // Real-time subscription for new messages
      subscriptionRef.current = supabase
        .channel(`match-${matchId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        }, async (payload) => {
          const newMessageData = payload.new as any
          
          // Get sender profile for display
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('user_id, full_name, profile_photos')
            .eq('user_id', newMessageData.sender_id)
            .single()

          const newMessage: Message = {
            id: newMessageData.id,
            content: newMessageData.message_text,
            sender_id: newMessageData.sender_id,
            created_at: newMessageData.created_at,
            message_type: newMessageData.message_type,
            moderation_status: 'approved',
            read_at: newMessageData.read_at,
            sender: {
              id: newMessageData.sender_id,
              first_name: newMessageData.sender_id === userId ? 'You' : (senderProfile?.full_name?.split(' ')[0] || 'User'),
              avatar_url: newMessageData.sender_id === userId ? undefined : (senderProfile?.profile_photos?.[0] || undefined)
            }
          }
          
          setMessages(prev => [...prev, newMessage])
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        }, (payload) => {
          const updatedMessageData = payload.new as any
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessageData.id ? {
              ...msg,
              is_read: updatedMessageData.is_read,
              read_at: updatedMessageData.read_at
            } : msg
          ))
        })
        .subscribe()
    }

    loadConversationData()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [matchId, userId])

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