import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

// Mock conversations database - in production, this would be Supabase  
const MOCK_CONVERSATIONS = new Map()
const MOCK_MESSAGES = new Map()

// Clean profiles for internal use
const CLEAN_PROFILE_DATA = {
  'user-1': { id: 'user-1', first_name: 'Ahmad', is_online: true },
  'user-2': { id: 'user-2', first_name: 'Aisha', is_online: false },
  'user-3': { id: 'user-3', first_name: 'Fatima', is_online: true }
}

function getCleanParticipantInfo(participantId: string) {
  return CLEAN_PROFILE_DATA[participantId] || { 
    id: participantId, 
    first_name: 'User', 
    is_online: false 
  }
}

// Initialize empty - no default conversations for clean production start

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (conversationId) {
      // Get messages for specific conversation
      const messages = MOCK_MESSAGES.get(conversationId) || []
      return NextResponse.json({ messages })
    }

    // Get all conversations for user
    const userConversations = []
    
    for (const [id, conversation] of MOCK_CONVERSATIONS) {
      if (conversation.participants.includes(userId)) {
        // Get participant info (not current user)
        const participantId = conversation.participants.find(p => p !== userId)
        
        // Get last message
        const messages = MOCK_MESSAGES.get(id) || []
        const lastMessage = messages[messages.length - 1]
        
        // Count unread messages (mock logic)
        const unreadCount = messages.filter(m => 
          m.sender_id !== userId && 
          new Date(m.created_at) > new Date(Date.now() - 60 * 60 * 1000)
        ).length

        // Get participant info directly without internal fetch
        const participant = getCleanParticipantInfo(participantId)

        userConversations.push({
          id,
          participant,
          last_message: lastMessage,
          unread_count: unreadCount,
          match_status: conversation.match_status,
          guardian_approval_required: conversation.guardian_approval_required,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        })
      }
    }

    // Sort by updated_at descending
    userConversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    return NextResponse.json({ conversations: userConversations })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, content, recipient_id } = body

    let conversationId = conversation_id

    // If no conversation_id, create new conversation
    if (!conversationId && recipient_id) {
      conversationId = `conv-${Date.now()}`
      const newConversation = {
        id: conversationId,
        participants: [userId, recipient_id],
        match_status: 'accepted',
        guardian_approval_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      MOCK_CONVERSATIONS.set(conversationId, newConversation)
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Create new message
    const newMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
      moderation_status: 'approved', // In production, this would go through moderation
      created_at: new Date().toISOString()
    }

    // Add message to conversation
    const messages = MOCK_MESSAGES.get(conversationId) || []
    messages.push(newMessage)
    MOCK_MESSAGES.set(conversationId, messages)

    // Update conversation timestamp
    const conversation = MOCK_CONVERSATIONS.get(conversationId)
    if (conversation) {
      conversation.updated_at = new Date().toISOString()
      MOCK_CONVERSATIONS.set(conversationId, conversation)
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId: newMessage.id,
      moderationStatus: newMessage.moderation_status
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}