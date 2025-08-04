import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

// Comprehensive simulation data for user profiles
const SIMULATION_USERS = [
  {
    id: 'sim-user-1',
    first_name: 'Ahmad',
    last_name: 'Hassan',
    age: 28,
    location: 'Singapore Central',
    profession: 'Software Engineer',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' },
      { url: '/api/placeholder/300/400', visibility: 'guardian_only' }
    ],
    bio: 'Practicing Muslim software engineer seeking a righteous wife for marriage. I enjoy technology, reading Quran, and spending time with family. Looking for someone who shares my values and vision of building a blessed Islamic household.',
    compatibility: { score: 90, strengths: ['Same religious level', 'Similar profession', 'Compatible age'] },
    last_active: new Date().toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'masters',
    interests: ['Technology', 'Islamic Studies', 'Reading', 'Family Time'],
    family_values: 'Traditional Islamic family structure',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Yes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-2',
    first_name: 'Aisha',
    last_name: 'Rahman',
    age: 26,
    location: 'Singapore Central',
    profession: 'Primary School Teacher',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' },
      { url: '/api/placeholder/300/400', visibility: 'public' }
    ],
    bio: 'Practicing Muslimah seeking a kind and practicing husband for marriage. I love teaching and helping children learn. Family is very important to me, and I hope to raise righteous Muslim children InshaAllah.',
    compatibility: { score: 92, strengths: ['Same religious level', 'Similar interests', 'Compatible age'] },
    last_active: new Date().toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'bachelors',
    interests: ['Teaching', 'Children', 'Islamic Studies', 'Cooking'],
    family_values: 'Want to be stay-at-home mother',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Always wear hijab',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-3',
    first_name: 'Fatima',
    last_name: 'Al-Zahra',
    age: 24,
    location: 'Singapore East',
    profession: 'Medical Doctor',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' }
    ],
    bio: 'Medical doctor who believes in the importance of family and faith. Looking for a partner who shares Islamic values and supports my career in serving the community. I want to balance career and family life.',
    compatibility: { score: 88, strengths: ['Education compatibility', 'Religious alignment', 'Family values'] },
    last_active: new Date(Date.now() - 3600000).toISOString(),
    verified: true,
    premium_member: false,
    religious_level: 'devout',
    education_level: 'doctorate',
    interests: ['Medicine', 'Community Service', 'Islamic Studies', 'Volunteering'],
    family_values: 'Career and family balance',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Professional hijab',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-4',
    first_name: 'Zara',
    last_name: 'Malik',
    age: 28,
    location: 'Singapore West',
    profession: 'Software Engineer',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' },
      { url: '/api/placeholder/300/400', visibility: 'guardian_only' }
    ],
    bio: 'Software engineer with a passion for technology and Islamic studies. Seeking a life partner for both Dunya and Akhirah. I enjoy coding, learning about Islam, and spending time in nature.',
    compatibility: { score: 85, strengths: ['Career compatibility', 'Age range', 'Shared interests'] },
    last_active: new Date(Date.now() - 7200000).toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'masters',
    interests: ['Technology', 'Islamic Studies', 'Nature', 'Coding'],
    family_values: 'Modern Islamic family',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Sometimes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-5',
    first_name: 'Mariam',
    last_name: 'Hassan',
    age: 30,
    location: 'Singapore North',
    profession: 'Pharmacist',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' }
    ],
    bio: 'Pharmacist who values Islamic principles and family life. Looking for a practicing Muslim for a blessed marriage. I believe in the importance of mutual respect and shared values in marriage.',
    compatibility: { score: 79, strengths: ['Religious compatibility', 'Professional background', 'Age compatibility'] },
    last_active: new Date(Date.now() - 14400000).toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'bachelors',
    interests: ['Healthcare', 'Family', 'Islamic Studies', 'Cooking'],
    family_values: 'Traditional with modern understanding',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Always wear hijab',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-6',
    first_name: 'Omar',
    last_name: 'Abdullah',
    age: 32,
    location: 'Singapore Central',
    profession: 'Islamic Finance Consultant',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' },
      { url: '/api/placeholder/300/400', visibility: 'public' }
    ],
    bio: 'Islamic finance consultant committed to living according to Islamic principles. Seeking a practicing Muslimah for marriage. I believe in building a strong Islamic household based on mutual respect and love.',
    compatibility: { score: 94, strengths: ['Strong religious alignment', 'Financial stability', 'Mature age'] },
    last_active: new Date(Date.now() - 1800000).toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'devout',
    education_level: 'masters',
    interests: ['Islamic Finance', 'Quran Study', 'Community Work', 'Travel'],
    family_values: 'Traditional Islamic family leadership',
    prayer_frequency: '5 times daily plus sunnah',
    hijab_preference: 'Strongly prefer hijab',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-7',
    first_name: 'Khadija',
    last_name: 'Mohamed',
    age: 25,
    location: 'Singapore East',
    profession: 'Graphic Designer',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' }
    ],
    bio: 'Creative graphic designer who loves art and Islamic calligraphy. Looking for a husband who appreciates creativity and shares Islamic values. I enjoy designing Islamic art and teaching Quran to children.',
    compatibility: { score: 83, strengths: ['Creative compatibility', 'Age range', 'Religious values'] },
    last_active: new Date(Date.now() - 5400000).toISOString(),
    verified: true,
    premium_member: false,
    religious_level: 'practicing',
    education_level: 'bachelors',
    interests: ['Graphic Design', 'Islamic Art', 'Calligraphy', 'Teaching'],
    family_values: 'Creative Islamic household',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Beautiful hijab styles',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sim-user-8',
    first_name: 'Yusuf',
    last_name: 'Ali',
    age: 29,
    location: 'Singapore West',
    profession: 'Civil Engineer',
    photos: [
      { url: '/api/placeholder/400/600', visibility: 'public' },
      { url: '/api/placeholder/300/400', visibility: 'guardian_only' }
    ],
    bio: 'Civil engineer working on sustainable infrastructure projects. Practicing Muslim seeking a wife who shares my vision of serving the community and building a blessed family. I love outdoor activities and community service.',
    compatibility: { score: 87, strengths: ['Professional stability', 'Community service', 'Active lifestyle'] },
    last_active: new Date(Date.now() - 3600000).toISOString(),
    verified: true,
    premium_member: true,
    religious_level: 'practicing',
    education_level: 'masters',
    interests: ['Engineering', 'Sustainability', 'Outdoor Activities', 'Community Service'],
    family_values: 'Service-oriented family',
    prayer_frequency: '5 times daily',
    hijab_preference: 'Supportive of hijab',
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
    const action = searchParams.get('action')

    switch (action) {
      case 'create':
        return createSimulationUsers()
      case 'interact':
        return simulateUserInteractions()
      case 'reset':
        return resetSimulation()
      default:
        return NextResponse.json({ 
          users: SIMULATION_USERS,
          total: SIMULATION_USERS.length,
          message: 'Simulation users data ready'
        })
    }
  } catch (error) {
    console.error('Error in simulation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createSimulationUsers() {
  // Simulate creating user accounts (in production, this would use Clerk API)
  const createdUsers = SIMULATION_USERS.map(user => ({
    ...user,
    status: 'created',
    simulation_id: `sim-${Date.now()}-${user.id}`
  }))

  return NextResponse.json({
    message: 'Simulation users created successfully',
    users: createdUsers,
    total: createdUsers.length
  })
}

async function simulateUserInteractions() {
  // Simulate various user interactions
  const interactions = [
    {
      type: 'profile_view',
      actor: 'sim-user-1',
      target: 'sim-user-2',
      timestamp: new Date().toISOString()
    },
    {
      type: 'like',
      actor: 'sim-user-2',
      target: 'sim-user-1',
      timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    },
    {
      type: 'mutual_match',
      participants: ['sim-user-1', 'sim-user-2'],
      timestamp: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
    },
    {
      type: 'message_sent',
      from: 'sim-user-2',
      to: 'sim-user-1',
      content: 'Assalamu alaikum! Thank you for your interest.',
      timestamp: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
    },
    {
      type: 'like',
      actor: 'sim-user-3',
      target: 'sim-user-1',
      timestamp: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    },
    {
      type: 'profile_view',
      actor: 'sim-user-4',
      target: 'sim-user-1',
      timestamp: new Date(Date.now() - 60000).toISOString() // 1 minute ago
    }
  ]

  return NextResponse.json({
    message: 'User interactions simulated',
    interactions,
    summary: {
      total_interactions: interactions.length,
      matches_created: 1,
      messages_sent: 1,
      likes_given: 2,
      profile_views: 2
    }
  })
}

async function resetSimulation() {
  // Reset all simulation data
  return NextResponse.json({
    message: 'Simulation reset successfully',
    status: 'reset',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'simulate_browsing':
        return simulateBrowsingSession(data)
      case 'simulate_matching':
        return simulateMatchingFlow(data)
      case 'simulate_messaging':
        return simulateMessagingFlow(data)
      case 'simulate_photo_upload':
        return simulatePhotoUpload(data)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in simulation POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function simulateBrowsingSession(data: any) {
  const browsingSesssion = {
    session_id: `browse-${Date.now()}`,
    user_id: data.userId || 'sim-user-1',
    profiles_viewed: SIMULATION_USERS.slice(0, 5).map(user => ({
      profile_id: user.id,
      view_duration: Math.floor(Math.random() * 30000) + 5000, // 5-35 seconds
      interactions: ['scroll', 'photo_view', 'bio_read'],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    })),
    session_duration: 15 * 60 * 1000, // 15 minutes
    likes_given: 2,
    passes_given: 3,
    messages_started: 0
  }

  return NextResponse.json({
    message: 'Browsing session simulated',
    session: browsingSesssion
  })
}

async function simulateMatchingFlow(data: any) {
  const matchingFlow = {
    flow_id: `match-${Date.now()}`,
    user_id: data.userId || 'sim-user-1',
    target_id: data.targetId || 'sim-user-2',
    steps: [
      {
        step: 'profile_view',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        duration: 45000
      },
      {
        step: 'like_sent',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        success: true
      },
      {
        step: 'mutual_like_received',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        match_created: true
      },
      {
        step: 'match_notification',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        viewed: true
      },
      {
        step: 'conversation_started',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        first_message: 'Assalamu alaikum! I\'m excited to get to know you better.'
      }
    ],
    completion_time: 240000, // 4 minutes
    success: true
  }

  return NextResponse.json({
    message: 'Matching flow simulated',
    flow: matchingFlow
  })
}

async function simulateMessagingFlow(data: any) {
  const messagingFlow = {
    conversation_id: `conv-${Date.now()}`,
    participants: [data.userId || 'sim-user-1', data.targetId || 'sim-user-2'],
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        sender_id: data.targetId || 'sim-user-2',
        content: 'Assalamu alaikum! Thank you for your interest. I would love to get to know you better.',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'delivered',
        moderation_status: 'approved'
      },
      {
        id: `msg-${Date.now()}-2`,
        sender_id: data.userId || 'sim-user-1',
        content: 'Wa alaikum assalam! Alhamdulillah, I\'m pleased to connect with you. May Allah guide our conversation.',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        status: 'delivered',
        moderation_status: 'approved'
      },
      {
        id: `msg-${Date.now()}-3`,
        sender_id: data.targetId || 'sim-user-2',
        content: 'Ameen! I appreciate your respectful approach. Could you tell me more about your interests and what you\'re looking for in a marriage partner?',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        status: 'delivered',
        moderation_status: 'approved'
      }
    ],
    guardian_notifications: [
      {
        type: 'conversation_started',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'sent'
      }
    ],
    compliance_checks: {
      inappropriate_content: false,
      privacy_maintained: true,
      islamic_guidelines: true
    }
  }

  return NextResponse.json({
    message: 'Messaging flow simulated',
    conversation: messagingFlow
  })
}

async function simulatePhotoUpload(data: any) {
  const uploadSimulation = {
    upload_id: `upload-${Date.now()}`,
    user_id: data.userId || 'sim-user-1',
    photos: [
      {
        id: `photo-${Date.now()}-1`,
        original_name: 'profile-main.jpg',
        size: 2457600, // ~2.5MB
        type: 'image/jpeg',
        url: `/api/placeholder/user-photos/${data.userId || 'sim-user-1'}-${Date.now()}-1.jpg`,
        visibility: 'public',
        moderation_status: 'approved',
        uploaded_at: new Date().toISOString()
      },
      {
        id: `photo-${Date.now()}-2`,
        original_name: 'profile-family.jpg',
        size: 1834567, // ~1.8MB
        type: 'image/jpeg',
        url: `/api/placeholder/user-photos/${data.userId || 'sim-user-1'}-${Date.now()}-2.jpg`,
        visibility: 'guardian_only',
        moderation_status: 'pending',
        uploaded_at: new Date().toISOString()
      }
    ],
    processing_steps: [
      { step: 'upload', status: 'completed', timestamp: new Date(Date.now() - 3000).toISOString() },
      { step: 'virus_scan', status: 'completed', timestamp: new Date(Date.now() - 2500).toISOString() },
      { step: 'image_validation', status: 'completed', timestamp: new Date(Date.now() - 2000).toISOString() },
      { step: 'content_moderation', status: 'completed', timestamp: new Date(Date.now() - 1500).toISOString() },
      { step: 'resize_optimize', status: 'completed', timestamp: new Date(Date.now() - 1000).toISOString() },
      { step: 'storage_save', status: 'completed', timestamp: new Date(Date.now() - 500).toISOString() }
    ],
    success: true,
    total_processing_time: 3000 // 3 seconds
  }

  return NextResponse.json({
    message: 'Photo upload simulated',
    upload: uploadSimulation
  })
}