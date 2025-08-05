import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to calculate compatibility score
function calculateCompatibilityScore(user1: any, user2: any): { score: number, strengths: string[] } {
  let score = 60 // Base score
  const strengths: string[] = []

  // Age compatibility (±5 years gets bonus)
  const ageDiff = Math.abs(user1.age - user2.age)
  if (ageDiff <= 5) {
    score += 15
    strengths.push('Compatible age range')
  }

  // Religious practice level
  if (user1.religious_practice_level === user2.religious_practice_level) {
    score += 20
    strengths.push('Same religious practice level')
  }

  // Education level compatibility
  if (user1.education_level === user2.education_level) {
    score += 10
    strengths.push('Similar education background')
  }

  // Location proximity
  if (user1.location === user2.location) {
    score += 10
    strengths.push('Same location')
  }

  // Family situation compatibility
  if (user1.family_situation === user2.family_situation) {
    score += 5
    strengths.push('Compatible family situation')
  }

  return { score: Math.min(score, 100), strengths }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') || 'all'
    const profileId = searchParams.get('profileId')

    // If requesting a specific profile
    if (profileId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profileId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      return NextResponse.json({ profile })
    }

    // Get current user's profile for compatibility calculation
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!currentUserProfile) {
      return NextResponse.json({
        profiles: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        message: 'Please complete your profile first'
      })
    }

    // Get opposite gender profiles
    const oppositeGender = currentUserProfile.gender === 'male' ? 'female' : 'male'
    
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('gender', oppositeGender)
      .eq('profile_active', true)
      .neq('user_id', userId)

    // Apply filters
    switch (filter) {
      case 'recent':
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('last_active_at', dayAgo)
        break
      case 'nearby':
        query = query.eq('location', currentUserProfile.location)
        break
      case 'premium':
        query = query.neq('subscription_tier', 'free')
        break
      case 'practicing':
        query = query.in('religious_practice_level', ['practicing', 'devout'])
        break
    }

    // Execute query with pagination
    const { data: profiles, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('last_active_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles:', error)
      throw error
    }

    // Transform profiles and calculate compatibility
    const transformedProfiles = (profiles || []).map(profile => {
      const compatibility = calculateCompatibilityScore(currentUserProfile, profile)
      
      return {
        id: profile.user_id,
        first_name: profile.full_name?.split(' ')[0] || 'User',
        last_name: profile.full_name?.split(' ')[1]?.[0] + '.' || '',
        age: profile.age,
        location: profile.location,
        profession: profile.profession,
        photos: profile.profile_photos || [],
        bio: profile.about_me || 'No bio available',
        compatibility,
        last_active: profile.last_active_at,
        verified: profile.identity_verified,
        premium_member: profile.subscription_tier !== 'free',
        religious_level: profile.religious_practice_level,
        education_level: profile.education_level,
        family_situation: profile.family_situation,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    })

    return NextResponse.json({
      profiles: transformedProfiles,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit
    })

  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      full_name,
      age,
      location,
      profession,
      about_me,
      profile_photos,
      gender,
      religious_practice_level,
      education_level,
      family_situation,
      looking_for,
      interests
    } = body

    // Validate required fields
    if (!full_name || !age || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, age, gender' },
        { status: 400 }
      )
    }

    // Create or update profile in Supabase
    const profileData = {
      user_id: userId,
      full_name,
      age: parseInt(age),
      location: location || 'Singapore',
      profession: profession || '',
      about_me: about_me || '',
      profile_photos: profile_photos || [],
      gender,
      religious_practice_level: religious_practice_level || 'practicing',
      education_level: education_level || 'bachelors',
      family_situation: family_situation || 'single',
      looking_for: looking_for || 'marriage',
      interests: interests || [],
      profile_active: true,
      profile_completion: 100,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating profile:', error)
      throw error
    }

    return NextResponse.json({ 
      message: 'Profile saved successfully',
      profile
    })

  } catch (error) {
    console.error('Error in profile POST:', error)
    return NextResponse.json(
      { error: 'Failed to save profile', details: error.message },
      { status: 500 }
    )
  }
}

// GET current user's own profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    )
  }
}