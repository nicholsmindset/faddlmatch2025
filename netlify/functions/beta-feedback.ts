import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface BetaFeedback {
  userId: string
  userEmail: string
  feedbackType: 'bug' | 'feature' | 'usability' | 'islamic-compliance' | 'family-experience'
  category: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  page: string
  deviceInfo: {
    userAgent: string
    viewport: string
    platform: string
  }
  islamicComplianceRating?: number // 1-5 scale
  familyFriendlinessRating?: number // 1-5 scale
  overallExperience?: number // 1-5 scale
  timestamp: string
}

interface FeedbackSummary {
  totalFeedback: number
  averageRatings: {
    islamicCompliance: number
    familyFriendliness: number
    overallExperience: number
  }
  topIssues: Array<{
    category: string
    count: number
    severity: string
  }>
  recentFeedback: BetaFeedback[]
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  try {
    if (event.httpMethod === 'POST') {
      return await submitBetaFeedback(event)
    } else if (event.httpMethod === 'GET') {
      return await getFeedbackSummary(event)
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }
  } catch (error) {
    console.error('Beta feedback error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

async function submitBetaFeedback(event: HandlerEvent) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing feedback data' })
    }
  }

  const feedback: BetaFeedback = JSON.parse(event.body)
  
  // Validate required fields
  if (!feedback.userId || !feedback.feedbackType || !feedback.title || !feedback.description) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required feedback fields' })
    }
  }

  // Validate Islamic compliance and family ratings if provided
  if (feedback.islamicComplianceRating && (feedback.islamicComplianceRating < 1 || feedback.islamicComplianceRating > 5)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Islamic compliance rating must be between 1 and 5' })
    }
  }

  // Store feedback in database
  const feedbackId = await storeBetaFeedback(feedback)
  
  // Process feedback for immediate action if critical
  if (feedback.severity === 'critical') {
    await handleCriticalFeedback(feedback, feedbackId)
  }
  
  // Send acknowledgment to user
  await sendFeedbackAcknowledgment(feedback)
  
  // Update feedback analytics
  await updateFeedbackAnalytics(feedback)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      success: true,
      feedbackId,
      message: 'Thank you for your feedback! Our team will review it promptly.',
      islamicComplianceNote: feedback.feedbackType === 'islamic-compliance' ? 
        'Islamic compliance feedback is prioritized for immediate review.' : undefined
    })
  }
}

async function getFeedbackSummary(event: HandlerEvent) {
  const { queryStringParameters } = event
  const timeRange = queryStringParameters?.timeRange || '7d'
  const feedbackType = queryStringParameters?.type
  
  try {
    const summary = await fetchFeedbackSummary(timeRange, feedbackType)
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        timeRange,
        feedbackType,
        summary,
        insights: generateFeedbackInsights(summary)
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch feedback summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

async function storeBetaFeedback(feedback: BetaFeedback): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration for feedback storage')
  }

  const feedbackData = {
    id: generateFeedbackId(),
    user_id: feedback.userId,
    user_email: feedback.userEmail,
    feedback_type: feedback.feedbackType,
    category: feedback.category,
    title: feedback.title,
    description: feedback.description,
    severity: feedback.severity,
    page: feedback.page,
    device_info: feedback.deviceInfo,
    islamic_compliance_rating: feedback.islamicComplianceRating,
    family_friendliness_rating: feedback.familyFriendlinessRating,
    overall_experience: feedback.overallExperience,
    timestamp: feedback.timestamp,
    status: 'open',
    environment: process.env.CONTEXT || 'staging'
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/beta_feedback`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(feedbackData)
    })

    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.status}`)
    }

    const result = await response.json()
    return result[0]?.id || feedbackData.id
  } catch (error) {
    console.error('Error storing beta feedback:', error)
    throw error
  }
}

