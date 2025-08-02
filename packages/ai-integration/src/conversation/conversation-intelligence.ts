import OpenAI from 'openai'
import { 
  ConversationContext, 
  ConversationSuggestion, 
  ConversationAnalysis,
  AIConfig,
  ConversationError 
} from '../types'
import type { UserProfile, Gender } from '@faddl-match/types'
import { CulturalContextManager } from './cultural-context'
import { IslamicGuidanceProvider } from './islamic-guidance'

/**
 * ConversationIntelligence - AI-powered conversation assistance for Islamic matrimonial platform
 * 
 * Features:
 * - Islamic-appropriate conversation starters
 * - Cultural context-aware suggestions
 * - Guardian involvement facilitation
 * - Real-time conversation analysis
 * - Escalation detection for inappropriate content
 * - Multi-language support with cultural nuances
 */
export class ConversationIntelligence {
  private openai: OpenAI
  private culturalManager: CulturalContextManager
  private islamicGuidance: IslamicGuidanceProvider

  constructor(config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    })
    
    this.culturalManager = new CulturalContextManager()
    this.islamicGuidance = new IslamicGuidanceProvider()
  }

  /**
   * Generate conversation suggestions based on context and Islamic guidelines
   */
  async generateConversationSuggestions(
    context: ConversationContext,
    requestingUserId: string,
    recipientProfile: UserProfile
  ): Promise<ConversationSuggestion[]> {
    try {
      const suggestions: ConversationSuggestion[] = []
      
      // Get cultural context for both users
      const culturalContext = await this.culturalManager.getCulturalContext(
        context.participants[0].culturalBackground,
        context.participants[1].culturalBackground
      )

      // Generate different types of suggestions based on conversation stage
      switch (context.stage) {
        case 'introduction':
          suggestions.push(...await this.generateIntroductionSuggestions(context, culturalContext))
          break
          
        case 'getting_to_know':
          suggestions.push(...await this.generateGettingToKnowSuggestions(context, recipientProfile, culturalContext))
          break
          
        case 'family_discussion':
          suggestions.push(...await this.generateFamilyDiscussionSuggestions(context, culturalContext))
          break
          
        case 'meeting_planning':
          suggestions.push(...await this.generateMeetingPlanningsuggestions(context, culturalContext))
          break
      }

      // Add Islamic guidance where appropriate
      for (const suggestion of suggestions) {
        suggestion.islamicGuidance = await this.islamicGuidance.getContextualGuidance(
          suggestion.type,
          context.stage
        )
      }

      return suggestions.slice(0, 5) // Return top 5 suggestions

    } catch (error) {
      throw new ConversationError(
        'Failed to generate conversation suggestions',
        { error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Analyze conversation content for appropriateness and Islamic compliance
   */
  async analyzeConversation(
    message: string,
    context: ConversationContext,
    senderProfile: UserProfile
  ): Promise<ConversationAnalysis> {
    try {
      const prompt = this.createAnalysisPrompt(message, context, senderProfile)
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an Islamic matrimonial platform moderator. Analyze messages for:
            1. Islamic compliance and appropriateness
            2. Cultural sensitivity
            3. Respectful communication
            4. Guardian involvement needs
            5. Potential concerns or red flags
            
            Respond with JSON containing: sentiment, appropriateness (0-1), islamicCompliance (0-1), culturalSensitivity (0-1), escalationNeeded (boolean), recommendations (array), guardianAlert (object with reason, severity, suggestedAction if needed).`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new ConversationError('No response from AI analysis')
      }

      return this.parseAnalysisResponse(content)

    } catch (error) {
      console.error('Error analyzing conversation:', error)
      
      // Return safe fallback analysis
      return {
        sentiment: 'neutral',
        appropriateness: 0.5,
        islamicCompliance: 0.5,
        culturalSensitivity: 0.5,
        escalationNeeded: true, // Err on the side of caution
        recommendations: ['Message analysis failed - manual review recommended']
      }
    }
  }

  /**
   * Generate introduction suggestions for first messages
   */
  private async generateIntroductionSuggestions(
    context: ConversationContext,
    culturalContext: any
  ): Promise<ConversationSuggestion[]> {
    const suggestions: ConversationSuggestion[] = []

    // Islamic greeting
    suggestions.push({
      type: 'greeting',
      content: 'Assalamu alaikum wa rahmatullahi wa barakatuh. I hope this message finds you in the best of health and iman.',
      culturalContext: 'Traditional Islamic greeting showing respect and good intentions',
      confidence: 0.95,
      alternatives: [
        'Assalamu alaikum sister/brother. May Allah bless you with peace and happiness.',
        'Peace be upon you. I pray this message reaches you in good health and faith.'
      ]
    })

    // Respectful introduction
    suggestions.push({
      type: 'greeting',
      content: 'I came across your profile and was impressed by your commitment to Islamic values. I would be honored to get to know you better, with Allah\'s guidance.',
      culturalContext: 'Respectful approach emphasizing Islamic values and divine guidance',
      confidence: 0.90,
      alternatives: [
        'Your profile caught my attention, particularly your dedication to faith. I hope we can learn about each other with Allah\'s blessing.',
        'I appreciate how you\'ve expressed your Islamic values. I would like to respectfully introduce myself.'
      ]
    })

    // Family-oriented introduction
    if (context.guardianInvolved) {
      suggestions.push({
        type: 'greeting',
        content: 'I am writing with the knowledge and blessing of my family, as they support my search for a righteous spouse. I hope we can proceed with proper guidance.',
        culturalContext: 'Emphasizes family involvement and proper Islamic courtship',
        confidence: 0.88,
        alternatives: [
          'My family is aware of my interest in getting to know you better, and they support this introduction.',
          'I approach you with my family\'s blessing and guidance, seeking Allah\'s will in this matter.'
        ]
      })
    }

    return suggestions
  }

  /**
   * Generate getting-to-know suggestions
   */
  private async generateGettingToKnowSuggestions(
    context: ConversationContext,
    recipientProfile: UserProfile,
    culturalContext: any
  ): Promise<ConversationSuggestion[]> {
    const suggestions: ConversationSuggestion[] = []

    // Islamic questions
    suggestions.push({
      type: 'question',
      content: 'What aspects of Islam bring you the most peace and fulfillment in your daily life?',
      culturalContext: 'Focuses on spiritual connection and Islamic practice',
      confidence: 0.92,
      alternatives: [
        'How do you incorporate Islamic teachings into your daily routine?',
        'What Islamic values are most important to you in building a family?'
      ]
    })

    // Family values
    suggestions.push({
      type: 'question',
      content: 'Family is central to Islamic life. What role do you envision your spouse playing in building a strong Muslim household?',
      culturalContext: 'Discusses family building within Islamic framework',
      confidence: 0.90,
      alternatives: [
        'How important is family involvement in your decision-making process?',
        'What are your hopes for raising children with strong Islamic values?'
      ]
    })

    // Cultural background (if different ethnicities)
    const participant1 = context.participants[0]
    const participant2 = context.participants[1]
    
    if (participant1.culturalBackground !== participant2.culturalBackground) {
      suggestions.push({
        type: 'question',
        content: `I notice we come from different cultural backgrounds. I'd love to learn about ${recipientProfile.ethnicity} Islamic traditions and how they've shaped your faith.`,
        culturalContext: 'Shows interest in cultural diversity within Islam',
        confidence: 0.85,
        alternatives: [
          'How has your cultural background enriched your understanding of Islam?',
          'I\'m curious about the Islamic traditions specific to your cultural heritage.'
        ]
      })
    }

    // Career and goals
    suggestions.push({
      type: 'question',
      content: 'How do you balance your professional goals with your Islamic principles and family aspirations?',
      culturalContext: 'Discusses work-life balance within Islamic framework',
      confidence: 0.87,
      alternatives: [
        'What are your career aspirations, and how do they align with your Islamic values?',
        'How do you see balancing work responsibilities with family and religious obligations?'
      ]
    })

    return suggestions
  }

  /**
   * Generate family discussion suggestions
   */
  private async generateFamilyDiscussionSuggestions(
    context: ConversationContext,
    culturalContext: any
  ): Promise<ConversationSuggestion[]> {
    const suggestions: ConversationSuggestion[] = []

    // Guardian involvement
    suggestions.push({
      type: 'family_introduction',
      content: 'I would be honored to have my family reach out to yours to discuss our mutual interest in marriage, as is proper in Islam.',
      culturalContext: 'Initiates formal family involvement following Islamic guidelines',
      confidence: 0.95,
      alternatives: [
        'Perhaps it\'s time for our families to meet and discuss how we can proceed with Allah\'s blessing.',
        'I believe our families should be introduced to guide us in this important decision.'
      ]
    })

    // Family expectations
    suggestions.push({
      type: 'question',
      content: 'What are your family\'s expectations for marriage, and how can we ensure both families feel comfortable and respected?',
      culturalContext: 'Shows respect for both families\' wishes and Islamic customs',
      confidence: 0.90,
      alternatives: [
        'How involved would you like our families to be in planning our potential future together?',
        'What traditions are important to your family for Islamic marriage proceedings?'
      ]
    })

    return suggestions
  }

  /**
   * Generate meeting planning suggestions
   */
  private async generateMeetingPlanningsuggestions(
    context: ConversationContext,
    culturalContext: any
  ): Promise<ConversationSuggestion[]> {
    const suggestions: ConversationSuggestion[] = []

    // Proper meeting arrangements
    suggestions.push({
      type: 'topic_change',
      content: 'I suggest we arrange a meeting in a respectful setting with our families present, as is appropriate in Islam.',
      culturalContext: 'Emphasizes proper Islamic courtship with family supervision',
      confidence: 0.95,
      alternatives: [
        'Perhaps we could meet at a local mosque or Islamic center with our guardians present.',
        'I think a family gathering would be the proper way for us to meet in person.'
      ]
    })

    // Venue suggestions
    suggestions.push({
      type: 'question',
      content: 'Would your family prefer to meet at a mosque, Islamic center, or perhaps a family-friendly restaurant that serves halal food?',
      culturalContext: 'Offers appropriate Islamic venue options',
      confidence: 0.88,
      alternatives: [
        'What type of setting would make your family most comfortable for our first meeting?',
        'Should we consider meeting after Jummah prayers when families often gather?'
      ]
    })

    return suggestions
  }

  /**
   * Create analysis prompt for conversation content
   */
  private createAnalysisPrompt(
    message: string,
    context: ConversationContext,
    senderProfile: UserProfile
  ): string {
    return `
    Analyze this message from a Muslim matrimonial conversation:

    Message: "${message}"
    
    Context:
    - Conversation stage: ${context.stage}
    - Guardian involved: ${context.guardianInvolved}
    - Previous messages: ${context.previousMessages}
    - Sender gender: ${senderProfile.gender}
    - Sender age: ${new Date().getFullYear() - senderProfile.year_of_birth}
    - Sender prayer frequency: ${senderProfile.prayer_frequency}

    Please analyze for:
    1. Overall sentiment and tone
    2. Islamic appropriateness (0-1 score)
    3. Cultural sensitivity (0-1 score)
    4. Whether escalation to human moderator is needed
    5. Specific recommendations for improvement
    6. Whether guardian should be alerted (with reason and severity)

    Focus on Islamic matrimonial context where respect, modesty, and family involvement are paramount.
    `
  }

  /**
   * Parse AI analysis response
   */
  private parseAnalysisResponse(content: string): ConversationAnalysis {
    try {
      const parsed = JSON.parse(content)
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        appropriateness: parsed.appropriateness || 0.5,
        islamicCompliance: parsed.islamicCompliance || 0.5,
        culturalSensitivity: parsed.culturalSensitivity || 0.5,
        escalationNeeded: parsed.escalationNeeded || false,
        recommendations: parsed.recommendations || [],
        guardianAlert: parsed.guardianAlert || undefined
      }
    } catch (error) {
      // Fallback parsing if JSON fails
      return {
        sentiment: content.toLowerCase().includes('positive') ? 'positive' : 
                  content.toLowerCase().includes('negative') ? 'negative' : 'neutral',
        appropriateness: content.toLowerCase().includes('appropriate') ? 0.8 : 0.5,
        islamicCompliance: content.toLowerCase().includes('islamic') && 
                          content.toLowerCase().includes('compliant') ? 0.8 : 0.5,
        culturalSensitivity: 0.7,
        escalationNeeded: content.toLowerCase().includes('escalation') || 
                         content.toLowerCase().includes('concern'),
        recommendations: ['Manual review recommended due to parsing error']
      }
    }
  }

  /**
   * Generate cultural adaptation for messages
   */
  async adaptMessageForCulture(
    message: string,
    senderCulture: string,
    recipientCulture: string,
    language?: string
  ): Promise<string> {
    if (senderCulture === recipientCulture) {
      return message // No adaptation needed
    }

    try {
      const prompt = `
      Adapt this Islamic matrimonial message for cultural sensitivity:
      
      Original: "${message}"
      Sender culture: ${senderCulture}
      Recipient culture: ${recipientCulture}
      Target language: ${language || 'English'}
      
      Make minor adjustments for cultural nuances while maintaining Islamic appropriateness and the original meaning. Focus on:
      - Appropriate level of formality
      - Cultural greeting styles
      - Family involvement expectations
      - Communication directness/indirectness preferences
      
      Return only the adapted message.
      `

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cultural adaptation specialist for Islamic matrimonial communications. Adapt messages while preserving Islamic values and respect.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.5
      })

      return response.choices[0]?.message?.content?.trim() || message

    } catch (error) {
      console.error('Error adapting message for culture:', error)
      return message // Return original if adaptation fails
    }
  }

  /**
   * Check if message needs guardian notification
   */
  shouldNotifyGuardian(analysis: ConversationAnalysis): boolean {
    return analysis.escalationNeeded || 
           analysis.appropriateness < 0.6 || 
           analysis.islamicCompliance < 0.7 ||
           Boolean(analysis.guardianAlert)
  }

  /**
   * Generate emergency intervention message
   */
  generateInterventionMessage(analysis: ConversationAnalysis): string {
    if (analysis.guardianAlert) {
      return `Guardian alert: ${analysis.guardianAlert.reason}. Recommended action: ${analysis.guardianAlert.suggestedAction}`
    }

    if (analysis.islamicCompliance < 0.5) {
      return 'Content may not align with Islamic values. Guardian review recommended.'
    }

    if (analysis.appropriateness < 0.5) {
      return 'Message content requires review for appropriateness in matrimonial context.'
    }

    return 'Conversation may benefit from guardian guidance.'
  }
}