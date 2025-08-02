import { 
  ProfileEmbeddings, 
  SimilarityScore, 
  MatchExplanation, 
  IslamicCompatibilityFactors,
  AIConfig 
} from '../types'
import type { 
  UserProfile, 
  PartnerPreferences, 
  PrayerFrequency,
  MaritalStatus,
  Ethnicity 
} from '@faddl-match/types'
import OpenAI from 'openai'

/**
 * SimilarityMatcher - Advanced semantic similarity matching with Islamic values
 * 
 * Features:
 * - Multi-dimensional similarity scoring (profile, values, interests, lifestyle, personality)
 * - Islamic compatibility weighting system
 * - Cultural background consideration
 * - AI-generated match explanations
 * - Family preference alignment scoring
 */
export class SimilarityMatcher {
  private openai: OpenAI

  // Weighting factors for different similarity dimensions
  private readonly weights = {
    values: 0.35,        // Highest weight for Islamic values alignment
    personality: 0.20,   // Personal compatibility
    lifestyle: 0.20,     // Daily life alignment
    interests: 0.15,     // Shared hobbies/activities
    profileText: 0.10    // General demographic fit
  }

  // Islamic compatibility factors weighting
  private readonly islamicWeights = {
    prayerAlignment: 0.25,
    lifestyleAlignment: 0.20,
    familyValuesAlignment: 0.20,
    religiousKnowledgeBalance: 0.15,
    communityInvolvementCompatibility: 0.10,
    matrimonialIntentions: 0.10
  }

