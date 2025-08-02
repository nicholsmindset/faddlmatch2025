import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface SendMessageRequest {
  conversationId: string
  content: string
  messageType?: 'text' | 'photo' | 'audio'
  replyToId?: string
}

interface MessageModerationResult {
  approved: boolean
  flagged_content?: string[]
  warning_message?: string
  requires_guardian_review?: boolean
}

interface ConversationValidation {
  exists: boolean
  user_is_participant: boolean
  match_status: string
  guardian_approval_required: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Islamic communication guidelines
const FORBIDDEN_PATTERNS = [
  // Inappropriate content
  /\b(dating|kiss|hug|touch|meet\s+alone|private\s+meeting)\b/i,
  // Contact information
  /\b(\d{10,}|[\w\.-]+@[\w\.-]+\.\w+)\b/,
  // Social media
  /\b(instagram|facebook|snapchat|whatsapp|telegram|@\w+)\b/i,
  // Inappropriate language
  /\b(sexy|hot|beautiful|handsome|attractive)\b/i
]

const WARNING_PATTERNS = [
  // Personal meetings
  /\b(meet|meeting|coffee|dinner|lunch)\b/i,
  // Family context is encouraged
  /\b(family|parents|siblings|guardian|wali)\b/i
]

async function moderateMessage(content: string): Promise<MessageModerationResult> {
  const flaggedContent: string[] = []
  let requiresGuardianReview = false

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern)
      if (match) {
        flaggedContent.push(match[0])
      }
    }
  }

  // Check for warning patterns
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern)
      if (match && match[0].includes('meet')) {
        requiresGuardianReview = true
        break
      }
    }
  }

  // OpenAI content moderation would go here in production
  // For now, using pattern-based moderation

  const approved = flaggedContent.length === 0

  return {
    approved,
    flagged_content: flaggedContent.length > 0 ? flaggedContent : undefined,
    warning_message: requiresGuardianReview 
      ? "Consider involving your guardian/family in any meeting arrangements as per Islamic guidelines."
      : undefined,
    requires_guardian_review: requiresGuardianReview
  }
}

async function validateConversation(
  conversationId: string,
  userId: string,
  supabaseClient: any
): Promise<ConversationValidation> {
  // Get conversation details
  const { data: conversation, error } = await supabaseClient
    .from('conversations')
    .select(`
      id,
      user1_id,
      user2_id,
      status,
      match:matches(status, guardian_approval_required)
    `)
    .eq('id', conversationId)
    .single()

  if (error || !conversation) {
    return {
      exists: false,
      user_is_participant: false,
      match_status: 'none',
      guardian_approval_required: false
    }
  }

  const isParticipant = conversation.user1_id === userId || conversation.user2_id === userId

  return {
    exists: true,
    user_is_participant: isParticipant,
    match_status: conversation.match?.status || 'none',
    guardian_approval_required: conversation.match?.guardian_approval_required || false
  }
}

async function checkRateLimit(
  userId: string,
  supabaseClient: any
): Promise<{ allowed: boolean; remaining: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { data: recentMessages, error } = await supabaseClient
    .from('messages')
    .select('id')
    .eq('sender_id', userId)
    .gte('created_at', oneHourAgo)

  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: 50 } // Fail open
  }

  const messageCount = recentMessages?.length || 0
  const limit = 50 // Messages per hour
  const remaining = Math.max(0, limit - messageCount)

  return {
    allowed: messageCount < limit,
    remaining
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authentication check
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user ID from token (simplified - in production, verify JWT)
    const token = authHeader.replace('Bearer ', '')
    // For now, extract user ID from token payload (implement proper JWT verification)
    const userId = req.headers.get('x-user-id') // Temporary workaround

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found in request' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const request: SendMessageRequest = await req.json()

    // Validate required fields
    if (!request.conversationId || !request.content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID and message content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(userId, supabaseClient)
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Try again in an hour.',
          retry_after: 3600
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }
        }
      )
    }

    // Validate conversation
    const conversationValidation = await validateConversation(
      request.conversationId,
      userId,
      supabaseClient
    )

    if (!conversationValidation.exists) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!conversationValidation.user_is_participant) {
      return new Response(
        JSON.stringify({ error: 'You are not a participant in this conversation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (conversationValidation.match_status !== 'accepted') {
      return new Response(
        JSON.stringify({ error: 'Cannot send messages until match is accepted' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Content moderation
    const moderation = await moderateMessage(request.content)

    if (!moderation.approved) {
      return new Response(
        JSON.stringify({
          error: 'Message content violates Islamic communication guidelines',
          flagged_content: moderation.flagged_content,
          guidelines: [
            'Maintain respectful and halal communication',
            'Avoid sharing personal contact information',
            'Consider involving family in meeting arrangements',
            'Focus on getting to know each other for marriage purposes'
          ]
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert message
    const messageData = {
      conversation_id: request.conversationId,
      sender_id: userId,
      content: request.content.trim(),
      message_type: request.messageType || 'text',
      reply_to_id: request.replyToId || null,
      moderation_status: moderation.requires_guardian_review ? 'guardian_review' : 'approved',
      moderation_notes: moderation.warning_message || null,
      created_at: new Date().toISOString()
    }

    const { data: newMessage, error: insertError } = await supabaseClient
      .from('messages')
      .insert(messageData)
      .select(`
        id,
        content,
        message_type,
        created_at,
        moderation_status,
        moderation_notes,
        sender:users(id, first_name, avatar_url)
      `)
      .single()

    if (insertError) {
      console.error('Message insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to send message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update conversation last activity
    await supabaseClient
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', request.conversationId)

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: 'message_sent',
        event_data: {
          conversation_id: request.conversationId,
          message_type: request.messageType || 'text',
          moderation_status: moderation.requires_guardian_review ? 'guardian_review' : 'approved',
          content_length: request.content.length
        }
      })

    // Prepare response
    const response = {
      success: true,
      message: newMessage,
      moderation: {
        approved: moderation.approved,
        warning: moderation.warning_message,
        requires_guardian_review: moderation.requires_guardian_review
      },
      rate_limit: {
        remaining: rateLimit.remaining - 1,
        reset_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString()
        }
      }
    )

  } catch (error) {
    console.error('Message send error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})