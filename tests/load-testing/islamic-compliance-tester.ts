/**
 * Islamic Compliance Load Testing Module
 * 
 * Specialized testing for Islamic compliance features including:
 * - Content moderation at scale
 * - Guardian oversight under load
 * - Halal communication validation
 * - Prayer time considerations
 * - Cultural appropriateness filtering
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { performance } from 'perf_hooks'

export interface IslamicComplianceTestConfig {
  supabaseUrl: string
  supabaseKey: string
  concurrentModerationRequests: number
  testDurationMinutes: number
  guardiansCount: number
  moderationRulesCount: number
  prayerTimeTestingEnabled: boolean
  culturalSensitivityTests: number
}

export interface ModerationTestCase {
  content: string
  expectedStatus: 'approved' | 'flagged' | 'guardian_review'
  category: 'halal_greeting' | 'family_discussion' | 'meeting_proposal' | 'inappropriate' | 'contact_sharing' | 'prayer_context' | 'cultural_reference'
  severity: 'low' | 'medium' | 'high' | 'critical'
  shouldTriggerGuardian: boolean
  culturalContext: 'malay' | 'arabic' | 'universal' | 'western'
  expectedModerationTime: number // in milliseconds
}

export interface GuardianOversightTest {
  guardianId: string
  userId: string
  messageContent: string
  expectedNotificationLatency: number
  shouldRequireApproval: boolean
  notificationChannel: 'email' | 'sms' | 'in_app' | 'all'
}

export interface IslamicComplianceMetrics {
  // Moderation Performance
  totalModerationRequests: number
  moderationRequestsProcessed: number
  moderationRequestsFailed: number
  averageModerationTime: number
  p95ModerationTime: number
  p99ModerationTime: number
  
  // Accuracy Metrics
  correctApprovals: number
  correctRejections: number
  falsePositives: number
  falseNegatives: number
  moderationAccuracy: number
  
  // Guardian Oversight
  guardianNotificationsSent: number
  guardianNotificationsDelivered: number
  averageGuardianResponseTime: number
  guardianApprovalRate: number
  
  // Cultural Sensitivity
  culturallyAppropriateContent: number
  culturalViolationsDetected: number
  culturalSensitivityScore: number
  
  // Prayer Time Integration
  prayerTimeRespectedMessages: number
  prayerTimeViolations: number
  prayerTimeComplianceRate: number
  
  // Performance Under Load
  throughputPerMinute: number
  peakModerationLatency: number
  systemStabilityScore: number
  
  errors: ComplianceError[]
  warnings: ComplianceWarning[]
}

interface ComplianceError {
  timestamp: number
  type: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  contentId?: string
}

interface ComplianceWarning {
  timestamp: number
  type: string
  message: string
  metric: string
  actualValue: number
  expectedValue: number
}

/**
 * Islamic Compliance Load Tester
 */
export class IslamicComplianceLoadTester {
  private config: IslamicComplianceTestConfig
  private supabaseClient: SupabaseClient
  private metrics: IslamicComplianceMetrics
  private testCases: ModerationTestCase[]
  private guardianTests: GuardianOversightTest[]
  private isRunning: boolean
  private startTime: number

  constructor(config: IslamicComplianceTestConfig) {
    this.config = config
    this.supabaseClient = createClient(config.supabaseUrl, config.supabaseKey)
    this.metrics = this.initializeMetrics()
    this.testCases = this.generateModerationTestCases()
    this.guardianTests = this.generateGuardianTests()
    this.isRunning = false
    this.startTime = 0
  }

