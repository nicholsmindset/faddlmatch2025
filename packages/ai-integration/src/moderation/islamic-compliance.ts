import { PrayerFrequency } from '@faddl-match/types'

/**
 * IslamicComplianceChecker - Specialized system for checking Islamic compliance
 * 
 * Features:
 * - Islamic values alignment checking
 * - Halal/Haram content identification
 * - Matrimonial appropriateness validation
 * - Cultural Islamic practices awareness
 * - Scholarly guidance integration
 */
export class IslamicComplianceChecker {
  
  // Islamic compliance patterns and rules
  private readonly complianceRules = {
    // Highly encouraged Islamic content
    encouraged: [
      /\b(allah|islam|muslim|islamic|halal|sunnah|prophet|muhammad|pbuh)\b/i,
      /\b(prayer|salah|dua|quran|hadith|mosque|masjid)\b/i,
      /\b(family|marriage|nikah|parents|children)\b/i,
      /\b(modest|modesty|hijab|respect|honor)\b/i,
      /\b(assalam|alaikum|inshallah|mashallah|subhanallah|alhamdulillah)\b/i,
      /\b(righteous|pious|god-fearing|taqwa|iman|faith)\b/i
    ],

    // Acceptable matrimonial content
    acceptable: [
      /\b(education|profession|career|work|job)\b/i,
      /\b(interests|hobbies|travel|books|sports)\b/i,
      /\b(culture|tradition|language|heritage)\b/i,
      /\b(values|goals|future|dreams|aspirations)\b/i,
      /\b(cooking|food|health|fitness|exercise)\b/i
    ],

    // Concerning content requiring review
    concerning: [
      /\b(date|dating|girlfriend|boyfriend|partner)\b/i,
      /\b(love|romantic|romance|passion|attraction)\b/i,
      /\b(physical|intimate|sexual|kiss|hug|touch)\b/i,
      /\b(alone|private|secret|hidden|sneak)\b/i,
      /\b(drink|alcohol|party|club|bar|nightlife)\b/i,
      /\b(haram|forbidden|sin|sinful|wrong|immoral)\b/i
    ],

    // Prohibited content
    prohibited: [
      /\b(sex|sexual|intercourse|intimate|adult)\b/i,
      /\b(naked|nude|body|appearance|looks|beauty)\b/i,
      /\b(alcohol|beer|wine|drunk|drugs|smoking)\b/i,
      /\b(pork|gambling|interest|riba|usury)\b/i,
      /\b(homosexual|gay|lesbian|lgbt)\b/i,
      /\b(atheist|kafir|non-believer)\b/i
    ]
  }

  // Islamic guidance messages
  private readonly guidanceMessages = {
    inappropriate_terminology: 'Consider using Islamic matrimonial terminology like "seeking marriage" instead of "dating"',
    physical_references: 'Islamic courtship maintains physical boundaries until marriage',
    alone_meetings: 'Islam encourages supervised meetings with family or mahram present',
    inappropriate_compliments: 'Focus on character and Islamic values rather than physical appearance',
    religious_obligations: 'Discussing religious practice and commitment is encouraged in Islamic matrimony',
    family_involvement: 'Islamic marriage involves families - consider mentioning family support',
    islamic_greetings: 'Using Islamic greetings like "Assalamu alaikum" is appreciated',
    halal_activities: 'Suggest halal activities and public meeting places',
    marriage_intentions: 'Clear intentions for marriage align with Islamic principles',
    patience_trust: 'Trust in Allah\'s timing and guidance in matrimonial matters'
  }

  /**
   * Check content for Islamic compliance
   */
  async checkCompliance(
    content: string,
    contentType: string,
    culturalContext: {
      primaryLanguage: string,
      culturalBackground: string,
      religiousLevel: PrayerFrequency
    }
  ): Promise<IslamicComplianceResult> {
    
    const analysis = this.analyzeContent(content)
    const score = this.calculateComplianceScore(analysis, culturalContext.religiousLevel)
    const violations = this.identifyViolations(analysis)
    const guidance = this.generateGuidance(violations, contentType)
    
    return {
      score,
      confidence: this.calculateConfidence(analysis),
      violations,
      guidance,
      recommendations: this.generateRecommendations(analysis, culturalContext),
      culturalNotes: this.getCulturalNotes(culturalContext.culturalBackground)
    }
  }

