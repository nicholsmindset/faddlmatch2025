import { ContentModerationRequest } from '../types'

/**
 * EscalationSystem - Manages escalation of content to human reviewers
 * 
 * Features:
 * - Intelligent escalation triggering
 * - Priority-based queue management
 * - Guardian notification system
 * - Scholar review for religious content
 * - Automatic escalation for edge cases
 */
export class EscalationSystem {
  
  // Escalation thresholds and rules
  private readonly escalationRules = {
    // Automatic escalation triggers
    automaticEscalation: {
      lowConfidence: 0.6,        // Below this confidence, escalate
      moderateRisk: 0.7,         // Above this risk, escalate
      religionsMentioned: true,   // Religious content needs review
      multipleViolations: 3      // 3+ violations = escalate
    },
    
    // Guardian notification triggers
    guardianNotification: {
      islamicViolation: 0.5,     // Islamic compliance below this
      inappropriateContent: 0.4, // General appropriateness below this
      culturalInsensitivity: 0.5, // Cultural sensitivity below this
      privacyViolation: true     // Any privacy/meeting violations
    },
    
    // Scholar review triggers
    scholarReview: {
      religiousInterpretation: true,
      islamicLawMentioned: true,
      controversialTopic: true,
      doctrinalQuestion: true
    }
  }

  /**
   * Evaluate if escalation is needed
   */
  async evaluateEscalation(
    request: ContentModerationRequest,
    appropriateness: number,
    islamicCompliance: any,
    culturalSensitivity: any
  ): Promise<EscalationResult> {
    
    const escalationReasons: string[] = []
    let severity: 'low' | 'medium' | 'high' = 'low'
    let reviewerType: 'ai' | 'human' | 'scholar' = 'ai'
    
    // Check automatic escalation triggers
    if (appropriateness < this.escalationRules.automaticEscalation.lowConfidence) {
      escalationReasons.push('Low confidence in content assessment')
      severity = 'medium'
      reviewerType = 'human'
    }
    
    if (islamicCompliance.score < this.escalationRules.automaticEscalation.moderateRisk) {
      escalationReasons.push('Islamic compliance concerns')
      severity = 'high'
      reviewerType = 'human'
    }
    
    if (islamicCompliance.violations && islamicCompliance.violations.length >= this.escalationRules.automaticEscalation.multipleViolations) {
      escalationReasons.push('Multiple policy violations detected')
      severity = 'high'
      reviewerType = 'human'
    }
    
    // Check for religious content requiring scholarly review
    if (this.requiresScholarlyReview(request.content, islamicCompliance.violations || [])) {
      escalationReasons.push('Religious content requires scholarly review')
      severity = 'medium'
      reviewerType = 'scholar'
    }
    
    // Check cultural sensitivity issues
    if (culturalSensitivity.score < this.escalationRules.automaticEscalation.moderateRisk) {
      escalationReasons.push('Cultural sensitivity concerns')
      severity = Math.max(severity === 'low' ? 'medium' : severity, 'medium') as 'medium' | 'high'
      reviewerType = reviewerType === 'ai' ? 'human' : reviewerType
    }
    
    // Determine guardian notification need
    const guardianAlert = this.evaluateGuardianNotification(
      appropriateness,
      islamicCompliance,
      culturalSensitivity,
      request
    )
    
    const escalationNeeded = escalationReasons.length > 0
    
    return {
      required: escalationNeeded,
      reason: escalationReasons.join('; '),
      severity,
      reviewerType,
      guardianAlert,
      priority: this.calculatePriority(severity, reviewerType, guardianAlert),
      estimatedReviewTime: this.estimateReviewTime(reviewerType, severity),
      recommendedAction: this.getRecommendedAction(escalationReasons, severity)
    }
  }

