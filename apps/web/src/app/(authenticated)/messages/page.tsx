'use client'

import { useState, useEffect } from 'react'
import { ConversationsList } from './components/ConversationsList'
import { MessageThread } from './components/MessageThread'
import { useMessages } from './hooks/useMessages'
import { Badge } from '@/components/ui/Badge'
import { MessageCircle, Shield, Clock } from 'lucide-react'

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const { conversations, isLoading, error, unreadCount } = useMessages()

  useEffect(() => {
    // Auto-select first conversation if none selected
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Unable to load messages
          </h2>
          <p className="text-neutral-600 mb-4">
            We're having trouble connecting to the message service. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-neutral-50" data-testid="messages-page">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <h1 className="text-lg font-semibold text-neutral-900">Messages</h1>
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" icon={<Shield className="w-3 h-3" />}>
              Halal Chat
            </Badge>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className={`
        w-full lg:w-80 bg-white border-r border-neutral-200 flex flex-col
        ${selectedConversationId ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Desktop Header */}
        <div className="hidden lg:block p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-semibold text-neutral-900">Messages</h1>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Islamic guidelines enforced</span>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden pt-16 lg:pt-0">
          <ConversationsList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Message Thread */}
      <div className={`
        flex-1 flex flex-col bg-white
        ${selectedConversationId ? 'flex' : 'hidden lg:flex'}
      `}>
        {selectedConversationId ? (
          <MessageThread
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-neutral-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                Welcome to Halal Messaging
              </h2>
              <p className="text-neutral-600 mb-6">
                Connect with your matches through respectful, Islamic-compliant conversations. 
                Select a conversation to start messaging.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="success" size="sm" icon={<Shield className="w-3 h-3" />}>
                  Moderated
                </Badge>
                <Badge variant="info" size="sm" icon={<Clock className="w-3 h-3" />}>
                  Guardian Oversight
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}