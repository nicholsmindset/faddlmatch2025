import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { authenticateRequest, monitorSecurityEvents } from '../_shared/jwt-validation.ts'
import { withMonitoring, initializeMonitoring, recordError } from '../_shared/monitoring.ts'

interface CreateProfileRequest {
  userId: string
  basicInfo: {
    age: number
    gender: 'male' | 'female'
    location_city: string
    location_country: string
    bio: string
  }
  religiousInfo: {
    religious_level: 'learning' | 'practicing' | 'devout'
    prayer_frequency: 'rarely' | 'sometimes' | 'regularly' | 'always'
    hijab_preference?: 'required' | 'preferred' | 'optional' // For male profiles about spouse
    beard_preference?: 'required' | 'preferred' | 'optional' // For female profiles about spouse
  }
  personalInfo: {
    education_level: 'high_school' | 'bachelors' | 'masters' | 'doctorate'
    occupation: string
    interests: string[]
    languages: string[]
    seeking_marriage_timeline: 'immediately' | 'within_year' | 'within_two_years' | 'when_ready'
  }
  familyInfo: {
    guardian_enabled: boolean
    guardian_email?: string
    family_values: string[]
    children_preference: 'definitely' | 'probably' | 'maybe' | 'no'
  }
  preferences: {
    age_range: [number, number]
    location_radius_km?: number
    education_preference?: string[]
    religious_level_preference?: string[]
  }
}

