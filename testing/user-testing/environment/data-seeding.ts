import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../supabase/types/database'

interface MockConversation {
  participants: string[]
  messages: Array<{
    senderId: string
    content: string
    timestamp: string
    islamicCompliance: 'good' | 'neutral' | 'flagged'
    guardianApproved: boolean
  }>
  scenario: string
  culturalContext: string
}

interface MockMatchData {
  userAId: string
  userBId: string
  compatibilityScore: number
  islamicCompatibility: number
  culturalCompatibility: number
  scenario: string
  expectedOutcome: 'mutual_interest' | 'polite_decline' | 'guardian_concern'
}

export class TestDataSeeder {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
  }

  /**
   * Seed comprehensive test data for user testing
   */
  async seedTestData(): Promise<void> {
    console.log('🌱 Seeding test data for FADDL Match user testing...')

    try {
      // 1. Create mock conversations with Islamic compliance scenarios
      await this.seedMockConversations()

      // 2. Create realistic match scenarios
      await this.seedMatchScenarios()

      // 3. Create guardian interaction examples
      await this.seedGuardianInteractions()

      // 4. Create prayer time and Islamic calendar events
      await this.seedIslamicCalendarData()

      // 5. Create content moderation test cases
      await this.seedContentModerationCases()

      // 6. Create cultural sensitivity test scenarios
      await this.seedCulturalScenarios()

      console.log('✅ Test data seeding completed successfully')

    } catch (error) {
      console.error('❌ Failed to seed test data:', error)
      throw error
    }
  }

  /**
   * Create mock conversations with various Islamic compliance scenarios
   */
  private async seedMockConversations(): Promise<void> {
    console.log('💬 Seeding mock conversations...')

    const mockConversations: MockConversation[] = [
      {
        participants: ['test_male_1', 'test_female_1'],
        scenario: 'traditional_islamic_courtship',
        culturalContext: 'malay_muslim_traditional',
        messages: [
          {
            senderId: 'test_male_1',
            content: 'Assalamu alaikum sister. I hope you and your family are in good health. I would like to introduce myself properly with your guardian\'s permission.',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            islamicCompliance: 'good',
            guardianApproved: true
          },
          {
            senderId: 'test_female_1',
            content: 'Wa alaikum salaam brother. Alhamdulillah, we are well. My father has given permission for us to communicate. May I know about your Islamic practice and family background?',
            timestamp: new Date(Date.now() - 82800000).toISOString(),
            islamicCompliance: 'good',
            guardianApproved: true
          },
          {
            senderId: 'test_male_1',
            content: 'Alhamdulillah, I pray five times daily and try to follow the Sunnah. I have completed my Islamic studies and work as a software engineer. My family is originally from Johor.',
            timestamp: new Date(Date.now() - 79200000).toISOString(),
            islamicCompliance: 'good',
            guardianApproved: true
          },
          {
            senderId: 'test_female_1',
            content: 'MashaAllah, may Allah continue to strengthen your iman. I teach at an Islamic school and we share similar values. Perhaps our families could meet for a proper introduction?',
            timestamp: new Date(Date.now() - 75600000).toISOString(),
            islamicCompliance: 'good',
            guardianApproved: true
          }
        ]
      },
      {
        participants: ['test_male_2', 'test_female_3'],
        scenario: 'modern_muslim_approach',
        culturalContext: 'indian_muslim_moderate',
        messages: [
          {
            senderId: 'test_male_2',
            content: 'Hi! I noticed we have similar interests and values. I\'d like to get to know you better while maintaining Islamic guidelines.',
            timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
            islamicCompliance: 'neutral',
            guardianApproved: true
          },
          {
            senderId: 'test_female_3',
            content: 'Hello! Yes, I believe it\'s important to balance modern life with our Islamic values. What aspects of Islam are most important to you in a marriage?',
            timestamp: new Date(Date.now() - 39600000).toISOString(),
            islamicCompliance: 'good',
            guardianApproved: true
          },
          {
            senderId: 'test_male_2',
            content: 'I think mutual respect, shared Islamic goals, and supporting each other\'s spiritual growth are key. How do you envision balancing career and family life?',
            timestamp: new Date(Date.now() - 36000000).toISOString(),
            islamicCompliance: 'good',
            guardianApproved: true
          }
        ]
      },
      {
        participants: ['test_male_3', 'test_female_2'],
        scenario: 'guardian_oversight_needed',
        culturalContext: 'cross_cultural_with_children',
        messages: [
          {
            senderId: 'test_male_3',
            content: 'Peace be with you. I read your profile and feel we might be compatible. I have a young daughter and see you have children too.',
            timestamp: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
            islamicCompliance: 'good',
            guardianApproved: false // Pending guardian review
          },
          {
            senderId: 'test_female_2',
            content: 'Wa alaykum salaam. Yes, blending families is a big responsibility. My mother would like to understand your approach to raising children with Islamic values.',
            timestamp: new Date(Date.now() - 18000000).toISOString(),
            islamicCompliance: 'good',
            guardianApproved: false // Pending review
          }
        ]
      }
    ]

    // Store mock conversations in analytics events for testing
    for (const conversation of mockConversations) {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'mock_conversation_seeded',
          properties: {
            conversation,
            seedingPurpose: 'user_testing',
            timestamp: new Date().toISOString()
          }
        })
    }

    console.log(`✅ Seeded ${mockConversations.length} mock conversations`)
  }

  /**
   * Create realistic match scenarios for testing
   */
  private async seedMatchScenarios(): Promise<void> {
    console.log('💝 Seeding match scenarios...')

    const matchScenarios: MockMatchData[] = [
      {
        userAId: 'test_male_1',
        userBId: 'test_female_1',
        compatibilityScore: 87,
        islamicCompatibility: 95,
        culturalCompatibility: 90,
        scenario: 'high_compatibility_traditional',
        expectedOutcome: 'mutual_interest'
      },
      {
        userAId: 'test_male_2',
        userBId: 'test_female_3',
        compatibilityScore: 72,
        islamicCompatibility: 78,
        culturalCompatibility: 65,
        scenario: 'moderate_compatibility_modern',
        expectedOutcome: 'mutual_interest'
      },
      {
        userAId: 'test_male_3',
        userBId: 'test_female_2',
        compatibilityScore: 68,
        islamicCompatibility: 85,
        culturalCompatibility: 55,
        scenario: 'cross_cultural_with_children',
        expectedOutcome: 'guardian_concern'
      },
      {
        userAId: 'test_male_1',
        userBId: 'test_female_3',
        compatibilityScore: 58,
        islamicCompatibility: 70,
        culturalCompatibility: 45,
        scenario: 'practice_level_mismatch',
        expectedOutcome: 'polite_decline'
      }
    ]

    for (const match of matchScenarios) {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'mock_match_seeded',
          properties: {
            matchData: match,
            seedingPurpose: 'user_testing',
            timestamp: new Date().toISOString()
          }
        })
    }

    console.log(`✅ Seeded ${matchScenarios.length} match scenarios`)
  }

  /**
   * Create guardian interaction examples
   */
  private async seedGuardianInteractions(): Promise<void> {
    console.log('👨‍👩‍👧‍👦 Seeding guardian interactions...')

    const guardianInteractions = [
      {
        guardianId: 'guardian_father_1',
        wardId: 'test_female_1',
        interactionType: 'profile_approval',
        decision: 'approved',
        notes: 'Profile shows good Islamic values and education. Approved for matching.',
        culturalContext: 'traditional_father_wali',
        timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        guardianId: 'guardian_mother_1',
        wardId: 'test_female_2',
        interactionType: 'match_review',
        decision: 'needs_discussion',
        notes: 'Potential match has children. Need to discuss blended family considerations.',
        culturalContext: 'protective_mother',
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        guardianId: 'guardian_brother_1',
        wardId: 'test_female_3',
        interactionType: 'message_oversight',
        decision: 'approved',
        notes: 'Conversation maintains proper Islamic etiquette. Communication approved.',
        culturalContext: 'elder_brother_guardian',
        timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
      },
      {
        guardianId: 'guardian_sister_1',
        wardId: 'test_male_2',
        interactionType: 'guidance_provided',
        decision: 'advised',
        notes: 'Suggested focusing on Islamic compatibility and family values in conversations.',
        culturalContext: 'sister_guardian',
        timestamp: new Date(Date.now() - 21600000).toISOString() // 6 hours ago
      }
    ]

    for (const interaction of guardianInteractions) {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'guardian_interaction_seeded',
          properties: {
            interaction,
            seedingPurpose: 'user_testing',
            timestamp: new Date().toISOString()
          }
        })
    }

    console.log(`✅ Seeded ${guardianInteractions.length} guardian interactions`)
  }

  /**
   * Create Islamic calendar and prayer time data
   */
  private async seedIslamicCalendarData(): Promise<void> {
    console.log('🕌 Seeding Islamic calendar data...')

    const islamicEvents = [
      {
        eventType: 'prayer_time_awareness',
        location: 'Singapore',
        prayerTimes: {
          fajr: '05:45',
          dhuhr: '13:15',
          asr: '16:30',
          maghrib: '19:20',
          isha: '20:30'
        },
        date: new Date().toISOString().split('T')[0],
        userPreferences: {
          notificationEnabled: true,
          autoAwayDuringPrayer: true,
          scheduleAroundPrayers: true
        }
      },
      {
        eventType: 'islamic_calendar_event',
        eventName: 'Friday Prayer (Jummah)',
        eventDate: this.getNextFriday().toISOString(),
        impact: 'reduced_activity_1200_1500',
        culturalSignificance: 'high',
        recommendedBehavior: 'respectful_scheduling'
      },
      {
        eventType: 'ramadan_consideration',
        period: 'upcoming_ramadan',
        impact: 'adjusted_communication_patterns',
        guidelines: [
          'increased_spiritual_focus',
          'family_time_priority',
          'respectful_scheduling',
          'spiritual_compatibility_emphasis'
        ]
      }
    ]

    for (const event of islamicEvents) {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'islamic_calendar_seeded',
          properties: {
            calendarEvent: event,
            seedingPurpose: 'user_testing',
            timestamp: new Date().toISOString()
          }
        })
    }

    console.log(`✅ Seeded ${islamicEvents.length} Islamic calendar events`)
  }

  /**
   * Create content moderation test cases
   */
  private async seedContentModerationCases(): Promise<void> {
    console.log('🛡️ Seeding content moderation cases...')

    const moderationCases = [
      {
        messageContent: 'Assalamu alaikum, may Allah bless you and your family.',
        moderationResult: 'approved',
        islamicCompliance: 'excellent',
        flags: [],
        culturalSensitivity: 'high',
        reasoning: 'Appropriate Islamic greeting with blessing'
      },
      {
        messageContent: 'Would you like to meet for coffee sometime this week?',
        moderationResult: 'flagged_for_review',
        islamicCompliance: 'questionable',
        flags: ['unsupervised_meeting_suggestion'],
        culturalSensitivity: 'medium',
        reasoning: 'Meeting suggestion without guardian involvement or proper Islamic guidelines'
      },
      {
        messageContent: 'I pray that Allah guides us to make the right decision for our families.',
        moderationResult: 'approved',
        islamicCompliance: 'excellent',
        flags: [],
        culturalSensitivity: 'high',
        reasoning: 'Spiritual reflection appropriate for Islamic matrimonial context'
      },
      {
        messageContent: 'You look beautiful in your profile picture.',
        moderationResult: 'flagged',
        islamicCompliance: 'poor',
        flags: ['inappropriate_physical_compliment', 'islamic_etiquette_violation'],
        culturalSensitivity: 'low',
        reasoning: 'Physical compliments not appropriate in Islamic courtship context'
      },
      {
        messageContent: 'My family and I would be honored to meet your family for a proper introduction.',
        moderationResult: 'approved',
        islamicCompliance: 'excellent',
        flags: [],
        culturalSensitivity: 'high',
        reasoning: 'Proper Islamic approach involving families'
      }
    ]

    for (const moderationCase of moderationCases) {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'moderation_case_seeded',
          properties: {
            moderationCase,
            seedingPurpose: 'testing_content_moderation',
            timestamp: new Date().toISOString()
          }
        })
    }

    console.log(`✅ Seeded ${moderationCases.length} content moderation cases`)
  }

  /**
   * Create cultural sensitivity test scenarios
   */
  private async seedCulturalScenarios(): Promise<void> {
    console.log('🌍 Seeding cultural sensitivity scenarios...')

    const culturalScenarios = [
      {
        scenarioName: 'malay_chinese_cross_cultural',
        participants: ['malay_muslim', 'chinese_muslim_convert'],
        culturalConsiderations: [
          'language_preferences',
          'family_acceptance_concerns',
          'religious_practice_differences',
          'food_preferences',
          'wedding_traditions'
        ],
        expectedChallenges: [
          'family_acceptance_of_convert',
          'cultural_tradition_blending',
          'language_communication'
        ],
        successFactors: [
          'mutual_respect',
          'islamic_knowledge_sharing',
          'family_involvement',
          'cultural_education'
        ]
      },
      {
        scenarioName: 'indian_malay_traditional_modern',
        participants: ['indian_muslim_traditional', 'malay_muslim_modern'],
        culturalConsiderations: [
          'religious_practice_intensity',
          'gender_role_expectations',
          'family_structure_differences',
          'cultural_celebration_styles'
        ],
        expectedChallenges: [
          'practice_level_alignment',
          'family_expectation_management',
          'cultural_compromise'
        ],
        successFactors: [
          'islamic_foundation_agreement',
          'respectful_communication',
          'family_guidance_acceptance'
        ]
      },
      {
        scenarioName: 'international_local_muslim',
        participants: ['international_muslim', 'local_singapore_muslim'],
        culturalConsiderations: [
          'visa_status_implications',
          'cultural_adaptation_expectations',
          'family_distance_factors',
          'career_priority_differences'
        ],
        expectedChallenges: [
          'long_distance_family_relationships',
          'cultural_integration_requirements',
          'career_relocation_considerations'
        ],
        successFactors: [
          'shared_islamic_values',
          'adaptability_demonstration',
          'long_term_commitment_clarity'
        ]
      }
    ]

    for (const scenario of culturalScenarios) {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'cultural_scenario_seeded',
          properties: {
            culturalScenario: scenario,
            seedingPurpose: 'cultural_sensitivity_testing',
            timestamp: new Date().toISOString()
          }
        })
    }

    console.log(`✅ Seeded ${culturalScenarios.length} cultural scenarios`)
  }

  /**
   * Clean up all seeded test data
   */
  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up seeded test data...')

    try {
      // Delete all seeded data
      const seedEventTypes = [
        'mock_conversation_seeded',
        'mock_match_seeded',
        'guardian_interaction_seeded',
        'islamic_calendar_seeded',
        'moderation_case_seeded',
        'cultural_scenario_seeded'
      ]

      for (const eventType of seedEventTypes) {
        const { error } = await this.supabase
          .from('analytics_events')
          .delete()
          .eq('event_type', eventType)

        if (error) {
          console.warn(`⚠️ Warning cleaning up ${eventType}:`, error.message)
        }
      }

      console.log('✅ Test data cleanup completed')

    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error)
      throw error
    }
  }

  // Helper methods
  private getNextFriday(): Date {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7
    const nextFriday = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000)
    nextFriday.setHours(12, 0, 0, 0) // Set to 12 PM Friday
    return nextFriday
  }
}

// CLI interface
export async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const seeder = new TestDataSeeder(supabaseUrl, supabaseServiceKey)

  try {
    const command = process.argv[2]

    if (command === 'cleanup') {
      await seeder.cleanupTestData()
    } else {
      await seeder.seedTestData()
      console.log('\n✅ Test data seeding completed!')
      console.log('\n📋 Seeded data includes:')
      console.log('• Mock Islamic-compliant conversations')
      console.log('• Realistic match scenarios')
      console.log('• Guardian interaction examples')
      console.log('• Islamic calendar and prayer time data')
      console.log('• Content moderation test cases')
      console.log('• Cultural sensitivity scenarios')
      console.log('\n🧹 To cleanup: npm run seed-data cleanup')
    }

  } catch (error) {
    console.error('❌ Error in data seeding:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}