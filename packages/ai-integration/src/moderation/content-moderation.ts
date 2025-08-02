import OpenAI from 'openai'
import { 
  ContentModerationRequest, 
  ModerationResult, 
  AIConfig,
  ModerationError 
} from '../types'
import { IslamicComplianceChecker } from './islamic-compliance'
import { EscalationSystem } from './escalation-system'

/**
 * ContentModerationSystem - AI-powered content moderation for Islamic matrimonial platform
 * 
 * Features:
 * - Real-time Islamic compliance checking
 * - Multi-language inappropriate content detection
 * - Cultural sensitivity analysis
 * - Graduated response system (warn, moderate, escalate)
 * - Guardian notification triggers
 * - Scholar review queue for religious content
 */
export class ContentModerationSystem {
  private openai: OpenAI
  private islamicChecker: IslamicComplianceChecker
  private escalationSystem: EscalationSystem
  
  // Moderation confidence thresholds
  private readonly thresholds = {
    autoApprove: 0.9,      // Automatically approve high-confidence appropriate content
    autoReject: 0.3,       // Automatically reject high-confidence inappropriate content
    humanReview: 0.7,      // Require human review for uncertain content
    scholarReview: 0.8     // Religious content requiring scholarly review
  }

  constructor(config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    })
    
    this.islamicChecker = new IslamicComplianceChecker()
    this.escalationSystem = new EscalationSystem()
  }

  /**
   * Comprehensive content moderation with Islamic compliance checking
   */
  async moderateContent(request: ContentModerationRequest): Promise<ModerationResult> {
    try {
      // Step 1: Basic OpenAI moderation check
      const openaiModeration = await this.performOpenAIModeration(request.content)
      
      // Step 2: Islamic compliance analysis
      const islamicCompliance = await this.islamicChecker.checkCompliance(
        request.content,
        request.contentType,
        request.culturalContext
      )
      
      // Step 3: Cultural sensitivity analysis
      const culturalSensitivity = await this.analyzeCulturalSensitivity(
        request.content,
        request.culturalContext
      )
      
      // Step 4: Content analysis (sentiment, topics, language)
      const contentAnalysis = await this.analyzeContent(request.content)
      
      // Step 5: Calculate overall appropriateness score
      const appropriateness = this.calculateAppropriatenessScore(
        openaiModeration,
        islamicCompliance,
        culturalSensitivity,
        contentAnalysis
      )
      
      // Step 6: Determine approval status
      const approved = this.determineApprovalStatus(appropriateness, islamicCompliance)
      
      // Step 7: Check if escalation is needed
      const escalation = await this.escalationSystem.evaluateEscalation(
        request,
        appropriateness,
        islamicCompliance,
        culturalSensitivity
      )
      
      // Step 8: Compile moderation result
      const result: ModerationResult = {
        approved,
        confidence: Math.min(
          openaiModeration.confidence,
          islamicCompliance.confidence,
          culturalSensitivity.confidence
        ),
        islamicCompliance: {
          score: islamicCompliance.score,
          violations: islamicCompliance.violations,
          guidance: islamicCompliance.guidance
        },
        culturalSensitivity: {
          score: culturalSensitivity.score,
          concerns: culturalSensitivity.concerns,
          suggestions: culturalSensitivity.suggestions
        },
        contentAnalysis: {
          language: contentAnalysis.language,
          sentiment: contentAnalysis.sentiment,
          topics: contentAnalysis.topics,
          appropriateness
        },
        escalation
      }

      // Log moderation action for audit trail
      await this.logModerationAction(request, result)
      
      return result

    } catch (error) {
      throw new ModerationError(
        'Content moderation failed',
        { 
          userId: request.userId,
          contentType: request.contentType,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    }
  }

  /**
   * Batch moderate multiple content items
   */
  async moderateContentBatch(requests: ContentModerationRequest[]): Promise<ModerationResult[]> {
    const batchSize = 5 // Process in small batches to avoid rate limits
    const results: ModerationResult[] = []

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(request => this.moderateContent(request))
      )
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + batchSize < requests.length) {
        await this.delay(1000)
      }
    }

    return results
  }

  /**
   * Perform OpenAI moderation check
   */
  private async performOpenAIModeration(content: string): Promise<OpenAIModerationResult> {
    try {
      const response = await this.openai.moderations.create({
        input: content,
      })

      const result = response.results[0]
      const flagged = result.flagged
      const categories = result.categories
      const categoryScores = result.category_scores

      // Calculate confidence based on scores
      const maxScore = Math.max(...Object.values(categoryScores))
      const confidence = flagged ? Math.min(0.95, maxScore * 1.2) : Math.min(0.95, 1 - maxScore)

      return {
        flagged,
        categories,
        categoryScores,
        confidence,
        violations: flagged ? Object.keys(categories).filter(key => categories[key as keyof typeof categories]) : []
      }

    } catch (error) {
      console.error('OpenAI moderation error:', error)
      
      // Return conservative result if API fails
      return {
        flagged: true,
        categories: {} as any,
        categoryScores: {} as any,
        confidence: 0.5,
        violations: ['moderation_api_error']
      }
    }
  }

  /**
   * Analyze cultural sensitivity
   */
  private async analyzeCulturalSensitivity(
    content: string,
    culturalContext: ContentModerationRequest['culturalContext']
  ): Promise<CulturalSensitivityResult> {
    try {
      const prompt = this.createCulturalSensitivityPrompt(content, culturalContext)
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a cultural sensitivity expert for Islamic matrimonial platforms. Analyze content for cultural appropriateness across different Muslim communities. Consider Arab, South Asian, Southeast Asian, African, Turkish, Persian, Convert, and Mixed cultural backgrounds.

            Respond with JSON containing:
            - score (0-1): Cultural sensitivity score
            - confidence (0-1): Confidence in analysis
            - concerns (array): Any cultural concerns
            - suggestions (array): Suggestions for improvement
            - culturalNotes (string): Relevant cultural context`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })

      const responseContent = response.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from cultural sensitivity analysis')
      }

      return this.parseCulturalSensitivityResponse(responseContent)

    } catch (error) {
      console.error('Cultural sensitivity analysis error:', error)
      
      // Return safe default
      return {
        score: 0.7,
        confidence: 0.5,
        concerns: ['Cultural analysis failed - manual review recommended'],
        suggestions: ['Consider cultural context and sensitivity'],
        culturalNotes: 'Analysis failed - default neutral assessment'
      }
    }
  }

  /**
   * Analyze content for sentiment, topics, and language
   */
  private async analyzeContent(content: string): Promise<ContentAnalysisResult> {
    try {
      const prompt = `Analyze this content for an Islamic matrimonial platform:

      Content: "${content}"

      Provide analysis including:
      1. Primary language detected
      2. Sentiment (positive/neutral/negative)
      3. Main topics discussed
      4. Overall appropriateness for matrimonial context (0-1 score)

      Respond with JSON format.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a content analysis expert. Provide detailed analysis in JSON format with: language, sentiment, topics (array), appropriateness (0-1).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })

      const responseContent = response.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from content analysis')
      }

      return this.parseContentAnalysisResponse(responseContent)

    } catch (error) {
      console.error('Content analysis error:', error)
      
      // Return safe default
      return {
        language: 'unknown',
        sentiment: 'neutral',
        topics: ['analysis_failed'],
        appropriateness: 0.5
      }
    }
  }

  /**
   * Calculate overall appropriateness score
   */
  private calculateAppropriatenessScore(
    openaiResult: OpenAIModerationResult,
    islamicResult: any,
    culturalResult: CulturalSensitivityResult,
    contentResult: ContentAnalysisResult
  ): number {
    // Weighted scoring system
    const weights = {
      openai: 0.25,      // Basic safety check
      islamic: 0.40,     // Highest weight for Islamic compliance
      cultural: 0.20,    // Cultural sensitivity
      content: 0.15      // General content appropriateness
    }

    const scores = {
      openai: openaiResult.flagged ? 0.1 : 0.9,
      islamic: islamicResult.score,
      cultural: culturalResult.score,
      content: contentResult.appropriateness
    }

    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight)
    }, 0)

    return Math.max(0, Math.min(1, weightedScore))
  }

  /**
   * Determine approval status based on scores and thresholds
   */
  private determineApprovalStatus(
    appropriateness: number,
    islamicCompliance: any
  ): boolean {
    // Auto-reject if very low scores
    if (appropriateness < this.thresholds.autoReject) {
      return false
    }

    // Auto-reject if serious Islamic violations
    if (islamicCompliance.score < 0.4) {
      return false
    }

    // Auto-approve if high confidence and scores
    if (appropriateness >= this.thresholds.autoApprove && islamicCompliance.score >= 0.8) {
      return true
    }

    // Conservative approach for uncertain content
    return appropriateness >= 0.6 && islamicCompliance.score >= 0.6
  }

  /**
   * Create cultural sensitivity analysis prompt
   */
  private createCulturalSensitivityPrompt(
    content: string,
    culturalContext: ContentModerationRequest['culturalContext']
  ): string {
    return `Analyze this content for cultural sensitivity in Islamic matrimonial context:

    Content: "${content}"
    
    Cultural Context:
    - Primary Language: ${culturalContext.primaryLanguage}
    - Cultural Background: ${culturalContext.culturalBackground}
    - Religious Level: ${culturalContext.religiousLevel}
    
    Consider:
    1. Appropriateness across different Muslim cultures
    2. Language formality and respect levels
    3. Family involvement expectations
    4. Gender interaction guidelines
    5. Regional Islamic practices and customs
    
    Rate cultural sensitivity (0-1) and provide specific feedback.`
  }

  /**
   * Parse cultural sensitivity response
   */
  private parseCulturalSensitivityResponse(response: string): CulturalSensitivityResult {
    try {
      const parsed = JSON.parse(response)
      return {
        score: parsed.score || 0.7,
        confidence: parsed.confidence || 0.7,
        concerns: parsed.concerns || [],
        suggestions: parsed.suggestions || [],
        culturalNotes: parsed.culturalNotes || 'No specific cultural notes'
      }
    } catch {
      // Fallback parsing
      const score = response.includes('appropriate') ? 0.8 : 
                   response.includes('concerning') ? 0.4 : 0.6
      
      return {
        score,
        confidence: 0.6,
        concerns: response.includes('concern') ? ['Cultural concerns identified'] : [],
        suggestions: ['Review for cultural appropriateness'],
        culturalNotes: 'Fallback analysis - manual review recommended'
      }
    }
  }

  /**
   * Parse content analysis response
   */
  private parseContentAnalysisResponse(response: string): ContentAnalysisResult {
    try {
      const parsed = JSON.parse(response)
      return {
        language: parsed.language || 'english',
        sentiment: parsed.sentiment || 'neutral',
        topics: parsed.topics || ['general'],
        appropriateness: parsed.appropriateness || 0.7
      }
    } catch {
      // Extract basic info without JSON
      const language = response.includes('arabic') ? 'arabic' : 
                      response.includes('urdu') ? 'urdu' : 'english'
      
      const sentiment = response.includes('positive') ? 'positive' :
                       response.includes('negative') ? 'negative' : 'neutral'
      
      return {
        language,
        sentiment,
        topics: ['analysis_failed'],
        appropriateness: 0.6
      }
    }
  }

  /**
   * Log moderation action for audit trail
   */
  private async logModerationAction(
    request: ContentModerationRequest,
    result: ModerationResult
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: request.userId,
      contentType: request.contentType,
      approved: result.approved,
      confidence: result.confidence,
      islamicScore: result.islamicCompliance.score,
      culturalScore: result.culturalSensitivity.score,
      escalated: result.escalation.required,
      action: result.approved ? 'approved' : 'rejected'
    }

    // In production, this would write to audit log database
    console.log('Moderation Action:', logEntry)
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<ModerationStats> {
    // In production, this would query the audit log database
    return {
      totalModerated: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      averageScore: 0,
      commonViolations: [],
      processingTime: 0
    }
  }
}

// Supporting interfaces
interface OpenAIModerationResult {
  flagged: boolean
  categories: any
  categoryScores: any
  confidence: number
  violations: string[]
}

interface CulturalSensitivityResult {
  score: number
  confidence: number
  concerns: string[]
  suggestions: string[]
  culturalNotes: string
}

interface ContentAnalysisResult {
  language: string
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
  appropriateness: number
}

interface ModerationStats {
  totalModerated: number
  approved: number
  rejected: number
  escalated: number
  averageScore: number
  commonViolations: string[]
  processingTime: number
}