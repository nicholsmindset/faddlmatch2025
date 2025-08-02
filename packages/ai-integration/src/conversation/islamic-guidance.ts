import { IslamicGuidance } from '../types'

/**
 * IslamicGuidanceProvider - Provides Islamic guidance for matrimonial conversations
 * 
 * Features:
 * - Stage-appropriate Islamic guidance
 * - Scholarly-backed advice
 * - Cultural adaptations for different Muslim communities
 * - Halal relationship progression guidance
 * - Family involvement recommendations
 */
export class IslamicGuidanceProvider {
  private guidanceDatabase: Record<string, IslamicGuidanceEntry> = {
    // Introduction stage guidance
    'introduction_greeting': {
      topic: 'Proper Islamic Greeting',
      guidance: 'Begin with "Assalamu alaikum" as taught by Prophet Muhammad (PBUH). This creates a blessed foundation for communication.',
      source: 'Hadith: "Spread salaam among yourselves" (Sahih Muslim)',
      culturalAdaptations: {
        arab: 'Use full greeting "Assalamu alaikum wa rahmatullahi wa barakatuh"',
        south_asian: 'Follow with respectful inquiry about health and family',
        convert: 'Simple "Assalamu alaikum" is perfectly appropriate',
        general: 'The greeting creates barakah (blessing) in the conversation'
      },
      actionable: true,
      relevanceScore: 1.0
    },

    'introduction_intention': {
      topic: 'Declaring Pure Intentions',
      guidance: 'State your intention for marriage clearly, as Islam values honesty and transparency in all dealings.',
      source: 'Quran 24:32 - "Marry those among you who are single"',
      culturalAdaptations: {
        arab: 'Reference seeking Allah\'s guidance in finding a righteous spouse',
        south_asian: 'Mention family support and blessing for your search',
        southeast_asian: 'Emphasize building a harmonious Muslim household',
        general: 'Honest intentions bring Allah\'s blessing'
      },
      actionable: true,
      relevanceScore: 0.9
    },

    // Getting to know stage guidance
    'getting_to_know_questions': {
      topic: 'Appropriate Questions in Islamic Courtship',
      guidance: 'Ask about religious practice, family values, and life goals. Avoid overly personal topics until families are involved.',
      source: 'Hadith: "A woman is married for four things: wealth, lineage, beauty, and religion. Choose the religious one" (Bukhari)',
      culturalAdaptations: {
        arab: 'Discuss Islamic knowledge and practice openly',
        south_asian: 'Include questions about family background and education',
        african: 'Community involvement and collective values important',
        general: 'Focus on character and deen (religion) as primary criteria'
      },
      actionable: true,
      relevanceScore: 0.95
    },

    'getting_to_know_boundaries': {
      topic: 'Maintaining Islamic Boundaries',
      guidance: 'Keep conversations respectful and modest. Avoid private meetings without mahram present.',
      source: 'Hadith: "When a man is alone with a woman, Satan is the third" (Tirmidhi)',
      culturalAdaptations: {
        arab: 'Strict adherence to gender interaction guidelines',
        south_asian: 'Family chaperones expected and respected',
        convert: 'Learning these boundaries is part of Islamic growth',
        general: 'Modesty protects both individuals and relationship'
      },
      actionable: true,
      relevanceScore: 0.9
    },

    // Family discussion stage guidance
    'family_involvement': {
      topic: 'Involving Families in Islamic Marriage',
      guidance: 'Islamic marriage involves families, not just individuals. Seek your guardian\'s blessing and guidance.',
      source: 'Hadith: "No marriage without a guardian" (Abu Dawood)',
      culturalAdaptations: {
        arab: 'Formal family meetings and negotiations expected',
        south_asian: 'Extended family involvement and approval sought',
        african: 'Community elders may play advisory role',
        convert: 'Islamic community leaders can serve as guardians if needed'
      },
      actionable: true,
      relevanceScore: 1.0
    },

    'family_compatibility': {
      topic: 'Family Compatibility in Islam',
      guidance: 'Ensure both families share similar Islamic values and can support the marriage harmoniously.',
      source: 'Hadith: "A woman is married to a man for his religion, so marry one with good religion" (Bukhari)',
      culturalAdaptations: {
        arab: 'Family honor and reputation highly important',
        south_asian: 'Educational and social status considerations',
        turkish: 'Balance of traditional and modern family values',
        general: 'Shared Islamic commitment is foundation'
      },
      actionable: true,
      relevanceScore: 0.85
    },

    // Meeting planning stage guidance
    'proper_meeting': {
      topic: 'Arranging Proper Islamic Meetings',
      guidance: 'Meet in appropriate settings with family present, following Islamic guidelines for gender interaction.',
      source: 'Prophet\'s example of allowing limited interaction for marriage compatibility',
      culturalAdaptations: {
        arab: 'Formal sitting arrangements with clear chaperoning',
        south_asian: 'Family tea/dinner gatherings common',
        southeast_asian: 'Community center or mosque meetings preferred',
        general: 'Public, respectful settings maintain Islamic propriety'
      },
      actionable: true,
      relevanceScore: 0.9
    },

    // General communication guidance
    'respectful_communication': {
      topic: 'Islamic Etiquette in Communication',
      guidance: 'Speak with kindness, avoid unnecessary compliments about appearance, focus on character and values.',
      source: 'Quran 24:30-31 - Guidelines for modest interaction',
      culturalAdaptations: {
        arab: 'Eloquent, respectful language appreciated',
        south_asian: 'Formal titles and respectful address important',
        african: 'Warm but appropriate communication style',
        general: 'Good character reflected in good speech'
      },
      actionable: true,
      relevanceScore: 0.8
    },

    'dua_and_guidance': {
      topic: 'Seeking Allah\'s Guidance Through Prayer',
      guidance: 'Make Istikhara (guidance prayer) for important decisions and trust in Allah\'s wisdom.',
      source: 'Hadith about Istikhara prayer (Bukhari)',
      culturalAdaptations: {
        arab: 'Frequent reference to Allah\'s guidance natural',
        south_asian: 'Family elders often lead in making dua',
        convert: 'Learning to seek Allah\'s guidance in decisions',
        general: 'Trust in Allah brings peace to the process'
      },
      actionable: true,
      relevanceScore: 0.75
    },

    'patience_and_trust': {
      topic: 'Patience and Trust in Allah\'s Timing',
      guidance: 'Trust Allah\'s timing and wisdom. If it\'s meant to be, Allah will make it easy.',
      source: 'Quran 2:216 - "Perhaps you dislike something that is good for you"',
      culturalAdaptations: {
        arab: 'Inshallah (God willing) commonly used',
        south_asian: 'Tawakkul (trust in Allah) emphasized',
        african: 'Community support during waiting periods',
        general: 'Patience is half of faith'
      },
      actionable: false,
      relevanceScore: 0.7
    }
  }

