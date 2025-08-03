import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { authenticateRequest, monitorSecurityEvents } from '../_shared/jwt-validation.ts'
import { withMonitoring, initializeMonitoring, recordError } from '../_shared/monitoring.ts'

interface UpdateProfileRequest {
  userId: string
  updates: {
    basicInfo?: {
      age?: number
      bio?: string
      location_city?: string
      location_country?: string
    }
    religiousInfo?: {
      religious_level?: 'learning' | 'practicing' | 'devout'
      prayer_frequency?: 'rarely' | 'sometimes' | 'regularly' | 'always'
      hijab_preference?: 'required' | 'preferred' | 'optional'
      beard_preference?: 'required' | 'preferred' | 'optional'
    }
    personalInfo?: {
      education_level?: 'high_school' | 'bachelors' | 'masters' | 'doctorate'
      occupation?: string
      interests?: string[]
      languages?: string[]
      seeking_marriage_timeline?: 'immediately' | 'within_year' | 'within_two_years' | 'when_ready'
    }
    familyInfo?: {
      guardian_enabled?: boolean
      guardian_email?: string
      family_values?: string[]
      children_preference?: 'definitely' | 'probably' | 'maybe' | 'no'
    }
    preferences?: {
      age_range?: [number, number]
      location_radius_km?: number
      education_preference?: string[]
      religious_level_preference?: string[]
    }
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
  'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
}

function validateProfileUpdates(
  updates: UpdateProfileRequest['updates'],
  existingProfile: any
): ProfileValidationResult {
  const errors: string[] = []
  const missingFields: string[] = []

  // Validate age if provided
  if (updates.basicInfo?.age !== undefined) {
    if (updates.basicInfo.age < 18 || updates.basicInfo.age > 80) {
      errors.push('Age must be between 18 and 80')
    }
  }

  // Validate bio length if provided
  if (updates.basicInfo?.bio !== undefined) {
    if (updates.basicInfo.bio.trim().length < 50) {
      errors.push('Bio must be at least 50 characters')
    }
  }

  // Validate guardian email if guardian is being enabled
  if (updates.familyInfo?.guardian_enabled === true && !updates.familyInfo.guardian_email?.trim()) {
    errors.push('Guardian email is required when guardian is enabled')
  }

  // Calculate completion percentage (simplified)
  let completedFields = 0
  const totalFields = 15 // Approximate total fields for a complete profile

  // Count existing completed fields (this is a simplified calculation)
  if (existingProfile.age) completedFields++
  if (existingProfile.bio) completedFields++
  if (existingProfile.location_city) completedFields++
  if (existingProfile.location_country) completedFields++
  if (existingProfile.religious_level) completedFields++
  if (existingProfile.prayer_frequency) completedFields++
  if (existingProfile.education_level) completedFields++
  if (existingProfile.occupation) completedFields++
  if (existingProfile.interests?.length) completedFields++
  if (existingProfile.languages?.length) completedFields++
  if (existingProfile.seeking_marriage_timeline) completedFields++
  if (existingProfile.family_values?.length) completedFields++
  if (existingProfile.children_preference) completedFields++
  if (existingProfile.age_range_preference?.length === 2) completedFields++
  if (typeof existingProfile.guardian_enabled === 'boolean') completedFields++

  const completionPercentage = Math.round((completedFields / totalFields) * 100)

  return {
    valid: errors.length === 0,
    errors,
    completion_percentage: completionPercentage,
    missing_fields: missingFields
  }
}

async function generateProfileEmbedding(profileData: any): Promise<number[]> {
  // In production, this would call OpenAI to generate embeddings
  // For now, return a mock embedding based on profile data
  const profileText = [
    profileData.bio,
    profileData.interests?.join(' '),
    profileData.family_values?.join(' '),
    profileData.religious_level,
    profileData.education_level
  ].filter(Boolean).join(' ')

  // Mock embedding - in production use OpenAI embeddings API
  const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5)
  
  return mockEmbedding
}

