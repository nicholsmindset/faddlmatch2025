import { CulturalBackground, CommunicationStyle } from '../types'

/**
 * CulturalContextManager - Manages cultural nuances for Islamic matrimonial communications
 * 
 * Features:
 * - Cultural background-specific communication styles
 * - Appropriate formality levels for different cultures
 * - Family involvement expectations by culture
 * - Language and greeting preferences
 * - Islamic practices across different cultural contexts
 */
export class CulturalContextManager {
  private culturalProfiles: Record<string, CulturalProfile> = {
    arab: {
      communication: 'formal',
      familyInvolvement: 'high',
      greetingStyle: 'elaborate',
      directness: 'moderate',
      religiousExpression: 'frequent',
      languagePreferences: ['arabic', 'english'],
      commonPhrases: {
        greeting: 'Assalamu alaikum wa rahmatullahi wa barakatuh',
        blessing: 'Barakallahu feeki/feek',
        thanks: 'Jazakallahu khayran',
        farewell: 'Fi amanillah'
      },
      culturalConsiderations: [
        'High emphasis on family honor and reputation',
        'Formal address until marriage arrangements discussed',
        'Poetry and eloquent expression appreciated',
        'Religious references natural and expected'
      ]
    },

    south_asian: {
      communication: 'formal',
      familyInvolvement: 'high',
      greetingStyle: 'respectful',
      directness: 'indirect',
      religiousExpression: 'moderate',
      languagePreferences: ['english', 'urdu', 'hindi', 'bengali'],
      commonPhrases: {
        greeting: 'Assalamu alaikum, how are you?',
        blessing: 'May Allah bless you',
        thanks: 'JazakAllahu khair',
        farewell: 'Allah hafiz'
      },
      culturalConsiderations: [
        'Elder respect is paramount',
        'Family izzat (honor) very important',
        'Educational achievements highly valued',
        'Extended family involvement expected'
      ]
    },

    southeast_asian: {
      communication: 'formal',
      familyInvolvement: 'high',
      greetingStyle: 'respectful',
      directness: 'indirect',
      religiousExpression: 'moderate',
      languagePreferences: ['english', 'malay', 'indonesian'],
      commonPhrases: {
        greeting: 'Assalamualaikum warahmatullahi wabarakatuh',
        blessing: 'Semoga Allah memberkati',
        thanks: 'Jazakallahu khairan',
        farewell: 'Wassalamualaikum'
      },
      culturalConsiderations: [
        'Harmony and avoiding conflict important',
        'Gentle, respectful communication preferred',
        'Community consensus valued',
        'Traditional gender roles often expected'
      ]
    },

    african: {
      communication: 'formal',
      familyInvolvement: 'high',
      greetingStyle: 'warm',
      directness: 'moderate',
      religiousExpression: 'frequent',
      languagePreferences: ['english', 'arabic', 'french', 'swahili'],
      commonPhrases: {
        greeting: 'As-salamu alaykum sister/brother',
        blessing: 'May Allah bless you abundantly',
        thanks: 'Barakallahu feek',
        farewell: 'May Allah protect you'
      },
      culturalConsiderations: [
        'Community and collective decision-making important',
        'Respect for elders and wisdom traditions',
        'Storytelling and personal history sharing valued',
        'Strong emphasis on family unity'
      ]
    },

    turkish: {
      communication: 'formal',
      familyInvolvement: 'high',
      greetingStyle: 'respectful',
      directness: 'direct',
      religiousExpression: 'moderate',
      languagePreferences: ['turkish', 'english'],
      commonPhrases: {
        greeting: 'Selamu aleykum',
        blessing: 'Allah razi olsun',
        thanks: 'Teşekkür ederim',
        farewell: 'Allah\'a emanet ol'
      },
      culturalConsiderations: [
        'Balance between modern and traditional values',
        'Direct but respectful communication',
        'Family approval significant',
        'Education and career balance important'
      ]
    },

    persian: {
      communication: 'formal',
      familyInvolvement: 'high',
      greetingStyle: 'elaborate',
      directness: 'indirect',
      religiousExpression: 'moderate',
      languagePreferences: ['persian', 'english'],
      commonPhrases: {
        greeting: 'Salamu alaykum va rahmatullahi va barakatuh',
        blessing: 'Khoda hefzet kone',
        thanks: 'Moteshakkeram',
        farewell: 'Be omid-e didar'
      },
      culturalConsiderations: [
        'Poetry and literature appreciation common',
        'Elaborate expressions of respect',
        'Family lineage and background important',
        'Artistic and intellectual pursuits valued'
      ]
    },

    convert: {
      communication: 'mixed',
      familyInvolvement: 'variable',
      greetingStyle: 'simple',
      directness: 'direct',
      religiousExpression: 'learning',
      languagePreferences: ['english'],
      commonPhrases: {
        greeting: 'Assalamu alaikum',
        blessing: 'May Allah bless you',
        thanks: 'Thank you, JazakAllah',
        farewell: 'Assalamu alaikum'
      },
      culturalConsiderations: [
        'May be learning Islamic etiquette',
        'Family may not be Muslim',
        'Eager to learn and integrate',
        'Patience with Islamic customs needed'
      ]
    },

    mixed: {
      communication: 'adaptable',
      familyInvolvement: 'moderate',
      greetingStyle: 'flexible',
      directness: 'moderate',
      religiousExpression: 'moderate',
      languagePreferences: ['english'],
      commonPhrases: {
        greeting: 'Assalamu alaikum',
        blessing: 'May Allah bless you',
        thanks: 'JazakAllah',
        farewell: 'Assalamu alaikum'
      },
      culturalConsiderations: [
        'Blend of cultural practices',
        'Flexible approach to traditions',
        'May relate to multiple cultures',
        'Open to different Islamic practices'
      ]
    }
  }