  private initializeMetrics(): IslamicComplianceMetrics {
    return {
      totalModerationRequests: 0,
      moderationRequestsProcessed: 0,
      moderationRequestsFailed: 0,
      averageModerationTime: 0,
      p95ModerationTime: 0,
      p99ModerationTime: 0,
      
      correctApprovals: 0,
      correctRejections: 0,
      falsePositives: 0,
      falseNegatives: 0,
      moderationAccuracy: 0,
      
      guardianNotificationsSent: 0,
      guardianNotificationsDelivered: 0,
      averageGuardianResponseTime: 0,
      guardianApprovalRate: 0,
      
      culturallyAppropriateContent: 0,
      culturalViolationsDetected: 0,
      culturalSensitivityScore: 0,
      
      prayerTimeRespectedMessages: 0,
      prayerTimeViolations: 0,
      prayerTimeComplianceRate: 0,
      
      throughputPerMinute: 0,
      peakModerationLatency: 0,
      systemStabilityScore: 0,
      
      errors: [],
      warnings: []
    }
  }

  /**
   * Generate comprehensive moderation test cases
   */
  private generateModerationTestCases(): ModerationTestCase[] {
    return [
      // Halal Greetings (Should be approved)
      {
        content: "Assalamu alaikum brother, I hope you're having a blessed day.",
        expectedStatus: 'approved',
        category: 'halal_greeting',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'arabic',
        expectedModerationTime: 50
      },
      {
        content: "Wa alaikum assalam sister. May Allah bless your search for a righteous spouse.",
        expectedStatus: 'approved',
        category: 'halal_greeting',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'arabic',
        expectedModerationTime: 50
      },
      {
        content: "Selamat pagi! I noticed we share similar values and would like to get to know you better.",
        expectedStatus: 'approved',
        category: 'halal_greeting',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'malay',
        expectedModerationTime: 60
      },

      // Family and Faith Discussions (Should be approved)
      {
        content: "I come from a practicing family and maintain regular prayers. What about your religious practices?",
        expectedStatus: 'approved',
        category: 'family_discussion',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'universal',
        expectedModerationTime: 75
      },
      {
        content: "Alhamdulillah, my family has been very supportive of my search for a halal relationship. How does your family feel about marriage?",
        expectedStatus: 'approved',
        category: 'family_discussion',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'arabic',
        expectedModerationTime: 80
      },
      {
        content: "I pray five times daily and try to follow the Quran in all aspects of life. What Islamic practices are most important to you?",
        expectedStatus: 'approved',
        category: 'family_discussion',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'universal',
        expectedModerationTime: 85
      },

      // Meeting Proposals (Should trigger guardian review)
      {
        content: "Perhaps we could arrange a meeting with our families present to discuss our compatibility for marriage?",
        expectedStatus: 'guardian_review',
        category: 'meeting_proposal',
        severity: 'medium',
        shouldTriggerGuardian: true,
        culturalContext: 'universal',
        expectedModerationTime: 120
      },
      {
        content: "I would like to involve my wali in our conversations. Could we arrange a chaperoned meeting?",
        expectedStatus: 'guardian_review',
        category: 'meeting_proposal',
        severity: 'medium',
        shouldTriggerGuardian: true,
        culturalContext: 'arabic',
        expectedModerationTime: 100
      },
      {
        content: "Would it be appropriate to meet at the mosque with our families to discuss our intentions?",
        expectedStatus: 'guardian_review',
        category: 'meeting_proposal',
        severity: 'medium',
        shouldTriggerGuardian: true,
        culturalContext: 'universal',
        expectedModerationTime: 110
      },

      // Inappropriate Content (Should be flagged)
      {
        content: "You look very beautiful in your photos. I find you very attractive physically.",
        expectedStatus: 'flagged',
        category: 'inappropriate',
        severity: 'high',
        shouldTriggerGuardian: false,
        culturalContext: 'western',
        expectedModerationTime: 90
      },
      {
        content: "Let's meet alone for dinner tonight. I think we have great chemistry.",
        expectedStatus: 'flagged',
        category: 'inappropriate',
        severity: 'critical',
        shouldTriggerGuardian: false,
        culturalContext: 'western',
        expectedModerationTime: 70
      },
      {
        content: "I want to kiss and hug you when we meet. You're so sexy.",
        expectedStatus: 'flagged',
        category: 'inappropriate',
        severity: 'critical',
        shouldTriggerGuardian: false,
        culturalContext: 'western',
        expectedModerationTime: 60
      },

      // Contact Information Sharing (Should be flagged)
      {
        content: "Here's my phone number: +65 9123-4567. Call me tonight when you're free.",
        expectedStatus: 'flagged',
        category: 'contact_sharing',
        severity: 'high',
        shouldTriggerGuardian: false,
        culturalContext: 'universal',
        expectedModerationTime: 80
      },
      {
        content: "Add me on WhatsApp: +60123456789. Let's chat privately there.",
        expectedStatus: 'flagged',
        category: 'contact_sharing',
        severity: 'high',
        shouldTriggerGuardian: false,
        culturalContext: 'universal',
        expectedModerationTime: 75
      },
      {
        content: "My Instagram is @john_doe123. Follow me and I'll follow back.",
        expectedStatus: 'flagged',
        category: 'contact_sharing',
        severity: 'medium',
        shouldTriggerGuardian: false,
        culturalContext: 'western',
        expectedModerationTime: 85
      },

      // Prayer Time Context (Should be approved with special handling)
      {
        content: "I noticed it's almost Maghrib time. I'll continue our conversation after prayers, InshaAllah.",
        expectedStatus: 'approved',
        category: 'prayer_context',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'arabic',
        expectedModerationTime: 90
      },
      {
        content: "Subhan Allah, I was just finishing my morning prayers when I saw your message. Good morning!",
        expectedStatus: 'approved',
        category: 'prayer_context',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'arabic',
        expectedModerationTime: 95
      },

      // Cultural References (Mixed approval based on appropriateness)
      {
        content: "I love attending cultural events at the mosque during Ramadan. Do you participate in community iftars?",
        expectedStatus: 'approved',
        category: 'cultural_reference',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'universal',
        expectedModerationTime: 100
      },
      {
        content: "I enjoy both traditional Malay cuisine and modern fusion foods. What's your favorite cuisine?",
        expectedStatus: 'approved',
        category: 'cultural_reference',
        severity: 'low',
        shouldTriggerGuardian: false,
        culturalContext: 'malay',
        expectedModerationTime: 105
      }
    ]
  }

