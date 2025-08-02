/**
 * Sample Content for Testing
 * Islamic content, inappropriate content, and boundary test cases
 */

export interface IslamicGreeting {
  text: string;
  category: 'greeting' | 'farewell' | 'blessing' | 'supplication';
  meaning: string;
  response?: string;
}

export interface IslamicPhrase {
  text: string;
  meaning: string;
  category: 'praise' | 'supplication' | 'blessing' | 'acknowledgment';
  response?: string;
}

export interface InappropriateContent {
  text: string;
  reason: string;
  category: 'intimacy' | 'privacy_violation' | 'family_exclusion' | 'inappropriate_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HalalTopic {
  example: string;
  category: 'family' | 'education' | 'career' | 'religion' | 'community' | 'values';
  guidance?: string;
}

export interface BoundaryTestContent {
  text: string;
  shouldPass: boolean;
  reason: string;
  category: 'borderline_appropriate' | 'cultural_context' | 'ambiguous_intent';
}

/**
 * Islamic greetings and expressions that should be recognized and encouraged
 */
export const getIslamicGreetings = (): IslamicGreeting[] => [
  {
    text: 'Assalamu Alaikum',
    category: 'greeting',
    meaning: 'Peace be upon you',
    response: 'Wa alaikum assalam'
  },
  {
    text: 'Wa alaikum assalam wa rahmatullahi wa barakatuh',
    category: 'greeting',
    meaning: 'And upon you peace and Allah\'s mercy and blessings',
    response: 'Wa alaikum assalam'
  },
  {
    text: 'Barakallahu feeki',
    category: 'blessing',
    meaning: 'May Allah bless you (to a female)',
    response: 'Wa feeki barakallah'
  },
  {
    text: 'Barakallahu feek',
    category: 'blessing',
    meaning: 'May Allah bless you (to a male)',
    response: 'Wa feeka barakallah'
  },
  {
    text: 'Fi amanillah',
    category: 'farewell',
    meaning: 'Go with Allah\'s protection',
    response: 'Fi amanillah'
  },
  {
    text: 'May Allah guide us both',
    category: 'supplication',
    meaning: 'Prayer for guidance',
    response: 'Ameen'
  }
];

/**
 * Islamic phrases and expressions for testing recognition
 */
export const getIslamicPhrases = (): IslamicPhrase[] => [
  {
    text: 'Alhamdulillah',
    meaning: 'Praise be to Allah',
    category: 'praise'
  },
  {
    text: 'InshaAllah',
    meaning: 'God willing',
    category: 'acknowledgment'
  },
  {
    text: 'Mashallah',
    meaning: 'What Allah has willed',
    category: 'acknowledgment'
  },
  {
    text: 'Subhanallah',
    meaning: 'Glory be to Allah',
    category: 'praise'
  },
  {
    text: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    category: 'supplication'
  },
  {
    text: 'Allahu A\'lam',
    meaning: 'Allah knows best',
    category: 'acknowledgment'
  },
  {
    text: 'May Allah make it easy',
    meaning: 'Prayer for ease',
    category: 'supplication',
    response: 'Ameen'
  },
  {
    text: 'Seeking Allah\'s guidance through Istikhara',
    meaning: 'Prayer for guidance in decision making',
    category: 'supplication'
  }
];

/**
 * Inappropriate content that should be blocked or flagged
 */
export const getInappropriateContent = (): InappropriateContent[] => [
  {
    text: 'Can we meet alone without our families?',
    reason: 'inappropriate meeting request',
    category: 'family_exclusion',
    severity: 'high'
  },
  {
    text: 'Send me photos of yourself',
    reason: 'inappropriate photo request',
    category: 'privacy_violation',
    severity: 'critical'
  },
  {
    text: 'I want to hold your hand',
    reason: 'inappropriate physical intimacy',
    category: 'intimacy',
    severity: 'high'
  },
  {
    text: 'Let\'s exchange phone numbers privately',
    reason: 'bypassing guardian oversight',
    category: 'family_exclusion',
    severity: 'medium'
  },
  {
    text: 'You look so beautiful in your pictures',
    reason: 'inappropriate physical compliments',
    category: 'intimacy',
    severity: 'medium'
  },
  {
    text: 'Can we video call when your family isn\'t around?',
    reason: 'inappropriate private communication',
    category: 'family_exclusion',
    severity: 'high'
  },
  {
    text: 'I dream about being with you',
    reason: 'inappropriate romantic expression',
    category: 'intimacy',
    severity: 'high'
  },
  {
    text: 'Tell me about your private life',
    reason: 'inappropriate personal information request',
    category: 'privacy_violation',
    severity: 'medium'
  },
  {
    text: 'I don\'t think we need guardian approval',
    reason: 'bypassing Islamic guidelines',
    category: 'family_exclusion',
    severity: 'high'
  },
  {
    text: 'Let\'s keep this conversation secret',
    reason: 'encouraging secrecy',
    category: 'family_exclusion',
    severity: 'high'
  }
];

/**
 * Halal topics that should be encouraged
 */
export const getHalalTopics = (): HalalTopic[] => [
  {
    example: 'Tell me about your family background and values',
    category: 'family',
    guidance: 'Family background is important for compatibility'
  },
  {
    example: 'What are your educational goals and career aspirations?',
    category: 'education'
  },
  {
    example: 'How do you practice Islam in your daily life?',
    category: 'religion',
    guidance: 'Religious compatibility is fundamental'
  },
  {
    example: 'What role does your family play in your decisions?',
    category: 'family',
    guidance: 'Family involvement is encouraged in Islam'
  },
  {
    example: 'What are your thoughts on Islamic marriage principles?',
    category: 'religion'
  },
  {
    example: 'How are you involved in your community?',
    category: 'community'
  },
  {
    example: 'What Islamic values are most important to you?',
    category: 'values'
  },
  {
    example: 'What are your professional goals and work ethics?',
    category: 'career'
  },
  {
    example: 'How do you balance religious obligations with daily life?',
    category: 'religion'
  },
  {
    example: 'What kind of Islamic household do you envision?',
    category: 'values',
    guidance: 'Future planning within Islamic framework is encouraged'
  }
];

