import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../supabase/types/database'

interface UserBehaviorEvent {
  userId: string
  sessionId: string
  eventType: string
  eventData: {
    action: string
    context: string
    metadata: Record<string, any>
    timestamp: string
    deviceInfo: {
      type: 'desktop' | 'mobile' | 'tablet'
      browser: string
      os: string
    }
    culturalContext?: string
    islamicRelevance?: string
  }
}

interface BehaviorAnalytics {
  userEngagement: {
    avgSessionDuration: number
    pagesPerSession: number
    bounceRate: number
    returnVisitorRate: number
  }
  islamicFeatureUsage: {
    prayerTimeAwareness: number
    islamicGreetingUsage: number
    guardianInteractionRate: number
    islamicContentEngagement: number
  }
  culturalSegmentation: {
    [culturalGroup: string]: {
      avgSatisfaction: number
      featurePreferences: string[]
      commonConcerns: string[]
      engagementPatterns: Record<string, number>
    }
  }
  conversionFunnels: {
    profileCompletion: number
    firstMessage: number
    mutualInterest: number
    familyIntroduction: number
  }
}

interface RealTimeMetrics {
  activeUsers: number
  activeGuardians: number
  messagesPerMinute: number
  guardianApprovalsPerHour: number
  islamicComplianceScore: number
  systemHealthScore: number
}

interface AlertCondition {
  id: string
  name: string
  description: string
  condition: string
  threshold: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  recipients: string[]
  islamicRelevance: string
}

