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
      const profileData = await req.json()
      
      if (!profileData.userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('user_profiles')
        .insert({
          user_id: profileData.userId,
          first_name: profileData.basicInfo?.firstName || '',
          last_name: profileData.basicInfo?.lastName || '',
          year_of_birth: profileData.basicInfo?.yearOfBirth || 1990,
          gender: profileData.basicInfo?.gender || 'male',
          location_zone: profileData.basicInfo?.locationZone || 'central',
          marital_status: profileData.basicInfo?.maritalStatus || 'divorced',
          prayer_frequency: profileData.religiousInfo?.prayerFrequency || 'usually',
          modest_dress: profileData.religiousInfo?.modestDress || 'usually',
          ethnicity: profileData.background?.ethnicity || 'malay',
          languages: profileData.background?.languages || ['English'],
          bio: profileData.basicInfo?.bio || ''
        })
        .select()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create profile', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
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