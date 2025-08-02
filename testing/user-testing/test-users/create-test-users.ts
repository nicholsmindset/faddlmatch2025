import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../supabase/types/database'
import islamicProfiles from './islamic-profiles.json'
import guardianScenarios from './guardian-scenarios.json'

// Types
type TestUser = Database['public']['Tables']['users']['Insert']
type TestUserProfile = Database['public']['Tables']['user_profiles']['Insert']
type TestGuardian = Database['public']['Tables']['guardians']['Insert']
type TestPartnerPreferences = Database['public']['Tables']['partner_preferences']['Insert']

interface TestUserCreationResult {
  userId: string
  profileId: string
  guardianId?: string
  success: boolean
  errors?: string[]
}

interface TestingEnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  testingMode: boolean
  cleanupOnExit: boolean
}

export class TestUserManager {
  private supabase: ReturnType<typeof createClient<Database>>
  private createdUsers: string[] = []
  private createdProfiles: string[] = []
  private createdGuardians: string[] = []

  constructor(config: TestingEnvironmentConfig) {
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey)
  }

  /**
   * Create comprehensive test user with Islamic profile and guardian
   */
  async createTestUser(profileData: any): Promise<TestUserCreationResult> {
    try {
      // Generate consistent test user ID
      const userId = `test_user_${profileData.id}_${Date.now()}`
      const testEmail = `${profileData.demographics.firstName.toLowerCase()}.${profileData.demographics.lastName.toLowerCase()}.test@faddlmatch.test`
      
      // Create base user
      const user: TestUser = {
        id: userId,
        email: testEmail,
        phone: `+65-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        status: 'active',
        subscription_tier: 'premium', // Give test users premium for full feature access
        last_active_at: new Date().toISOString()
      }

      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .insert(user)
        .select()
        .single()

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      this.createdUsers.push(userId)

      // Create user profile with Islamic characteristics
      const userProfile: TestUserProfile = {
        user_id: userId,
        first_name: profileData.demographics.firstName,
        last_name: profileData.demographics.lastName,
        year_of_birth: profileData.demographics.yearOfBirth,
        gender: profileData.demographics.gender,
        location_zone: profileData.demographics.locationZone,
        marital_status: profileData.demographics.maritalStatus,
        has_children: profileData.familySituation.hasChildren,
        children_count: profileData.familySituation.childrenCount,
        children_ages: profileData.familySituation.childrenAges,
        open_to_more_children: profileData.familySituation.openToMoreChildren,
        prayer_frequency: profileData.islamicPractice.prayerFrequency,
        modest_dress: profileData.islamicPractice.modestDress,
        ethnicity: profileData.demographics.ethnicity,
        languages: profileData.demographics.languages,
        education: this.generateEducation(profileData),
        profession: this.generateProfession(profileData),
        bio: this.generateBio(profileData),
        looking_for: this.generateLookingFor(profileData),
        preferences: {
          islamicPractice: profileData.islamicPractice,
          culturalValues: profileData.preferences.culturalValues,
          familyInvolvement: profileData.preferences.familyInvolvement,
          testingProfile: true,
          testingNotes: profileData.testingNotes
        },
        profile_completed_at: new Date().toISOString()
      }

      const { data: profileData, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert(userProfile)
        .select()
        .single()

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      this.createdProfiles.push(profileData.id)

      // Create partner preferences
      const partnerPreferences: TestPartnerPreferences = {
        user_id: userId,
        min_age: this.calculateMinAge(profileData.demographics.yearOfBirth),
        max_age: this.calculateMaxAge(profileData.demographics.yearOfBirth),
        preferred_locations: ['central', 'north', 'south', 'east', 'west'], // Allow all for testing
        min_prayer_frequency: profileData.preferences.minPrayerFrequency,
        accept_children: profileData.preferences.acceptChildren,
        want_more_children: profileData.familySituation.openToMoreChildren
      }

      await this.supabase
        .from('partner_preferences')
        .insert(partnerPreferences)

      // Create guardian if required
      let guardianId: string | undefined
      if (profileData.guardian) {
        const guardian: TestGuardian = {
          user_id: userId,
          name: profileData.guardian.name,
          relationship: profileData.guardian.relationship,
          email: profileData.guardian.email,
          phone: profileData.guardian.phone,
          approval_required: profileData.guardian.approvalRequired,
          can_view_messages: profileData.guardian.canViewMessages
        }

        const { data: guardianData, error: guardianError } = await this.supabase
          .from('guardians')
          .insert(guardian)
          .select()
          .single()

        if (guardianError) {
          console.warn(`Failed to create guardian: ${guardianError.message}`)
        } else {
          guardianId = guardianData.id
          this.createdGuardians.push(guardianId)
        }
      }

      // Log analytics event for test user creation
      await this.supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_type: 'test_user_created',
          properties: {
            profileType: profileData.id,
            culturalBackground: profileData.demographics.ethnicity,
            guardianRequired: !!profileData.guardian,
            testingPurpose: profileData.testingNotes.purpose
          }
        })

      return {
        userId,
        profileId: profileData.id,
        guardianId,
        success: true
      }

    } catch (error) {
      return {
        userId: '',
        profileId: '',
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Create all test users from profiles configuration
   */
  async createAllTestUsers(): Promise<TestUserCreationResult[]> {
    const results: TestUserCreationResult[] = []
    const profiles = islamicProfiles.testUserProfiles

    console.log('Creating male test users...')
    for (const profile of profiles.maleProfiles) {
      const result = await this.createTestUser(profile)
      results.push(result)
      if (result.success) {
        console.log(`✅ Created male user: ${profile.demographics.firstName} ${profile.demographics.lastName}`)
      } else {
        console.error(`❌ Failed to create male user: ${profile.demographics.firstName}`, result.errors)
      }
    }

    console.log('Creating female test users...')
    for (const profile of profiles.femaleProfiles) {
      const result = await this.createTestUser(profile)
      results.push(result)
      if (result.success) {
        console.log(`✅ Created female user: ${profile.demographics.firstName} ${profile.demographics.lastName}`)
      } else {
        console.error(`❌ Failed to create female user: ${profile.demographics.firstName}`, result.errors)
      }
    }

    return results
  }

  /**
   * Create test matches between users
   */
  async createTestMatches(): Promise<void> {
    const scenarios = islamicProfiles.testingScenarios

    for (const scenarioType of Object.keys(scenarios)) {
      const scenarioList = scenarios[scenarioType as keyof typeof scenarios] as any[]
      
      for (const scenario of scenarioList) {
        await this.createTestMatch(scenario.participants[0], scenario.participants[1], scenario)
      }
    }
  }

  /**
   * Create a test match between two users
   */
  private async createTestMatch(userAId: string, userBId: string, scenario: any): Promise<void> {
    try {
      // Get actual user IDs from test IDs
      const { data: userA } = await this.supabase
        .from('user_profiles')
        .select('user_id')
        .eq('preferences->testingProfile', true)
        .like('preferences->testingNotes->purpose', `%${userAId}%`)
        .single()

      const { data: userB } = await this.supabase
        .from('user_profiles')
        .select('user_id')
        .eq('preferences->testingProfile', true)
        .like('preferences->testingNotes->purpose', `%${userBId}%`)
        .single()

      if (!userA || !userB) {
        console.warn(`Could not find users for match: ${userAId} <-> ${userBId}`)
        return
      }

      // Create match with compatibility score
      const compatibilityScore = this.calculateTestCompatibilityScore(scenario)
      
      await this.supabase.rpc('create_match', {
        p_user_a_id: userA.user_id,
        p_user_b_id: userB.user_id,
        p_compatibility_score: compatibilityScore,
        p_score_breakdown: {
          testScenario: scenario.scenario,
          focusAreas: scenario.focusAreas,
          expectedChallenges: scenario.expectedChallenges
        }
      })

      console.log(`✅ Created test match: ${scenario.scenario}`)
    } catch (error) {
      console.error(`❌ Failed to create test match:`, error)
    }
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up test data...')

    // Delete guardians
    if (this.createdGuardians.length > 0) {
      await this.supabase
        .from('guardians')
        .delete()
        .in('id', this.createdGuardians)
    }

    // Delete users (cascade will handle profiles, matches, etc.)
    if (this.createdUsers.length > 0) {
      await this.supabase
        .from('users')
        .delete()
        .in('id', this.createdUsers)
    }

    console.log('✅ Test data cleanup completed')
  }

  // Helper methods
  private generateEducation(profile: any): string {
    const educationOptions = {
      advanced: ['Bachelor in Islamic Studies', 'Masters in Education', 'PhD in Islamic Law'],
      intermediate: ['Diploma in Business', 'Bachelor of Arts', 'Certificate in IT'],
      basic: ['Secondary Education', 'Vocational Training', 'High School']
    }
    
    const level = profile.islamicPractice.islamicKnowledge as keyof typeof educationOptions
    const options = educationOptions[level] || educationOptions.intermediate
    return options[Math.floor(Math.random() * options.length)]
  }

  private generateProfession(profile: any): string {
    const professions = {
      male: ['Software Engineer', 'Teacher', 'Business Analyst', 'Accountant', 'Doctor', 'Engineer'],
      female: ['Teacher', 'Nurse', 'Marketing Executive', 'HR Manager', 'Graphic Designer', 'Pharmacist']
    }
    
    const gender = profile.demographics.gender as keyof typeof professions
    const options = professions[gender]
    return options[Math.floor(Math.random() * options.length)]
  }

  private generateBio(profile: any): string {
    const islamicLevel = profile.islamicPractice.prayerFrequency
    const culturalValues = profile.preferences.culturalValues
    
    const bioTemplates = {
      traditional: `Seeking a partner who values Islamic principles and family traditions. ${islamicLevel === 'always' ? 'Committed to daily prayers and Islamic lifestyle.' : 'Striving to improve my Islamic practice.'} Looking for someone to build a blessed family together.`,
      moderate: `Balancing modern life with Islamic values. Enjoy spending time with family and community. ${profile.familySituation.hasChildren ? 'My children are my priority, and I hope to find someone who will love them too.' : 'Open to building a beautiful family together.'} Seeking understanding and compatibility.`,
      progressive: `Modern Muslim seeking a partner who shares similar values. Believe in the importance of faith, family, and personal growth. ${profile.islamicPractice.islamicKnowledge === 'advanced' ? 'Well-versed in Islamic teachings' : 'Always learning and growing in faith'}. Looking for mutual respect and partnership.`
    }
    
    return bioTemplates[culturalValues as keyof typeof bioTemplates] || bioTemplates.moderate
  }

  private generateLookingFor(profile: any): string {
    const seekingTemplates = {
      traditional: 'Seeking a practicing Muslim partner who values family, faith, and traditional Islamic principles.',
      moderate: 'Looking for a compatible Muslim partner who balances faith with modern life and values family.',
      progressive: 'Seeking an understanding Muslim partner for a journey of mutual growth, faith, and companionship.'
    }
    
    return seekingTemplates[profile.preferences.culturalValues as keyof typeof seekingTemplates] || seekingTemplates.moderate
  }

  private calculateMinAge(birthYear: number): number {
    const currentAge = new Date().getFullYear() - birthYear
    return Math.max(18, currentAge - 10)
  }

  private calculateMaxAge(birthYear: number): number {
    const currentAge = new Date().getFullYear() - birthYear
    return Math.min(65, currentAge + 15)
  }

  private calculateTestCompatibilityScore(scenario: any): number {
    // Base score for test scenarios
    const baseScores = {
      'cross_cultural': 75,
      'guardian_complexity': 70,
      'family_blending': 80
    }
    
    const scenarioType = Object.keys(baseScores).find(key => 
      scenario.scenario.toLowerCase().includes(key.replace('_', ''))
    )
    
    return baseScores[scenarioType as keyof typeof baseScores] || 75
  }
}

// CLI interface
export async function main() {
  const config: TestingEnvironmentConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    testingMode: true,
    cleanupOnExit: true
  }

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration')
    process.exit(1)
  }

  const manager = new TestUserManager(config)

  try {
    console.log('🚀 Starting test user creation...')
    const results = await manager.createAllTestUsers()
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`\n📊 Results:`)
    console.log(`✅ Successful: ${successful.length}`)
    console.log(`❌ Failed: ${failed.length}`)
    
    if (failed.length > 0) {
      console.log('\n❌ Failed users:')
      failed.forEach(f => console.log(`  - ${f.errors?.join(', ')}`))
    }

    // Create test matches
    console.log('\n🔗 Creating test matches...')
    await manager.createTestMatches()

    console.log('\n✅ Test environment setup completed!')
    console.log('\n📝 Test Users Created:')
    successful.forEach(result => {
      console.log(`  - User ID: ${result.userId}`)
      console.log(`  - Profile ID: ${result.profileId}`)
      if (result.guardianId) {
        console.log(`  - Guardian ID: ${result.guardianId}`)
      }
      console.log('')
    })

    // Setup cleanup on exit
    if (config.cleanupOnExit) {
      process.on('SIGINT', async () => {
        console.log('\n🧹 Cleaning up test data...')
        await manager.cleanup()
        process.exit(0)
      })
    }

  } catch (error) {
    console.error('❌ Error setting up test environment:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}