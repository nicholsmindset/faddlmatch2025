'use client'

import { useState } from 'react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Reply, AlertTriangle, Clock, Shield, Check, CheckCheck } from 'lucide-react'

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

interface MessageBubbleProps {
  message: Message
  showAvatar?: boolean
  isOwn?: boolean
  onReply?: () => void
}

export function MessageBubble({ 
  message, 
  showAvatar = true, 
  isOwn = false, 
  onReply 
}: MessageBubbleProps) {
  // Determine if this is the user's own message based on sender_id
  const currentUserId = 'current-user' // In production, get from auth context
  const isOwnMessage = message.sender_id === currentUserId
  const [showActions, setShowActions] = useState(false)

  const getModerationIndicator = () => {
    switch (message.moderation_status) {
      case 'flagged':
        return (
          <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Flagged content</span>
          </div>
        )
      case 'guardian_review':
        return (
          <div className="flex items-center gap-1 text-yellow-600 text-xs mt-1">
            <Clock className="w-3 h-3" />
            <span>Under review</span>
          </div>
        )
      case 'approved':
        return isOwnMessage ? (
          <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
            <Shield className="w-3 h-3" />
            <span>Verified halal</span>
          </div>
        ) : null
      default:
        return null
    }
  }

  const getDeliveryStatus = () => {
    if (!isOwnMessage) return null

    if (message.read_at) {
      return (
        <div className="flex items-center gap-1 text-primary-600 text-xs">
          <CheckCheck className="w-3 h-3" />
          <span>Read</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1 text-neutral-500 text-xs">
        <Check className="w-3 h-3" />
        <span>Sent</span>
      </div>
    )
  }

  const renderMessageContent = () => {
    if (message.moderation_status === 'flagged') {
      return (
        <div className="italic text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Message Flagged</span>
          </div>
          <p className="text-sm">
            This message was flagged for violating Islamic communication guidelines.
          </p>
          {message.moderation_notes && (
            <p className="text-xs mt-1 text-red-700">
              Note: {message.moderation_notes}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="break-words">
        {message.reply_to && (
          <div className="mb-2 p-2 bg-neutral-100 dark:bg-neutral-700 rounded border-l-4 border-primary-500">
            <p className="text-xs text-neutral-600 mb-1">
              Reply to {message.reply_to.sender.first_name}
            </p>
            <p className="text-sm text-neutral-700 truncate">
              {message.reply_to.content}
            </p>
          </div>
        )}
        
        <p className="text-sm">{message.content}</p>
      </div>
    )
  }

  return (
    <div 
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`message-${message.id}`}
    >
      <div className={`flex gap-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwnMessage && (
          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {message.sender.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt={message.sender.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-neutral-600 text-xs font-medium">
                {getInitials(message.sender.first_name)}
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Sender Name (only for received messages with avatar) */}
          {showAvatar && !isOwnMessage && (
            <span className="text-xs text-neutral-600 mb-1 px-1">
              {message.sender.first_name}
            </span>
          )}

          {/* Message Bubble */}
          <div
            className={`
              px-3 py-2 rounded-lg relative
              ${isOwnMessage 
                ? 'bg-primary-600 text-white' 
                : 'bg-white border border-neutral-200 text-neutral-900'
              }
              ${message.moderation_status === 'flagged' ? 'border-red-300' : ''}
              ${message.moderation_status === 'guardian_review' ? 'border-yellow-300' : ''}
            `}
          >
            {renderMessageContent()}

            {/* Actions (Reply button) */}
            {showActions && onReply && !isOwnMessage && message.moderation_status === 'approved' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="absolute -top-8 right-0 bg-white shadow-md border border-neutral-200"
              >
                <Reply className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Message Info */}
          <div className={`flex items-center gap-2 mt-1 px-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-neutral-500">
              {formatRelativeTime(message.created_at)}
            </span>

            {/* Delivery Status */}
            {getDeliveryStatus()}

            {/* Moderation Status */}
            {getModerationIndicator()}
          </div>

          {/* Guardian Review Notice */}
          {message.moderation_status === 'guardian_review' && message.moderation_notes && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div className="flex items-center gap-1 text-yellow-700 mb-1">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Guardian Review</span>
              </div>
              <p className="text-yellow-700">{message.moderation_notes}</p>
            </div>
          )}
        </div>

        {/* Spacer for own messages without avatar */}
        {showAvatar && isOwnMessage && (
          <div className="w-8 h-8 flex-shrink-0"></div>
        )}
      </div>
    </div>
  )
}