Deno.serve(withMonitoring('profile-update', async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (!['PUT', 'PATCH'].includes(req.method)) {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const monitoringContext = initializeMonitoring('profile-update', req)

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

    const updateData: UpdateProfileRequest = await req.json()

    if (!updateData.userId || updateData.userId !== clerkUserId) {
      return new Response(
        JSON.stringify({ 
          error: 'User ID mismatch - cannot update profile for different user',
          security_notice: 'Potential user impersonation attempt logged'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing user and profile
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

    // Get existing profile
    const { data: existingProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', existingUser.id)
      .single()

    if (profileError || !existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found. Please create profile first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate updates
    const validation = validateProfileUpdates(updateData.updates, existingProfile)

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Profile validation failed',
          validation_errors: validation.errors,
          completion_percentage: validation.completion_percentage
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build update object
    const profileUpdates: any = {
      updated_at: new Date().toISOString()
    }

    // Apply basic info updates
    if (updateData.updates.basicInfo) {
      if (updateData.updates.basicInfo.age !== undefined) {
        profileUpdates.age = updateData.updates.basicInfo.age
      }
      if (updateData.updates.basicInfo.bio !== undefined) {
        profileUpdates.bio = updateData.updates.basicInfo.bio
        // Regenerate embedding if bio changed
        const mergedProfile = { ...existingProfile, ...profileUpdates }
        profileUpdates.bio_embedding = await generateProfileEmbedding(mergedProfile)
      }
      if (updateData.updates.basicInfo.location_city !== undefined) {
        profileUpdates.location_city = updateData.updates.basicInfo.location_city
      }
      if (updateData.updates.basicInfo.location_country !== undefined) {
        profileUpdates.location_country = updateData.updates.basicInfo.location_country
      }
    }

    // Apply religious info updates
    if (updateData.updates.religiousInfo) {
      if (updateData.updates.religiousInfo.religious_level !== undefined) {
        profileUpdates.religious_level = updateData.updates.religiousInfo.religious_level
      }
      if (updateData.updates.religiousInfo.prayer_frequency !== undefined) {
        profileUpdates.prayer_frequency = updateData.updates.religiousInfo.prayer_frequency
      }
      if (updateData.updates.religiousInfo.hijab_preference !== undefined) {
        profileUpdates.hijab_preference = updateData.updates.religiousInfo.hijab_preference
      }
      if (updateData.updates.religiousInfo.beard_preference !== undefined) {
        profileUpdates.beard_preference = updateData.updates.religiousInfo.beard_preference
      }
    }

    // Apply personal info updates
    if (updateData.updates.personalInfo) {
      if (updateData.updates.personalInfo.education_level !== undefined) {
        profileUpdates.education_level = updateData.updates.personalInfo.education_level
      }
      if (updateData.updates.personalInfo.occupation !== undefined) {
        profileUpdates.occupation = updateData.updates.personalInfo.occupation
      }
      if (updateData.updates.personalInfo.interests !== undefined) {
        profileUpdates.interests = updateData.updates.personalInfo.interests
      }
      if (updateData.updates.personalInfo.languages !== undefined) {
        profileUpdates.languages = updateData.updates.personalInfo.languages
      }
      if (updateData.updates.personalInfo.seeking_marriage_timeline !== undefined) {
        profileUpdates.seeking_marriage_timeline = updateData.updates.personalInfo.seeking_marriage_timeline
      }
    }

    // Apply family info updates
    if (updateData.updates.familyInfo) {
      if (updateData.updates.familyInfo.guardian_enabled !== undefined) {
        profileUpdates.guardian_enabled = updateData.updates.familyInfo.guardian_enabled
      }
      if (updateData.updates.familyInfo.guardian_email !== undefined) {
        profileUpdates.guardian_email = updateData.updates.familyInfo.guardian_email
      }
      if (updateData.updates.familyInfo.family_values !== undefined) {
        profileUpdates.family_values = updateData.updates.familyInfo.family_values
      }
      if (updateData.updates.familyInfo.children_preference !== undefined) {
        profileUpdates.children_preference = updateData.updates.familyInfo.children_preference
      }
    }

    // Apply preferences updates
    if (updateData.updates.preferences) {
      if (updateData.updates.preferences.age_range !== undefined) {
        profileUpdates.age_range_preference = updateData.updates.preferences.age_range
      }
      if (updateData.updates.preferences.location_radius_km !== undefined) {
        profileUpdates.location_radius_preference = updateData.updates.preferences.location_radius_km
      }
      if (updateData.updates.preferences.education_preference !== undefined) {
        profileUpdates.education_preference = updateData.updates.preferences.education_preference
      }
      if (updateData.updates.preferences.religious_level_preference !== undefined) {
        profileUpdates.religious_level_preference = updateData.updates.preferences.religious_level_preference
      }
    }

    // Recalculate completion percentage
    const mergedProfile = { ...existingProfile, ...profileUpdates }
    const newValidation = validateProfileUpdates({}, mergedProfile)
    profileUpdates.profile_completion_percentage = newValidation.completion_percentage
    profileUpdates.profile_status = newValidation.completion_percentage >= 80 ? 'active' : 'incomplete'

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabaseClient
      .from('user_profiles')
      .update(profileUpdates)
      .eq('user_id', existingUser.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user's profile status
    await supabaseClient
      .from('users')
      .update({ 
        profile_status: profileUpdates.profile_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id)

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id: existingUser.id,
        event_type: 'profile_updated',
        event_data: {
          updated_fields: Object.keys(profileUpdates).filter(key => key !== 'updated_at'),
          completion_percentage: profileUpdates.profile_completion_percentage,
          session_id: sessionId
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        profile: updatedProfile,
        validation: {
          completion_percentage: profileUpdates.profile_completion_percentage,
          status: profileUpdates.profile_status
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Profile update error:', error)
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