interface ProfileValidationResult {
  valid: boolean
  errors: string[]
  completion_percentage: number
  missing_fields: string[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function validateProfileData(data: CreateProfileRequest): ProfileValidationResult {
  const errors: string[] = []
  const missingFields: string[] = []
  let totalFields = 0
  let completedFields = 0

  // Basic info validation
  totalFields += 5
  if (!data.basicInfo.age || data.basicInfo.age < 18 || data.basicInfo.age > 80) {
    errors.push('Age must be between 18 and 80')
  } else {
    completedFields++
  }

  if (!data.basicInfo.gender || !['male', 'female'].includes(data.basicInfo.gender)) {
    errors.push('Gender must be male or female')
  } else {
    completedFields++
  }

  if (!data.basicInfo.location_city?.trim()) {
    missingFields.push('location_city')
  } else {
    completedFields++
  }

  if (!data.basicInfo.location_country?.trim()) {
    missingFields.push('location_country')
  } else {
    completedFields++
  }

  if (!data.basicInfo.bio?.trim() || data.basicInfo.bio.length < 50) {
    errors.push('Bio must be at least 50 characters')
  } else {
    completedFields++
  }

  // Religious info validation
  totalFields += 3
  if (!data.religiousInfo.religious_level) {
    missingFields.push('religious_level')
  } else {
    completedFields++
  }

  if (!data.religiousInfo.prayer_frequency) {
    missingFields.push('prayer_frequency')
  } else {
    completedFields++
  }

  // Gender-specific religious preferences
  if (data.basicInfo.gender === 'male' && data.religiousInfo.hijab_preference) {
    completedFields++
  } else if (data.basicInfo.gender === 'female' && data.religiousInfo.beard_preference) {
    completedFields++
  } else {
    missingFields.push(data.basicInfo.gender === 'male' ? 'hijab_preference' : 'beard_preference')
  }

  // Personal info validation
  totalFields += 5
  if (!data.personalInfo.education_level) {
    missingFields.push('education_level')
  } else {
    completedFields++
  }

  if (!data.personalInfo.occupation?.trim()) {
    missingFields.push('occupation')
  } else {
    completedFields++
  }

  if (!data.personalInfo.interests?.length) {
    missingFields.push('interests')
  } else {
    completedFields++
  }

  if (!data.personalInfo.languages?.length) {
    missingFields.push('languages')
  } else {
    completedFields++
  }

  if (!data.personalInfo.seeking_marriage_timeline) {
    missingFields.push('seeking_marriage_timeline')
  } else {
    completedFields++
  }

  // Family info validation
  totalFields += 3
  if (typeof data.familyInfo.guardian_enabled !== 'boolean') {
    missingFields.push('guardian_enabled')
  } else {
    completedFields++
    if (data.familyInfo.guardian_enabled && !data.familyInfo.guardian_email?.trim()) {
      errors.push('Guardian email is required when guardian is enabled')
    }
  }

  if (!data.familyInfo.family_values?.length) {
    missingFields.push('family_values')
  } else {
    completedFields++
  }

  if (!data.familyInfo.children_preference) {
    missingFields.push('children_preference')
  } else {
    completedFields++
  }

  // Preferences validation
  totalFields += 2
  if (!data.preferences.age_range || data.preferences.age_range.length !== 2) {
    missingFields.push('age_range')
  } else {
    completedFields++
  }

  if (data.preferences.education_preference?.length) {
    completedFields++
  }

  const completionPercentage = Math.round((completedFields / totalFields) * 100)

  return {
    valid: errors.length === 0 && missingFields.length === 0,
    errors,
    completion_percentage: completionPercentage,
    missing_fields: missingFields
  }
}

async function generateProfileEmbedding(profile: CreateProfileRequest): Promise<number[]> {
  // In production, this would call OpenAI to generate embeddings
  // For now, return a mock embedding based on profile data
  const profileText = [
    profile.basicInfo.bio,
    profile.personalInfo.interests.join(' '),
    profile.familyInfo.family_values.join(' '),
    profile.religiousInfo.religious_level,
    profile.personalInfo.education_level
  ].join(' ')

  // Mock embedding - in production use OpenAI embeddings API
  const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5)
  
  return mockEmbedding
}

Deno.serve(withMonitoring('profile-create', async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const monitoringContext = initializeMonitoring('profile-create', req)

  try {
    // Authenticate request with comprehensive JWT validation
    const auth = await authenticateRequest(req)
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ 
          error: auth.error,
          error_code: auth.errorCode,
          security_notice: 'Authentication failed - all attempts are logged'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId: clerkUserId, sessionId, supabaseClient } = auth
    
    // Update monitoring context with user info
    monitoringContext.userId = clerkUserId
    monitoringContext.sessionId = sessionId
    
    // Monitor security events in background
    monitorSecurityEvents(supabaseClient).catch(err => 
      console.error('Security monitoring error:', err)
    )

    const profileData: CreateProfileRequest = await req.json()

    if (!profileData.userId || profileData.userId !== clerkUserId) {
      return new Response(
        JSON.stringify({ 
          error: 'User ID mismatch - cannot create profile for different user',
          security_notice: 'Potential user impersonation attempt logged'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabaseClient
      .from('users')
      .select('id, clerk_id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !existingUser) {
      return new Response(
        JSON.stringify({ error: 'User not found. Please ensure user is synced first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('user_id', existingUser.id)
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile already exists. Use update endpoint instead.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate profile data
    const validation = validateProfileData(profileData)

    if (!validation.valid && validation.completion_percentage < 60) {
      return new Response(
        JSON.stringify({
          error: 'Profile validation failed',
          validation_errors: validation.errors,
          missing_fields: validation.missing_fields,
          completion_percentage: validation.completion_percentage,
          minimum_required: 60
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate profile embedding
    const bioEmbedding = await generateProfileEmbedding(profileData)

    // Create profile
    const profileInsertData = {
      user_id: existingUser.id,
      age: profileData.basicInfo.age,
      gender: profileData.basicInfo.gender,
      location_city: profileData.basicInfo.location_city,
      location_country: profileData.basicInfo.location_country,
      bio: profileData.basicInfo.bio,
      bio_embedding: bioEmbedding,
      religious_level: profileData.religiousInfo.religious_level,
      prayer_frequency: profileData.religiousInfo.prayer_frequency,
      hijab_preference: profileData.religiousInfo.hijab_preference,
      beard_preference: profileData.religiousInfo.beard_preference,
      education_level: profileData.personalInfo.education_level,
      occupation: profileData.personalInfo.occupation,
      interests: profileData.personalInfo.interests,
      languages: profileData.personalInfo.languages,
      seeking_marriage_timeline: profileData.personalInfo.seeking_marriage_timeline,
      guardian_enabled: profileData.familyInfo.guardian_enabled,
      guardian_email: profileData.familyInfo.guardian_email,
      family_values: profileData.familyInfo.family_values,
      children_preference: profileData.familyInfo.children_preference,
      age_range_preference: profileData.preferences.age_range,
      location_radius_preference: profileData.preferences.location_radius_km,
      education_preference: profileData.preferences.education_preference,
      religious_level_preference: profileData.preferences.religious_level_preference,
      profile_completion_percentage: validation.completion_percentage,
      profile_status: validation.completion_percentage >= 80 ? 'active' : 'incomplete',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newProfile, error: insertError } = await supabaseClient
      .from('user_profiles')
      .insert(profileInsertData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Profile creation error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user's profile status
    await supabaseClient
      .from('users')
      .update({ 
        profile_status: validation.completion_percentage >= 80 ? 'complete' : 'incomplete',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id)

    // Send guardian invitation if enabled
    if (profileData.familyInfo.guardian_enabled && profileData.familyInfo.guardian_email) {
      // TODO: Implement guardian invitation email
      console.log('Guardian invitation needed for:', profileData.familyInfo.guardian_email)
    }

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id: existingUser.id,
        event_type: 'profile_created',
        event_data: {
          completion_percentage: validation.completion_percentage,
          guardian_enabled: profileData.familyInfo.guardian_enabled,
          profile_status: validation.completion_percentage >= 80 ? 'active' : 'incomplete'
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        profile: newProfile,
        validation: {
          completion_percentage: validation.completion_percentage,
          missing_fields: validation.missing_fields,
          status: validation.completion_percentage >= 80 ? 'active' : 'incomplete'
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Profile creation error:', error)
    await recordError(monitoringContext, error, undefined, req, 'high')
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}))