async function handleCriticalFeedback(feedback: BetaFeedback, feedbackId: string) {
  // Send immediate alert for critical feedback
  const alertData = {
    feedbackId,
    type: 'CRITICAL_BETA_FEEDBACK',
    severity: 'critical',
    title: feedback.title,
    description: feedback.description,
    userId: feedback.userId,
    userEmail: feedback.userEmail,
    page: feedback.page,
    timestamp: feedback.timestamp,
    islamicCompliance: feedback.feedbackType === 'islamic-compliance'
  }

  try {
    // Send to Slack for immediate attention
    const slackWebhook = process.env.SLACK_FEEDBACK_WEBHOOK
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 CRITICAL Beta Feedback - Immediate Action Required`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Critical Beta Feedback*\n*Type:* ${feedback.feedbackType}\n*Page:* ${feedback.page}\n*User:* ${feedback.userEmail}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Title:* ${feedback.title}\n*Description:* ${feedback.description}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: feedback.feedbackType === 'islamic-compliance' ? 
                  '⚠️ *Islamic Compliance Issue* - Requires immediate review' : 
                  '🔥 *Critical Issue* - User experience severely impacted'
              }
            }
          ]
        })
      })
    }

    // Create urgent ticket in project management system
    await createUrgentTicket(feedback, feedbackId)
    
  } catch (error) {
    console.error('Error handling critical feedback:', error)
  }
}

async function sendFeedbackAcknowledgment(feedback: BetaFeedback) {
  // Send email acknowledgment to user
  try {
    const emailData = {
      to: feedback.userEmail,
      subject: 'Thank you for your beta feedback - FADDL Match',
      template: 'beta-feedback-acknowledgment',
      data: {
        feedbackType: feedback.feedbackType,
        title: feedback.title,
        islamicCompliance: feedback.feedbackType === 'islamic-compliance',
        estimatedResponse: feedback.severity === 'critical' ? '24 hours' : '3-5 business days'
      }
    }

    // This would integrate with your email service (SendGrid, etc.)
    console.log('Email acknowledgment would be sent:', emailData)
    
  } catch (error) {
    console.error('Error sending feedback acknowledgment:', error)
  }
}

async function updateFeedbackAnalytics(feedback: BetaFeedback) {
  // Update real-time analytics for feedback tracking
  const analyticsData = {
    event: 'beta_feedback_submitted',
    properties: {
      feedback_type: feedback.feedbackType,
      severity: feedback.severity,
      page: feedback.page,
      islamic_compliance_rating: feedback.islamicComplianceRating,
      family_friendliness_rating: feedback.familyFriendlinessRating,
      overall_experience: feedback.overallExperience,
      platform: feedback.deviceInfo.platform
    },
    timestamp: feedback.timestamp,
    user_id: feedback.userId
  }

  try {
    // Store in analytics database
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/feedback_analytics`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      })
    }
  } catch (error) {
    console.error('Error updating feedback analytics:', error)
  }
}