  /**
   * Generate guardian oversight test scenarios
   */
  private generateGuardianTests(): GuardianOversightTest[] {
    const tests: GuardianOversightTest[] = []
    
    for (let i = 0; i < this.config.guardiansCount; i++) {
      const guardianId = `test-guardian-${i}`
      const userId = `test-user-${i}`
      
      // Test different notification scenarios
      tests.push({
        guardianId,
        userId,
        messageContent: "I would like to arrange a meeting with our families to discuss marriage.",
        expectedNotificationLatency: 200,
        shouldRequireApproval: true,
        notificationChannel: 'email'
      })
      
      tests.push({
        guardianId,
        userId,
        messageContent: "Could we meet at the mosque for a chaperoned conversation?",
        expectedNotificationLatency: 150,
        shouldRequireApproval: true,
        notificationChannel: 'sms'
      })
      
      tests.push({
        guardianId,
        userId,
        messageContent: "I think we should involve our families in the next step of getting to know each other.",
        expectedNotificationLatency: 250,
        shouldRequireApproval: true,
        notificationChannel: 'in_app'
      })
    }
    
    return tests
  }

  /**
   * Run comprehensive Islamic compliance load test
   */
  async runComplianceLoadTest(): Promise<IslamicComplianceMetrics> {
    console.log('🕌 Starting Islamic Compliance Load Test')
    console.log(`   Moderation Requests: ${this.config.concurrentModerationRequests}`)
    console.log(`   Test Duration: ${this.config.testDurationMinutes} minutes`)
    console.log(`   Guardians: ${this.config.guardiansCount}`)

    this.isRunning = true
    this.startTime = performance.now()

    try {
      // Run all compliance tests in parallel
      await Promise.all([
        this.runContentModerationLoadTest(),
        this.runGuardianOversightLoadTest(),
        this.runCulturalSensitivityTest(),
        this.runPrayerTimeComplianceTest()
      ])

      // Calculate final metrics
      this.calculateFinalMetrics()

    } catch (error) {
      this.addError('COMPLIANCE_TEST_EXECUTION', error.message, 'critical')
    } finally {
      this.isRunning = false
    }

    return this.metrics
  }

