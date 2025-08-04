import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { Webhook } from 'svix'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'

/**
 * 🔒 Clerk Webhook Handler for Netlify Functions
 * Fallback handler for webhook processing
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const startTime = Date.now()
  const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
  
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  }

  const logWebhookEvent = (eventType: string, details?: any) => {
    console.log(`[NETLIFY-WEBHOOK] ${eventType}`, {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      userAgent: event.headers['user-agent'],
      duration: Date.now() - startTime,
      ...details
    })
  }

  try {
    // Verify webhook secret
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      logWebhookEvent('MISSING_WEBHOOK_SECRET')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'CLERK_WEBHOOK_SECRET not configured' }),
        headers: { 'Content-Type': 'application/json' }
      }
    }

    // Get Svix headers
    const svix_id = event.headers['svix-id']
    const svix_timestamp = event.headers['svix-timestamp']
    const svix_signature = event.headers['svix-signature']

    if (!svix_id || !svix_timestamp || !svix_signature) {
      logWebhookEvent('MISSING_SVIX_HEADERS', {
        hasId: !!svix_id,
        hasTimestamp: !!svix_timestamp,
        hasSignature: !!svix_signature
      })
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required webhook headers' }),
        headers: { 'Content-Type': 'application/json' }
      }
    }

    // Validate timestamp
    const timestamp = parseInt(svix_timestamp)
    const now = Math.floor(Date.now() / 1000)
    const timestampTolerance = 5 * 60 // 5 minutes
    
    if (Math.abs(now - timestamp) > timestampTolerance) {
      logWebhookEvent('TIMESTAMP_OUT_OF_RANGE', {
        timestamp,
        now,
        difference: Math.abs(now - timestamp)
      })
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Webhook timestamp out of acceptable range' }),
        headers: { 'Content-Type': 'application/json' }
      }
    }

    // Parse and validate payload
    let payload: any
    let body: string
    
    try {
      if (!event.body) {
        throw new Error('No request body')
      }
      
      payload = JSON.parse(event.body)
      body = event.body
      
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload format')
      }
      
    } catch (error) {
      logWebhookEvent('INVALID_PAYLOAD', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON payload' }),
        headers: { 'Content-Type': 'application/json' }
      }
    }

    // Verify webhook signature
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
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Webhook signature verification failed' }),
        headers: { 'Content-Type': 'application/json' }
      }
    }

    // Handle the verified webhook
    const { type, data } = evt
    logWebhookEvent('PROCESSING_EVENT', { type, dataId: data.id })

    try {
      switch (type) {
        case 'user.created':
          logWebhookEvent('USER_CREATED_PROCESSED', { userId: data.id })
          break
          
        case 'user.updated':
          logWebhookEvent('USER_UPDATED_PROCESSED', { userId: data.id })
          break
          
        case 'user.deleted':
          logWebhookEvent('USER_DELETED_PROCESSED', { userId: data.id })
          break
          
        case 'session.created':
          logWebhookEvent('SESSION_CREATED', { userId: data.user_id })
          break
          
        case 'session.ended':
        case 'session.removed':
          logWebhookEvent('SESSION_ENDED', { userId: data.user_id })
          break
          
        default:
          logWebhookEvent('UNHANDLED_EVENT_TYPE', { type })
      }

      logWebhookEvent('WEBHOOK_SUCCESS', { 
        type, 
        processingTime: Date.now() - startTime 
      })
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          received: true, 
          timestamp: new Date().toISOString(),
          eventType: type
        }),
        headers: { 'Content-Type': 'application/json' }
      }
      
    } catch (error) {
      logWebhookEvent('WEBHOOK_PROCESSING_ERROR', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      })
      
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error processing webhook' }),
        headers: { 'Content-Type': 'application/json' }
      }
    }
    
  } catch (error) {
    logWebhookEvent('WEBHOOK_HANDLER_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    })
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook handler error' }),
      headers: { 'Content-Type': 'application/json' }
    }
  }
}