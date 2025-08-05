// Match Algorithm - Calculates compatibility between users
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Get user ID from auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get potential matches (opposite gender, active profiles)
    const { data: potentialMatches, error: matchError } = await supabaseClient
      .from('profiles')
      .select('*')
      .neq('gender', userProfile.gender)
      .eq('profile_active', true)
      .neq('user_id', user.id)
      .limit(50)

    if (matchError) {
      throw matchError
    }

    // Calculate compatibility scores
    const matchesWithScores = potentialMatches.map(match => {
      const score = calculateCompatibility(userProfile, match)
      return {
        ...match,
        compatibility_score: score.percentage,
        compatibility_reasons: score.reasons
      }
    })

    // Sort by compatibility score
    matchesWithScores.sort((a, b) => b.compatibility_score - a.compatibility_score)

    // Return top matches based on user's subscription
    const matchLimit = userProfile.subscription_tier === 'free' ? 5 : 
                      userProfile.subscription_tier === 'premium' ? 20 : 50

    const topMatches = matchesWithScores.slice(0, matchLimit)

    return new Response(JSON.stringify({ 
      matches: topMatches,
      total_available: matchesWithScores.length,
      limit: matchLimit
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function calculateCompatibility(user1: any, user2: any) {
  let score = 0
  const reasons = []
  
  // Religious compatibility (40% weight)
  if (user1.religious_practice_level === user2.religious_practice_level) {
    score += 20
    reasons.push('Same religious practice level')
  } else if (
    (user1.religious_practice_level === 'very_practicing' && user2.religious_practice_level === 'practicing') ||
    (user1.religious_practice_level === 'practicing' && user2.religious_practice_level === 'very_practicing')
  ) {
    score += 15
    reasons.push('Compatible religious practice')
  }
  
  if (user1.prayer_frequency === user2.prayer_frequency) {
    score += 10
    reasons.push('Same prayer frequency')
  }
  
  if (user1.sect_affiliation === user2.sect_affiliation) {
    score += 10
    reasons.push('Same sect affiliation')
  }
  
  // Location compatibility (20% weight)
  if (user1.location === user2.location) {
    score += 20
    reasons.push('Same location')
  } else if (user1.relocation_willing || user2.relocation_willing) {
    score += 10
    reasons.push('Open to relocation')
  }
  
  // Age compatibility (15% weight)
  const ageDiff = Math.abs(user1.age - user2.age)
  if (ageDiff <= 3) {
    score += 15
    reasons.push('Close in age')
  } else if (ageDiff <= 5) {
    score += 10
    reasons.push('Acceptable age difference')
  } else if (ageDiff <= 8) {
    score += 5
  }
  
  // Education compatibility (10% weight)
  if (user1.education_level === user2.education_level) {
    score += 10
    reasons.push('Same education level')
  } else {
    score += 5
  }
  
  // Marriage timeline (10% weight)
  if (user1.marriage_timeline === user2.marriage_timeline) {
    score += 10
    reasons.push('Same marriage timeline')
  }
  
  // Family values (5% weight)
  if (user1.wants_children === user2.wants_children) {
    score += 5
    reasons.push('Agree on children')
  }
  
  return {
    percentage: Math.min(score, 100),
    reasons
  }
}
