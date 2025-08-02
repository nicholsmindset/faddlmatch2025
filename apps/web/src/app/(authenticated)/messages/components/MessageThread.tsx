'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MoreVertical, Shield, AlertTriangle, Clock } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ComplianceIndicator } from './ComplianceIndicator'
import { useRealTimeMessages } from '../hooks/useRealTimeMessages'
import { useMessageActions } from '../hooks/useMessageActions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getInitials, formatRelativeTime } from '@/lib/utils'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type: 'text' | 'photo' | 'audio'
  moderation_status: 'approved' | 'flagged' | 'guardian_review'
  moderation_notes?: string
  reply_to_id?: string
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

interface MessageThreadProps {
  conversationId: string
  onBack: () => void
}

export function MessageThread({ conversationId, onBack }: MessageThreadProps) {
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    participant,
    conversation,
    isLoading,
    error,
    connectionStatus
  } = useRealTimeMessages(conversationId)

  const {
    sendMessage,
    markAsRead,
    isSending,
    error: sendError
  } = useMessageActions(conversationId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Mark messages as read when thread is opened
  useEffect(() => {
    markAsRead()
  }, [conversationId, markAsRead])

  const handleSendMessage = async (content: string, replyTo?: string) => {
    const success = await sendMessage(content, replyTo)
    if (success) {
      setReplyToMessage(null)
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="success" size="sm" icon={<Shield className="w-3 h-3" />}>
            Secure
          </Badge>
        )
      case 'connecting':
        return (
          <Badge variant="warning" size="sm">
            Connecting...
          </Badge>
        )
      case 'disconnected':
        return (
          <Badge variant="danger" size="sm">
            Offline
          </Badge>
        )
      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Unable to load conversation
          </h2>
          <p className="text-neutral-600 mb-4">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="border-b border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-3 bg-neutral-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-xs">
                <div className="h-16 bg-neutral-200 rounded-lg animate-pulse"></div>
                <div className="h-3 bg-neutral-200 rounded w-16 mt-1 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full" data-testid="message-thread">
      {/* Header */}
      <div className="border-b border-neutral-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Participant Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden">
                  {participant?.avatar_url ? (
                    <img
                      src={participant.avatar_url}
                      alt={participant.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-neutral-600 font-medium text-sm">
                      {participant ? getInitials(participant.first_name) : '?'}
                    </span>
                  )}
                </div>
                {participant?.is_online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-neutral-900">
                  {participant?.first_name || 'Loading...'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  {participant?.is_typing ? (
                    <span className="text-green-600">Typing...</span>
                  ) : participant?.is_online ? (
                    <span>Online</span>
                  ) : participant?.last_seen ? (
                    <span>Last seen {formatRelativeTime(participant.last_seen)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getConnectionStatusBadge()}
            
            {conversation?.guardian_approval_required && (
              <Badge variant="info" size="sm" icon={<Shield className="w-3 h-3" />}>
                Guardian Oversight
              </Badge>
            )}

            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {conversation?.guardian_approval_required && (
        <ComplianceIndicator
          type="guardian_oversight"
          message="This conversation is monitored by guardians to ensure Islamic guidelines are followed."
        />
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-neutral-50"
        data-testid="messages-container"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Start a halal conversation
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Share your thoughts respectfully while following Islamic guidelines.
                Your messages are moderated for everyone's comfort.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              const showAvatar = !previousMessage || 
                previousMessage.sender_id !== message.sender_id ||
                new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime() > 300000 // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  onReply={() => setReplyToMessage(message)}
                />
              )
            })}
            
            {/* Typing Indicator */}
            {participant?.is_typing && (
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-neutral-600">
                    {participant.first_name[0]}
                  </span>
                </div>
                <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-600 mb-1">
                Replying to {replyToMessage.sender.first_name}
              </p>
              <p className="text-sm text-neutral-900 truncate">
                {replyToMessage.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-neutral-200 bg-white">
        <MessageInput
          onSend={(content) => handleSendMessage(content, replyToMessage?.id)}
          isLoading={isSending}
          error={sendError}
          disabled={conversation?.match_status !== 'accepted'}
        />
      </div>
    </div>
  )
}