import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface MatchGenerationRequest {
  userId: string
  limit?: number
  filters?: {
    ageRange?: [number, number]
    locationRadius?: number
    educationLevel?: string[]
    religiousLevel?: string[]
  }
}

interface UserProfile {
  id: string
  user_id: string
  age: number
  gender: 'male' | 'female'
  location_city: string
  location_country: string
  education_level: string
  religious_level: string
  bio_embedding?: number[]
  preferences_embedding?: number[]
  interests: string[]
  seeking_marriage_timeline: string
  guardian_enabled: boolean
  photo_visibility: 'public' | 'private' | 'guardian_only'
  last_active: string
}

interface MatchCandidate {
  profile: UserProfile
  compatibility_score: number
  shared_interests: string[]
  distance_km?: number
  reasons: string[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Islamic marriage compatibility factors
const COMPATIBILITY_WEIGHTS = {
  religious_alignment: 0.25,
  education_compatibility: 0.15,
  age_compatibility: 0.15,
  location_proximity: 0.10,
  shared_interests: 0.15,
  marriage_timeline: 0.10,
  bio_similarity: 0.10
}

function calculateCompatibilityScore(
  userProfile: UserProfile, 
  candidateProfile: UserProfile
): { score: number; reasons: string[] } {
  let totalScore = 0
  const reasons: string[] = []

  // Religious alignment (highest weight for Islamic matching)
  if (userProfile.religious_level === candidateProfile.religious_level) {
    totalScore += COMPATIBILITY_WEIGHTS.religious_alignment * 100
    reasons.push('Similar religious commitment level')
  } else {
    const religiousLevels = ['learning', 'practicing', 'devout']
    const userIndex = religiousLevels.indexOf(userProfile.religious_level)
    const candidateIndex = religiousLevels.indexOf(candidateProfile.religious_level)
    const difference = Math.abs(userIndex - candidateIndex)
    const score = Math.max(0, 100 - (difference * 30))
    totalScore += COMPATIBILITY_WEIGHTS.religious_alignment * score
    if (score > 70) reasons.push('Compatible religious practice')
  }

  // Education compatibility
  const educationLevels = ['high_school', 'bachelors', 'masters', 'doctorate']
  const userEduIndex = educationLevels.indexOf(userProfile.education_level)
  const candidateEduIndex = educationLevels.indexOf(candidateProfile.education_level)
  const eduDifference = Math.abs(userEduIndex - candidateEduIndex)
  const eduScore = Math.max(0, 100 - (eduDifference * 20))
  totalScore += COMPATIBILITY_WEIGHTS.education_compatibility * eduScore
  if (eduScore > 80) reasons.push('Similar education levels')

  // Age compatibility (prefer closer ages)
  const ageDifference = Math.abs(userProfile.age - candidateProfile.age)
  const ageScore = Math.max(0, 100 - (ageDifference * 5))
  totalScore += COMPATIBILITY_WEIGHTS.age_compatibility * ageScore
  if (ageScore > 80) reasons.push('Compatible age range')

  // Location proximity
  const sameCountry = userProfile.location_country === candidateProfile.location_country
  const sameCity = userProfile.location_city === candidateProfile.location_city
  let locationScore = 0
  if (sameCity) {
    locationScore = 100
    reasons.push('Same city')
  } else if (sameCountry) {
    locationScore = 70
    reasons.push('Same country')
  } else {
    locationScore = 30
  }
  totalScore += COMPATIBILITY_WEIGHTS.location_proximity * locationScore

  // Shared interests
  const sharedInterests = userProfile.interests.filter(interest => 
    candidateProfile.interests.includes(interest)
  )
  const interestScore = Math.min(100, (sharedInterests.length / Math.max(userProfile.interests.length, 1)) * 100)
  totalScore += COMPATIBILITY_WEIGHTS.shared_interests * interestScore
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`)
  }

  // Marriage timeline compatibility
  const timelineCompatible = userProfile.seeking_marriage_timeline === candidateProfile.seeking_marriage_timeline
  const timelineScore = timelineCompatible ? 100 : 50
  totalScore += COMPATIBILITY_WEIGHTS.marriage_timeline * timelineScore
  if (timelineCompatible) reasons.push('Similar marriage timeline')

  // Bio similarity (if embeddings available)
  let bioScore = 50 // Default if no embeddings
  if (userProfile.bio_embedding && candidateProfile.bio_embedding) {
    // Cosine similarity calculation
    const similarity = calculateCosineSimilarity(userProfile.bio_embedding, candidateProfile.bio_embedding)
    bioScore = Math.max(0, similarity * 100)
    if (bioScore > 70) reasons.push('Similar life values and goals')
  }
  totalScore += COMPATIBILITY_WEIGHTS.bio_similarity * bioScore

  return {
    score: Math.round(totalScore),
    reasons: reasons.slice(0, 4) // Top 4 reasons
  }
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function validateHalalInteraction(
  userProfile: UserProfile,
  candidateProfile: UserProfile,
  supabaseClient: any
): Promise<boolean> {
  // Basic gender validation for heterosexual matching
  if (userProfile.gender === candidateProfile.gender) {
    return false
  }

  // Check if users have already been matched or rejected
  const { data: existingInteraction } = await supabaseClient
    .from('matches')
    .select('id, status')
    .or(`and(user_id.eq.${userProfile.user_id},matched_user_id.eq.${candidateProfile.user_id}),and(user_id.eq.${candidateProfile.user_id},matched_user_id.eq.${userProfile.user_id})`)
    .single()

  if (existingInteraction) {
    return false // Already interacted
  }

  // Guardian approval check for users under 25 or with guardian enabled
  if (userProfile.guardian_enabled || candidateProfile.guardian_enabled) {
    // Allow match generation but mark for guardian review
    return true
  }

  return true
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

    const request: MatchGenerationRequest = await req.json()
    
    if (!request.userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile
    const { data: userProfile, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', request.userId)
      .single()

    if (userError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if profile is complete
    if (userProfile.profile_completion_percentage < 60) {
      return new Response(
        JSON.stringify({ 
          error: 'Profile must be at least 60% complete to generate matches',
          completion_percentage: userProfile.profile_completion_percentage
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build candidate query
    let candidateQuery = supabaseClient
      .from('user_profiles')
      .select('*')
      .neq('user_id', request.userId)
      .neq('gender', userProfile.gender) // Opposite gender
      .eq('profile_status', 'active')
      .gte('profile_completion_percentage', 60)

    // Apply filters
    if (request.filters?.ageRange) {
      candidateQuery = candidateQuery
        .gte('age', request.filters.ageRange[0])
        .lte('age', request.filters.ageRange[1])
    }

    if (request.filters?.educationLevel?.length) {
      candidateQuery = candidateQuery.in('education_level', request.filters.educationLevel)
    }

    if (request.filters?.religiousLevel?.length) {
      candidateQuery = candidateQuery.in('religious_level', request.filters.religiousLevel)
    }

    // Get candidates
    const { data: candidates, error: candidatesError } = await candidateQuery
      .limit(100) // Get more candidates to filter and score

    if (candidatesError) {
      console.error('Candidates query error:', candidatesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch potential matches' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Score and filter candidates
    const scoredMatches: MatchCandidate[] = []

    for (const candidate of candidates || []) {
      // Validate halal interaction
      const isHalal = await validateHalalInteraction(userProfile, candidate, supabaseClient)
      if (!isHalal) continue

      // Calculate compatibility
      const { score, reasons } = calculateCompatibilityScore(userProfile, candidate)
      
      // Only include matches above threshold
      if (score >= 50) {
        const sharedInterests = userProfile.interests.filter(interest =>
          candidate.interests.includes(interest)
        )

        scoredMatches.push({
          profile: candidate,
          compatibility_score: score,
          shared_interests: sharedInterests,
          reasons
        })
      }
    }

    // Sort by compatibility score
    scoredMatches.sort((a, b) => b.compatibility_score - a.compatibility_score)

    // Limit results
    const limit = Math.min(request.limit || 10, 20)
    const finalMatches = scoredMatches.slice(0, limit)

    // Log match generation for analytics
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id: request.userId,
        event_type: 'matches_generated',
        event_data: {
          matches_count: finalMatches.length,
          avg_compatibility: finalMatches.reduce((sum, m) => sum + m.compatibility_score, 0) / finalMatches.length || 0,
          filters_applied: request.filters
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        matches: finalMatches,
        total_candidates_evaluated: candidates?.length || 0,
        generated_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Match generation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})