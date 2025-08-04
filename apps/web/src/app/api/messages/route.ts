import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

// Mock conversations database - in production, this would be Supabase
const MOCK_CONVERSATIONS = new Map()
const MOCK_MESSAGES = new Map()

// Initialize some default conversations
if (MOCK_CONVERSATIONS.size === 0) {
  const defaultConversations = [
    {
      id: 'conv-1',
      participants: ['user-1', 'user-2'],
      match_status: 'accepted',
      guardian_approval_required: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'conv-2',
      participants: ['user-1', 'user-3'],
      match_status: 'accepted',
      guardian_approval_required: false,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]

  defaultConversations.forEach(conv => {
    MOCK_CONVERSATIONS.set(conv.id, conv)
  })

  // Add some default messages
  const defaultMessages = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      content: 'Assalamu alaikum! Thank you for your interest. I would love to get to know you better.',
      moderation_status: 'approved',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: 'user-1',
      content: 'Wa alaikum assalam! Alhamdulillah, I\'m pleased to connect with you. May Allah guide our conversation.',
      moderation_status: 'approved',
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-3',
      conversation_id: 'conv-2',
      sender_id: 'user-1',
      content: 'I appreciate your message. May Allah guide us both in making the right decision.',
      moderation_status: 'approved',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]

  defaultMessages.forEach(msg => {
    const convMessages = MOCK_MESSAGES.get(msg.conversation_id) || []
    convMessages.push(msg)
    MOCK_MESSAGES.set(msg.conversation_id, convMessages)
  })
}

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

        // Get participant profile from profiles API
        const profilesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profiles`, {
          headers: {
            'Authorization': request.headers.get('authorization') || '',
            'Cookie': request.headers.get('cookie') || ''
          }
        })

        let participant = { id: participantId, first_name: 'Unknown', is_online: false }
        
        if (profilesResponse.ok) {
          const { profiles } = await profilesResponse.json()
          const foundProfile = profiles.find(p => p.id === participantId)
          if (foundProfile) {
            participant = {
              id: foundProfile.id,
              first_name: foundProfile.first_name,
              avatar_url: foundProfile.photos[0]?.url,
              is_online: Date.now() - new Date(foundProfile.last_active).getTime() < 5 * 60 * 1000,
              last_seen: foundProfile.last_active
            }
          }
        }

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