  /**
   * Get contextual Islamic guidance based on conversation stage and type
   */
  async getContextualGuidance(
    conversationType: string,
    stage: string,
    culturalBackground?: string
  ): Promise<string | undefined> {
    const key = `${stage}_${conversationType}`
    const guidance = this.guidanceDatabase[key]
    
    if (!guidance) {
      return this.getGeneralGuidance(stage, conversationType)
    }

    // Return culturally adapted guidance
    if (culturalBackground && guidance.culturalAdaptations[culturalBackground]) {
      return `${guidance.guidance} Cultural note: ${guidance.culturalAdaptations[culturalBackground]}`
    }

    return `${guidance.guidance} ${guidance.culturalAdaptations.general || ''}`
  }

  /**
   * Get comprehensive Islamic guidance for a conversation stage
   */
  async getStageGuidance(
    stage: string,
    culturalBackground?: string
  ): Promise<IslamicGuidance[]> {
    const relevantGuidance: IslamicGuidance[] = []

    // Get all guidance entries relevant to the stage
    Object.entries(this.guidanceDatabase).forEach(([key, entry]) => {
      if (key.startsWith(stage) || key.includes('general')) {
        const culturalNote = culturalBackground ? 
          entry.culturalAdaptations[culturalBackground] || entry.culturalAdaptations.general :
          entry.culturalAdaptations.general

        relevantGuidance.push({
          topic: entry.topic,
          guidance: entry.guidance,
          source: entry.source,
          culturalAdaptation: culturalBackground ? 
            { [culturalBackground]: culturalNote || '' } : 
            { general: entry.culturalAdaptations.general || '' },
          actionable: entry.actionable,
          relevanceScore: entry.relevanceScore
        })
      }
    })

    // Sort by relevance score
    return relevantGuidance.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Get Islamic guidance for specific situations
   */
  async getSituationalGuidance(situation: string): Promise<IslamicGuidance | null> {
    switch (situation) {
      case 'first_message':
        return this.createGuidance(
          'First Message Guidelines',
          'Begin with Islamic greeting, state pure intentions, and seek Allah\'s blessing for the conversation.',
          'Prophetic example of straightforward, honest communication',
          { general: 'Honesty and good intentions bring barakah' }
        )

      case 'family_introduction':
        return this.createGuidance(
          'Introducing Families',
          'Facilitate proper family introduction as Islam emphasizes family involvement in marriage decisions.',
          'Islamic tradition of family participation in marriage',
          { general: 'Family blessing is crucial for successful Islamic marriage' }
        )

      case 'disagreement':
        return this.createGuidance(
          'Handling Disagreements Islamically',
          'Address differences with patience, respect, and reference to Islamic principles. Seek wise counsel.',
          'Quran 4:35 - "If you fear a breach between them, appoint arbiters"',
          { general: 'Disagreements can reveal compatibility and conflict resolution skills' }
        )

      case 'meeting_delay':
        return this.createGuidance(
          'Patience with Delays',
          'Trust Allah\'s timing. Delays may be protection or preparation for better outcomes.',
          'Hadith: "What is meant for you will not pass you by"',
          { general: 'Patience and trust in Allah bring peace' }
        )

      default:
        return null
    }
  }

  /**
   * Validate message content against Islamic guidelines
   */
  async validateIslamicContent(message: string): Promise<IslamicValidationResult> {
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 1.0

    // Check for inappropriate content
    const inappropriatePatterns = [
      /\b(dating|girlfriend|boyfriend)\b/i,
      /\b(intimate|physical|sexual)\b/i,
      /\b(alone|private|secret)\b/i
    ]

    inappropriatePatterns.forEach(pattern => {
      if (pattern.test(message)) {
        issues.push('Contains terminology not aligned with Islamic courtship')
        score -= 0.3
      }
    })

    // Check for positive Islamic elements
    const islamicPatterns = [
      /\b(allah|islamic|muslim|halal|inshallah|mashallah|barakallahu)\b/i,
      /\b(family|marriage|values|faith)\b/i,
      /assalam/i
    ]

    let islamicContentFound = false
    islamicPatterns.forEach(pattern => {
      if (pattern.test(message)) {
        islamicContentFound = true
      }
    })

    if (!islamicContentFound && message.length > 50) {
      recommendations.push('Consider including Islamic greetings or references to faith')
      score -= 0.1
    }

    // Check message length (very short or very long may be inappropriate)
    if (message.length < 10) {
      recommendations.push('Message may be too brief for meaningful Islamic courtship')
      score -= 0.1
    } else if (message.length > 1000) {
      recommendations.push('Consider breaking long messages into smaller, focused conversations')
      score -= 0.1
    }

    return {
      isAppropriate: issues.length === 0,
      score: Math.max(0, score),
      issues,
      recommendations,
      islamicElements: islamicContentFound
    }
  }

  /**
   * Get general guidance for unknown contexts
   */
  private getGeneralGuidance(stage: string, type: string): string {
    const generalGuidanceMap: Record<string, string> = {
      introduction: 'Begin with Islamic greetings and state your pure intentions for marriage.',
      getting_to_know: 'Focus on Islamic values, family importance, and life goals while maintaining appropriate boundaries.',
      family_discussion: 'Involve families as Islam emphasizes collective decision-making in marriage.',
      meeting_planning: 'Arrange meetings in appropriate Islamic settings with proper supervision.'
    }

    return generalGuidanceMap[stage] || 'Follow Islamic principles of honesty, respect, and modesty in all communications.'
  }

  /**
   * Create guidance entry
   */
  private createGuidance(
    topic: string,
    guidance: string,
    source: string,
    culturalAdaptation: Record<string, string>
  ): IslamicGuidance {
    return {
      topic,
      guidance,
      source,
      culturalAdaptation,
      actionable: true,
      relevanceScore: 0.8
    }
  }

  /**
   * Get daily Islamic reminders for users
   */
  async getDailyIslamicReminder(): Promise<IslamicGuidance> {
    const reminders = [
      {
        topic: 'Seeking Allah\'s Guidance',
        guidance: 'Make du\'a for Allah to guide you to a righteous spouse who will be the coolness of your eyes.',
        source: 'Quran 25:74 - "Grant us from our spouses and offspring comfort to our eyes"'
      },
      {
        topic: 'Patience in Search',
        guidance: 'Trust Allah\'s timing in providing the right spouse. What Allah has written for you will reach you.',
        source: 'Hadith: "Know that what has passed you by was not meant to reach you"'
      },
      {
        topic: 'Self-Improvement',
        guidance: 'Work on becoming the righteous spouse you seek. Improve your deen, character, and skills.',
        source: 'Hadith: "Each of you is a shepherd and responsible for his flock"'
      },
      {
        topic: 'Family Involvement',
        guidance: 'Include your family in your marriage search. Their prayers and guidance are valuable assets.',
        source: 'Quran: "And those who say: Our Lord! Grant us in our wives and offspring comfort to our eyes"'
      }
    ]

    const randomReminder = reminders[Math.floor(Math.random() * reminders.length)]
    
    return {
      topic: randomReminder.topic,
      guidance: randomReminder.guidance,
      source: randomReminder.source,
      culturalAdaptation: { general: 'Universal Islamic guidance for all Muslims' },
      actionable: true,
      relevanceScore: 0.8
    }
  }
}

// Supporting interfaces
interface IslamicGuidanceEntry {
  topic: string
  guidance: string
  source: string
  culturalAdaptations: Record<string, string>
  actionable: boolean
  relevanceScore: number
}

interface IslamicValidationResult {
  isAppropriate: boolean
  score: number
  issues: string[]
  recommendations: string[]
  islamicElements: boolean
}