async function fetchFeedbackSummary(timeRange: string, feedbackType?: string): Promise<FeedbackSummary> {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  const intervals: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }
  
  const since = new Date(Date.now() - (intervals[timeRange] || intervals['7d'])).toISOString()
  
  let query = `beta_feedback?timestamp=gte.${since}`
  if (feedbackType) {
    query += `&feedback_type=eq.${feedbackType}`
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch feedback: ${response.status}`)
  }

  const feedbackData = await response.json()
  
  return {
    totalFeedback: feedbackData.length,
    averageRatings: calculateAverageRatings(feedbackData),
    topIssues: identifyTopIssues(feedbackData),
    recentFeedback: feedbackData.slice(0, 10) // Most recent 10
  }
}

function calculateAverageRatings(feedbackData: any[]) {
  const ratings = {
    islamicCompliance: 0,
    familyFriendliness: 0,
    overallExperience: 0
  }

  const counts = {
    islamicCompliance: 0,
    familyFriendliness: 0,
    overallExperience: 0
  }

  feedbackData.forEach(feedback => {
    if (feedback.islamic_compliance_rating) {
      ratings.islamicCompliance += feedback.islamic_compliance_rating
      counts.islamicCompliance++
    }
    if (feedback.family_friendliness_rating) {
      ratings.familyFriendliness += feedback.family_friendliness_rating
      counts.familyFriendliness++
    }
    if (feedback.overall_experience) {
      ratings.overallExperience += feedback.overall_experience
      counts.overallExperience++
    }
  })

  return {
    islamicCompliance: counts.islamicCompliance > 0 ? ratings.islamicCompliance / counts.islamicCompliance : 0,
    familyFriendliness: counts.familyFriendliness > 0 ? ratings.familyFriendliness / counts.familyFriendliness : 0,
    overallExperience: counts.overallExperience > 0 ? ratings.overallExperience / counts.overallExperience : 0
  }
}

function identifyTopIssues(feedbackData: any[]) {
  const issueCount: Record<string, { count: number; severity: string }> = {}

  feedbackData.forEach(feedback => {
    if (feedback.category) {
      if (!issueCount[feedback.category]) {
        issueCount[feedback.category] = { count: 0, severity: 'low' }
      }
      issueCount[feedback.category].count++
      
      // Track highest severity for each category
      const severityRank = { low: 1, medium: 2, high: 3, critical: 4 }
      if (severityRank[feedback.severity] > severityRank[issueCount[feedback.category].severity]) {
        issueCount[feedback.category].severity = feedback.severity
      }
    }
  })

  return Object.entries(issueCount)
    .map(([category, data]) => ({
      category,
      count: data.count,
      severity: data.severity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function generateFeedbackInsights(summary: FeedbackSummary) {
  const insights = []

  // Islamic compliance insights
  if (summary.averageRatings.islamicCompliance > 0) {
    if (summary.averageRatings.islamicCompliance < 3) {
      insights.push({
        type: 'warning',
        category: 'islamic-compliance',
        message: `Islamic compliance rating is below expectations (${summary.averageRatings.islamicCompliance.toFixed(1)}/5). Immediate review recommended.`
      })
    } else if (summary.averageRatings.islamicCompliance >= 4) {
      insights.push({
        type: 'success',
        category: 'islamic-compliance',
        message: `Excellent Islamic compliance rating (${summary.averageRatings.islamicCompliance.toFixed(1)}/5). Users appreciate our Islamic values integration.`
      })
    }
  }

  // Family experience insights
  if (summary.averageRatings.familyFriendliness > 0) {
    if (summary.averageRatings.familyFriendliness < 3) {
      insights.push({
        type: 'warning',
        category: 'family-experience',
        message: `Family-friendliness rating needs improvement (${summary.averageRatings.familyFriendliness.toFixed(1)}/5). Consider family-focused features.`
      })
    }
  }

  // Top issues insights
  if (summary.topIssues.length > 0) {
    const criticalIssues = summary.topIssues.filter(issue => issue.severity === 'critical')
    if (criticalIssues.length > 0) {
      insights.push({
        type: 'critical',
        category: 'issues',
        message: `${criticalIssues.length} critical issue categories require immediate attention: ${criticalIssues.map(i => i.category).join(', ')}`
      })
    }
  }

  return insights
}

async function createUrgentTicket(feedback: BetaFeedback, feedbackId: string) {
  // This would integrate with your project management system (Jira, Linear, etc.)
  const ticketData = {
    title: `[CRITICAL BETA] ${feedback.title}`,
    description: `${feedback.description}\n\nFeedback ID: ${feedbackId}\nUser: ${feedback.userEmail}\nPage: ${feedback.page}`,
    priority: 'urgent',
    labels: ['beta-feedback', 'critical', feedback.feedbackType],
    assignee: feedback.feedbackType === 'islamic-compliance' ? 'islamic-compliance-team' : 'product-team'
  }

  console.log('Urgent ticket would be created:', ticketData)
}

function generateFeedbackId(): string {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}