  /**
   * Analyze content against Islamic compliance patterns
   */
  private analyzeContent(content: string): ContentAnalysis {
    const contentLower = content.toLowerCase()
    
    const encouraged = this.complianceRules.encouraged.filter(pattern => pattern.test(content)).length
    const acceptable = this.complianceRules.acceptable.filter(pattern => pattern.test(content)).length
    const concerning = this.complianceRules.concerning.filter(pattern => pattern.test(content)).length
    const prohibited = this.complianceRules.prohibited.filter(pattern => pattern.test(content)).length

    // Check for specific Islamic elements
    const hasIslamicGreeting = /assalam|salaam/i.test(content)
    const hasIslamicPhrases = /inshallah|mashallah|subhanallah|alhamdulillah|barakallahu/i.test(content)
    const hasReligiousContent = /allah|islam|muslim|prayer|quran|hadith|prophet/i.test(content)
    const hasFamilyMention = /family|parents|guardian|mahram/i.test(content)
    const hasMarriageIntention = /marriage|nikah|wife|husband|spouse/i.test(content)

    // Check for problematic elements
    const hasInappropriateTerms = /dating|girlfriend|boyfriend|romantic/i.test(content)
    const hasPhysicalReferences = /physical|intimate|touch|kiss|hug|appearance|looks/i.test(content)
    const hasPrivacyTerms = /alone|private|secret|meet privately/i.test(content)
    const hasProhibitedContent = /alcohol|drugs|gambling|interest|haram/i.test(content)

    return {
      encouraged,
      acceptable,
      concerning,
      prohibited,
      hasIslamicGreeting,
      hasIslamicPhrases,
      hasReligiousContent,
      hasFamilyMention,
      hasMarriageIntention,
      hasInappropriateTerms,
      hasPhysicalReferences,
      hasPrivacyTerms,
      hasProhibitedContent,
      wordCount: content.split(/\s+/).length,
      characterCount: content.length
    }
  }