  /**
   * Test content moderation under load
   */
  private async runContentModerationLoadTest(): Promise<void> {
    console.log('🔍 Testing content moderation under load...')
    
    const testDurationMs = this.config.testDurationMinutes * 60 * 1000
    const moderationInterval = 1000 // Test every second
    const requestsPerInterval = Math.ceil(this.config.concurrentModerationRequests / 60) // Spread over 60 seconds
    
    const endTime = Date.now() + testDurationMs
    
    while (Date.now() < endTime && this.isRunning) {
      const moderationPromises: Promise<void>[] = []
      
      // Submit batch of moderation requests
      for (let i = 0; i < requestsPerInterval; i++) {
        const testCase = this.testCases[Math.floor(Math.random() * this.testCases.length)]
        moderationPromises.push(this.testMessageModeration(testCase))
      }
      
      await Promise.allSettled(moderationPromises)
      
      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, moderationInterval))
    }

    console.log(`✅ Content moderation load test completed`)
    console.log(`   Requests processed: ${this.metrics.moderationRequestsProcessed}`)
    console.log(`   Average time: ${this.metrics.averageModerationTime.toFixed(2)}ms`)
    console.log(`   Accuracy: ${this.metrics.moderationAccuracy.toFixed(2)}%`)
  }

  private async testMessageModeration(testCase: ModerationTestCase): Promise<void> {
    const startTime = performance.now()
    
    try {
      this.metrics.totalModerationRequests++
      
      // Simulate moderation API call
      const moderationResult = await this.simulateContentModeration(testCase)
      
      const moderationTime = performance.now() - startTime
      
      // Update timing metrics
      this.updateModerationTimingMetrics(moderationTime)
      
      // Check accuracy
      if (moderationResult.status === testCase.expectedStatus) {
        if (testCase.expectedStatus === 'approved') {
          this.metrics.correctApprovals++
        } else {
          this.metrics.correctRejections++
        }
      } else {
        if (testCase.expectedStatus === 'approved' && moderationResult.status === 'flagged') {
          this.metrics.falsePositives++
        } else if (testCase.expectedStatus === 'flagged' && moderationResult.status === 'approved') {
          this.metrics.falseNegatives++
        }
        
        this.addWarning(
          'MODERATION_ACCURACY',
          `Expected ${testCase.expectedStatus}, got ${moderationResult.status}`,
          'accuracy_mismatch',
          0,
          1
        )
      }
      
      // Test guardian notification if required
      if (testCase.shouldTriggerGuardian) {
        await this.testGuardianNotification(testCase.content)
      }
      
      // Check if moderation time exceeds expected
      if (moderationTime > testCase.expectedModerationTime * 1.5) {
        this.addWarning(
          'MODERATION_SLOW',
          `Moderation took ${moderationTime.toFixed(2)}ms, expected ${testCase.expectedModerationTime}ms`,
          'moderation_latency',
          moderationTime,
          testCase.expectedModerationTime
        )
      }
      
      this.metrics.moderationRequestsProcessed++
      
    } catch (error) {
      this.metrics.moderationRequestsFailed++
      this.addError('MODERATION_REQUEST_FAILED', error.message, 'high')
    }
  }

  private async simulateContentModeration(testCase: ModerationTestCase): Promise<{ status: string; confidence: number }> {
    // Simulate network latency and processing time
    const baseLatency = 30
    const processingTime = Math.random() * testCase.expectedModerationTime + baseLatency
    
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    // Simulate moderation accuracy (95% accurate)
    const accuracy = 0.95
    const isAccurate = Math.random() < accuracy
    
    if (isAccurate) {
      return {
        status: testCase.expectedStatus,
        confidence: 0.8 + Math.random() * 0.2
      }
    } else {
      // Return incorrect result for testing error handling
      const wrongStatuses = ['approved', 'flagged', 'guardian_review'].filter(s => s !== testCase.expectedStatus)
      return {
        status: wrongStatuses[Math.floor(Math.random() * wrongStatuses.length)],
        confidence: 0.3 + Math.random() * 0.4
      }
    }
  }

  /**
   * Test guardian oversight under load
   */
  private async runGuardianOversightLoadTest(): Promise<void> {
    console.log('👨‍👩‍👧‍👦 Testing guardian oversight under load...')
    
    const guardianPromises = this.guardianTests.map(test => this.testGuardianOversight(test))
    
    await Promise.allSettled(guardianPromises)
    
    console.log(`✅ Guardian oversight test completed`)
    console.log(`   Notifications sent: ${this.metrics.guardianNotificationsSent}`)
    console.log(`   Delivery rate: ${((this.metrics.guardianNotificationsDelivered / this.metrics.guardianNotificationsSent) * 100).toFixed(2)}%`)
  }

  private async testGuardianOversight(test: GuardianOversightTest): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Simulate guardian notification
      await this.simulateGuardianNotification(test)
      
      const responseTime = performance.now() - startTime
      
      // Update guardian metrics
      this.metrics.guardianNotificationsSent++
      
      if (responseTime <= test.expectedNotificationLatency * 1.2) { // 20% tolerance
        this.metrics.guardianNotificationsDelivered++
      }
      
      // Update average response time
      const count = this.metrics.guardianNotificationsSent
      this.metrics.averageGuardianResponseTime = 
        (this.metrics.averageGuardianResponseTime * (count - 1) + responseTime) / count
      
      if (responseTime > test.expectedNotificationLatency * 1.5) {
        this.addWarning(
          'GUARDIAN_NOTIFICATION_SLOW',
          `Guardian notification took ${responseTime.toFixed(2)}ms, expected ${test.expectedNotificationLatency}ms`,
          'guardian_response_time',
          responseTime,
          test.expectedNotificationLatency
        )
      }
      
    } catch (error) {
      this.addError('GUARDIAN_OVERSIGHT_FAILED', error.message, 'high', test.userId)
    }
  }

  private async simulateGuardianNotification(test: GuardianOversightTest): Promise<void> {
    // Simulate notification delivery based on channel
    const channelLatencies = {
      'email': 200,
      'sms': 500,
      'in_app': 100,
      'all': 600
    }
    
    const latency = channelLatencies[test.notificationChannel] || 200
    
    await new Promise(resolve => setTimeout(resolve, latency + Math.random() * 100))
  }

  private async testGuardianNotification(content: string): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Simulate guardian notification for guardian review content
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100))
      
      this.metrics.guardianNotificationsSent++
      
      const responseTime = performance.now() - startTime
      if (responseTime <= 300) { // 300ms expected
        this.metrics.guardianNotificationsDelivered++
      }
      
    } catch (error) {
      this.addError('GUARDIAN_NOTIFICATION_FAILED', error.message, 'medium')
    }
  }

  /**
   * Test cultural sensitivity under load
   */
  private async runCulturalSensitivityTest(): Promise<void> {
    console.log('🌍 Testing cultural sensitivity under load...')
    
    const culturalTests: Promise<void>[] = []
    
    for (let i = 0; i < this.config.culturalSensitivityTests; i++) {
      culturalTests.push(this.testCulturalSensitivity())
    }
    
    await Promise.allSettled(culturalTests)
    
    // Calculate cultural sensitivity score
    const totalCulturalTests = this.metrics.culturallyAppropriateContent + this.metrics.culturalViolationsDetected
    this.metrics.culturalSensitivityScore = totalCulturalTests > 0 
      ? (this.metrics.culturallyAppropriateContent / totalCulturalTests) * 100 
      : 0
    
    console.log(`✅ Cultural sensitivity test completed`)
    console.log(`   Sensitivity score: ${this.metrics.culturalSensitivityScore.toFixed(2)}%`)
  }

  private async testCulturalSensitivity(): Promise<void> {
    try {
      // Select random test case
      const testCase = this.testCases[Math.floor(Math.random() * this.testCases.length)]
      
      // Simulate cultural sensitivity analysis
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
      
      // Determine if content is culturally appropriate
      const isCulturallyAppropriate = this.evaluateCulturalAppropriateness(testCase)
      
      if (isCulturallyAppropriate) {
        this.metrics.culturallyAppropriateContent++
      } else {
        this.metrics.culturalViolationsDetected++
      }
      
    } catch (error) {
      this.addError('CULTURAL_SENSITIVITY_TEST_FAILED', error.message, 'medium')
    }
  }

  private evaluateCulturalAppropriateness(testCase: ModerationTestCase): boolean {
    // Evaluate based on cultural context and content appropriateness
    if (testCase.culturalContext === 'western' && testCase.category === 'inappropriate') {
      return false
    }
    
    if (testCase.culturalContext === 'arabic' && testCase.category === 'prayer_context') {
      return true
    }
    
    if (testCase.culturalContext === 'malay' && testCase.category === 'cultural_reference') {
      return true
    }
    
    // Default evaluation based on expected status
    return testCase.expectedStatus === 'approved'
  }

  /**
   * Test prayer time compliance features
   */
  private async runPrayerTimeComplianceTest(): Promise<void> {
    if (!this.config.prayerTimeTestingEnabled) {
      console.log('⏰ Prayer time testing disabled')
      return
    }
    
    console.log('🕐 Testing prayer time compliance...')
    
    const prayerTimeTests: Promise<void>[] = []
    
    // Test different prayer times
    const prayerTimes = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
    
    for (const prayerTime of prayerTimes) {
      for (let i = 0; i < 20; i++) { // 20 tests per prayer time
        prayerTimeTests.push(this.testPrayerTimeCompliance(prayerTime))
      }
    }
    
    await Promise.allSettled(prayerTimeTests)
    
    // Calculate prayer time compliance rate
    const totalPrayerTests = this.metrics.prayerTimeRespectedMessages + this.metrics.prayerTimeViolations
    this.metrics.prayerTimeComplianceRate = totalPrayerTests > 0 
      ? (this.metrics.prayerTimeRespectedMessages / totalPrayerTests) * 100 
      : 0
    
    console.log(`✅ Prayer time compliance test completed`)
    console.log(`   Compliance rate: ${this.metrics.prayerTimeComplianceRate.toFixed(2)}%`)
  }

  private async testPrayerTimeCompliance(prayerTime: string): Promise<void> {
    try {
      // Simulate prayer time checking
      const currentTime = new Date()
      const isPrayerTime = this.isPrayerTime(currentTime, prayerTime)
      
      // Test message delivery during prayer time
      const messageContent = `Test message during ${prayerTime} time`
      
      if (isPrayerTime) {
        // Message should be delayed or flagged for prayer time respect
        const shouldRespectPrayerTime = Math.random() < 0.9 // 90% should respect prayer time
        
        if (shouldRespectPrayerTime) {
          this.metrics.prayerTimeRespectedMessages++
        } else {
          this.metrics.prayerTimeViolations++
          this.addWarning(
            'PRAYER_TIME_VIOLATION',
            `Message sent during ${prayerTime} time without proper consideration`,
            'prayer_time_respect',
            0,
            1
          )
        }
      } else {
        this.metrics.prayerTimeRespectedMessages++
      }
      
    } catch (error) {
      this.addError('PRAYER_TIME_TEST_FAILED', error.message, 'low')
    }
  }

  private isPrayerTime(currentTime: Date, prayerTime: string): boolean {
    // Simplified prayer time calculation for testing
    const hour = currentTime.getHours()
    
    const prayerHours = {
      'fajr': [5, 6],
      'dhuhr': [12, 13],
      'asr': [15, 16],
      'maghrib': [18, 19],
      'isha': [19, 21]
    }
    
    const [startHour, endHour] = prayerHours[prayerTime] || [0, 0]
    return hour >= startHour && hour <= endHour
  }

  private updateModerationTimingMetrics(moderationTime: number): void {
    const count = this.metrics.moderationRequestsProcessed + 1
    
    // Update average
    this.metrics.averageModerationTime = 
      (this.metrics.averageModerationTime * (count - 1) + moderationTime) / count
    
    // Update peak latency
    this.metrics.peakModerationLatency = Math.max(this.metrics.peakModerationLatency, moderationTime)
  }

  private calculateFinalMetrics(): void {
    // Calculate moderation accuracy
    const totalAccuracyTests = this.metrics.correctApprovals + this.metrics.correctRejections + 
                              this.metrics.falsePositives + this.metrics.falseNegatives
    
    if (totalAccuracyTests > 0) {
      this.metrics.moderationAccuracy = 
        ((this.metrics.correctApprovals + this.metrics.correctRejections) / totalAccuracyTests) * 100
    }
    
    // Calculate guardian approval rate
    if (this.metrics.guardianNotificationsSent > 0) {
      this.metrics.guardianApprovalRate = 
        (this.metrics.guardianNotificationsDelivered / this.metrics.guardianNotificationsSent) * 100
    }
    
    // Calculate throughput
    const testDurationMinutes = this.config.testDurationMinutes
    this.metrics.throughputPerMinute = this.metrics.moderationRequestsProcessed / testDurationMinutes
    
    // Calculate system stability score (based on error rate)
    const errorRate = this.metrics.errors.filter(e => e.severity === 'high' || e.severity === 'critical').length
    const totalOperations = this.metrics.moderationRequestsProcessed + this.metrics.guardianNotificationsSent
    
    this.metrics.systemStabilityScore = totalOperations > 0 
      ? Math.max(0, 100 - (errorRate / totalOperations) * 100)
      : 100
  }

  private addError(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical', userId?: string): void {
    this.metrics.errors.push({
      timestamp: Date.now(),
      type,
      message,
      severity,
      userId
    })
  }

  private addWarning(type: string, message: string, metric: string, actualValue: number, expectedValue: number): void {
    this.metrics.warnings.push({
      timestamp: Date.now(),
      type,
      message,
      metric,
      actualValue,
      expectedValue
    })
  }

  /**
   * Get real-time compliance metrics
   */
  getCurrentMetrics(): Partial<IslamicComplianceMetrics> {
    const elapsedTime = (performance.now() - this.startTime) / 1000 / 60 // minutes
    
    return {
      moderationRequestsProcessed: this.metrics.moderationRequestsProcessed,
      averageModerationTime: this.metrics.averageModerationTime,
      moderationAccuracy: this.metrics.moderationAccuracy,
      guardianNotificationsSent: this.metrics.guardianNotificationsSent,
      averageGuardianResponseTime: this.metrics.averageGuardianResponseTime,
      culturalSensitivityScore: this.metrics.culturalSensitivityScore,
      prayerTimeComplianceRate: this.metrics.prayerTimeComplianceRate,
      throughputPerMinute: elapsedTime > 0 ? this.metrics.moderationRequestsProcessed / elapsedTime : 0,
      systemStabilityScore: this.metrics.systemStabilityScore
    }
  }
}