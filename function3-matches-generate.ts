import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { userId, limit = 10 } = await req.json()
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: userProfile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'User profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const oppositeGender = userProfile.gender === 'male' ? 'female' : 'male'
      
      const { data: potentialMatches, error: matchError } = await supabaseClient
        .from('user_profiles')
        .select('*, users!inner(*)')
        .eq('gender', oppositeGender)
        .neq('user_id', userId)
        .eq('users.status', 'active')
        .limit(limit)

      if (matchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to find matches', details: matchError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const matches = potentialMatches.map(match => ({
        ...match,
        compatibility_score: Math.floor(Math.random() * 30) + 70
      }))

      return new Response(
        JSON.stringify({ success: true, matches }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})