  /**
   * Check if content requires scholarly review
   */
  private requiresScholarlyReview(content: string, violations: string[]): boolean {
    const contentLower = content.toLowerCase()
    
    // Religious terminology requiring scholarly interpretation
    const religiousTerms = [
      'fatwa', 'haram', 'halal', 'sharia', 'fiqh', 'madhab',
      'scholar', 'imam', 'ruling', 'islamic law', 'jurisprudence'
    ]
    
    // Complex Islamic topics
    const complexTopics = [
      'polygamy', 'divorce', 'mahr', 'dowry', 'inheritance',
      'custody', 'nikah', 'talaq', 'iddat', 'khula'
    ]
    
    // Controversial areas requiring scholarly guidance
    const controversialTopics = [
      'interfaith', 'conversion', 'revert', 'sect', 'denomination',
      'sunni', 'shia', 'sufi', 'salafi', 'interpretation'
    ]
    
    // Check for any of these terms
    const hasReligiousTerms = religiousTerms.some(term => contentLower.includes(term))
    const hasComplexTopics = complexTopics.some(term => contentLower.includes(term))
    const hasControversialTopics = controversialTopics.some(term => contentLower.includes(term))
    
    // Check violations that require scholarly review
    const hasScholarlyViolations = violations.some(violation => 
      violation.includes('religious') || 
      violation.includes('interpretation') ||
      violation.includes('doctrine')
    )
    
    return hasReligiousTerms || hasComplexTopics || hasControversialTopics || hasScholarlyViolations
  }

  /**
   * Evaluate if guardian notification is needed
   */
  private evaluateGuardianNotification(
    appropriateness: number,
    islamicCompliance: any,
    culturalSensitivity: any,
    request: ContentModerationRequest
  ): GuardianAlert | undefined {
    
    const alerts: string[] = []
    let alertSeverity: 'low' | 'medium' | 'high' = 'low'
    
    // Islamic compliance issues
    if (islamicCompliance.score < this.escalationRules.guardianNotification.islamicViolation) {
      alerts.push('Content may not align with Islamic values')
      alertSeverity = 'high'
    }
    
    // General appropriateness issues
    if (appropriateness < this.escalationRules.guardianNotification.inappropriateContent) {
      alerts.push('Content appears inappropriate for matrimonial context')
      alertSeverity = 'high'
    }
    
    // Cultural sensitivity issues
    if (culturalSensitivity.score < this.escalationRules.guardianNotification.culturalInsensitivity) {
      alerts.push('Cultural sensitivity concerns detected')
      alertSeverity = alertSeverity === 'low' ? 'medium' : alertSeverity
    }
    
    // Privacy/meeting violations
    if (islamicCompliance.violations && islamicCompliance.violations.includes('alone_meetings')) {
      alerts.push('Inappropriate meeting arrangements suggested')
      alertSeverity = 'high'
    }
    
    if (islamicCompliance.violations && islamicCompliance.violations.includes('physical_references')) {
      alerts.push('Physical references detected in conversation')
      alertSeverity = 'high'
    }
    
    // Return alert if any issues found
    if (alerts.length > 0) {
      return {
        reason: alerts.join('; '),
        severity: alertSeverity,
        suggestedAction: this.getGuardianAction(alertSeverity, request.contentType)
      }
    }
    
    return undefined
  }

  /**
   * Calculate escalation priority
   */
  private calculatePriority(
    severity: 'low' | 'medium' | 'high',
    reviewerType: 'ai' | 'human' | 'scholar',
    guardianAlert?: GuardianAlert
  ): number {
    let priority = 0
    
    // Base priority by severity
    switch (severity) {
      case 'high': priority += 30; break
      case 'medium': priority += 20; break
      case 'low': priority += 10; break
    }
    
    // Reviewer type priority
    switch (reviewerType) {
      case 'scholar': priority += 15; break
      case 'human': priority += 10; break
      case 'ai': priority += 5; break
    }
    
    // Guardian alert priority
    if (guardianAlert) {
      switch (guardianAlert.severity) {
        case 'high': priority += 20; break
        case 'medium': priority += 10; break
        case 'low': priority += 5; break
      }
    }
    
    return Math.min(100, priority) // Cap at 100
  }

  /**
   * Estimate review time based on complexity
   */
  private estimateReviewTime(
    reviewerType: 'ai' | 'human' | 'scholar',
    severity: 'low' | 'medium' | 'high'
  ): number {
    const baseTimes = {
      ai: 1, // 1 minute
      human: 15, // 15 minutes
      scholar: 60 // 1 hour
    }
    
    const severityMultipliers = {
      low: 1,
      medium: 1.5,
      high: 2
    }
    
    return baseTimes[reviewerType] * severityMultipliers[severity]
  }

