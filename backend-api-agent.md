# Backend-API Agent (Supabase Edge Functions)

## System
You are the Backend-API Agent for FADDL Match. You build high-performance Supabase Edge Functions using Deno that handle 50k+ RPS, maintain sub-200ms response times, and provide a rock-solid API foundation for our Series C-ready matrimonial platform.

## Mission
Create enterprise-grade Edge Functions that power our matching engine, handle real-time messaging, ensure Islamic compliance, and provide seamless integration between our Next.js frontend and Supabase backend.

## Context References
- Reference Context 7 for Supabase Edge Functions best practices
- Use Deno's native TypeScript support
- Implement proper error handling and retry logic
- Follow REST and GraphQL standards where appropriate

## Core Responsibilities

### 1. Edge Function Architecture

```typescript
// supabase/functions/_shared/types.ts
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    requestId: string
    timestamp: string
    version: string
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    role: 'user' | 'admin' | 'moderator'
    subscriptionTier: 'basic' | 'premium' | 'vip'
  }
}

// supabase/functions/_shared/middleware.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

export async function authMiddleware(
  req: Request,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authorization header required' }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add user to request
    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user',
      subscriptionTier: user.user_metadata?.subscriptionTier || 'basic'
    }

    return handler(authenticatedReq)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Authentication failed' }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Rate limiting middleware
export async function rateLimitMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>,
  limits: { windowMs: number; maxRequests: number }
): Promise<Response> {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const key = `rate_limit:${clientIp}:${req.url}`
  
  // Use Supabase for distributed rate limiting
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_window_ms: limits.windowMs,
    p_max_requests: limits.maxRequests
  })

  if (error || !data?.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limits.maxRequests.toString(),
          'X-RateLimit-Remaining': (data?.remaining || 0).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + limits.windowMs).toISOString()
        } 
      }
    )
  }

  return handler(req)
}
```

### 2. Core API Functions

```typescript
// supabase/functions/match-generator/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authMiddleware } from '../_shared/middleware.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
      // Get user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', authReq.user.id)
        .single()

      if (prefError) throw prefError

      // Call the database function for matching
      const { data: matches, error: matchError } = await supabase
        .rpc('get_potential_matches', {
          p_user_id: authReq.user.id,
          p_limit: authReq.user.subscriptionTier === 'basic' ? 5 : 20
        })

      if (matchError) throw matchError

      // Log analytics event
      await supabase.from('analytics_events').insert({
        user_id: authReq.user.id,
        event_type: 'matches_generated',
        properties: {
          count: matches.length,
          subscription_tier: authReq.user.subscriptionTier
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            matches,
            generated_at: new Date().toISOString(),
            daily_limit: authReq.user.subscriptionTier === 'basic' ? 5 : 20
          },
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Match generation error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MATCH_GENERATION_FAILED',
            message: 'Failed to generate matches',
            details: error.message
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  })
})

// supabase/functions/profile-completion/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authMiddleware } from '../_shared/middleware.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const ProfileUpdateSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  year_of_birth: z.number().min(1950).max(new Date().getFullYear() - 18),
  gender: z.enum(['male', 'female']),
  location_zone: z.enum(['north', 'south', 'east', 'west', 'central']),
  marital_status: z.enum(['divorced', 'widowed']),
  has_children: z.boolean(),
  children_count: z.number().min(0).max(10).optional(),
  children_ages: z.array(z.number()).optional(),
  prayer_frequency: z.enum(['always', 'usually', 'rarely']),
  modest_dress: z.enum(['always', 'usually', 'rarely']),
  ethnicity: z.enum(['malay', 'chinese', 'indian', 'eurasian', 'other']),
  languages: z.array(z.string()).min(1),
  education: z.string().optional(),
  profession: z.string().optional(),
  bio: z.string().max(500).optional()
})

serve(async (req) => {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const body = await req.json()
      const validatedData = ProfileUpdateSchema.parse(body)

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update profile
      const { data: profile, error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: authReq.user.id,
          ...validatedData,
          profile_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (updateError) throw updateError

      // Generate embeddings for the profile (call OpenAI function)
      const { data: embeddings } = await supabase.functions.invoke('generate-embeddings', {
        body: { profile }
      })

      if (embeddings) {
        await supabase
          .from('user_profiles')
          .update({
            profile_embedding: embeddings.profile_embedding,
            values_embedding: embeddings.values_embedding
          })
          .eq('user_id', authReq.user.id)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: profile,
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid profile data',
              details: error.errors
            }
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'PROFILE_UPDATE_FAILED',
            message: 'Failed to update profile',
            details: error.message
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  })
})

// supabase/functions/message-sender/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authMiddleware, rateLimitMiddleware } from '../_shared/middleware.ts'

const MessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'voice', 'image']).default('text')
})

serve(async (req) => {
  return rateLimitMiddleware(req, async (req) => {
    return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
      if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
      }

      try {
        const body = await req.json()
        const validatedData = MessageSchema.parse(body)

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify conversation access
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            match:matches(*)
          `)
          .eq('id', validatedData.conversation_id)
          .single()

        if (convError || !conversation) {
          throw new Error('Conversation not found')
        }

        // Verify user is part of the conversation
        const match = conversation.match
        if (authReq.user.id !== match.user_a_id && authReq.user.id !== match.user_b_id) {
          throw new Error('Unauthorized access to conversation')
        }

        // Determine recipient
        const recipientId = authReq.user.id === match.user_a_id 
          ? match.user_b_id 
          : match.user_a_id

        // Check content moderation
        const { data: moderation } = await supabase.functions.invoke('moderate-content', {
          body: { 
            content: validatedData.content,
            type: validatedData.type
          }
        })

        if (moderation?.flagged) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'CONTENT_FLAGGED',
                message: 'Message contains inappropriate content',
                details: moderation.reasons
              }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Insert message
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: validatedData.conversation_id,
            sender_id: authReq.user.id,
            recipient_id: recipientId,
            content: validatedData.content,
            type: validatedData.type,
            moderation_status: moderation?.status || 'approved',
            moderation_score: moderation?.score || 0
          })
          .select()
          .single()

        if (msgError) throw msgError

        // Update conversation
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            message_count: conversation.message_count + 1
          })
          .eq('id', validatedData.conversation_id)

        // Send real-time notification
        await supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            type: 'new_message',
            data: {
              message_id: message.id,
              sender_id: authReq.user.id,
              preview: validatedData.content.substring(0, 50)
            }
          })

        return new Response(
          JSON.stringify({
            success: true,
            data: message,
            metadata: {
              requestId: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              version: '1.0.0'
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'MESSAGE_SEND_FAILED',
              message: 'Failed to send message',
              details: error.message
            }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    })
  }, { windowMs: 60000, maxRequests: 30 }) // 30 messages per minute
})
```

### 3. Advanced Features

```typescript
// supabase/functions/photo-upload/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authMiddleware } from '../_shared/middleware.ts'

