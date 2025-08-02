import OpenAI from 'openai'
import { MatchExplanation, SimilarityScore, AIConfig } from '../types'
import type { UserProfile, PartnerPreferences } from '@faddl-match/types'

/**
 * MatchExplanationGenerator - AI-powered match explanations for Islamic matrimonial platform
 * 
 * Features:
 * - Personalized match compatibility explanations
 * - Islamic values-focused analysis
 * - Cultural context consideration
 * - Constructive feedback for improvements
 * - Family-friendly language
 * - Scholarly Islamic guidance integration
 */
export class MatchExplanationGenerator {
  private openai: OpenAI

  constructor(config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    })
  }

  /**
   * Generate comprehensive match explanation
   */
  async generateMatchExplanation(
    similarity: SimilarityScore,
    userProfile: UserProfile,
    matchProfile: UserProfile,
    userPreferences: PartnerPreferences,
    matchPreferences: PartnerPreferences
  ): Promise<MatchExplanation> {
    try {
      const prompt = this.createExplanationPrompt(
        similarity,
        userProfile,
        matchProfile,
        userPreferences,
        matchPreferences
      )

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an Islamic matrimonial counselor providing thoughtful match explanations. 
            
            Your responses should:
            - Focus on Islamic compatibility factors
            - Be encouraging while honest about considerations
            - Use respectful, family-friendly language
            - Emphasize character and values over appearance
            - Include Islamic guidance where appropriate
            - Consider cultural backgrounds respectfully
            - Provide constructive recommendations
            
            Format your response as JSON with:
            - overallCompatibility (0-100 number)
            - strengths (array of strings)
            - considerations (array of strings)  
            - islamicValues (object with score 0-100, alignment array, areas array)
            - recommendations (array of strings)`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return this.parseExplanationResponse(content, similarity)
      }

      // Fallback if AI response fails
      return this.generateFallbackExplanation(similarity, userProfile, matchProfile)

    } catch (error) {
      console.error('Error generating match explanation:', error)
      return this.generateFallbackExplanation(similarity, userProfile, matchProfile)
    }
  }

  /**
   * Create detailed prompt for match explanation
   */
  private createExplanationPrompt(
    similarity: SimilarityScore,
    userProfile: UserProfile,
    matchProfile: UserProfile,
    userPreferences: PartnerPreferences,
    matchPreferences: PartnerPreferences
  ): string {
    const userAge = new Date().getFullYear() - userProfile.year_of_birth
    const matchAge = new Date().getFullYear() - matchProfile.year_of_birth

    return `Analyze this Islamic matrimonial match and provide a comprehensive explanation:

    COMPATIBILITY SCORES:
    - Overall Match: ${(similarity.overallScore * 100).toFixed(0)}%
    - Values Alignment: ${(similarity.subscores.values * 100).toFixed(0)}%
    - Lifestyle Compatibility: ${(similarity.subscores.lifestyle * 100).toFixed(0)}%
    - Personality Match: ${(similarity.subscores.personality * 100).toFixed(0)}%
    - Interests Overlap: ${(similarity.subscores.interests * 100).toFixed(0)}%
    - Islamic Alignment: ${(similarity.islamicAlignment * 100).toFixed(0)}%
    - Cultural Compatibility: ${(similarity.culturalCompatibility * 100).toFixed(0)}%

    USER PROFILE:
    - Age: ${userAge}, Gender: ${userProfile.gender}
    - Prayer Frequency: ${userProfile.prayer_frequency}
    - Modest Dress: ${userProfile.modest_dress}
    - Marital Status: ${userProfile.marital_status}
    - Has Children: ${userProfile.has_children}
    - Ethnicity: ${userProfile.ethnicity}
    - Location: ${userProfile.location_zone}
    - Education: ${userProfile.education || 'Not specified'}
    - Profession: ${userProfile.profession || 'Not specified'}
    - Languages: ${userProfile.languages.join(', ')}

    MATCH PROFILE:
    - Age: ${matchAge}, Gender: ${matchProfile.gender}
    - Prayer Frequency: ${matchProfile.prayer_frequency}
    - Modest Dress: ${matchProfile.modest_dress}
    - Marital Status: ${matchProfile.marital_status}
    - Has Children: ${matchProfile.has_children}
    - Ethnicity: ${matchProfile.ethnicity}
    - Location: ${matchProfile.location_zone}
    - Education: ${matchProfile.education || 'Not specified'}
    - Profession: ${matchProfile.profession || 'Not specified'}
    - Languages: ${matchProfile.languages.join(', ')}

    USER PREFERENCES:
    - Age Range: ${userPreferences.min_age}-${userPreferences.max_age}
    - Wants Children: ${userPreferences.wants_children}
    - Accepts Children: ${userPreferences.accepts_children}
    - Education Level: ${userPreferences.education_level || 'Any'}

    MATCH PREFERENCES:
    - Age Range: ${matchPreferences.min_age}-${matchPreferences.max_age}
    - Wants Children: ${matchPreferences.wants_children}
    - Accepts Children: ${matchPreferences.accepts_children}
    - Education Level: ${matchPreferences.education_level || 'Any'}

    Please provide:
    1. Overall compatibility assessment (0-100)
    2. Top 3-5 strengths of this match
    3. Important considerations or potential challenges
    4. Islamic values analysis (score, alignments, areas for discussion)
    5. Specific recommendations for both individuals

    Focus on:
    - Islamic compatibility as primary factor
    - Family building potential
    - Cultural harmony
    - Practical life compatibility
    - Growth opportunities together
    - Communication and understanding potential`
  }

  /**
   * Parse AI explanation response
   */
  private parseExplanationResponse(
    content: string,
    similarity: SimilarityScore
  ): MatchExplanation {
    try {
      const parsed = JSON.parse(content)
      
      return {
        overallCompatibility: parsed.overallCompatibility || Math.round(similarity.overallScore * 100),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : this.getDefaultStrengths(similarity),
        considerations: Array.isArray(parsed.considerations) ? parsed.considerations : [],
        islamicValues: {
          score: parsed.islamicValues?.score || Math.round(similarity.islamicAlignment * 100),
          alignment: Array.isArray(parsed.islamicValues?.alignment) ? parsed.islamicValues.alignment : ['Shared Islamic values'],
          areas: Array.isArray(parsed.islamicValues?.areas) ? parsed.islamicValues.areas : ['Discuss religious practice levels']
        },
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : this.getDefaultRecommendations()
      }
    } catch (error) {
      console.error('Error parsing match explanation:', error)
      return this.generateFallbackExplanation(similarity, null, null)
    }
  }

  /**
   * Generate fallback explanation when AI fails
   */
  private generateFallbackExplanation(
    similarity: SimilarityScore,
    userProfile?: UserProfile | null,
    matchProfile?: UserProfile | null
  ): MatchExplanation {
    const overallCompatibility = Math.round(similarity.overallScore * 100)
    const islamicScore = Math.round(similarity.islamicAlignment * 100)
    
    const strengths = this.getDefaultStrengths(similarity)
    const considerations = this.getDefaultConsiderations(similarity)
    const recommendations = this.getDefaultRecommendations()

    return {
      overallCompatibility,
      strengths,
      considerations,
      islamicValues: {
        score: islamicScore,
        alignment: this.getIslamicAlignment(similarity),
        areas: this.getIslamicDiscussionAreas(similarity)
      },
      recommendations
    }
  }

  /**
   * Get default strengths based on similarity scores
   */
  private getDefaultStrengths(similarity: SimilarityScore): string[] {
    const strengths: string[] = []
    
    if (similarity.islamicAlignment > 0.8) {
      strengths.push('Strong Islamic values alignment - both share similar levels of religious commitment')
    }
    
    if (similarity.subscores.values > 0.75) {
      strengths.push('Excellent compatibility in core life values and family priorities')
    }
    
    if (similarity.subscores.lifestyle > 0.7) {
      strengths.push('Compatible lifestyle approaches and daily life preferences')
    }
    
    if (similarity.subscores.personality > 0.7) {
      strengths.push('Complementary personality traits that could create good balance')
    }
    
    if (similarity.culturalCompatibility > 0.75) {
      strengths.push('Strong cultural understanding and shared traditions')
    }
    
    if (similarity.subscores.interests > 0.6) {
      strengths.push('Shared interests and activities that could strengthen your bond')
    }
    
    // Always include at least one strength
    if (strengths.length === 0) {
      strengths.push('Both individuals are seeking marriage with Islamic intentions')
    }
    
    return strengths.slice(0, 5) // Limit to top 5
  }

  /**
   * Get default considerations based on similarity scores
   */
  private getDefaultConsiderations(similarity: SimilarityScore): string[] {
    const considerations: string[] = []
    
    if (similarity.islamicAlignment < 0.6) {
      considerations.push('Different levels of religious practice may need discussion and understanding')
    }
    
    if (similarity.culturalCompatibility < 0.6) {
      considerations.push('Different cultural backgrounds - family introduction and cultural bridge-building important')
    }
    
    if (similarity.subscores.lifestyle < 0.5) {
      considerations.push('Different lifestyle preferences - discuss daily routines and life goals')
    }
    
    if (similarity.subscores.personality < 0.5) {
      considerations.push('Different personality types - explore communication styles and conflict resolution')
    }
    
    if (similarity.overallScore < 0.6) {
      considerations.push('Take time for thorough getting-to-know process with family guidance')
    }
    
    return considerations.slice(0, 4) // Limit to top 4 considerations
  }

  /**
   * Get default recommendations
   */
  private getDefaultRecommendations(): string[] {
    return [
      'Begin with proper Islamic greetings and introduce families early in the process',
      'Discuss Islamic practice levels, family goals, and life vision openly',
      'Arrange supervised meetings in appropriate Islamic settings',
      'Involve both families in getting-to-know process and decision-making',
      'Make Istikhara (guidance prayer) and seek Allah\'s guidance throughout the process'
    ]
  }

  /**
   * Get Islamic alignment areas
   */
  private getIslamicAlignment(similarity: SimilarityScore): string[] {
    const alignment: string[] = []
    
    if (similarity.islamicAlignment > 0.8) {
      alignment.push('Very similar levels of Islamic practice and commitment')
      alignment.push('Shared understanding of Islamic marriage goals')
    } else if (similarity.islamicAlignment > 0.6) {
      alignment.push('Compatible Islamic values with room for mutual growth')
      alignment.push('Shared commitment to halal lifestyle')
    } else {
      alignment.push('Both seeking Islamic marriage with family involvement')
      alignment.push('Opportunity for mutual Islamic learning and growth')
    }
    
    return alignment
  }

  /**
   * Get Islamic discussion areas
   */
  private getIslamicDiscussionAreas(similarity: SimilarityScore): string[] {
    const areas: string[] = []
    
    if (similarity.islamicAlignment < 0.7) {
      areas.push('Religious practice levels and daily Islamic routines')
      areas.push('Islamic knowledge and learning goals')
    }
    
    areas.push('Family Islamic traditions and cultural practices')
    areas.push('Children\'s Islamic education and upbringing plans')
    areas.push('Community involvement and Islamic social activities')
    
    return areas.slice(0, 4)
  }

  /**
   * Generate match explanation for display
   */
  async generateDisplayExplanation(
    matchExplanation: MatchExplanation,
    isHighCompatibility: boolean
  ): Promise<string> {
    const compatibilityLevel = matchExplanation.overallCompatibility >= 80 ? 'excellent' :
                              matchExplanation.overallCompatibility >= 65 ? 'good' :
                              matchExplanation.overallCompatibility >= 50 ? 'moderate' : 'limited'

    let explanation = `This match shows ${compatibilityLevel} compatibility (${matchExplanation.overallCompatibility}%) with `

    if (matchExplanation.islamicValues.score >= 80) {
      explanation += 'strong Islamic values alignment. '
    } else if (matchExplanation.islamicValues.score >= 60) {
      explanation += 'good Islamic compatibility. '
    } else {
      explanation += 'Islamic foundations to build upon. '
    }

    // Add top strength
    if (matchExplanation.strengths.length > 0) {
      explanation += matchExplanation.strengths[0] + '. '
    }

    // Add consideration if needed
    if (matchExplanation.considerations.length > 0 && !isHighCompatibility) {
      explanation += 'Consider discussing ' + matchExplanation.considerations[0].toLowerCase() + '. '
    }

    explanation += 'Take time for proper Islamic getting-to-know process with family guidance.'

    return explanation
  }

  /**
   * Generate Islamic guidance for match
   */
  generateIslamicGuidanceForMatch(
    matchExplanation: MatchExplanation,
    compatibilityScore: number
  ): string {
    if (compatibilityScore >= 80) {
      return 'This appears to be a promising match. Make Istikhara and seek Allah\'s guidance. Involve both families in the process and proceed with proper Islamic courtship guidelines.'
    } else if (compatibilityScore >= 60) {
      return 'This match has good potential. Take time to discuss important matters with family involvement. Make Istikhara and trust in Allah\'s wisdom for your decision.'
    } else if (compatibilityScore >= 40) {
      return 'This match requires careful consideration. Discuss all important aspects thoroughly with family guidance. Differences can be bridges if handled with Islamic wisdom and patience.'
    } else {
      return 'This match may present challenges. Seek guidance from family and trusted Islamic advisors. Remember that Allah knows best what is suitable for you.'
    }
  }
}