/**
 * Boundary test content for edge cases
 */
export const getBoundaryTestContent = (): BoundaryTestContent[] => [
  {
    text: 'I think you seem like a wonderful person',
    shouldPass: true,
    reason: 'General appreciation is appropriate',
    category: 'borderline_appropriate'
  },
  {
    text: 'I admire your commitment to Islamic values',
    shouldPass: true,
    reason: 'Appreciating religious values is encouraged',
    category: 'borderline_appropriate'
  },
  {
    text: 'I feel we might be compatible',
    shouldPass: true,
    reason: 'Expressing compatibility assessment is appropriate',
    category: 'borderline_appropriate'
  },
  {
    text: 'I hope our families will approve of this match',
    shouldPass: true,
    reason: 'Seeking family approval is Islamic',
    category: 'borderline_appropriate'
  },
  {
    text: 'You have a nice smile',
    shouldPass: false,
    reason: 'Physical compliments are inappropriate',
    category: 'borderline_appropriate'
  },
  {
    text: 'I\'m excited to get to know you better',
    shouldPass: true,
    reason: 'Expressing interest in getting acquainted is appropriate',
    category: 'borderline_appropriate'
  },
  {
    text: 'Perhaps we could meet at the mosque',
    shouldPass: true,
    reason: 'Suggesting appropriate meeting places is good',
    category: 'borderline_appropriate'
  },
  {
    text: 'I\'d like to know more about your personality',
    shouldPass: true,
    reason: 'Interest in character is appropriate',
    category: 'borderline_appropriate'
  },
  {
    text: 'Can we talk more personally?',
    shouldPass: false,
    reason: 'Ambiguous request that could be inappropriate',
    category: 'ambiguous_intent'  
  },
  {
    text: 'In our culture, meetings are arranged differently',
    shouldPass: true,
    reason: 'Cultural context should be respected',
    category: 'cultural_context'
  }
];

/**
 * Islamic marriage-related content for testing
 */
export const getIslamicMarriageContent = () => [
  'Marriage is half of faith in Islam',
  'I pray Allah will guide us in this process',
  'Family blessing is important for a successful marriage',
  'Islamic marriage is based on mutual respect and understanding',
  'May Allah bring barakah to our families\' decision',
  'I believe in following Islamic courtship guidelines',
  'Our families\' involvement will bring blessings to this process',
  'Islamic marriage requires sincere intention and family support',
  'I seek a spouse who will help me grow in my Islamic faith',
  'May this process be pleasing to Allah and our families'
];

/**
 * Cultural sensitivity test content
 */
export const getCulturalTestContent = () => [
  // Arabic culture
  'In our Arab family traditions, engagement involves extended family',
  'Arabic Islamic customs include beautiful marriage celebrations',
  'Our family follows traditional Middle Eastern Islamic practices',
  
  // South Asian culture  
  'Pakistani Islamic wedding traditions are very meaningful to us',
  'Our Indian Muslim family has lovely engagement customs',
  'Bengali Islamic culture includes unique marriage practices',
  
  // African culture
  'Nigerian Islamic traditions are important to our family',
  'Our Ethiopian Muslim community has beautiful customs',
  'West African Islamic practices are deeply meaningful',
  
  // Southeast Asian culture
  'Indonesian Islamic weddings are magnificent celebrations',
  'Malaysian Muslim families have wonderful traditions',
  'Our Filipino Muslim heritage includes unique customs',
  
  // Convert experiences
  'As a new Muslim, I\'m learning about Islamic marriage',
  'Converting to Islam has taught me about proper courtship',
  'I appreciate the Islamic community\'s guidance on marriage'
];

/**
 * Guardian guidance sample content
 */
export const getGuardianGuidanceContent = () => [
  'Remember to maintain Islamic etiquette in conversations',
  'Family involvement brings blessings to the marriage process',
  'Keep discussions appropriate and family-friendly',
  'Consider arranging a meeting with both families present',
  'Islamic courtship requires patience and proper conduct',
  'Seek Allah\'s guidance through Istikhara prayer',
  'Both families should be comfortable with this process',
  'Islamic marriage is a blessed union requiring careful consideration'
];

/**
 * Prayer time and Islamic calendar content
 */
export const getPrayerTimeContent = () => [
  'I\'ll be at Maghrib prayer, talk to you after',
  'Jummah prayer is starting, I\'ll respond later',
  'It\'s time for Asr prayer, may Allah accept our prayers',
  'During Ramadan, our family focuses on extra worship',
  'Eid celebrations with family are always special',
  'Hajj pilgrimage is a dream for our family',
  'Islamic holidays bring our community together'
];

/**
 * Generate test content based on category
 */
export const generateTestContent = (category: string, count: number = 5): string[] => {
  const contentMap: { [key: string]: string[] } = {
    islamic_greetings: getIslamicGreetings().map(g => g.text),
    islamic_phrases: getIslamicPhrases().map(p => p.text),
    inappropriate: getInappropriateContent().map(c => c.text),
    halal_topics: getHalalTopics().map(t => t.example),
    marriage_content: getIslamicMarriageContent(),
    cultural_content: getCulturalTestContent(),
    guardian_guidance: getGuardianGuidanceContent(),
    prayer_content: getPrayerTimeContent()
  };

  const content = contentMap[category] || [];
  return content.slice(0, count);
};