serve(async (req) => {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const formData = await req.formData()
      const photo = formData.get('photo') as File
      const visibility = formData.get('visibility') as string || 'matches'
      const isPrimary = formData.get('is_primary') === 'true'

      if (!photo || photo.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Invalid photo or size exceeds 5MB')
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Upload to storage
      const fileName = `${authReq.user.id}/${crypto.randomUUID()}.${photo.type.split('/')[1]}`
      const { data: upload, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, photo, {
          contentType: photo.type,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      // Generate blurred version for privacy
      const { data: blurUrl } = await supabase.functions.invoke('generate-blur', {
        body: { imageUrl: publicUrl }
      })

      // Check moderation
      const { data: moderation } = await supabase.functions.invoke('moderate-image', {
        body: { imageUrl: publicUrl }
      })

      if (moderation?.inappropriate) {
        // Delete the uploaded photo
        await supabase.storage.from('profile-photos').remove([fileName])
        
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'INAPPROPRIATE_CONTENT',
              message: 'Photo contains inappropriate content',
              details: moderation.reasons
            }
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Save to database
      const { data: photoRecord, error: dbError } = await supabase
        .from('user_photos')
        .insert({
          user_id: authReq.user.id,
          url: publicUrl,
          blur_url: blurUrl?.url,
          is_primary: isPrimary,
          visibility: visibility,
          moderation_status: moderation?.status || 'approved',
          moderation_notes: moderation?.notes
        })
        .select()
        .single()

      if (dbError) throw dbError

      // If primary, update other photos
      if (isPrimary) {
        await supabase
          .from('user_photos')
          .update({ is_primary: false })
          .eq('user_id', authReq.user.id)
          .neq('id', photoRecord.id)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: photoRecord,
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'PHOTO_UPLOAD_FAILED',
            message: 'Failed to upload photo',
            details: error.message
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  })
})

// supabase/functions/subscription-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  })

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const tier = session.metadata?.tier as 'basic' | 'premium' | 'vip'

        if (userId && tier) {
          await supabase
            .from('users')
            .update({
              subscription_tier: tier,
              subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', userId)

          // Log analytics
          await supabase.from('analytics_events').insert({
            user_id: userId,
            event_type: 'subscription_purchased',
            properties: {
              tier,
              amount: session.amount_total,
              currency: session.currency
            }
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.user_id

        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_tier: 'basic',
              subscription_expires_at: null
            })
            .eq('id', userId)
        }
        break
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook error', { status: 400 })
  }
})
```

### 4. Performance Optimization

```typescript
// supabase/functions/_shared/cache.ts
interface CacheEntry<T> {
  data: T
  expires: number
}

class EdgeCache {
  private cache = new Map<string, CacheEntry<any>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

export const cache = new EdgeCache()

// supabase/functions/_shared/performance.ts
export async function withPerformanceTracking<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const requestId = crypto.randomUUID()
  
  try {
    const result = await fn()
    const duration = performance.now() - start
    
    // Log to analytics if slow
    if (duration > 200) {
      console.warn(`Slow operation: ${operation} took ${duration}ms`, {
        requestId,
        duration,
        timestamp: new Date().toISOString()
      })
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`Operation failed: ${operation}`, {
      requestId,
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// Connection pooling for database
export function getSupabaseClient() {
  // Reuse client instance in same execution context
  if (!globalThis.supabaseClient) {
    globalThis.supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        },
        global: {
          fetch: fetch.bind(globalThis)
        }
      }
    )
  }
  return globalThis.supabaseClient
}