  /**
   * Get cultural context for cross-cultural communication
   */
  async getCulturalContext(
    senderCulture: string,
    recipientCulture: string
  ): Promise<CulturalInteractionContext> {
    const senderProfile = this.culturalProfiles[senderCulture] || this.culturalProfiles.mixed
    const recipientProfile = this.culturalProfiles[recipientCulture] || this.culturalProfiles.mixed

    return {
      sender: senderProfile,
      recipient: recipientProfile,
      recommendations: this.generateInteractionRecommendations(senderProfile, recipientProfile),
      commonGround: this.findCommonGround(senderProfile, recipientProfile),
      adaptations: this.suggestAdaptations(senderProfile, recipientProfile)
    }
  }

  /**
   * Generate communication style recommendations
   */
  private generateInteractionRecommendations(
    sender: CulturalProfile,
    recipient: CulturalProfile
  ): string[] {
    const recommendations: string[] = []

    // Formality level
    if (sender.communication !== recipient.communication) {
      if (recipient.communication === 'formal') {
        recommendations.push('Use formal language and respectful titles')
      } else if (recipient.communication === 'mixed') {
        recommendations.push('Start formal and adapt based on recipient\'s response style')
      }
    }

    // Family involvement
    if (recipient.familyInvolvement === 'high') {
      recommendations.push('Acknowledge and respect family involvement in decision-making')
      recommendations.push('Consider mentioning your own family\'s support')
    }

    // Communication directness
    if (sender.directness === 'direct' && recipient.directness === 'indirect') {
      recommendations.push('Use gentler, more nuanced language')
      recommendations.push('Allow for reading between the lines')
    } else if (sender.directness === 'indirect' && recipient.directness === 'direct') {
      recommendations.push('Be more straightforward in your communication')
      recommendations.push('Express intentions clearly')
    }

    // Religious expression
    if (recipient.religiousExpression === 'frequent') {
      recommendations.push('Include appropriate Islamic phrases and references')
      recommendations.push('Reference Allah\'s guidance and blessings naturally')
    } else if (recipient.religiousExpression === 'learning') {
      recommendations.push('Be patient with Islamic terminology')
      recommendations.push('Explain Islamic concepts gently when relevant')
    }

    return recommendations
  }

  /**
   * Find common ground between cultures
   */
  private findCommonGround(
    sender: CulturalProfile,
    recipient: CulturalProfile
  ): string[] {
    const commonGround: string[] = []

    // Shared Islamic values
    commonGround.push('Shared commitment to Islamic values and halal marriage')
    commonGround.push('Common goal of building a righteous Muslim family')

    // Language preferences
    const sharedLanguages = sender.languagePreferences.filter(lang =>
      recipient.languagePreferences.includes(lang)
    )
    if (sharedLanguages.length > 0) {
      commonGround.push(`Shared language(s): ${sharedLanguages.join(', ')}`)
    }

    // Similar communication styles
    if (sender.communication === recipient.communication) {
      commonGround.push(`Both prefer ${sender.communication} communication style`)
    }

    // Similar family involvement expectations
    if (sender.familyInvolvement === recipient.familyInvolvement) {
      commonGround.push(`Shared expectations for ${sender.familyInvolvement} family involvement`)
    }

    return commonGround
  }