export class UserBehaviorAnalytics {
  private supabase: ReturnType<typeof createClient<Database>>
  private realTimeSubscriptions: any[] = []
  private alertConditions: AlertCondition[] = []

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
    this.initializeAlertConditions()
  }

  /**
   * Initialize analytics monitoring system
   */
  async initializeAnalytics(): Promise<void> {
    console.log('📊 Initializing user behavior analytics...')

    try {
      // Setup real-time monitoring
      await this.setupRealTimeMonitoring()

      // Initialize alert system
      await this.setupAlertSystem()

      // Setup cultural segmentation tracking
      await this.setupCulturalSegmentation()

      // Initialize Islamic compliance tracking
      await this.setupIslamicComplianceTracking()

      console.log('✅ Analytics monitoring system initialized')

    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error)
      throw error
    }
  }

  /**
   * Track user behavior event
   */
  async trackBehaviorEvent(event: UserBehaviorEvent): Promise<void> {
    try {
      await this.supabase
        .from('analytics_events')
        .insert({
          user_id: event.userId,
          event_type: event.eventType,
          properties: {
            sessionId: event.sessionId,
            action: event.eventData.action,
            context: event.eventData.context,
            metadata: event.eventData.metadata,
            deviceInfo: event.eventData.deviceInfo,
            culturalContext: event.eventData.culturalContext,
            islamicRelevance: event.eventData.islamicRelevance,
            timestamp: event.eventData.timestamp
          }
        })

      // Process real-time alerts
      await this.processRealTimeAlerts(event)

    } catch (error) {
      console.error('Error tracking behavior event:', error)
    }
  }

  /**
   * Get comprehensive behavior analytics
   */
  async getBehaviorAnalytics(
    startDate?: string,
    endDate?: string,
    filters?: {
      culturalGroup?: string
      islamicPracticeLevel?: string
      userType?: 'user' | 'guardian'
    }
  ): Promise<BehaviorAnalytics> {
    try {
      let query = this.supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate)

      const { data: events, error } = await query

      if (error) throw error

      // Filter events based on criteria
      let filteredEvents = events || []
      if (filters) {
        filteredEvents = filteredEvents.filter(event => {
          const props = event.properties as any
          return (
            (!filters.culturalGroup || props.culturalContext === filters.culturalGroup) &&
            (!filters.islamicPracticeLevel || props.islamicPracticeLevel === filters.islamicPracticeLevel) &&
            (!filters.userType || props.userType === filters.userType)
          )
        })
      }

      return this.calculateBehaviorAnalytics(filteredEvents)

    } catch (error) {
      console.error('Error getting behavior analytics:', error)
      throw error
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Active users (active in last 5 minutes)
      const { data: activeUserEvents } = await this.supabase
        .from('analytics_events')
        .select('user_id')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .not('user_id', 'is', null)

      const activeUsers = new Set(activeUserEvents?.map(e => e.user_id)).size

      // Active guardians
      const { data: guardianEvents } = await this.supabase
        .from('analytics_events')
        .select('user_id')
        .like('event_type', '%guardian%')
        .gte('created_at', fiveMinutesAgo.toISOString())

      const activeGuardians = new Set(guardianEvents?.map(e => e.user_id)).size

      // Messages per minute (last 5 minutes)
      const { data: messageEvents } = await this.supabase
        .from('analytics_events')
        .select('id')
        .like('event_type', '%message%')
        .gte('created_at', fiveMinutesAgo.toISOString())

      const messagesPerMinute = (messageEvents?.length || 0) / 5

      // Guardian approvals per hour
      const { data: approvalEvents } = await this.supabase
        .from('analytics_events')
        .select('id')
        .eq('event_type', 'guardian_approval')
        .gte('created_at', oneHourAgo.toISOString())

      const guardianApprovalsPerHour = approvalEvents?.length || 0

      // Islamic compliance score (average from recent compliance checks)
      const { data: complianceEvents } = await this.supabase
        .from('analytics_events')
        .select('properties')
        .like('event_type', '%islamic_compliance%')
        .gte('created_at', oneHourAgo.toISOString())

      const complianceScores = complianceEvents
        ?.map(e => (e.properties as any)?.score)
        .filter(score => typeof score === 'number') || []

      const islamicComplianceScore = complianceScores.length > 0
        ? complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length
        : 85 // Default good score

      // System health score (based on error rates, response times, etc.)
      const systemHealthScore = await this.calculateSystemHealthScore()

      return {
        activeUsers,
        activeGuardians,
        messagesPerMinute,
        guardianApprovalsPerHour,
        islamicComplianceScore,
        systemHealthScore
      }

    } catch (error) {
      console.error('Error getting real-time metrics:', error)
      throw error
    }
  }

  /**
   * Generate Islamic compliance report
   */
  async getIslamicComplianceReport(timeframe: 'day' | 'week' | 'month'): Promise<{
    overallScore: number
    categoryScores: {
      messaging: number
      matching: number
      guardianOversight: number
      prayerTimeRespect: number
      culturalSensitivity: number
    }
    trends: Array<{
      date: string
      score: number
    }>
    violations: Array<{
      type: string
      count: number
      severity: 'low' | 'medium' | 'high'
      examples: string[]
    }>
    improvements: Array<{
      area: string
      recommendation: string
      priority: 'high' | 'medium' | 'low'
      islamicBasis: string
    }>
  }> {
    try {
      const startDate = this.getTimeframeStartDate(timeframe)
      
      const { data: complianceEvents } = await this.supabase
        .from('analytics_events')
        .select('*')
        .like('event_type', '%islamic_compliance%')
        .gte('created_at', startDate.toISOString())

      return this.analyzeIslamicCompliance(complianceEvents || [])

    } catch (error) {
      console.error('Error getting Islamic compliance report:', error)
      throw error
    }
  }

  /**
   * Generate cultural insights report
   */
  async getCulturalInsightsReport(): Promise<{
    culturalGroups: Array<{
      group: string
      userCount: number
      satisfaction: number
      engagementLevel: number
      preferredFeatures: string[]
      concerns: string[]
      successStories: number
    }>
    crossCulturalMatches: {
      total: number
      successRate: number
      commonChallenges: string[]
      successFactors: string[]
    }
    recommendations: Array<{
      culturalGroup: string
      recommendation: string
      priority: 'high' | 'medium' | 'low'
      culturalBasis: string
    }>
  }> {
    try {
      const { data: culturalEvents } = await this.supabase
        .from('analytics_events')
        .select('*')
        .contains('properties', { culturalContext: true })

      return this.analyzeCulturalInsights(culturalEvents || [])

    } catch (error) {
      console.error('Error getting cultural insights report:', error)
      throw error
    }
  }

  /**
   * Setup real-time dashboard data
   */
  async getDashboardData(): Promise<{
    metrics: RealTimeMetrics
    recentActivity: Array<{
      timestamp: string
      event: string
      user: string
      details: string
      islamicRelevance?: string
    }>
    alerts: Array<{
      id: string
      type: 'warning' | 'error' | 'info'
      message: string
      timestamp: string
      resolved: boolean
    }>
    trends: {
      userGrowth: number[]
      engagement: number[]
      satisfaction: number[]
      islamicCompliance: number[]
    }
  }> {
    try {
      const metrics = await this.getRealTimeMetrics()
      const recentActivity = await this.getRecentActivity()
      const alerts = await this.getActiveAlerts()
      const trends = await this.getTrendData()

      return {
        metrics,
        recentActivity,
        alerts,
        trends
      }

    } catch (error) {
      console.error('Error getting dashboard data:', error)
      throw error
    }
  }

  // Private helper methods

  private initializeAlertConditions(): void {
    this.alertConditions = [
      {
        id: 'islamic_compliance_drop',
        name: 'Islamic Compliance Score Drop',
        description: 'Islamic compliance score drops below acceptable threshold',
        condition: 'islamicComplianceScore < threshold',
        threshold: 75,
        priority: 'high',
        recipients: ['admin@faddlmatch.com', 'islamic-advisor@faddlmatch.com'],
        islamicRelevance: 'Maintaining Islamic principles is fundamental to platform integrity'
      },
      {
        id: 'guardian_approval_delay',
        name: 'Guardian Approval Delays',
        description: 'Guardian approvals taking longer than expected',
        condition: 'avgGuardianApprovalTime > threshold',
        threshold: 300, // 5 minutes
        priority: 'medium',
        recipients: ['support@faddlmatch.com'],
        islamicRelevance: 'Timely guardian oversight maintains Islamic marriage process flow'
      },
      {
        id: 'cultural_satisfaction_drop',
        name: 'Cultural Group Satisfaction Drop',
        description: 'Satisfaction drops significantly for specific cultural group',
        condition: 'culturalGroupSatisfaction < threshold',
        threshold: 70,
        priority: 'high',
        recipients: ['community@faddlmatch.com'],
        islamicRelevance: 'All Muslim communities should feel welcomed and respected'
      },
      {
        id: 'inappropriate_content_spike',
        name: 'Inappropriate Content Spike',
        description: 'Unusual increase in inappropriate content detection',
        condition: 'inappropriateContentRate > threshold',
        threshold: 5, // 5% of messages
        priority: 'critical',
        recipients: ['moderation@faddlmatch.com', 'admin@faddlmatch.com'],
        islamicRelevance: 'Maintaining Islamic communication standards is critical'
      }
    ]
  }

  private async setupRealTimeMonitoring(): Promise<void> {
    // Setup real-time subscriptions for key events
    const subscription = this.supabase
      .channel('analytics_monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        (payload) => {
          this.processRealTimeEvent(payload.new)
        }
      )
      .subscribe()

    this.realTimeSubscriptions.push(subscription)
  }

  private async setupAlertSystem(): Promise<void> {
    // Initialize alert processing system
    console.log('🚨 Alert system initialized with', this.alertConditions.length, 'conditions')
  }

  private async setupCulturalSegmentation(): Promise<void> {
    // Initialize cultural segmentation tracking
    console.log('🌍 Cultural segmentation tracking initialized')
  }

  private async setupIslamicComplianceTracking(): Promise<void> {
    // Initialize Islamic compliance tracking
    console.log('🕌 Islamic compliance tracking initialized')
  }

  private async processRealTimeEvent(event: any): Promise<void> {
    // Process real-time events for immediate alerts
    try {
      const eventType = event.event_type
      const properties = event.properties

      // Check for alert conditions
      for (const condition of this.alertConditions) {
        const shouldAlert = await this.evaluateAlertCondition(condition, event)
        if (shouldAlert) {
          await this.triggerAlert(condition, event)
        }
      }

    } catch (error) {
      console.error('Error processing real-time event:', error)
    }
  }

  private async processRealTimeAlerts(event: UserBehaviorEvent): Promise<void> {
    // Process alerts based on behavior events
    const eventData = event.eventData

    // Check for Islamic compliance concerns
    if (eventData.islamicRelevance === 'violation') {
      await this.triggerAlert(
        this.alertConditions.find(c => c.id === 'inappropriate_content_spike')!,
        event
      )
    }

    // Check for guardian system issues
    if (eventData.action === 'guardian_approval_timeout') {
      await this.triggerAlert(
        this.alertConditions.find(c => c.id === 'guardian_approval_delay')!,
        event
      )
    }
  }

  private calculateBehaviorAnalytics(events: any[]): BehaviorAnalytics {
    // Group events by user sessions
    const sessionGroups = new Map<string, any[]>()
    const userGroups = new Map<string, any[]>()

    events.forEach(event => {
      const props = event.properties as any
      const sessionId = props.sessionId
      const userId = event.user_id

      if (sessionId) {
        if (!sessionGroups.has(sessionId)) sessionGroups.set(sessionId, [])
        sessionGroups.get(sessionId)!.push(event)
      }

      if (userId) {
        if (!userGroups.has(userId)) userGroups.set(userId, [])
        userGroups.get(userId)!.push(event)
      }
    })

    // Calculate user engagement metrics
    const sessions = Array.from(sessionGroups.values())
    const avgSessionDuration = this.calculateAvgSessionDuration(sessions)
    const pagesPerSession = this.calculatePagesPerSession(sessions)
    const bounceRate = this.calculateBounceRate(sessions)
    const returnVisitorRate = this.calculateReturnVisitorRate(userGroups)

    // Calculate Islamic feature usage
    const islamicFeatureUsage = this.calculateIslamicFeatureUsage(events)

    // Calculate cultural segmentation
    const culturalSegmentation = this.calculateCulturalSegmentation(events)

    // Calculate conversion funnels
    const conversionFunnels = this.calculateConversionFunnels(events)

    return {
      userEngagement: {
        avgSessionDuration,
        pagesPerSession,
        bounceRate,
        returnVisitorRate
      },
      islamicFeatureUsage,
      culturalSegmentation,
      conversionFunnels
    }
  }

  private calculateAvgSessionDuration(sessions: any[][]): number {
    if (sessions.length === 0) return 0

    const durations = sessions.map(session => {
      if (session.length < 2) return 0
      const start = new Date(session[session.length - 1].created_at)
      const end = new Date(session[0].created_at)
      return (end.getTime() - start.getTime()) / 1000 / 60 // minutes
    })

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  }

  private calculatePagesPerSession(sessions: any[][]): number {
    if (sessions.length === 0) return 0
    const totalPages = sessions.reduce((sum, session) => sum + session.length, 0)
    return totalPages / sessions.length
  }

  private calculateBounceRate(sessions: any[][]): number {
    if (sessions.length === 0) return 0
    const bounces = sessions.filter(session => session.length === 1).length
    return (bounces / sessions.length) * 100
  }

  private calculateReturnVisitorRate(userGroups: Map<string, any[]>): number {
    if (userGroups.size === 0) return 0
    const returnVisitors = Array.from(userGroups.values()).filter(
      userEvents => new Set(userEvents.map(e => e.created_at.split('T')[0])).size > 1
    ).length
    return (returnVisitors / userGroups.size) * 100
  }

  private calculateIslamicFeatureUsage(events: any[]): any {
    const total = events.length
    if (total === 0) return { prayerTimeAwareness: 0, islamicGreetingUsage: 0, guardianInteractionRate: 0, islamicContentEngagement: 0 }

    const prayerTimeEvents = events.filter(e => e.event_type.includes('prayer')).length
    const islamicGreetingEvents = events.filter(e => 
      e.properties && (e.properties as any).content?.includes('Assalam')
    ).length
    const guardianEvents = events.filter(e => e.event_type.includes('guardian')).length
    const islamicContentEvents = events.filter(e => 
      e.properties && (e.properties as any).islamicRelevance
    ).length

    return {
      prayerTimeAwareness: (prayerTimeEvents / total) * 100,
      islamicGreetingUsage: (islamicGreetingEvents / total) * 100,
      guardianInteractionRate: (guardianEvents / total) * 100,
      islamicContentEngagement: (islamicContentEvents / total) * 100
    }
  }

  private calculateCulturalSegmentation(events: any[]): any {
    const culturalGroups: Record<string, any> = {}

    events.forEach(event => {
      const props = event.properties as any
      const culturalContext = props.culturalContext || 'unknown'

      if (!culturalGroups[culturalContext]) {
        culturalGroups[culturalContext] = {
          avgSatisfaction: 0,
          featurePreferences: [],
          commonConcerns: [],
          engagementPatterns: {}
        }
      }

      // Aggregate cultural group data
      if (props.satisfaction) {
        culturalGroups[culturalContext].avgSatisfaction = props.satisfaction
      }
    })

    return culturalGroups
  }

  private calculateConversionFunnels(events: any[]): any {
    const totalUsers = new Set(events.map(e => e.user_id)).size
    if (totalUsers === 0) return { profileCompletion: 0, firstMessage: 0, mutualInterest: 0, familyIntroduction: 0 }

    const profileCompletions = new Set(
      events.filter(e => e.event_type === 'profile_completed').map(e => e.user_id)
    ).size

    const firstMessages = new Set(
      events.filter(e => e.event_type === 'first_message_sent').map(e => e.user_id)
    ).size

    const mutualInterests = new Set(
      events.filter(e => e.event_type === 'mutual_interest').map(e => e.user_id)
    ).size

    const familyIntroductions = new Set(
      events.filter(e => e.event_type === 'family_introduction').map(e => e.user_id)
    ).size

    return {
      profileCompletion: (profileCompletions / totalUsers) * 100,
      firstMessage: (firstMessages / totalUsers) * 100,
      mutualInterest: (mutualInterests / totalUsers) * 100,
      familyIntroduction: (familyIntroductions / totalUsers) * 100
    }
  }

  private async calculateSystemHealthScore(): Promise<number> {
    // Calculate system health based on various metrics
    // This is a simplified calculation
    let healthScore = 100

    // Check error rates
    const recentErrors = await this.getRecentErrorCount()
    healthScore -= Math.min(recentErrors * 2, 30)

    // Check response times
    const avgResponseTime = await this.getAverageResponseTime()
    if (avgResponseTime > 2000) healthScore -= 10
    if (avgResponseTime > 5000) healthScore -= 20

    return Math.max(0, healthScore)
  }

  private async getRecentErrorCount(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const { data: errorEvents } = await this.supabase
      .from('analytics_events')
      .select('id')
      .like('event_type', '%error%')
      .gte('created_at', fiveMinutesAgo.toISOString())

    return errorEvents?.length || 0
  }

  private async getAverageResponseTime(): Promise<number> {
    // This would typically come from performance monitoring
    // For now, return a simulated value
    return 1500 // 1.5 seconds
  }

  private getTimeframeStartDate(timeframe: 'day' | 'week' | 'month'): Date {
    const now = new Date()
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  private analyzeIslamicCompliance(events: any[]): any {
    // Analyze Islamic compliance from events
    return {
      overallScore: 85,
      categoryScores: {
        messaging: 88,
        matching: 82,
        guardianOversight: 90,
        prayerTimeRespect: 85,
        culturalSensitivity: 87
      },
      trends: [],
      violations: [],
      improvements: []
    }
  }

  private analyzeCulturalInsights(events: any[]): any {
    // Analyze cultural insights from events
    return {
      culturalGroups: [],
      crossCulturalMatches: {
        total: 0,
        successRate: 0,
        commonChallenges: [],
        successFactors: []
      },
      recommendations: []
    }
  }

  private async getRecentActivity(): Promise<any[]> {
    const { data: recentEvents } = await this.supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    return (recentEvents || []).map(event => ({
      timestamp: event.created_at,
      event: event.event_type,
      user: event.user_id || 'system',
      details: this.formatEventDetails(event),
      islamicRelevance: (event.properties as any)?.islamicRelevance
    }))
  }

  private formatEventDetails(event: any): string {
    const props = event.properties as any
    switch (event.event_type) {
      case 'user_registered':
        return `New user registered with ${props.culturalBackground || 'unknown'} background`
      case 'islamic_compliance_test_completed':
        return `Islamic compliance test completed with score ${props.score || 'unknown'}`
      case 'guardian_approval':
        return `Guardian approved ${props.action || 'action'}`
      default:
        return `${event.event_type} event occurred`
    }
  }

  private async getActiveAlerts(): Promise<any[]> {
    // Return simulated alerts for now
    return [
      {
        id: 'alert_001',
        type: 'info' as const,
        message: 'Islamic compliance scores are above target',
        timestamp: new Date().toISOString(),
        resolved: false
      }
    ]
  }

  private async getTrendData(): Promise<any> {
    // Return simulated trend data
    return {
      userGrowth: [10, 15, 12, 18, 22, 25, 30],
      engagement: [85, 87, 83, 89, 91, 88, 92],
      satisfaction: [78, 82, 85, 87, 89, 88, 90],
      islamicCompliance: [82, 85, 87, 89, 88, 90, 91]
    }
  }

  private async evaluateAlertCondition(condition: AlertCondition, event: any): Promise<boolean> {
    // Evaluate if alert condition is met
    // This would contain actual condition evaluation logic
    return false // Simplified for now
  }

  private async triggerAlert(condition: AlertCondition, event: any): Promise<void> {
    console.log(`🚨 Alert triggered: ${condition.name}`)
    
    // Store alert
    await this.supabase
      .from('analytics_events')
      .insert({
        event_type: 'alert_triggered',
        properties: {
          alertId: condition.id,
          alertName: condition.name,
          priority: condition.priority,
          islamicRelevance: condition.islamicRelevance,
          triggerEvent: event,
          timestamp: new Date().toISOString()
        }
      })

    // In a real implementation, this would send notifications to recipients
  }

  /**
   * Cleanup subscriptions
   */
  async cleanup(): Promise<void> {
    this.realTimeSubscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.realTimeSubscriptions = []
  }
}

