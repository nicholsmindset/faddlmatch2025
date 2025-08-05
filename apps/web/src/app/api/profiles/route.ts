import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

// Mock database - in production, this would be Supabase
const MOCK_PROFILES = [
  {
    id: 'user-1',
    first_name: 'Ahmad',
    last_name: 'H.',
    age: 28,
    location: 'Central Singapore',
    profession: 'Software Engineer',
    photos: [],
    bio: 'Practicing Muslim software engineer seeking a righteous partner for marriage. I enjoy technology, reading Quran, and spending time with family.',
    compatibility: { score: 90, strengths: ['Same religious level', 'Similar profession', 'Compatible age'] },
    last_active: new Date().toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'masters',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-2',
    first_name: 'Aisha',
    last_name: 'R.',
    age: 26,
    location: 'Central Singapore',
    profession: 'Teacher',
    photos: [],
    bio: 'Practicing Muslimah seeking a kind and practicing husband for marriage. Love teaching and helping children learn.',
    compatibility: { score: 92, strengths: ['Same religious level', 'Similar interests', 'Compatible age'] },
    last_active: new Date().toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'bachelors',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-3',
    first_name: 'Fatima',
    last_name: 'A.',
    age: 24,
    location: 'East Singapore',
    profession: 'Doctor',
    photos: [],
    bio: 'Medical doctor who believes in the importance of family and faith. Looking for a partner who shares Islamic values.',
    compatibility: { score: 88, strengths: ['Education compatibility', 'Religious alignment', 'Family values'] },
    last_active: new Date(Date.now() - 3600000).toISOString(),
    verified: true,
    premium_member: false,
    religious_level: 'devout',
    education_level: 'masters',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-4',
    first_name: 'Zara',
    last_name: 'M.',
    age: 28,
    location: 'West Singapore',
    profession: 'Engineer',
    photos: [],
    bio: 'Software engineer with a passion for technology and Islamic studies. Seeking a life partner for both Dunya and Akhirah.',
    compatibility: { score: 85, strengths: ['Career compatibility', 'Age range', 'Shared interests'] },
    last_active: new Date(Date.now() - 7200000).toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'masters',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-5',
    first_name: 'Mariam',
    last_name: 'H.',
    age: 30,
    location: 'North Singapore',
    profession: 'Pharmacist',
    photos: [],
    bio: 'Pharmacist who values Islamic principles and family life. Looking for a practicing Muslim for a blessed marriage.',
    compatibility: { score: 79, strengths: ['Religious compatibility', 'Professional background', 'Age compatibility'] },
    last_active: new Date(Date.now() - 14400000).toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'bachelors',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

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

    // Filter out current user's profile from matches
    let profiles = MOCK_PROFILES.filter(profile => profile.id !== userId)

    // Apply filters
    switch (filter) {
      case 'recent':
        profiles = profiles.filter(p => 
          Date.now() - new Date(p.last_active).getTime() < 24 * 60 * 60 * 1000
        )
        break
      case 'nearby':
        profiles = profiles.filter(p => p.location.includes('Singapore'))
        break
      case 'premium':
        profiles = profiles.filter(p => p.premium_member)
        break
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProfiles = profiles.slice(startIndex, endIndex)

    return NextResponse.json({
      profiles: paginatedProfiles,
      total: profiles.length,
      page,
      limit,
      hasMore: endIndex < profiles.length
    })
  } catch (error) {
    console.error('Error fetching profiles:', error)
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
    const { first_name, last_name, age, location, profession, bio, photos } = body

    // In production, this would create/update profile in Supabase
    const newProfile = {
      id: userId,
      first_name,
      last_name,
      age,
      location,
      profession,
      photos: photos || [],
      bio,
      compatibility: { score: 0, strengths: [] },
      last_active: new Date().toISOString(),
      verified: false,
      premium_member: false,
      religious_level: 'practicing',
      education_level: 'bachelors',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add to mock database
    MOCK_PROFILES.push(newProfile)

    return NextResponse.json({ 
      message: 'Profile created successfully',
      profile: newProfile 
    })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}