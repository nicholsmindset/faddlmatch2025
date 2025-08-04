import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

// Mock matches database - in production, this would be Supabase
const MOCK_MATCHES = new Map()
const MOCK_LIKES = new Map()

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'

    // Get user's likes and matches
    const userLikes = MOCK_LIKES.get(userId) || []
    const userMatches = MOCK_MATCHES.get(userId) || []

    // Fetch profiles from profiles endpoint
    const profilesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profiles`, {
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    if (!profilesResponse.ok) {
      throw new Error('Failed to fetch profiles')
    }

    const { profiles } = await profilesResponse.json()

    let matches = []

    switch (type) {
      case 'daily':
        // All available profiles that user hasn't liked yet
        matches = profiles.filter(profile => !userLikes.includes(profile.id))
        break
      case 'mutual':
        // Profiles where both parties liked each other
        matches = profiles.filter(profile => {
          const theyLikedMe = MOCK_LIKES.get(profile.id)?.includes(userId)
          const iLikedThem = userLikes.includes(profile.id)
          return theyLikedMe && iLikedThem
        })
        break
      case 'recent':
        matches = profiles.filter(profile => 
          Date.now() - new Date(profile.last_active).getTime() < 24 * 60 * 60 * 1000
        )
        break
      case 'nearby':
        matches = profiles.filter(profile => profile.location.includes('Singapore'))
        break
      default:
        matches = profiles
    }

    return NextResponse.json({
      matches,
      type,
      total: matches.length
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      // Add to user's likes
      const userLikes = MOCK_LIKES.get(userId) || []
      if (!userLikes.includes(targetUserId)) {
        userLikes.push(targetUserId)
        MOCK_LIKES.set(userId, userLikes)
      }

      // Check if it's a mutual match
      const targetUserLikes = MOCK_LIKES.get(targetUserId) || []
      const isMutualMatch = targetUserLikes.includes(userId)

      if (isMutualMatch) {
        // Create mutual match
        const userMatches = MOCK_MATCHES.get(userId) || []
        const targetMatches = MOCK_MATCHES.get(targetUserId) || []
        
        if (!userMatches.includes(targetUserId)) {
          userMatches.push(targetUserId)
          MOCK_MATCHES.set(userId, userMatches)
        }
        
        if (!targetMatches.includes(userId)) {
          targetMatches.push(userId)
          MOCK_MATCHES.set(targetUserId, targetMatches)
        }

        return NextResponse.json({
          message: 'It\'s a match! 🎉',
          isMutualMatch: true,
          matchId: `${userId}_${targetUserId}`
        })
      }

      return NextResponse.json({
        message: 'Interest expressed successfully',
        isMutualMatch: false
      })
    }

    if (action === 'pass') {
      // In production, you'd record this to avoid showing again
      return NextResponse.json({
        message: 'Profile passed'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing match action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}