  constructor(config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    })
  }

  /**
   * Calculate comprehensive similarity score between two profiles
   */
  async calculateSimilarity(
    profile1: ProfileEmbeddings,
    profile2: ProfileEmbeddings,
    userProfile1: UserProfile,
    userProfile2: UserProfile,
    preferences1: PartnerPreferences,
    preferences2: PartnerPreferences
  ): Promise<SimilarityScore> {
    try {
      // Calculate cosine similarity for each embedding dimension
      const similarities = {
        values: this.cosineSimilarity(profile1.values, profile2.values),
        interests: this.cosineSimilarity(profile1.interests, profile2.interests),
        lifestyle: this.cosineSimilarity(profile1.lifestyle, profile2.lifestyle),
        personality: this.cosineSimilarity(profile1.personality, profile2.personality),
        profileText: this.cosineSimilarity(profile1.profileText, profile2.profileText)
      }

      // Calculate demographic compatibility
      const demographics = this.calculateDemographicCompatibility(
        userProfile1, userProfile2, preferences1, preferences2
      )

      // Calculate Islamic compatibility
      const islamicAlignment = this.calculateIslamicCompatibility(
        userProfile1, userProfile2
      )

      // Calculate cultural compatibility
      const culturalCompatibility = this.calculateCulturalCompatibility(
        userProfile1, userProfile2
      )

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(
        similarities,
        demographics,
        islamicAlignment,
        culturalCompatibility
      )

      // Generate AI explanation
      const explanation = await this.generateMatchExplanation(
        similarities,
        demographics,
        islamicAlignment,
        culturalCompatibility,
        userProfile1,
        userProfile2
      )

      return {
        profileId: profile2.profileId,
        overallScore,
        subscores: {
          ...similarities,
          demographics
        },
        explanation,
        islamicAlignment,
        culturalCompatibility
      }

    } catch (error) {
      console.error('Error calculating similarity:', error)
      throw error
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must be the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Calculate demographic compatibility score
   */
  private calculateDemographicCompatibility(
    profile1: UserProfile,
    profile2: UserProfile,
    preferences1: PartnerPreferences,
    preferences2: PartnerPreferences
  ): number {
    let score = 0
    let factors = 0

    // Age compatibility
    const age1 = new Date().getFullYear() - profile1.year_of_birth
    const age2 = new Date().getFullYear() - profile2.year_of_birth
    
    const ageMatch1 = this.isAgeMatch(age2, preferences1.min_age, preferences1.max_age)
    const ageMatch2 = this.isAgeMatch(age1, preferences2.min_age, preferences2.max_age)
    
    if (ageMatch1 && ageMatch2) score += 1
    else if (ageMatch1 || ageMatch2) score += 0.5
    factors++

    // Location compatibility
    if (profile1.location_zone === profile2.location_zone) score += 1
    else if (this.isLocationNearby(profile1.location_zone, profile2.location_zone)) score += 0.7
    else score += 0.3 // Different but still possible
    factors++

    // Education compatibility
    if (preferences1.education_level && preferences2.education_level) {
      if (this.isEducationCompatible(profile1.education, preferences2.education_level) &&
          this.isEducationCompatible(profile2.education, preferences1.education_level)) {
        score += 1
      } else score += 0.5
      factors++
    }

    // Marital status and children compatibility
    const maritalMatch = this.isMaritalStatusCompatible(
      profile1.marital_status, profile2.marital_status,
      profile1.has_children, profile2.has_children,
      preferences1.accepts_children, preferences2.accepts_children
    )
    score += maritalMatch
    factors++

    return score / factors
  }

  /**
   * Calculate Islamic compatibility score
   */
  private calculateIslamicCompatibility(
    profile1: UserProfile,
    profile2: UserProfile
  ): number {
    const factors: IslamicCompatibilityFactors = {
      prayerAlignment: this.calculatePrayerAlignment(profile1.prayer_frequency, profile2.prayer_frequency),
      lifestyleAlignment: this.calculateLifestyleAlignment(profile1.modest_dress, profile2.modest_dress),
      familyValuesAlignment: this.calculateFamilyValuesAlignment(profile1, profile2),
      religiousKnowledgeBalance: this.calculateReligiousBalance(profile1, profile2),
      communityInvolvementCompatibility: 0.8, // Default high - would need more data
      matrimonialIntentions: 1.0 // Both on matrimonial platform
    }

    // Calculate weighted Islamic compatibility score
    return Object.entries(factors).reduce((total, [key, value]) => {
      const weight = this.islamicWeights[key as keyof IslamicCompatibilityFactors]
      return total + (value * weight)
    }, 0)
  }

  /**
   * Calculate prayer frequency alignment
   */
  private calculatePrayerAlignment(freq1: PrayerFrequency, freq2: PrayerFrequency): number {
    const prayerLevels = {
      'never': 0,
      'sometimes': 1,
      'often': 2,
      'always': 3
    }

    const level1 = prayerLevels[freq1]
    const level2 = prayerLevels[freq2]
    const difference = Math.abs(level1 - level2)

    // Perfect match = 1.0, one level diff = 0.7, two levels = 0.4, three levels = 0.1
    switch (difference) {
      case 0: return 1.0
      case 1: return 0.7
      case 2: return 0.4
      case 3: return 0.1
      default: return 0.1
    }
  }

  /**
   * Calculate lifestyle alignment (modesty, halal practices)
   */
  private calculateLifestyleAlignment(modesty1: PrayerFrequency, modesty2: PrayerFrequency): number {
    // Similar to prayer alignment
    return this.calculatePrayerAlignment(modesty1, modesty2)
  }

  /**
   * Calculate family values alignment
   */
  private calculateFamilyValuesAlignment(profile1: UserProfile, profile2: UserProfile): number {
    let score = 0
    let factors = 0

    // Children compatibility
    if (profile1.has_children === profile2.has_children) {
      score += 1
    } else {
      score += 0.6 // Different situations but still compatible
    }
    factors++

    // Age difference for family planning
    const age1 = new Date().getFullYear() - profile1.year_of_birth
    const age2 = new Date().getFullYear() - profile2.year_of_birth
    const ageDiff = Math.abs(age1 - age2)
    
    if (ageDiff <= 5) score += 1
    else if (ageDiff <= 10) score += 0.8
    else score += 0.5
    factors++

    return score / factors
  }

  /**
   * Calculate religious knowledge balance
   */
  private calculateReligiousBalance(profile1: UserProfile, profile2: UserProfile): number {
    // For now, base on prayer frequency as proxy for religious knowledge
    // In future, could add specific religious knowledge questions
    const combined = this.calculatePrayerAlignment(profile1.prayer_frequency, profile2.prayer_frequency)
    
    // Slight bonus for both being highly religious
    if (profile1.prayer_frequency === 'always' && profile2.prayer_frequency === 'always') {
      return Math.min(1.0, combined + 0.1)
    }
    
    return combined
  }

  /**
   * Calculate cultural compatibility
   */
  private calculateCulturalCompatibility(profile1: UserProfile, profile2: UserProfile): number {
    let score = 0
    let factors = 0

    // Ethnicity compatibility
    if (profile1.ethnicity === profile2.ethnicity) {
      score += 1
    } else if (this.isCulturallyCompatible(profile1.ethnicity, profile2.ethnicity)) {
      score += 0.8
    } else {
      score += 0.6 // Different but Islam unites
    }
    factors++

    // Language compatibility
    const commonLanguages = profile1.languages.filter(lang => 
      profile2.languages.includes(lang)
    )
    
    if (commonLanguages.length > 0) {
      score += Math.min(1.0, commonLanguages.length * 0.3)
    } else {
      score += 0.2 // English likely common
    }
    factors++

    return score / factors
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(
    similarities: Record<string, number>,
    demographics: number,
    islamicAlignment: number,
    culturalCompatibility: number
  ): number {
    // Base similarity score from embeddings
    const baseSimilarity = Object.entries(similarities).reduce((total, [key, value]) => {
      const weight = this.weights[key as keyof typeof this.weights] || 0
      return total + (value * weight)
    }, 0)

    // Combine with compatibility factors
    const compatibilityBonus = (
      (demographics * 0.2) +
      (islamicAlignment * 0.5) +  // Heavy weight on Islamic compatibility
      (culturalCompatibility * 0.3)
    )

    // Final weighted score
    const finalScore = (baseSimilarity * 0.6) + (compatibilityBonus * 0.4)
    
    return Math.min(1.0, Math.max(0.0, finalScore))
  }

  /**
   * Generate AI-powered match explanation
   */
  private async generateMatchExplanation(
    similarities: Record<string, number>,
    demographics: number,
    islamicAlignment: number,
    culturalCompatibility: number,
    profile1: UserProfile,
    profile2: UserProfile
  ): Promise<string> {
    try {
      const prompt = this.createExplanationPrompt(
        similarities,
        demographics,
        islamicAlignment,
        culturalCompatibility,
        profile1,
        profile2
      )

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an Islamic matrimonial counselor providing thoughtful match explanations that respect Islamic values and cultural sensitivity. Keep explanations concise, positive, and focused on compatibility factors that matter for successful Islamic marriage.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || 'Compatible match based on shared values and lifestyle alignment.'

    } catch (error) {
      console.error('Error generating match explanation:', error)
      return this.createFallbackExplanation(similarities, islamicAlignment)
    }
  }

  /**
   * Create prompt for match explanation
   */
  private createExplanationPrompt(
    similarities: Record<string, number>,
    demographics: number,
    islamicAlignment: number,
    culturalCompatibility: number,
    profile1: UserProfile,
    profile2: UserProfile
  ): string {
    const age1 = new Date().getFullYear() - profile1.year_of_birth
    const age2 = new Date().getFullYear() - profile2.year_of_birth

    return `
    Analyze this potential Islamic matrimonial match and provide a brief explanation:

    Compatibility Scores:
    - Islamic Values Alignment: ${(islamicAlignment * 100).toFixed(0)}%
    - Values Similarity: ${(similarities.values * 100).toFixed(0)}%
    - Lifestyle Compatibility: ${(similarities.lifestyle * 100).toFixed(0)}%
    - Personality Match: ${(similarities.personality * 100).toFixed(0)}%
    - Cultural Compatibility: ${(culturalCompatibility * 100).toFixed(0)}%

    Profile Details:
    - Ages: ${age1} and ${age2}
    - Prayer Frequency: ${profile1.prayer_frequency} and ${profile2.prayer_frequency}
    - Modest Dress: ${profile1.modest_dress} and ${profile2.modest_dress}
    - Ethnicities: ${profile1.ethnicity} and ${profile2.ethnicity}
    - Location: ${profile1.location_zone} and ${profile2.location_zone}
    - Children: ${profile1.has_children ? 'Has children' : 'No children'} and ${profile2.has_children ? 'Has children' : 'No children'}

    Provide a warm, encouraging explanation of why this could be a good match, focusing on the strongest compatibility areas while being honest about any considerations. Keep it under 150 words.
    `
  }

  /**
   * Create fallback explanation when AI fails
   */
  private createFallbackExplanation(
    similarities: Record<string, number>,
    islamicAlignment: number
  ): string {
    const strongestArea = Object.entries(similarities)
      .sort(([,a], [,b]) => b - a)[0]

    const areaNames = {
      values: 'shared Islamic values',
      lifestyle: 'compatible lifestyle',
      personality: 'personality compatibility',
      interests: 'common interests',
      profileText: 'overall compatibility'
    }

    return `This match shows promise with strong ${areaNames[strongestArea[0] as keyof typeof areaNames]} (${(strongestArea[1] * 100).toFixed(0)}%) and good Islamic alignment (${(islamicAlignment * 100).toFixed(0)}%). Both individuals appear to share important values for building a successful Islamic marriage.`
  }

  // Helper methods for compatibility checks

  private isAgeMatch(age: number, minAge?: number, maxAge?: number): boolean {
    if (!minAge && !maxAge) return true
    if (minAge && age < minAge) return false
    if (maxAge && age > maxAge) return false
    return true
  }

  private isLocationNearby(zone1: string, zone2: string): boolean {
    // Define nearby zones - this could be more sophisticated
    const nearbyZones: Record<string, string[]> = {
      'north_america_east': ['north_america_central', 'north_america_west'],
      'north_america_central': ['north_america_east', 'north_america_west'],
      'north_america_west': ['north_america_central', 'north_america_east'],
      'europe_west': ['europe_east', 'middle_east'],
      'europe_east': ['europe_west', 'middle_east'],
      // Add more as needed
    }

    return nearbyZones[zone1]?.includes(zone2) || false
  }

  private isEducationCompatible(education?: string, preferredLevel?: string): boolean {
    if (!education || !preferredLevel) return true
    // Simplified education compatibility - could be enhanced
    return true
  }

  private isMaritalStatusCompatible(
    status1: MaritalStatus,
    status2: MaritalStatus,
    hasChildren1: boolean,
    hasChildren2: boolean,
    acceptsChildren1?: boolean,
    acceptsChildren2?: boolean
  ): number {
    // Both never married
    if (status1 === 'never_married' && status2 === 'never_married') {
      if (!hasChildren1 && !hasChildren2) return 1.0
      return 0.8 // One has children but other never married
    }

    // Both divorced/widowed
    if ((status1 === 'divorced' || status1 === 'widowed') && 
        (status2 === 'divorced' || status2 === 'widowed')) {
      return 0.9 // Good compatibility
    }

    // Mixed never married with divorced/widowed
    if ((status1 === 'never_married' && (status2 === 'divorced' || status2 === 'widowed')) ||
        (status2 === 'never_married' && (status1 === 'divorced' || status1 === 'widowed'))) {
      
      // Check children acceptance
      const neverMarriedAccepts = status1 === 'never_married' ? acceptsChildren1 : acceptsChildren2
      const hasChildrenFromPrevious = status1 !== 'never_married' ? hasChildren1 : hasChildren2
      
      if (hasChildrenFromPrevious && neverMarriedAccepts) return 0.8
      if (hasChildrenFromPrevious && !neverMarriedAccepts) return 0.3
      return 0.9 // No children involved
    }

    return 0.7 // Default moderate compatibility
  }

  private isCulturallyCompatible(ethnicity1: Ethnicity, ethnicity2: Ethnicity): boolean {
    // Define culturally compatible ethnicities
    const compatibleGroups = [
      ['arab', 'middle_eastern'],
      ['south_asian', 'southeast_asian'],
      ['african', 'afro_caribbean'],
      // Convert backgrounds often compatible with all
    ]

    return compatibleGroups.some(group => 
      group.includes(ethnicity1) && group.includes(ethnicity2)
    ) || ethnicity1 === 'convert' || ethnicity2 === 'convert'
  }
}