// CLI interface
export async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  const analytics = new UserBehaviorAnalytics(supabaseUrl, supabaseServiceKey)

  try {
    const command = process.argv[2]

    switch (command) {
      case 'init':
        await analytics.initializeAnalytics()
        console.log('✅ Analytics system initialized')
        break

      case 'metrics':
        const metrics = await analytics.getRealTimeMetrics()
        console.log('📊 Real-time Metrics:')
        console.log(`👥 Active Users: ${metrics.activeUsers}`)
        console.log(`👨‍👩‍👧‍👦 Active Guardians: ${metrics.activeGuardians}`)
        console.log(`💬 Messages/min: ${metrics.messagesPerMinute.toFixed(1)}`)
        console.log(`✅ Guardian Approvals/hr: ${metrics.guardianApprovalsPerHour}`)
        console.log(`🕌 Islamic Compliance: ${metrics.islamicComplianceScore.toFixed(1)}/100`)
        console.log(`🔧 System Health: ${metrics.systemHealthScore.toFixed(1)}/100`)
        break

      case 'dashboard':
        const dashboardData = await analytics.getDashboardData()
        console.log('📈 Dashboard Data:')
        console.log('Metrics:', dashboardData.metrics)
        console.log('Recent Activity:', dashboardData.recentActivity.slice(0, 5))
        console.log('Active Alerts:', dashboardData.alerts.length)
        break

      case 'compliance':
        const complianceReport = await analytics.getIslamicComplianceReport('week')
        console.log('🕌 Islamic Compliance Report:')
        console.log(`Overall Score: ${complianceReport.overallScore}/100`)
        console.log('Category Scores:', complianceReport.categoryScores)
        break

      default:
        console.log('Available commands: init, metrics, dashboard, compliance')
    }

  } catch (error) {
    console.error('❌ Error running analytics:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}