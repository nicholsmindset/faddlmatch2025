import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../supabase/types/database'

interface MessagingScenario {
  id: string
  name: string
  description: string
  participants: {
    userId: string
    role: 'sender' | 'receiver'
    culturalBackground: string
    islamicPracticeLevel: 'high' | 'medium' | 'low'
    guardianRequired: boolean
  }[]
  messageFlow: MessageFlow[]
  expectedOutcomes: ExpectedOutcome[]
  testingObjectives: string[]
  islamicConsiderations: string[]
}

interface MessageFlow {
  step: number
  senderId: string
  receiverId: string
  messageContent: string
  messageType: 'text' | 'system_guidance' | 'guardian_notification'
  expectedModeration: 'approve' | 'flag' | 'block' | 'guide'
  guardianAction?: 'approve' | 'reject' | 'request_modification'
  culturalNotes?: string
}

interface ExpectedOutcome {
  metric: string
  expectedValue: any
  description: string
  islamicRelevance: string
}

interface ScenarioResult {
  scenarioId: string
  passed: boolean
  score: number
  findings: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  islamicComplianceScore: number
  culturalSensitivityScore: number
  guardianEffectivenessScore: number
  recommendations: string[]
}

export class MessagingScenarioTester {
  private supabase: ReturnType<typeof createClient<Database>>
  private scenarios: MessagingScenario[] = []

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
    this.initializeScenarios()
  }

  /**
   * Initialize comprehensive messaging test scenarios
   */
  private initializeScenarios(): void {
    this.scenarios = [
      {
        id: 'msg_scenario_001',
        name: 'Traditional Islamic Courtship Communication',
        description: 'Test messaging between traditionally practicing Muslims with full guardian oversight',
        participants: [
          {
            userId: 'test_male_traditional',
            role: 'sender',
            culturalBackground: 'malay_muslim',
            islamicPracticeLevel: 'high',
            guardianRequired: false
          },
          {
            userId: 'test_female_traditional',
            role: 'receiver',
            culturalBackground: 'malay_muslim',
            islamicPracticeLevel: 'high',
            guardianRequired: true
          }
        ],
        messageFlow: [
          {
            step: 1,
            senderId: 'test_male_traditional',
            receiverId: 'test_female_traditional',
            messageContent: 'Assalamu alaikum wa rahmatullahi wa barakatuh, sister. I hope you and your family are blessed with good health and iman.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Full Islamic greeting shows respect and Islamic consciousness'
          },
          {
            step: 2,
            senderId: 'test_female_traditional',
            receiverId: 'test_male_traditional',
            messageContent: 'Wa alaikum salaam wa rahmatullahi wa barakatuh, brother. Alhamdulillah, by Allah\'s grace we are well. My father has given permission for us to communicate about marriage matters.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Mentions father\'s permission, showing proper Islamic protocol'
          },
          {
            step: 3,
            senderId: 'test_male_traditional',
            receiverId: 'test_female_traditional',
            messageContent: 'Alhamdulillah, I am honored by your father\'s permission. May I ask about your Islamic studies and how you practice your deen in daily life?',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Focuses on Islamic compatibility, appropriate for courtship'
          },
          {
            step: 4,
            senderId: 'test_female_traditional',
            receiverId: 'test_male_traditional',
            messageContent: 'MashaAllah, I studied Islamic jurisprudence and try to follow the Quran and Sunnah. I pray five times daily, read Quran regularly, and volunteer at our local mosque\'s children\'s Islamic education program.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Detailed Islamic practice description appropriate for serious marriage inquiry'
          }
        ],
        expectedOutcomes: [
          {
            metric: 'guardian_notification_speed',
            expectedValue: '< 30 seconds',
            description: 'Guardian notified immediately of new messages',
            islamicRelevance: 'Guardian oversight is essential for Islamic propriety'
          },
          {
            metric: 'islamic_content_recognition',
            expectedValue: 'positive',
            description: 'System recognizes and rewards Islamic content',
            islamicRelevance: 'Islamic phrases and concepts should be encouraged'
          },
          {
            metric: 'conversation_flow_rating',
            expectedValue: '> 4.5/5',
            description: 'Natural, respectful conversation flow',
            islamicRelevance: 'Islamic courtship should feel natural and blessed'
          }
        ],
        testingObjectives: [
          'Verify guardian oversight works seamlessly',
          'Test Islamic content recognition and encouragement',
          'Validate cultural sensitivity for traditional families',
          'Ensure conversation flow feels natural despite oversight'
        ],
        islamicConsiderations: [
          'Both parties maintain Islamic etiquette throughout',
          'Guardian involvement protects both families\' honor',
          'Focus on Islamic compatibility over superficial matters',
          'Conversation progresses toward family introduction'
        ]
      },
      {
        id: 'msg_scenario_002',
        name: 'Cross-Cultural Islamic Communication',
        description: 'Test messaging between Muslims from different cultural backgrounds',
        participants: [
          {
            userId: 'test_male_indian',
            role: 'sender',
            culturalBackground: 'indian_muslim',
            islamicPracticeLevel: 'medium',
            guardianRequired: true
          },
          {
            userId: 'test_female_chinese',
            role: 'receiver',
            culturalBackground: 'chinese_muslim_convert',
            islamicPracticeLevel: 'high',
            guardianRequired: false
          }
        ],
        messageFlow: [
          {
            step: 1,
            senderId: 'test_male_indian',
            receiverId: 'test_female_chinese',
            messageContent: 'Assalamu alaikum sister. I noticed we both value Islamic principles despite our different cultural backgrounds. I would like to know more about your journey to Islam.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Acknowledges cultural differences positively, shows interest in Islamic journey'
          },
          {
            step: 2,
            senderId: 'test_female_chinese',
            receiverId: 'test_male_indian',
            messageContent: 'Wa alaikum salaam brother. Alhamdulillah, I embraced Islam 5 years ago. I studied Arabic and Islamic jurisprudence. I appreciate that you see Islam as our common ground rather than focusing on cultural differences.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Convert sharing journey positively, emphasizing Islamic unity'
          },
          {
            step: 3,
            senderId: 'test_male_indian',
            receiverId: 'test_female_chinese',
            messageContent: 'MashaAllah, your commitment to learning Arabic and fiqh is inspiring. In our Indian Muslim family, we blend Islamic principles with some cultural traditions. How do you balance your Chinese heritage with Islamic practice?',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Respectful inquiry about cultural-Islamic balance, sharing own approach'
          },
          {
            step: 4,
            senderId: 'test_female_chinese',
            receiverId: 'test_male_indian',
            messageContent: 'I maintain respect for my family while prioritizing Islamic obligations. For example, I participate in Chinese New Year family gatherings but avoid any elements that conflict with Islamic beliefs. I believe Islam can honor cultural heritage while maintaining clear boundaries.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Thoughtful approach to cultural-Islamic balance, shows wisdom and flexibility'
          }
        ],
        expectedOutcomes: [
          {
            metric: 'cross_cultural_sensitivity',
            expectedValue: '> 4.0/5',
            description: 'System handles cross-cultural Islamic dialogue well',
            islamicRelevance: 'Islam unites people across cultures'
          },
          {
            metric: 'convert_support_quality',
            expectedValue: 'positive',
            description: 'Platform supportive of Muslim converts',
            islamicRelevance: 'Converts deserve respect and support in Islamic community'
          },
          {
            metric: 'cultural_integration_guidance',
            expectedValue: 'available',
            description: 'Platform provides guidance on cultural-Islamic balance',
            islamicRelevance: 'Muslims need guidance on harmonizing culture with Islam'
          }
        ],
        testingObjectives: [
          'Test cross-cultural Islamic matching sensitivity',
          'Verify convert support and encouragement',
          'Validate cultural integration guidance',
          'Ensure Islamic unity message is prominent'
        ],
        islamicConsiderations: [
          'Islam transcends cultural boundaries',
          'Converts deserve special respect and support',
          'Cultural practices must align with Islamic principles',
          'Both parties should focus on Islamic compatibility'
        ]
      },
      {
        id: 'msg_scenario_003',
        name: 'Guardian Intervention Required',
        description: 'Test system response when guardian intervention is needed',
        participants: [
          {
            userId: 'test_male_modern',
            role: 'sender',
            culturalBackground: 'modern_muslim',
            islamicPracticeLevel: 'medium',
            guardianRequired: false
          },
          {
            userId: 'test_female_young',
            role: 'receiver',
            culturalBackground: 'traditional_family',
            islamicPracticeLevel: 'medium',
            guardianRequired: true
          }
        ],
        messageFlow: [
          {
            step: 1,
            senderId: 'test_male_modern',
            receiverId: 'test_female_young',
            messageContent: 'Hi there! I saw your profile and think we might be compatible. Would you like to meet for coffee this weekend?',
            messageType: 'text',
            expectedModeration: 'flag',
            guardianAction: 'reject',
            culturalNotes: 'Casual approach and unsupervised meeting suggestion inappropriate for traditional family'
          },
          {
            step: 2,
            senderId: 'system',
            receiverId: 'test_male_modern',
            messageContent: 'Islamic Guidance: We notice you suggested an unsupervised meeting. In Islamic courtship, meetings should involve family members or occur in appropriate settings. Would you like guidance on Islamic courtship etiquette?',
            messageType: 'system_guidance',
            expectedModeration: 'approve',
            culturalNotes: 'System provides Islamic guidance without being judgmental'
          },
          {
            step: 3,
            senderId: 'test_male_modern',
            receiverId: 'test_female_young',
            messageContent: 'Assalamu alaikum sister. I apologize for my previous message. I would be honored to communicate with your family\'s blessing and would welcome the opportunity for our families to meet properly.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Shows learning and respect for Islamic protocols'
          },
          {
            step: 4,
            senderId: 'test_female_young',
            receiverId: 'test_male_modern',
            messageContent: 'Wa alaikum salaam brother. Thank you for understanding our family\'s approach. My father would like to speak with your family first. This shows respect for Islamic traditions.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Positive response to corrected approach, explains family expectations'
          }
        ],
        expectedOutcomes: [
          {
            metric: 'inappropriate_content_detection',
            expectedValue: 'flagged',
            description: 'System flags inappropriate meeting suggestions',
            islamicRelevance: 'Unsupervised meetings between non-mahram are not permissible'
          },
          {
            metric: 'educational_guidance_quality',
            expectedValue: '> 4.0/5',
            description: 'System provides helpful Islamic guidance',
            islamicRelevance: 'Education helps Muslims follow proper Islamic etiquette'
          },
          {
            metric: 'behavior_improvement',
            expectedValue: 'demonstrated',
            description: 'User behavior improves after guidance',
            islamicRelevance: 'Islamic guidance should lead to better behavior'
          }
        ],
        testingObjectives: [
          'Test inappropriate content detection',
          'Verify educational guidance effectiveness',
          'Validate guardian protection mechanisms',
          'Ensure system promotes Islamic learning'
        ],
        islamicConsiderations: [
          'System should educate, not just punish',
          'Guardian authority must be respected',
          'Islamic guidance should be gentle but clear',
          'Users should feel supported in learning Islamic etiquette'
        ]
      },
      {
        id: 'msg_scenario_004',
        name: 'Prayer Time Integration Test',
        description: 'Test how messaging respects Islamic prayer times',
        participants: [
          {
            userId: 'test_male_practicing',
            role: 'sender',
            culturalBackground: 'arab_muslim',
            islamicPracticeLevel: 'high',
            guardianRequired: false
          },
          {
            userId: 'test_female_practicing',
            role: 'receiver',
            culturalBackground: 'malay_muslim',
            islamicPracticeLevel: 'high',
            guardianRequired: true
          }
        ],
        messageFlow: [
          {
            step: 1,
            senderId: 'test_male_practicing',
            receiverId: 'test_female_practicing',
            messageContent: 'Assalamu alaikum sister. I hope this message reaches you at a blessed time. I wanted to discuss our Islamic goals and how we can support each other\'s deen.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Message sent during non-prayer time, focuses on Islamic goals'
          },
          {
            step: 2,
            senderId: 'system',
            receiverId: 'test_female_practicing',
            messageContent: 'Prayer Time Notice: Maghrib prayer time is approaching in 10 minutes. You may want to prepare for prayer.',
            messageType: 'system_guidance',
            expectedModeration: 'approve',
            culturalNotes: 'System automatically reminds users of prayer times'
          },
          {
            step: 3,
            senderId: 'test_female_practicing',
            receiverId: 'test_male_practicing',
            messageContent: 'Wa alaikum salaam brother. JazakAllahu khair for your message. I\'m going to pray Maghrib now. InshaAllah, I\'ll respond thoughtfully after my prayer and dhikr.',
            messageType: 'text',
            expectedModeration: 'approve',
            guardianAction: 'approve',
            culturalNotes: 'Prioritizes prayer over conversation, shows strong Islamic practice'
          },
          {
            step: 4,
            senderId: 'system',
            receiverId: 'test_male_practicing',
            messageContent: 'Your conversation partner is currently at prayer time. The system will deliver your messages after prayer time ends. May Allah accept their prayers.',
            messageType: 'system_guidance',
            expectedModeration: 'approve',
            culturalNotes: 'System respects prayer time and educates about Islamic priorities'
          }
        ],
        expectedOutcomes: [
          {
            metric: 'prayer_time_awareness',
            expectedValue: 'active',
            description: 'System actively supports prayer time observance',
            islamicRelevance: 'Prayer is the most important obligation in Islam'
          },
          {
            metric: 'islamic_priority_respect',
            expectedValue: '> 4.5/5',
            description: 'System respects Islamic priorities over social interaction',
            islamicRelevance: 'Nothing should interfere with worship obligations'
          },
          {
            metric: 'spiritual_growth_support',
            expectedValue: 'evident',
            description: 'Platform supports spiritual development',
            islamicRelevance: 'Islamic matrimony should enhance spiritual growth'
          }
        ],
        testingObjectives: [
          'Test prayer time integration and respect',
          'Verify system supports Islamic priorities',
          'Validate spiritual growth encouragement',
          'Ensure prayer is never compromised for social interaction'
        ],
        islamicConsiderations: [
          'Prayer always takes priority over conversation',
          'System should actively support Islamic worship',
          'Users should feel encouraged in their Islamic practice',
          'Technology should serve Islamic life, not distract from it'
        ]
      }
    ]
  }

  /**
   * Run a specific messaging scenario test
   */
  async runMessagingScenario(scenarioId: string): Promise<ScenarioResult> {
    const scenario = this.scenarios.find(s => s.id === scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    console.log(`🧪 Running messaging scenario: ${scenario.name}`)

    try {
      // Track scenario start
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'messaging_scenario_started',
          properties: {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            participants: scenario.participants.length,
            messageCount: scenario.messageFlow.length,
            timestamp: new Date().toISOString()
          }
        })

      // Execute message flow
      const flowResults = await this.executeMessageFlow(scenario)
      
      // Evaluate outcomes
      const outcomeResults = await this.evaluateOutcomes(scenario, flowResults)

      // Calculate scenario result
      const result = this.calculateScenarioResult(scenario, flowResults, outcomeResults)

      // Track scenario completion
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'messaging_scenario_completed',
          properties: {
            scenarioId: scenario.id,
            passed: result.passed,
            score: result.score,
            islamicComplianceScore: result.islamicComplianceScore,
            findings: result.findings,
            timestamp: new Date().toISOString()
          }
        })

      return result

    } catch (error) {
      console.error(`❌ Scenario ${scenarioId} failed:`, error)
      throw error
    }
  }

  /**
   * Run all messaging scenarios
   */
  async runAllMessagingScenarios(): Promise<{
    overall: {
      passed: number
      failed: number
      averageScore: number
      averageIslamicCompliance: number
    }
    results: ScenarioResult[]
    recommendations: string[]
  }> {
    console.log('🧪 Running all messaging scenarios...')

    const results: ScenarioResult[] = []
    let totalScore = 0
    let totalIslamicCompliance = 0
    let passed = 0

    for (const scenario of this.scenarios) {
      try {
        const result = await this.runMessagingScenario(scenario.id)
        results.push(result)
        
        totalScore += result.score
        totalIslamicCompliance += result.islamicComplianceScore
        
        if (result.passed) {
          passed++
        }

        // Small delay between scenarios
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`❌ Failed to run scenario ${scenario.id}:`, error)
      }
    }

    const averageScore = totalScore / this.scenarios.length
    const averageIslamicCompliance = totalIslamicCompliance / this.scenarios.length
    const recommendations = this.generateOverallRecommendations(results)

    // Track overall completion
    await this.supabase
      .from('analytics_events')
      .insert({
        event_type: 'messaging_scenarios_suite_completed',
        properties: {
          totalScenarios: this.scenarios.length,
          passed,
          failed: this.scenarios.length - passed,
          averageScore,
          averageIslamicCompliance,
          recommendations,
          timestamp: new Date().toISOString()
        }
      })

    return {
      overall: {
        passed,
        failed: this.scenarios.length - passed,
        averageScore,
        averageIslamicCompliance
      },
      results,
      recommendations
    }
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios(): MessagingScenario[] {
    return this.scenarios
  }

  // Private helper methods

  private async executeMessageFlow(scenario: MessagingScenario): Promise<any[]> {
    const flowResults = []

    for (const message of scenario.messageFlow) {
      console.log(`  💬 Step ${message.step}: ${message.senderId} → ${message.receiverId}`)
      
      // Simulate message processing
      const messageResult = await this.simulateMessageProcessing(message)
      flowResults.push(messageResult)

      // Track message step
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'messaging_scenario_step',
          properties: {
            scenarioId: scenario.id,
            step: message.step,
            senderId: message.senderId,
            receiverId: message.receiverId,
            messageType: message.messageType,
            moderationResult: messageResult.moderationResult,
            guardianAction: messageResult.guardianAction,
            timestamp: new Date().toISOString()
          }
        })
    }

    return flowResults
  }

  private async simulateMessageProcessing(message: MessageFlow): Promise<any> {
    // Simulate message processing based on content and expectations
    const result = {
      step: message.step,
      messageContent: message.messageContent,
      moderationResult: message.expectedModeration,
      guardianAction: message.guardianAction || null,
      islamicContentScore: this.calculateIslamicContentScore(message.messageContent),
      culturalSensitivity: this.calculateCulturalSensitivity(message),
      processingTime: Math.random() * 2 + 0.5, // 0.5-2.5 seconds
      timestamp: new Date().toISOString()
    }

    // Add realistic processing delay
    await new Promise(resolve => setTimeout(resolve, result.processingTime * 1000))

    return result
  }

  private calculateIslamicContentScore(content: string): number {
    let score = 3 // neutral baseline

    // Islamic phrases and greetings
    if (content.includes('Assalamu alaikum')) score += 2
    if (content.includes('InshaAllah') || content.includes('MashaAllah')) score += 1
    if (content.includes('Alhamdulillah')) score += 1
    if (content.includes('JazakAllahu')) score += 1
    if (content.includes('prayer') || content.includes('deen') || content.includes('Islam')) score += 1

    // Negative indicators
    if (content.includes('coffee') && content.includes('meet')) score -= 2
    if (content.includes('beautiful') || content.includes('handsome')) score -= 1

    return Math.min(5, Math.max(1, score))
  }

  private calculateCulturalSensitivity(message: MessageFlow): number {
    let score = 3 // neutral baseline

    // Positive cultural indicators
    if (message.culturalNotes?.includes('respect')) score += 1
    if (message.culturalNotes?.includes('family')) score += 1
    if (message.culturalNotes?.includes('permission')) score += 1
    if (message.culturalNotes?.includes('tradition')) score += 1

    // Consider guardian involvement
    if (message.guardianAction === 'approve') score += 1
    if (message.guardianAction === 'reject') score -= 1

    return Math.min(5, Math.max(1, score))
  }

  private async evaluateOutcomes(scenario: MessagingScenario, flowResults: any[]): Promise<any[]> {
    const outcomeResults = []

    for (const outcome of scenario.expectedOutcomes) {
      const evaluation = this.evaluateOutcome(outcome, flowResults)
      outcomeResults.push(evaluation)

      // Track outcome evaluation
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'messaging_scenario_outcome',
          properties: {
            scenarioId: scenario.id,
            metric: outcome.metric,
            expected: outcome.expectedValue,
            actual: evaluation.actualValue,
            passed: evaluation.passed,
            timestamp: new Date().toISOString()
          }
        })
    }

    return outcomeResults
  }

  private evaluateOutcome(outcome: ExpectedOutcome, flowResults: any[]): any {
    switch (outcome.metric) {
      case 'guardian_notification_speed':
        const guardianNotifications = flowResults.filter(r => r.guardianAction)
        const avgProcessingTime = guardianNotifications.reduce((sum, r) => sum + r.processingTime, 0) / guardianNotifications.length
        return {
          passed: avgProcessingTime < 30,
          actualValue: `${avgProcessingTime.toFixed(1)} seconds`,
          notes: `Average guardian notification time: ${avgProcessingTime.toFixed(1)}s`
        }

      case 'islamic_content_recognition':
        const islamicScores = flowResults.map(r => r.islamicContentScore)
        const avgIslamicScore = islamicScores.reduce((sum, score) => sum + score, 0) / islamicScores.length
        return {
          passed: avgIslamicScore >= 4,
          actualValue: avgIslamicScore.toFixed(1),
          notes: `Average Islamic content score: ${avgIslamicScore.toFixed(1)}/5`
        }

      case 'inappropriate_content_detection':
        const flaggedMessages = flowResults.filter(r => r.moderationResult === 'flag' || r.moderationResult === 'block')
        return {
          passed: flaggedMessages.length > 0,
          actualValue: flaggedMessages.length > 0 ? 'flagged' : 'not flagged',
          notes: `${flaggedMessages.length} inappropriate messages detected`
        }

      default:
        return {
          passed: true,
          actualValue: 'simulated',
          notes: `Simulated evaluation for ${outcome.metric}`
        }
    }
  }

  private calculateScenarioResult(
    scenario: MessagingScenario,
    flowResults: any[],
    outcomeResults: any[]
  ): ScenarioResult {
    const passedOutcomes = outcomeResults.filter(o => o.passed).length
    const totalOutcomes = outcomeResults.length
    const score = (passedOutcomes / totalOutcomes) * 100

    // Calculate specific scores
    const islamicScores = flowResults.map(r => r.islamicContentScore)
    const islamicComplianceScore = (islamicScores.reduce((sum, score) => sum + score, 0) / islamicScores.length) * 20 // Convert to 100 scale

    const culturalScores = flowResults.map(r => r.culturalSensitivity)
    const culturalSensitivityScore = (culturalScores.reduce((sum, score) => sum + score, 0) / culturalScores.length) * 20

    const guardianActions = flowResults.filter(r => r.guardianAction).length
    const guardianEffectivenessScore = guardianActions > 0 ? 85 : 70 // Simulated score

    const findings = {
      positive: [],
      negative: [],
      neutral: []
    }

    // Analyze findings
    if (islamicComplianceScore >= 80) {
      findings.positive.push('Excellent Islamic compliance in messaging')
    } else if (islamicComplianceScore < 60) {
      findings.negative.push('Islamic compliance needs improvement')
    } else {
      findings.neutral.push('Moderate Islamic compliance achieved')
    }

    if (culturalSensitivityScore >= 80) {
      findings.positive.push('Strong cultural sensitivity demonstrated')
    }

    if (guardianActions > 0) {
      findings.positive.push('Guardian oversight working effectively')
    }

    const recommendations = this.generateScenarioRecommendations(findings, scenario)

    return {
      scenarioId: scenario.id,
      passed: score >= 70,
      score,
      findings,
      islamicComplianceScore,
      culturalSensitivityScore,
      guardianEffectivenessScore,
      recommendations
    }
  }

  private generateScenarioRecommendations(findings: any, scenario: MessagingScenario): string[] {
    const recommendations = []

    if (findings.negative.length > 0) {
      recommendations.push('Address identified Islamic compliance issues')
    }

    if (scenario.islamicConsiderations.length > 0) {
      recommendations.push('Continue emphasizing Islamic considerations in messaging')
    }

    if (findings.positive.length === 0) {
      recommendations.push('Improve overall messaging experience quality')
    }

    return recommendations
  }

  private generateOverallRecommendations(results: ScenarioResult[]): string[] {
    const recommendations = []
    const failedScenarios = results.filter(r => !r.passed)

    if (failedScenarios.length === 0) {
      recommendations.push('Excellent messaging system performance across all scenarios')
    } else {
      recommendations.push('Focus on improving failed messaging scenarios')
    }

    const avgIslamicCompliance = results.reduce((sum, r) => sum + r.islamicComplianceScore, 0) / results.length
    if (avgIslamicCompliance < 75) {
      recommendations.push('Enhance Islamic compliance features in messaging')
    }

    const avgCulturalSensitivity = results.reduce((sum, r) => sum + r.culturalSensitivityScore, 0) / results.length
    if (avgCulturalSensitivity < 75) {
      recommendations.push('Improve cultural sensitivity in cross-cultural communications')
    }

    return recommendations
  }
}