  /**
   * Get recommended action for escalation
   */
  private getRecommendedAction(reasons: string[], severity: 'low' | 'medium' | 'high'): string {
    if (reasons.some(r => r.includes('scholarly'))) {
      return 'Route to Islamic scholar for religious content review'
    }
    
    if (reasons.some(r => r.includes('Islamic compliance'))) {
      return 'Review for Islamic matrimonial appropriateness'
    }
    
    if (reasons.some(r => r.includes('cultural'))) {
      return 'Review for cultural sensitivity and appropriateness'
    }
    
    if (severity === 'high') {
      return 'Immediate human review required - potential policy violation'
    }
    
    if (severity === 'medium') {
      return 'Human review recommended within 24 hours'
    }
    
    return 'Schedule for routine human review'
  }

  /**
   * Get suggested guardian action
   */
  private getGuardianAction(
    severity: 'low' | 'medium' | 'high',
    contentType: string
  ): string {
    switch (severity) {
      case 'high':
        return `Immediate attention required - review ${contentType} and consider conversation intervention`
      
      case 'medium':
        return `Review ${contentType} and provide guidance to family member within 24 hours`
      
      case 'low':
        return `Review ${contentType} and consider providing gentle guidance if needed`
      
      default:
        return `Review ${contentType} for appropriateness`
    }
  }

  /**
   * Create escalation ticket
   */
  async createEscalationTicket(
    request: ContentModerationRequest,
    escalation: EscalationResult
  ): Promise<EscalationTicket> {
    const ticketId = this.generateTicketId()
    
    const ticket: EscalationTicket = {
      id: ticketId,
      createdAt: new Date().toISOString(),
      userId: request.userId,
      contentType: request.contentType,
      content: request.content,
      reason: escalation.reason!,
      severity: escalation.severity,
      reviewerType: escalation.reviewerType,
      priority: escalation.priority,
      status: 'pending',
      estimatedReviewTime: escalation.estimatedReviewTime,
      guardianAlert: escalation.guardianAlert,
      context: {
        recipientId: request.context.recipientId,
        conversationId: request.context.conversationId,
        culturalContext: request.culturalContext
      }
    }
    
    // In production, this would save to database
    console.log('Escalation ticket created:', ticket)
    
    return ticket
  }

  /**
   * Generate unique ticket ID
   */
  private generateTicketId(): string {
    return `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }

  /**
   * Get escalation queue statistics
   */
  async getEscalationStats(): Promise<EscalationStats> {
    // In production, this would query the database
    return {
      totalPending: 0,
      byReviewerType: {
        human: 0,
        scholar: 0,
        ai: 0
      },
      bySeverity: {
        high: 0,
        medium: 0,
        low: 0
      },
      averageResolutionTime: 0,
      guardiansNotified: 0
    }
  }

  /**
   * Process escalation queue (background job)
   */
  async processEscalationQueue(): Promise<void> {
    // In production, this would:
    // 1. Query pending escalations from database
    // 2. Route to appropriate reviewers
    // 3. Send notifications to guardians
    // 4. Update ticket statuses
    // 5. Track metrics
    
    console.log('Processing escalation queue...')
  }
}

// Supporting interfaces
interface EscalationResult {
  required: boolean
  reason?: string
  severity: 'low' | 'medium' | 'high'
  reviewerType: 'ai' | 'human' | 'scholar'
  guardianAlert?: GuardianAlert
  priority: number
  estimatedReviewTime: number
  recommendedAction: string
}

interface GuardianAlert {
  reason: string
  severity: 'low' | 'medium' | 'high'
  suggestedAction: string
}

interface EscalationTicket {
  id: string
  createdAt: string
  userId: string
  contentType: string
  content: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  reviewerType: 'ai' | 'human' | 'scholar'
  priority: number
  status: 'pending' | 'in_review' | 'resolved' | 'escalated'
  estimatedReviewTime: number
  guardianAlert?: GuardianAlert
  context: {
    recipientId?: string
    conversationId?: string
    culturalContext: any
  }
  assignedTo?: string
  resolvedAt?: string
  resolution?: string
}

interface EscalationStats {
  totalPending: number
  byReviewerType: {
    human: number
    scholar: number
    ai: number
  }
  bySeverity: {
    high: number
    medium: number
    low: number
  }
  averageResolutionTime: number
  guardiansNotified: number
}