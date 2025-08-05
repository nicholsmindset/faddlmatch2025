import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all matches where the user is involved and it's mutual
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        user_id,
        matched_user_id,
        mutual_match,
        created_at,
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
      .eq('mutual_match', true)
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)

    if (matchError) {
      console.error('Error fetching matches:', matchError)
      throw matchError
    }

    // Transform matches into conversations
    const conversations = await Promise.all((matches || []).map(async (match) => {
      // Determine who is the other user
      const isUserInitiator = match.user_id === userId
      const otherUserId = isUserInitiator ? match.matched_user_id : match.user_id
      const otherProfile = isUserInitiator ? match.matched_profile : match.user_profile

      // Get the last message for this match
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Count unread messages
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .eq('receiver_id', userId)
        .eq('is_read', false)

      return {
        id: match.id,
        userId: otherUserId,
        userName: otherProfile?.full_name || 'Unknown User',
        userAvatar: otherProfile?.profile_photos?.[0] || null,
        lastMessage: lastMessage ? {
          text: lastMessage.message_text,
          timestamp: lastMessage.created_at,
          isRead: lastMessage.is_read,
          senderId: lastMessage.sender_id
        } : null,
        unreadCount: unreadCount || 0,
        isOnline: false, // TODO: Implement online status
        lastSeen: new Date().toISOString()
      }
    }))

    // Sort by last message timestamp
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    })

    return NextResponse.json({
      conversations,
      total: conversations.length
    })

  } catch (error) {
    console.error('Error in messages API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
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
    const { matchId, receiverId, text } = body

    if (!matchId || !receiverId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the user is part of this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .eq('mutual_match', true)
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Invalid match or not authorized' },
        { status: 403 }
      )
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: userId,
        receiver_id: receiverId,
        message_text: text,
        message_type: 'text'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      throw messageError
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    )
  }
}

// Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID required' },
        { status: 400 }
      )
    }

    // Mark all messages in this match as read for this user
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('match_id', matchId)
      .eq('receiver_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }

    return NextResponse.json({
      message: 'Messages marked as read'
    })

  } catch (error) {
    console.error('Error updating messages:', error)
    return NextResponse.json(
      { error: 'Failed to update messages', details: error.message },
      { status: 500 }
    )
  }
}