  /**
   * Suggest cultural adaptations
   */
  private suggestAdaptations(
    sender: CulturalProfile,
    recipient: CulturalProfile
  ): CulturalAdaptation[] {
    const adaptations: CulturalAdaptation[] = []

    // Greeting adaptation
    if (sender.commonPhrases.greeting !== recipient.commonPhrases.greeting) {
      adaptations.push({
        aspect: 'greeting',
        suggestion: `Consider using: "${recipient.commonPhrases.greeting}"`,
        reason: 'Matches recipient\'s cultural greeting style'
      })
    }

    // Communication style adaptation
    if (sender.directness !== recipient.directness) {
      adaptations.push({
        aspect: 'communication_style',
        suggestion: recipient.directness === 'indirect' ? 
          'Use more subtle, gentle language' : 
          'Be more direct and clear in your communication',
        reason: `Recipient prefers ${recipient.directness} communication`
      })
    }

    // Cultural considerations
    recipient.culturalConsiderations.forEach(consideration => {
      adaptations.push({
        aspect: 'cultural_awareness',
        suggestion: `Be aware: ${consideration}`,
        reason: 'Important cultural context for recipient\'s background'
      })
    })

    return adaptations
  }

  /**
   * Get appropriate greeting for cultural context
   */
  getAppropriateGreeting(culture: string, gender: 'male' | 'female'): string {
    const profile = this.culturalProfiles[culture] || this.culturalProfiles.mixed
    const baseGreeting = profile.commonPhrases.greeting
    
    // Add gender-appropriate address if needed
    if (culture === 'arab' || culture === 'south_asian') {
      const address = gender === 'female' ? 'sister' : 'brother'
      return `${baseGreeting}, dear ${address}`
    }
    
    return baseGreeting
  }

  /**
   * Get cultural-specific conversation topics
   */
  getCulturalConversationTopics(culture: string): ConversationTopic[] {
    const topics: ConversationTopic[] = [
      // Universal Islamic topics
      {
        topic: 'Islamic values and practice',
        appropriate: 'always',
        culturalNotes: 'Central to all Muslim cultures'
      },
      {
        topic: 'Family importance',
        appropriate: 'always',
        culturalNotes: 'Universal Islamic value'
      }
    ]

    // Culture-specific topics
    switch (culture) {
      case 'arab':
        topics.push(
          {
            topic: 'Islamic history and scholarship',
            appropriate: 'always',
            culturalNotes: 'Highly valued in Arab culture'
          },
          {
            topic: 'Poetry and literature',
            appropriate: 'getting_to_know',
            culturalNotes: 'Arabic literary tradition appreciated'
          }
        )
        break
        
      case 'south_asian':
        topics.push(
          {
            topic: 'Education and career achievements',
            appropriate: 'getting_to_know',
            culturalNotes: 'Highly valued in South Asian families'
          },
          {
            topic: 'Extended family traditions',
            appropriate: 'family_discussion',
            culturalNotes: 'Large family networks important'
          }
        )
        break
        
      case 'convert':
        topics.push(
          {
            topic: 'Islamic learning journey',
            appropriate: 'getting_to_know',
            culturalNotes: 'Often eager to share and learn'
          },
          {
            topic: 'Integrating Islamic practices',
            appropriate: 'getting_to_know',
            culturalNotes: 'May need support and understanding'
          }
        )
        break
    }

    return topics
  }
}

// Supporting interfaces
interface CulturalProfile {
  communication: CommunicationStyle
  familyInvolvement: 'high' | 'medium' | 'low' | 'variable'
  greetingStyle: 'elaborate' | 'respectful' | 'simple' | 'warm' | 'flexible'
  directness: 'direct' | 'indirect' | 'moderate'
  religiousExpression: 'frequent' | 'moderate' | 'learning'
  languagePreferences: string[]
  commonPhrases: {
    greeting: string
    blessing: string
    thanks: string
    farewell: string
  }
  culturalConsiderations: string[]
}

interface CulturalInteractionContext {
  sender: CulturalProfile
  recipient: CulturalProfile
  recommendations: string[]
  commonGround: string[]
  adaptations: CulturalAdaptation[]
}

interface CulturalAdaptation {
  aspect: string
  suggestion: string
  reason: string
}

interface ConversationTopic {
  topic: string
  appropriate: 'always' | 'introduction' | 'getting_to_know' | 'family_discussion' | 'meeting_planning'
  culturalNotes: string
}