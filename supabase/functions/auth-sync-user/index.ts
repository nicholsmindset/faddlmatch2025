import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    phone_numbers: Array<{ phone_number: string; id: string }>
    first_name: string | null
    last_name: string | null
    image_url: string | null
    created_at: number
    updated_at: number
  }
}

interface UserSyncRequest {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const contentType = req.headers.get('content-type')
    
    // Handle Clerk webhook
    if (contentType?.includes('application/json') && req.headers.get('svix-signature')) {
      const webhookEvent: ClerkWebhookEvent = await req.json()
      
      if (webhookEvent.type === 'user.created' || webhookEvent.type === 'user.updated') {
        const { data: userData } = webhookEvent
        
        // Sync user to Supabase
        const { error } = await supabaseClient
          .from('users')
          .upsert({
            clerk_id: userData.id,
            email: userData.email_addresses[0]?.email_address,
            first_name: userData.first_name,
            last_name: userData.last_name,
            avatar_url: userData.image_url,
            created_at: new Date(userData.created_at).toISOString(),
            updated_at: new Date(userData.updated_at).toISOString(),
            subscription_tier: 'free', // Default tier
            profile_status: 'incomplete' // Require profile completion
          }, {
            onConflict: 'clerk_id'
          })

        if (error) {
          console.error('Supabase sync error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to sync user' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `User ${userData.id} synced successfully` 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Event type not handled' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle direct API call for manual sync
    if (req.method === 'POST') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid authorization header' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const syncRequest: UserSyncRequest = await req.json()
      
      // Validate required fields
      if (!syncRequest.userId || !syncRequest.email) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, email' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Sync user to Supabase
      const { error } = await supabaseClient
        .from('users')
        .upsert({
          clerk_id: syncRequest.userId,
          email: syncRequest.email,
          first_name: syncRequest.firstName,
          last_name: syncRequest.lastName,
          avatar_url: syncRequest.imageUrl,
          updated_at: new Date().toISOString(),
          subscription_tier: 'free',
          profile_status: 'incomplete'
        }, {
          onConflict: 'clerk_id'
        })

      if (error) {
        console.error('Manual sync error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to sync user' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${syncRequest.userId} synced successfully` 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Auth sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})