import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { userManagement } from '@/lib/clerk/user-management'
import { NextRequest, NextResponse } from 'next/server'
import { ratelimit } from '@/lib/ratelimit'

/**
 * 🔒 Secure Clerk Webhook Handler
 * Enhanced security with rate limiting and validation
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  // 🔐 Security logging
  const logWebhookEvent = (event: string, details?: any) => {
    console.log(`[WEBHOOK] ${event}`, {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      userAgent: req.headers.get('user-agent'),
      duration: Date.now() - startTime,
      ...details
    })
  }
  
  try {
    // 🚦 Rate limiting for webhook endpoint
    const { success } = await ratelimit(`webhook:${clientIP}`, { requests: 50, window: '1m' })
    if (!success) {
      logWebhookEvent('RATE_LIMIT_EXCEEDED')
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }
    
    // 🔑 Verify webhook secret
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      logWebhookEvent('MISSING_WEBHOOK_SECRET')
      throw new Error('CLERK_WEBHOOK_SECRET not configured')
    }

    // 📝 Get and validate headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // 🚨 Validate required Svix headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
      logWebhookEvent('MISSING_SVIX_HEADERS', {
        hasId: !!svix_id,
        hasTimestamp: !!svix_timestamp,
        hasSignature: !!svix_signature
      })
      return new NextResponse('Missing required webhook headers', { status: 400 })
    }

    // 🔍 Validate timestamp to prevent replay attacks
    const timestamp = parseInt(svix_timestamp)
    const now = Math.floor(Date.now() / 1000)
    const timestampTolerance = 5 * 60 // 5 minutes
    
    if (Math.abs(now - timestamp) > timestampTolerance) {
      logWebhookEvent('TIMESTAMP_OUT_OF_RANGE', {
        timestamp,
        now,
        difference: Math.abs(now - timestamp)
      })
      return new NextResponse('Webhook timestamp out of acceptable range', { status: 400 })
    }

    // 📬 Get and validate payload
    let payload: any
    let body: string
    
    try {
      payload = await req.json()
      body = JSON.stringify(payload)
      
      // Basic payload validation
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload format')
      }
      
    } catch (error) {
      logWebhookEvent('INVALID_PAYLOAD', { error: error instanceof Error ? error.message : 'Unknown error' })
      return new NextResponse('Invalid JSON payload', { status: 400 })
    }

    // 🔐 Verify webhook signature
    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent
      
      logWebhookEvent('SIGNATURE_VERIFIED', { eventType: evt.type })
      
    } catch (err) {
      logWebhookEvent('SIGNATURE_VERIFICATION_FAILED', {
        error: err instanceof Error ? err.message : 'Unknown error',
        svixId: svix_id
      })
      return new NextResponse('Webhook signature verification failed', { status: 401 })
    }

    // 🔄 Handle the verified webhook
    const { type, data } = evt
    logWebhookEvent('PROCESSING_EVENT', { type, dataId: data.id })

    try {
      switch (type) {
        case 'user.created':
          try {
            // Webhook data is UserJSON, need to fetch full User object
            const createdUser = await clerkClient.users.getUser(data.id)
            await userManagement.handleUserCreated(createdUser)
            logWebhookEvent('USER_CREATED_SUCCESS', { userId: data.id })
          } catch (error) {
            logWebhookEvent('USER_CREATED_ERROR', { 
              userId: data.id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
            throw error
          }
          break
          
        case 'user.updated':
          try {
            // Webhook data is UserJSON, need to fetch full User object
            const updatedUser = await clerkClient.users.getUser(data.id)
            await userManagement.syncUser(updatedUser)
            logWebhookEvent('USER_UPDATED_SUCCESS', { userId: data.id })
          } catch (error) {
            logWebhookEvent('USER_UPDATED_ERROR', { 
              userId: data.id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
            throw error
          }
          break
          
        case 'user.deleted':
          try {
            await userManagement.handleUserDeleted(data.id!)
            logWebhookEvent('USER_DELETED_SUCCESS', { userId: data.id })
          } catch (error) {
            logWebhookEvent('USER_DELETED_ERROR', { 
              userId: data.id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
            throw error
          }
          break
          
        case 'session.created':
          logWebhookEvent('SESSION_CREATED', { userId: data.user_id })
          // Track login analytics and security events
          break
          
        case 'session.ended':
          logWebhookEvent('SESSION_ENDED', { userId: data.user_id })
          // Track logout analytics
          break
          
        case 'organization.created':
          logWebhookEvent('ORGANIZATION_CREATED', { orgId: data.id })
          // Handle family/guardian group creation
          break
          
        case 'organizationMembership.created':
          logWebhookEvent('MEMBERSHIP_CREATED', { 
            membershipId: data.id,
            userId: data.public_user_data?.user_id,
            orgId: data.organization?.id
          })
          // Handle guardian joining
          break
          
        default:
          logWebhookEvent('UNHANDLED_EVENT_TYPE', { type })
          // Still return success to avoid webhook retries
      }

      logWebhookEvent('WEBHOOK_SUCCESS', { 
        type, 
        processingTime: Date.now() - startTime 
      })
      
      return NextResponse.json({ 
        received: true, 
        timestamp: new Date().toISOString(),
        eventType: type
      })
      
    } catch (error) {
      logWebhookEvent('WEBHOOK_PROCESSING_ERROR', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTime: Date.now() - startTime
      })
      
      // Return 500 to trigger webhook retry
      return new NextResponse('Internal server error processing webhook', {
        status: 500,
      })
    }
    
  } catch (error) {
    logWebhookEvent('WEBHOOK_HANDLER_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    })
    
    return new NextResponse('Webhook handler error', {
      status: 500,
    })
  }
}