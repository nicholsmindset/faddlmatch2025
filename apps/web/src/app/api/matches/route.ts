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
    const type = searchParams.get('type') || 'daily'

    // First, get the current user's profile to know their gender
    const { data: currentUserProfile, error: userError } = await supabase
      .from('profiles')
      .select('gender, location')
      .eq('user_id', userId)
      .single()

    if (userError || !currentUserProfile) {
      console.error('Error fetching user profile:', userError)
      // If user has no profile, return empty matches
      return NextResponse.json({
        matches: [],
        type,
        total: 0,
        message: 'Please complete your profile first'
      })
    }

    // Get opposite gender profiles
    const oppositeGender = currentUserProfile.gender === 'male' ? 'female' : 'male'

    // Base query for active profiles of opposite gender
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('gender', oppositeGender)
      .eq('profile_active', true)
      .neq('user_id', userId)

    // Apply filters based on type
    switch (type) {
      case 'daily':
        // Get limited daily matches for free users
        query = query.limit(10)
        break
      case 'mutual':
        // Get mutual matches - need to join with matches table
        const { data: mutualMatches } = await supabase
          .from('matches')
          .select('matched_user_id')
          .eq('user_id', userId)
          .eq('mutual_match', true)

        if (mutualMatches && mutualMatches.length > 0) {
          const mutualUserIds = mutualMatches.map(m => m.matched_user_id)
          query = query.in('user_id', mutualUserIds)
        } else {
          return NextResponse.json({ matches: [], type, total: 0 })
        }
        break
      case 'recent':
        // Get recently active profiles (within 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('last_active_at', sevenDaysAgo)
        break
      case 'nearby':
        // Get profiles in same location
        query = query.eq('location', currentUserProfile.location)
        break
    }

    // Execute query
    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    // Transform profiles for frontend
    const matches = (profiles || []).map(profile => ({
      id: profile.user_id,
      first_name: profile.full_name?.split(' ')[0] || 'User',
      last_name: profile.full_name?.split(' ')[1]?.[0] + '.' || '',
      age: profile.age,
      location: profile.location,
      profession: profile.profession,
      photos: profile.profile_photos || [],
      bio: profile.about_me || 'No bio available',
      compatibility: calculateCompatibilityScore(currentUserProfile, profile),
      last_active: profile.last_active_at,
      verified: profile.identity_verified,
      premium_member: profile.subscription_tier !== 'free',
      religious_level: profile.religious_practice_level,
      education_level: profile.education_level
    }))

    return NextResponse.json({
      matches,
      type,
      total: matches.length
    })

  } catch (error) {
    console.error('Error in matches API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches', details: error.message },
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
    const { action, targetUserId } = body

    if (action === 'like') {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .eq('matched_user_id', targetUserId)
        .single()

      if (existingMatch) {
        // Update existing match
        await supabase
          .from('matches')
          .update({ 
            user_interested: true,
            status: 'accepted' 
          })
          .eq('id', existingMatch.id)
      } else {
        // Create new match record
        await supabase
          .from('matches')
          .insert({
            user_id: userId,
            matched_user_id: targetUserId,
            user_interested: true,
            status: 'pending'
          })
      }

      // Check if the other person already liked us (mutual match)
      const { data: reverseMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('matched_user_id', userId)
        .eq('user_interested', true)
        .single()

      if (reverseMatch) {
        // It's a mutual match! Update both records
        await supabase
          .from('matches')
          .update({ mutual_match: true })
          .or(`id.eq.${existingMatch?.id || ''},id.eq.${reverseMatch.id}`)

        return NextResponse.json({
          message: 'It\'s a match! 🎉',
          isMutualMatch: true,
          matchId: existingMatch?.id || reverseMatch.id
        })
      }

      return NextResponse.json({
        message: 'Interest expressed successfully',
        isMutualMatch: false
      })
    }

    if (action === 'pass') {
      // Record the pass action
      await supabase
        .from('matches')
        .upsert({
          user_id: userId,
          matched_user_id: targetUserId,
          user_interested: false,
          status: 'rejected'
        })

      return NextResponse.json({
        message: 'Profile passed'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error processing match action:', error)
    return NextResponse.json(
      { error: 'Failed to process action', details: error.message },
      { status: 500 }
    )
  }
}