  /**
   * Calculate Islamic compliance score (0-1)
   */
  private calculateComplianceScore(
    analysis: ContentAnalysis,
    religiousLevel: PrayerFrequency
  ): number {
    let score = 0.7 // Base neutral score

    // Positive factors
    if (analysis.hasIslamicGreeting) score += 0.1
    if (analysis.hasIslamicPhrases) score += 0.05
    if (analysis.hasReligiousContent) score += 0.1
    if (analysis.hasFamilyMention) score += 0.08
    if (analysis.hasMarriageIntention) score += 0.12
    if (analysis.encouraged > 0) score += Math.min(0.15, analysis.encouraged * 0.03)
    if (analysis.acceptable > 0) score += Math.min(0.1, analysis.acceptable * 0.02)

    // Negative factors
    if (analysis.hasInappropriateTerms) score -= 0.25
    if (analysis.hasPhysicalReferences) score -= 0.3
    if (analysis.hasPrivacyTerms) score -= 0.2
    if (analysis.hasProhibitedContent) score -= 0.4
    if (analysis.concerning > 0) score -= Math.min(0.3, analysis.concerning * 0.1)
    if (analysis.prohibited > 0) score -= Math.min(0.5, analysis.prohibited * 0.15)

    // Adjust based on religious level
    const religiousMultiplier = this.getReligiousMultiplier(religiousLevel)
    if (analysis.hasReligiousContent) {
      score *= religiousMultiplier
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Get religious level multiplier
   */
  private getReligiousMultiplier(religiousLevel: PrayerFrequency): number {
    switch (religiousLevel) {
      case 'always': return 1.1 // Higher expectations and rewards for religious content
      case 'often': return 1.05
      case 'sometimes': return 1.0
      case 'never': return 0.95 // Slightly lower expectations but still important
      default: return 1.0
    }
  }

  /**
   * Identify specific violations
   */
  private identifyViolations(analysis: ContentAnalysis): string[] {
    const violations: string[] = []

    if (analysis.hasInappropriateTerms) {
      violations.push('inappropriate_terminology')
    }
    
    if (analysis.hasPhysicalReferences) {
      violations.push('physical_references')
    }
    
    if (analysis.hasPrivacyTerms) {
      violations.push('alone_meetings')
    }
    
    if (analysis.hasProhibitedContent) {
      violations.push('prohibited_content')
    }
    
    if (analysis.concerning > 2) {
      violations.push('multiple_concerns')
    }
    
    // Check for missing positive elements in longer content
    if (analysis.wordCount > 20) {
      if (!analysis.hasIslamicGreeting && !analysis.hasIslamicPhrases) {
        violations.push('missing_islamic_elements')
      }
      
      if (!analysis.hasMarriageIntention && !analysis.hasFamilyMention) {
        violations.push('unclear_intentions')
      }
    }

    return violations
  }

  /**
   * Generate Islamic guidance based on violations
   */
  private generateGuidance(violations: string[], contentType: string): string | undefined {
    if (violations.length === 0) return undefined

    const primaryViolation = violations[0]
    let guidance = this.guidanceMessages[primaryViolation as keyof typeof this.guidanceMessages]
    
    if (!guidance) {
      guidance = 'Please ensure your content aligns with Islamic values and matrimonial appropriateness'
    }

    // Add content-type specific guidance
    switch (contentType) {
      case 'profile':
        guidance += '. Consider highlighting your Islamic values and family-oriented goals.'
        break
      case 'message':
        guidance += '. Use respectful Islamic communication and maintain appropriate boundaries.'
        break
      case 'bio':
        guidance += '. Focus on character, faith, and marriage intentions rather than physical attributes.'
        break
    }

    return guidance
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    analysis: ContentAnalysis,
    culturalContext: {
      primaryLanguage: string,
      culturalBackground: string,
      religiousLevel: PrayerFrequency
    }
  ): string[] {
    const recommendations: string[] = []

    // Islamic greeting recommendation
    if (!analysis.hasIslamicGreeting && analysis.wordCount > 10) {
      recommendations.push('Consider starting with "Assalamu alaikum" for Islamic greeting')
    }

    // Religious content recommendation
    if (!analysis.hasReligiousContent && analysis.wordCount > 15) {
      recommendations.push('Mentioning Islamic values or faith can enhance your message')
    }

    // Family involvement recommendation
    if (!analysis.hasFamilyMention && analysis.wordCount > 25) {
      recommendations.push('Islamic marriage involves families - consider mentioning family support')
    }

    // Marriage intention recommendation
    if (!analysis.hasMarriageIntention && analysis.wordCount > 20) {
      recommendations.push('Clear marriage intentions align with Islamic matrimonial principles')
    }

    // Cultural specific recommendations
    switch (culturalContext.culturalBackground) {
      case 'arab':
        recommendations.push('Arabic Islamic phrases are highly appreciated in Arab culture')
        break
      case 'south_asian':
        recommendations.push('Family honor and educational achievements are culturally important')
        break
      case 'convert':
        recommendations.push('Sharing your Islamic journey can be meaningful to other converts')
        break
    }

    return recommendations.slice(0, 3) // Limit to top 3 recommendations
  }

  /**
   * Get cultural notes for Islamic compliance
   */
  private getCulturalNotes(culturalBackground: string): string {
    const culturalNotes: Record<string, string> = {
      arab: 'Arab Islamic culture highly values eloquent religious expression and family honor',
      south_asian: 'South Asian Muslims often emphasize family approval and educational compatibility',
      southeast_asian: 'Southeast Asian Islamic culture values harmony and gentle religious expression',
      african: 'African Islamic traditions emphasize community involvement and collective decision-making',
      turkish: 'Turkish Islamic culture balances traditional values with modern approaches',
      persian: 'Persian Islamic culture appreciates sophisticated religious and literary expression',
      convert: 'New Muslims may be learning Islamic etiquette - patience and guidance appreciated',
      mixed: 'Mixed cultural background allows flexibility in Islamic expression and practices'
    }

    return culturalNotes[culturalBackground] || 'Islamic principles are universal across all cultures'
  }

  /**
   * Calculate confidence in the compliance assessment
   */
  private calculateConfidence(analysis: ContentAnalysis): number {
    let confidence = 0.7 // Base confidence

    // Higher confidence with clear indicators
    if (analysis.prohibited > 0) confidence += 0.2 // Very confident about violations
    if (analysis.encouraged > 2) confidence += 0.15 // Confident about positive content
    if (analysis.hasProhibitedContent) confidence += 0.1
    if (analysis.hasIslamicGreeting) confidence += 0.05

    // Lower confidence with ambiguous content
    if (analysis.concerning > 0 && analysis.encouraged > 0) confidence -= 0.1 // Mixed signals
    if (analysis.wordCount < 5) confidence -= 0.2 // Too short to analyze well

    return Math.max(0.3, Math.min(0.95, confidence))
  }

  /**
   * Check if content requires scholarly review
   */
  requiresScholarlyReview(
    content: string,
    violations: string[]
  ): boolean {
    // Content mentioning complex religious topics
    const religiousTopics = /\b(fatwa|haram|halal|sharia|fiqh|madhab|scholar|imam|ruling)\b/i
    
    // Controversial or complex Islamic matters
    const complexTopics = /\b(polygamy|divorce|mahr|dowry|inheritance|custody)\b/i
    
    return religiousTopics.test(content) || 
           complexTopics.test(content) || 
           violations.includes('religious_interpretation_needed')
  }

  /**
   * Get severity level of violations
   */
  getViolationSeverity(violations: string[]): 'low' | 'medium' | 'high' {
    if (violations.includes('prohibited_content') || violations.includes('physical_references')) {
      return 'high'
    }
    
    if (violations.includes('inappropriate_terminology') || violations.includes('alone_meetings')) {
      return 'medium'
    }
    
    return 'low'
  }
}

// Supporting interfaces
interface ContentAnalysis {
  encouraged: number
  acceptable: number
  concerning: number
  prohibited: number
  hasIslamicGreeting: boolean
  hasIslamicPhrases: boolean
  hasReligiousContent: boolean
  hasFamilyMention: boolean
  hasMarriageIntention: boolean
  hasInappropriateTerms: boolean
  hasPhysicalReferences: boolean
  hasPrivacyTerms: boolean
  hasProhibitedContent: boolean
  wordCount: number
  characterCount: number
}

interface IslamicComplianceResult {
  score: number
  confidence: number
  violations: string[]
  guidance?: string
  recommendations: string[]
  culturalNotes: string
}