import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { userManagement } from '@/lib/clerk/user-management'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Handle the webhook
  try {
    const { type, data } = evt

    switch (type) {
      case 'user.created':
        await userManagement.handleUserCreated(data)
        console.log('User created:', data.id)
        break
        
      case 'user.updated':
        await userManagement.syncUser(data)
        console.log('User updated:', data.id)
        break
        
      case 'user.deleted':
        await userManagement.handleUserDeleted(data.id!)
        console.log('User deleted:', data.id)
        break
        
      case 'session.created':
        console.log('Session created for user:', data.user_id)
        // Track login analytics
        break
        
      case 'organization.created':
        console.log('Organization created:', data.id)
        // Handle family/guardian group creation
        break
        
      case 'organizationMembership.created':
        console.log('Organization membership created:', data.id)
        // Handle guardian joining
        break
        
      default:
        console.log('Unhandled webhook type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return new Response('Error occurred', {
      status: 500,
    })
  }
}