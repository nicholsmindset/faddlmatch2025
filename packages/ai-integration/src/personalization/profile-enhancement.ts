import OpenAI from 'openai'
import { 
  PersonalizationContext, 
  ProfileEnhancementSuggestion, 
  IslamicGuidance,
  AIConfig 
} from '../types'
import type { UserProfile, PartnerPreferences } from '@faddl-match/types'

/**
 * ProfileEnhancementSystem - AI-powered profile optimization for Islamic matrimonial platform
 * 
 * Features:
 * - Islamic values-focused improvement suggestions
 * - Cultural context-aware recommendations
 * - Profile completeness analysis
 * - Match potential optimization
 * - Family-friendly presentation guidance
 * - Scholarly-backed Islamic advice
 */
export class ProfileEnhancementSystem {
  private openai: OpenAI

  constructor(config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    })
  }

  /**
   * Generate comprehensive profile enhancement suggestions
   */
  async generateEnhancementSuggestions(
    context: PersonalizationContext
  ): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    
    try {
      // Analyze each profile section
      const bioSuggestions = await this.analyzeBioSection(context)
      const valuesSuggestions = await this.analyzeValuesSection(context)
      const interestsSuggestions = await this.analyzeInterestsSection(context)
      const photoSuggestions = await this.analyzePhotosSection(context)
      const preferencesSuggestions = await this.analyzePreferencesSection(context)
      
      suggestions.push(
        ...bioSuggestions,
        ...valuesSuggestions,
        ...interestsSuggestions,
        ...photoSuggestions,
        ...preferencesSuggestions
      )
      
      // Add cultural-specific suggestions
      const culturalSuggestions = await this.generateCulturalSuggestions(context)
      suggestions.push(...culturalSuggestions)
      
      // Sort by priority and estimated impact
      return suggestions
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
          }
          return b.estimatedImpact - a.estimatedImpact
        })
        .slice(0, 8) // Limit to top 8 suggestions

    } catch (error) {
      console.error('Error generating enhancement suggestions:', error)
      return this.getFallbackSuggestions(context)
    }
  }

  /**
   * Analyze bio section for improvements
   */
  private async analyzeBioSection(context: PersonalizationContext): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    const bio = context.profile.bio
    
    if (!bio || bio.length < 50) {
      suggestions.push({
        section: 'bio',
        suggestion: 'Write a more detailed bio (150-300 words) highlighting your Islamic values, personality, and what you seek in a spouse.',
        reasoning: 'A comprehensive bio helps potential matches understand your character and intentions.',
        islamicGuidance: 'Islam encourages honesty and clarity in marriage intentions. Share your faith journey and family goals.',
        culturalConsideration: this.getCulturalBioGuidance(context.culturalAdaptation.culturalBackground),
        priority: 'high',
        estimatedImpact: 0.85
      })
    } else {
      // Analyze existing bio for improvements
      const bioAnalysis = await this.analyzeBioContent(bio, context)
      suggestions.push(...bioAnalysis)
    }
    
    return suggestions
  }

  /**
   * Analyze bio content using AI
   */
  private async analyzeBioContent(
    bio: string,
    context: PersonalizationContext
  ): Promise<ProfileEnhancementSuggestion[]> {
    try {
      const prompt = `Analyze this Islamic matrimonial profile bio and suggest improvements:

      Bio: "${bio}"
      
      User context:
      - Age: ${new Date().getFullYear() - context.profile.year_of_birth}
      - Gender: ${context.profile.gender}
      - Prayer frequency: ${context.profile.prayer_frequency}
      - Cultural background: ${context.culturalAdaptation.culturalBackground}
      - Profile completeness: ${context.interactionHistory.profileCompleteness}%
      
      Provide suggestions for:
      1. Islamic values emphasis
      2. Marriage intentions clarity
      3. Family goals mention
      4. Personality expression
      5. Cultural sensitivity
      
      Format as JSON with: suggestion, reasoning, islamicGuidance, priority (high/medium/low), estimatedImpact (0-1)`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an Islamic matrimonial counselor helping Muslims create compelling, authentic profiles that attract compatible spouses while adhering to Islamic values.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return this.parseBioSuggestions(content)
      }

    } catch (error) {
      console.error('Bio analysis error:', error)
    }

    return []
  }

  /**
   * Parse AI bio suggestions response
   */
  private parseBioSuggestions(content: string): ProfileEnhancementSuggestion[] {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          section: 'bio' as const,
          suggestion: item.suggestion || 'Improve bio content',
          reasoning: item.reasoning || 'Better bio attracts more compatible matches',
          islamicGuidance: item.islamicGuidance,
          priority: item.priority || 'medium',
          estimatedImpact: item.estimatedImpact || 0.7
        }))
      }
    } catch (error) {
      console.error('Error parsing bio suggestions:', error)
    }

    return [{
      section: 'bio',
      suggestion: 'Consider adding more about your Islamic values and marriage goals',
      reasoning: 'Clear intentions and values help attract compatible matches',
      islamicGuidance: 'Islam values honesty and clarity in marriage intentions',
      priority: 'medium',
      estimatedImpact: 0.7
    }]
  }

  /**
   * Analyze values section
   */
  private async analyzeValuesSection(context: PersonalizationContext): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    
    // Check prayer frequency representation
    if (context.profile.prayer_frequency === 'never' || context.profile.prayer_frequency === 'sometimes') {
      suggestions.push({
        section: 'values',
        suggestion: 'Consider how you present your spiritual journey and growth intentions.',
        reasoning: 'Many matches value spiritual compatibility and growth potential.',
        islamicGuidance: 'Islam encourages continuous spiritual improvement and honest self-assessment.',
        priority: 'medium',
        estimatedImpact: 0.6
      })
    }

    // Check modesty alignment
    if (context.profile.modest_dress !== context.profile.prayer_frequency) {
      suggestions.push({
        section: 'values',
        suggestion: 'Ensure your modesty and prayer practices are clearly and consistently represented.',
        reasoning: 'Consistency in religious practice representation helps set proper expectations.',
        islamicGuidance: 'Authenticity in representing your Islamic practice builds trust.',
        priority: 'medium',
        estimatedImpact: 0.65
      })
    }

    return suggestions
  }

  /**
   * Analyze interests section
   */
  private async analyzeInterestsSection(context: PersonalizationContext): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    
    // Basic interests check
    if (!context.profile.bio || !this.hasInterestsMentioned(context.profile.bio)) {
      suggestions.push({
        section: 'interests',
        suggestion: 'Add 3-5 specific interests or hobbies that reflect your personality and lifestyle.',
        reasoning: 'Shared interests create natural conversation starters and compatibility indicators.',
        islamicGuidance: 'Islam encourages balanced life with wholesome activities and learning.',
        culturalConsideration: this.getCulturalInterestsGuidance(context.culturalAdaptation.culturalBackground),
        priority: 'medium',
        estimatedImpact: 0.7
      })
    }

    // Islamic interests encouragement
    if (context.profile.bio && !this.hasIslamicInterests(context.profile.bio)) {
      suggestions.push({
        section: 'interests',
        suggestion: 'Consider mentioning Islamic activities like Quran study, community service, or halal recreation.',
        reasoning: 'Islamic interests show spiritual engagement and attract like-minded matches.',
        islamicGuidance: 'Seeking knowledge and serving the community are beloved acts in Islam.',
        priority: 'high',
        estimatedImpact: 0.8
      })
    }

    return suggestions
  }

  /**
   * Analyze photos section
   */
  private async analyzePhotosSection(context: PersonalizationContext): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    
    // This would integrate with photo analysis in production
    // For now, providing general guidance
    
    suggestions.push({
      section: 'photos',
      suggestion: 'Ensure your photos reflect your Islamic values and modest presentation.',
      reasoning: 'Photos should align with your stated religious practice level and attract appropriate matches.',
      islamicGuidance: 'Islam encourages modesty in presentation while allowing families to see you for marriage purposes.',
      culturalConsideration: this.getCulturalPhotoGuidance(context.culturalAdaptation.culturalBackground),
      priority: 'high',
      estimatedImpact: 0.9
    })

    return suggestions
  }

  /**
   * Analyze preferences section
   */
  private async analyzePreferencesSection(context: PersonalizationContext): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    
    // Check if preferences are too restrictive
    const restrictiveness = this.calculatePreferencesRestrictiveness(context)
    
    if (restrictiveness > 0.8) {
      suggestions.push({
        section: 'preferences',
        suggestion: 'Consider if some preferences are too restrictive. Focus on essential Islamic values over specific demographics.',
        reasoning: 'Overly restrictive preferences may limit compatible matches who share your core values.',
        islamicGuidance: 'Prophet Muhammad (PBUH) advised choosing spouses primarily for their religion and character.',
        priority: 'medium',
        estimatedImpact: 0.75
      })
    }

    // Check for missing essential preferences
    if (!context.preferences.wants_children && context.profile.has_children === false) {
      suggestions.push({
        section: 'preferences',
        suggestion: 'Consider specifying your desires regarding children and family building.',
        reasoning: 'Family planning compatibility is crucial for long-term marriage success.',
        islamicGuidance: 'Islam encourages discussing family goals and children intentions before marriage.',
        priority: 'high',
        estimatedImpact: 0.85
      })
    }

    return suggestions
  }

  /**
   * Generate cultural-specific suggestions
   */
  private async generateCulturalSuggestions(context: PersonalizationContext): Promise<ProfileEnhancementSuggestion[]> {
    const suggestions: ProfileEnhancementSuggestion[] = []
    const culturalBackground = context.culturalAdaptation.culturalBackground
    
    switch (culturalBackground) {
      case 'arab':
        suggestions.push({
          section: 'values',
          suggestion: 'Consider mentioning your connection to Islamic scholarship and Arabic language if applicable.',
          reasoning: 'Arab cultural context values Islamic knowledge and linguistic heritage.',
          culturalConsideration: 'Arabic-speaking families often appreciate Quranic Arabic knowledge and scholarly engagement.',
          priority: 'medium',
          estimatedImpact: 0.6
        })
        break
        
      case 'south_asian':
        suggestions.push({
          section: 'bio',
          suggestion: 'Mention your educational achievements and family background respectfully.',
          reasoning: 'South Asian families often value educational compatibility and family honor.',
          culturalConsideration: 'Academic achievements and family respect are culturally significant.',
          priority: 'medium',
          estimatedImpact: 0.65
        })
        break
        
      case 'convert':
        suggestions.push({
          section: 'bio',
          suggestion: 'Share your Islamic journey and what drew you to Islam, if comfortable.',
          reasoning: 'Your conversion story can be inspiring and help others understand your commitment.',
          islamicGuidance: 'New Muslims bring fresh perspective and strong conviction to their practice.',
          priority: 'high',
          estimatedImpact: 0.8
        })
        break
    }
    
    return suggestions
  }

  /**
   * Check if bio mentions interests
   */
  private hasInterestsMentioned(bio: string): boolean {
    const interestKeywords = [
      'enjoy', 'love', 'like', 'interest', 'hobby', 'passion',
      'reading', 'travel', 'cooking', 'sport', 'music', 'art'
    ]
    return interestKeywords.some(keyword => bio.toLowerCase().includes(keyword))
  }

  /**
   * Check if bio mentions Islamic interests
   */
  private hasIslamicInterests(bio: string): boolean {
    const islamicKeywords = [
      'quran', 'hadith', 'islamic', 'mosque', 'community', 'volunteer',
      'charity', 'study', 'learn', 'knowledge', 'deen', 'faith'
    ]
    return islamicKeywords.some(keyword => bio.toLowerCase().includes(keyword))
  }

  /**
   * Calculate how restrictive preferences are
   */
  private calculatePreferencesRestrictiveness(context: PersonalizationContext): number {
    let restrictiveness = 0
    let factors = 0
    
    // Age range restrictiveness
    const ageRange = (context.preferences.max_age || 50) - (context.preferences.min_age || 18)
    if (ageRange < 5) restrictiveness += 0.3
    else if (ageRange < 10) restrictiveness += 0.1
    factors++
    
    // Location restrictiveness would be checked here
    // Education level requirements
    // Ethnicity preferences, etc.
    
    return factors > 0 ? restrictiveness / factors : 0
  }

  /**
   * Get cultural bio guidance
   */
  private getCulturalBioGuidance(culturalBackground: string): string {
    const guidance: Record<string, string> = {
      arab: 'Arab culture appreciates eloquent expression and reference to Islamic heritage',
      south_asian: 'South Asian families value educational background and family respect',
      southeast_asian: 'Southeast Asian culture values harmony and gentle, respectful presentation',
      african: 'African Muslim culture values community connection and collective values',
      turkish: 'Turkish culture balances modern achievements with traditional Islamic values',
      persian: 'Persian culture appreciates literary expression and cultural sophistication',
      convert: 'New Muslims can share their journey and fresh perspective on Islam',
      mixed: 'Mixed background allows flexibility in cultural expression and practices'
    }
    
    return guidance[culturalBackground] || 'Express your authentic Islamic identity and values'
  }

  /**
   * Get cultural interests guidance
   */
  private getCulturalInterestsGuidance(culturalBackground: string): string {
    const guidance: Record<string, string> = {
      arab: 'Consider mentioning Arabic poetry, Islamic history, or scholarly pursuits',
      south_asian: 'Family gatherings, cultural celebrations, and educational activities are valued',
      southeast_asian: 'Community harmony, traditional crafts, and peaceful activities resonate',
      african: 'Community service, storytelling, and collective cultural activities are appreciated',
      convert: 'Share how Islamic interests have shaped your new lifestyle and growth',
      mixed: 'Diverse interests reflecting your multicultural Islamic experience'
    }
    
    return guidance[culturalBackground] || 'Share halal interests that reflect your personality'
  }

  /**
   * Get cultural photo guidance
   */
  private getCulturalPhotoGuidance(culturalBackground: string): string {
    const guidance: Record<string, string> = {
      arab: 'Formal, respectful presentation that reflects family honor',
      south_asian: 'Traditional or semi-formal attire that shows cultural respect',
      southeast_asian: 'Gentle, modest presentation in harmony with cultural norms',
      african: 'Warm, community-oriented presentation that reflects collective values',
      convert: 'Authentic Islamic presentation that shows your spiritual journey',
      mixed: 'Balanced presentation reflecting your diverse Islamic identity'
    }
    
    return guidance[culturalBackground] || 'Modest, authentic presentation aligned with Islamic values'
  }

  /**
   * Get fallback suggestions when AI analysis fails
   */
  private getFallbackSuggestions(context: PersonalizationContext): ProfileEnhancementSuggestion[] {
    return [
      {
        section: 'bio',
        suggestion: 'Complete your bio with 150-300 words about your Islamic values, personality, and marriage goals.',
        reasoning: 'A complete bio significantly improves match quality and compatibility.',
        islamicGuidance: 'Islam encourages honest and clear communication about marriage intentions.',
        priority: 'high',
        estimatedImpact: 0.85
      },
      {
        section: 'values',
        suggestion: 'Clearly represent your level of Islamic practice and spiritual goals.',
        reasoning: 'Religious compatibility is fundamental for successful Islamic marriage.',
        islamicGuidance: 'Prophet Muhammad (PBUH) advised choosing spouses primarily for their religion.',
        priority: 'high',
        estimatedImpact: 0.9
      },
      {
        section: 'interests',
        suggestion: 'Add 3-5 specific interests that reflect your halal lifestyle and personality.',
        reasoning: 'Shared interests create natural connections and conversation opportunities.',
        islamicGuidance: 'Islam encourages balanced life with wholesome activities and continuous learning.',
        priority: 'medium',
        estimatedImpact: 0.7
      }
    ]
  }

  /**
   * Get profile completeness score
   */
  calculateProfileCompleteness(profile: UserProfile): number {
    let score = 0
    let maxScore = 0
    
    // Bio (30 points)
    maxScore += 30
    if (profile.bio) {
      if (profile.bio.length > 150) score += 30
      else if (profile.bio.length > 50) score += 20
      else score += 10
    }
    
    // Basic info (20 points)
    maxScore += 20
    if (profile.education) score += 5
    if (profile.profession) score += 5
    if (profile.languages && profile.languages.length > 0) score += 5
    score += 5 // Always have basic demographic info
    
    // Religious info (30 points)
    maxScore += 30
    score += 15 // Prayer frequency and modest dress always present
    if (profile.bio && this.hasIslamicInterests(profile.bio)) score += 15
    
    // Photos (20 points) - would need to check actual photo count
    maxScore += 20
    score += 10 // Assume at least one photo
    
    return Math.round((score / maxScore) * 100)
  }
}