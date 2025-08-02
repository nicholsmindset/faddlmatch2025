'use client'

import { useState, useMemo } from 'react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Search, MessageCircle, Shield, Clock, AlertTriangle } from 'lucide-react'

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

interface ConversationsListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
  isLoading: boolean
}

export function ConversationsList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations

    return conversations.filter(conv =>
      conv.participant.first_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [conversations, searchQuery])

  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // Unread messages first
      if (a.unread_count > 0 && b.unread_count === 0) return -1
      if (b.unread_count > 0 && a.unread_count === 0) return 1
      
      // Then by last activity
      const aTime = a.last_message?.created_at || a.updated_at
      const bTime = b.last_message?.created_at || b.updated_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }, [filteredConversations])

  if (isLoading) {
    return (
      <div className="p-4" data-testid="conversations-loading">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6" data-testid="no-conversations">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No conversations yet
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Start connecting with your matches to begin conversations
          </p>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Browse Matches
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="conversations-list">
      {/* Search */}
      <div className="p-4 border-b border-neutral-200">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          size={'sm' as const}
          data-testid="conversation-search"
        />
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-neutral-600">No conversations found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation,
  isSelected,
  onClick
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) {
  const { participant, last_message, unread_count, guardian_approval_required } = conversation

  const getModerationIcon = () => {
    if (!last_message) return null
    
    switch (last_message.moderation_status) {
      case 'flagged':
        return <AlertTriangle className="w-3 h-3 text-red-500" />
      case 'guardian_review':
        return <Clock className="w-3 h-3 text-yellow-500" />
      default:
        return <Shield className="w-3 h-3 text-green-500" />
    }
  }

  const getLastMessagePreview = () => {
    if (!last_message) return 'Start a conversation...'
    
    if (last_message.moderation_status === 'flagged') {
      return 'Message flagged for review'
    }
    
    return last_message.content
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg text-left transition-all
        hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500
        ${isSelected ? 'bg-primary-50 border border-primary-200' : 'bg-white'}
      `}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden">
            {participant.avatar_url ? (
              <img
                src={participant.avatar_url}
                alt={participant.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-neutral-600 font-medium">
                {getInitials(participant.first_name)}
              </span>
            )}
          </div>
          
          {/* Online indicator */}
          {participant.is_online && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-neutral-900 truncate">
              {participant.first_name}
            </h3>
            <div className="flex items-center gap-1">
              {guardian_approval_required && (
                <Shield className="w-3 h-3 text-blue-500" title="Guardian oversight active" />
              )}
              {getModerationIcon()}
              {last_message && (
                <span className="text-xs text-neutral-500">
                  {formatRelativeTime(last_message.created_at)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 truncate flex-1 mr-2">
              {getLastMessagePreview()}
            </p>
            
            {unread_count > 0 && (
              <Badge variant="primary" size={'sm' as const}>
                {unread_count > 99 ? '99+' : unread_count}
              </Badge>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2 mt-1">
            {conversation.match_status === 'pending' && (
              <Badge variant="warning" size={'sm' as const}>
                Pending
              </Badge>
            )}
            {conversation.match_status === 'expired' && (
              <Badge variant="danger" size={'sm' as const}>
                Expired
              </Badge>
            )}
            {!participant.is_online && participant.last_seen && (
              <span className="text-xs text-neutral-500">
                Last seen {formatRelativeTime(participant.last_seen)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}