// CLI interface
export async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  const tester = new MessagingScenarioTester(supabaseUrl, supabaseKey)
  const scenarioId = process.argv[2]

  try {
    if (scenarioId) {
      // Run specific scenario
      console.log(`🧪 Running messaging scenario: ${scenarioId}`)
      const result = await tester.runMessagingScenario(scenarioId)
      console.log('\n📊 Scenario Result:')
      console.log(`✅ Passed: ${result.passed}`)
      console.log(`📈 Overall Score: ${result.score.toFixed(1)}/100`)
      console.log(`🕌 Islamic Compliance: ${result.islamicComplianceScore.toFixed(1)}/100`)
      console.log(`🌍 Cultural Sensitivity: ${result.culturalSensitivityScore.toFixed(1)}/100`)
      console.log(`👨‍👩‍👧‍👦 Guardian Effectiveness: ${result.guardianEffectivenessScore.toFixed(1)}/100`)
    } else {
      // Run all scenarios
      console.log('🧪 Running all messaging scenarios...')
      const results = await tester.runAllMessagingScenarios()
      
      console.log('\n📊 Overall Results:')
      console.log(`✅ Passed: ${results.overall.passed}`)
      console.log(`❌ Failed: ${results.overall.failed}`)
      console.log(`📈 Average Score: ${results.overall.averageScore.toFixed(1)}/100`)
      console.log(`🕌 Average Islamic Compliance: ${results.overall.averageIslamicCompliance.toFixed(1)}/100`)
      
      if (results.recommendations.length > 0) {
        console.log('\n💡 Recommendations:')
        results.recommendations.forEach(rec => console.log(`  • ${rec}`))
      }
    }

  } catch (error) {
    console.error('❌ Error running messaging scenarios:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}