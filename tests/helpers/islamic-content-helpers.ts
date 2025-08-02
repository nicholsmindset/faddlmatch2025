/**
 * Islamic Content Helpers
 * Utilities for testing Islamic compliance, content validation, and cultural sensitivity
 */

export interface IslamicValidationResult {
  isCompliant: boolean;
  complianceScore: number; // 0-100
  flags: string[];
  suggestions: string[];
  category: 'appropriate' | 'needs_guidance' | 'inappropriate' | 'excellent';
}

export interface CulturalContext {
  region: 'arab' | 'south_asian' | 'african' | 'southeast_asian' | 'western' | 'mixed';
  madhab: 'hanafi' | 'shafi' | 'maliki' | 'hanbali' | 'mixed' | 'unknown';
  practiceLevel: 'learning' | 'practicing' | 'strict' | 'scholarly';
}

/**
 * Validate content for Islamic compliance
 */
export function validateIslamicContent(content: string): IslamicValidationResult {
  const flags: string[] = [];
  const suggestions: string[] = [];
  let complianceScore = 100;
  
  // Convert to lowercase for pattern matching
  const lowerContent = content.toLowerCase();
  
  // Check for Islamic greetings and positive expressions
  const islamicGreetings = [
    'assalamu alaikum', 'wa alaikum assalam', 'barakallahu', 'alhamdulillah',
    'inshallah', 'mashallah', 'subhanallah', 'astaghfirullah', 'allahu alam'
  ];
  
  const hasIslamicGreeting = islamicGreetings.some(greeting => 
    lowerContent.includes(greeting.replace(/'/g, ''))
  );
  
  if (hasIslamicGreeting) {
    complianceScore += 10; // Bonus for Islamic expressions
  }
  
  // Check for inappropriate content
  const inappropriatePatterns = [
    { pattern: /meet.*alone|private.*meeting|without.*family/i, flag: 'inappropriate_meeting_request', penalty: 30 },
    { pattern: /photo.*without|picture.*private|send.*pic/i, flag: 'inappropriate_photo_request', penalty: 40 },
    { pattern: /hold.*hand|kiss|hug|physical/i, flag: 'inappropriate_physical_intimacy', penalty: 35 },
    { pattern: /beautiful|gorgeous|sexy|attractive.*look/i, flag: 'inappropriate_compliment', penalty: 20 },
    { pattern: /love.*you|romantic|dream.*about/i, flag: 'premature_romantic_expression', penalty: 25 },
    { pattern: /phone.*private|contact.*secret|text.*alone/i, flag: 'private_communication_attempt', penalty: 30 },
    { pattern: /guardian.*not|family.*not.*need|approval.*not/i, flag: 'guardian_avoidance', penalty: 35 },
    { pattern: /secret|hide.*from|don.*tell/i, flag: 'secrecy_encouragement', penalty: 30 }
  ];
  
  inappropriatePatterns.forEach(({ pattern, flag, penalty }) => {
    if (pattern.test(content)) {
      flags.push(flag);
      complianceScore -= penalty;
    }
  });
  
  // Check for positive Islamic content
  const positivePatterns = [
    { pattern: /family.*involve|guardian.*approve|parent.*blessing/i, bonus: 15, suggestion: 'Excellent emphasis on family involvement' },
    { pattern: /allah.*guide|seek.*guidance|istikhara/i, bonus: 15, suggestion: 'Beautiful reliance on Allah\'s guidance' },
    { pattern: /islamic.*value|religious.*practice|faith.*important/i, bonus: 10, suggestion: 'Good focus on Islamic values' },
    { pattern: /mosque|prayer|quran|hadith/i, bonus: 10, suggestion: 'Positive religious reference' },
    { pattern: /marriage.*allah|nikah|islamic.*wedding/i, bonus: 10, suggestion: 'Good Islamic marriage focus' }
  ];
  
  positivePatterns.forEach(({ pattern, bonus, suggestion }) => {
    if (pattern.test(content)) {
      complianceScore += bonus;
      suggestions.push(suggestion);
    }
  });
  
  // Boundary cases that need guidance
  const guidancePatterns = [
    { pattern: /meet.*together|get.*together/i, suggestion: 'Consider suggesting family-supervised meetings' },
    { pattern: /know.*better|learn.*about/i, suggestion: 'Encourage family-appropriate getting-to-know process' },
    { pattern: /future.*together|our.*future/i, suggestion: 'Guide toward family-involved discussions about compatibility' }
  ];
  
  guidancePatterns.forEach(({ pattern, suggestion }) => {
    if (pattern.test(content)) {
      suggestions.push(suggestion);
    }
  });
  
  // Cap the score
  complianceScore = Math.max(0, Math.min(100, complianceScore));
  
  // Determine category
  let category: IslamicValidationResult['category'];
  if (complianceScore >= 90) category = 'excellent';
  else if (complianceScore >= 70) category = 'appropriate';
  else if (complianceScore >= 40) category = 'needs_guidance';
  else category = 'inappropriate';
  
  // Add general suggestions based on score
  if (complianceScore < 70 && flags.length === 0) {
    suggestions.push('Consider adding Islamic greetings or expressions');
  }
  
  if (flags.includes('inappropriate_meeting_request')) {
    suggestions.push('Suggest family-supervised meetings instead');
  }
  
  if (flags.includes('guardian_avoidance')) {
    suggestions.push('Emphasize the importance of guardian approval in Islamic courtship');
  }
  
  return {
    isCompliant: complianceScore >= 60 && flags.length === 0,
    complianceScore,
    flags,
    suggestions,
    category
  };
}

/**
 * Generate Islamic guidance message
 */
export function generateIslamicGuidance(context: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): string {
  const guidanceTemplates = {
    beginner: [
      'In Islam, getting to know a potential spouse should involve families from the beginning.',
      'Islamic courtship emphasizes respect, modesty, and family involvement.',
      'Consider seeking Allah\'s guidance through Istikhara prayer for important decisions.',
      'Remember that Islamic marriage is built on mutual respect and shared faith.'
    ],
    intermediate: [
      'The Islamic approach to marriage emphasizes the involvement of families and guardians.',
      'Maintaining appropriate boundaries while getting to know each other is part of Islamic etiquette.',
      'Consider how this conversation would sound to your families - this is a good guideline.',
      'Islamic marriage is half of faith - approach it with seriousness and divine guidance.'
    ],
    advanced: [
      'The Prophetic example shows us the importance of character assessment through family interaction.',
      'Islamic jurisprudence emphasizes the role of guardians in ensuring appropriate courtship.',
      'Consider the hadith: "When someone whose religion and character pleases you proposes, then marry him."',
      'The barakah in marriage comes through following Islamic guidelines and seeking Allah\'s pleasure.'
    ]
  };
  
  const contextSpecificGuidance: { [key: string]: string[] } = {
    meeting: [
      'Islamic meetings should include family members or take place in appropriate public settings.',
      'The mosque community center is an excellent place for families to meet.',
      'Consider arranging a meeting where both families can get acquainted.'
    ],
    communication: [
      'Keep conversations respectful and family-appropriate.',
      'Islamic communication focuses on character, values, and compatibility.',
      'Remember that your guardian is there to help ensure the best outcome for you.'
    ],
    compatibility: [
      'Islamic compatibility includes shared values, practice level, and family harmony.',
      'Discuss your approaches to Islamic practice and family life.',
      'Consider how well your families might get along together.'
    ]
  };
  
  const templates = guidanceTemplates[userLevel];
  const contextGuidance = contextSpecificGuidance[context] || contextSpecificGuidance.communication;
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  const randomContextGuidance = contextGuidance[Math.floor(Math.random() * contextGuidance.length)];
  
  return `${randomTemplate} ${randomContextGuidance}`;
}

/**
 * Detect cultural context from content
 */
export function detectCulturalContext(content: string): CulturalContext {
  const lowerContent = content.toLowerCase();
  
  // Detect region
  let region: CulturalContext['region'] = 'mixed';
  
  const regionalIndicators = {
    arab: ['arabic', 'arab', 'middle east', 'gulf', 'saudi', 'uae', 'qatar', 'kuwait', 'lebanon', 'syria', 'jordan', 'egypt'],
    south_asian: ['pakistani', 'indian', 'bengali', 'desi', 'urdu', 'hindi', 'bangladesh', 'pakistan', 'india'],
    african: ['nigerian', 'ethiopian', 'somali', 'sudanese', 'african', 'west africa', 'east africa'],
    southeast_asian: ['indonesian', 'malaysian', 'thai', 'filipino', 'singapore', 'brunei', 'indonesia', 'malaysia'],
    western: ['american', 'canadian', 'british', 'australian', 'european', 'convert', 'revert']
  };
  
  for (const [regionKey, indicators] of Object.entries(regionalIndicators)) {
    if (indicators.some(indicator => lowerContent.includes(indicator))) {
      region = regionKey as CulturalContext['region'];
      break;
    }
  }
  
  // Detect madhab
  let madhab: CulturalContext['madhab'] = 'unknown';
  
  const madhabIndicators = {
    hanafi: ['hanafi', 'abu hanifa', 'deobandi', 'tablighi'],
    shafi: ['shafi', 'shafii', 'ash\'ari'],
    maliki: ['maliki', 'malik'],
    hanbali: ['hanbali', 'ahmad', 'salafi', 'wahabi']
  };
  
  for (const [madhabKey, indicators] of Object.entries(madhabIndicators)) {
    if (indicators.some(indicator => lowerContent.includes(indicator))) {
      madhab = madhabKey as CulturalContext['madhab'];
      break;
    }
  }
  
  // Detect practice level
  let practiceLevel: CulturalContext['practiceLevel'] = 'practicing';
  
  if (lowerContent.includes('new muslim') || lowerContent.includes('convert') || lowerContent.includes('learning')) {
    practiceLevel = 'learning';
  } else if (lowerContent.includes('strict') || lowerContent.includes('traditional') || lowerContent.includes('conservative')) {
    practiceLevel = 'strict';
  } else if (lowerContent.includes('scholar') || lowerContent.includes('islamic studies') || lowerContent.includes('imam')) {
    practiceLevel = 'scholarly';
  }
  
  return { region, madhab, practiceLevel };
}

/**
 * Generate culturally appropriate response suggestions
 */
export function generateCulturallyAppropriateResponses(
  context: CulturalContext, 
  topic: string
): string[] {
  const responses: string[] = [];
  
  // Base Islamic responses
  const baseResponses = [
    'Alhamdulillah, that sounds wonderful.',
    'May Allah bless your family\'s traditions.',
    'I appreciate learning about different Islamic practices.',
    'Islamic diversity is truly beautiful.'
  ];
  
  // Region-specific responses
  const regionalResponses = {
    arab: [
      'Arabic Islamic traditions are rich and meaningful.',
      'May Allah preserve the beautiful Arab Islamic heritage.',
      'The Arabic language adds beauty to Islamic expressions.'
    ],
    south_asian: [
      'South Asian Islamic culture has wonderful traditions.',
      'The devotion in South Asian Muslim communities is inspiring.',
      'Pakistani/Indian Islamic weddings are truly magnificent.'
    ],
    african: [
      'African Islamic scholarship has a rich history.',
      'The Islamic traditions of Africa are deeply meaningful.',
      'May Allah bless the African Muslim communities.'
    ],
    southeast_asian: [
      'Southeast Asian Islamic culture is beautifully diverse.',
      'Indonesian/Malaysian Islamic traditions are wonderful.',
      'The harmony in Southeast Asian Muslim communities is inspiring.'
    ],
    western: [
      'Converting to Islam requires great courage and faith.',
      'New Muslim experiences enrich our community.',
      'May Allah make your Islamic journey easy and blessed.'
    ]
  };
  
  // Madhab-specific responses
  const madhabResponses = {
    hanafi: ['The Hanafi school has rich scholarly traditions.'],
    shafi: ['Shafi\'i jurisprudence offers beautiful guidance.'],
    maliki: ['The Maliki school has wonderful practices.'],
    hanbali: ['Hanbali scholarship is deeply respected.']
  };
  
  responses.push(...baseResponses);
  
  if (context.region !== 'mixed') {
    responses.push(...regionalResponses[context.region]);
  }
  
  if (context.madhab !== 'unknown') {
    responses.push(...madhabResponses[context.madhab]);
  }
  
  return responses.slice(0, 3); // Return top 3 suggestions
}

/**
 * Validate prayer time awareness
 */
export function validatePrayerTimeAwareness(content: string, currentTime?: Date): {
  isPrayerTimeAware: boolean;
  prayerMentioned?: string;
  suggestion?: string;
} {
  const lowerContent = content.toLowerCase();
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jummah'];
  
  const prayerMentioned = prayers.find(prayer => lowerContent.includes(prayer));
  
  if (prayerMentioned) {
    return {
      isPrayerTimeAware: true,
      prayerMentioned,
      suggestion: 'Excellent awareness of prayer times and Islamic obligations.'
    };
  }
  
  // Check for prayer-related phrases
  const prayerPhrases = [
    'after prayer', 'before prayer', 'at the mosque', 'prayer time',
    'going to pray', 'prayer is calling', 'time for salah'
  ];
  
  const hasPrayerPhrase = prayerPhrases.some(phrase => lowerContent.includes(phrase));
  
  if (hasPrayerPhrase) {
    return {
      isPrayerTimeAware: true,
      suggestion: 'Good awareness of Islamic prayer obligations.'
    };
  }
  
  return {
    isPrayerTimeAware: false,
    suggestion: 'Consider incorporating awareness of prayer times in your communication.'
  };
}

/**
 * Generate Islamic calendar awareness suggestions
 */
export function generateIslamicCalendarAwareness(date?: Date): {
  occasion?: string;
  greeting?: string;
  guidance?: string;
} {
  // In a real implementation, this would check against the Islamic calendar
  // For testing purposes, we'll simulate some occasions
  
  const currentDate = date || new Date();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  
  // Simulated Islamic occasions
  if (month === 3 && day >= 20 && day <= 25) { // Ramadan period (approximate)
    return {
      occasion: 'Ramadan',
      greeting: 'Ramadan Mubarak',
      guidance: 'During Ramadan, focus on spiritual growth and family bonding.'
    };
  }
  
  if (month === 6 && day >= 10 && day <= 15) { // Eid al-Adha period (approximate)
    return {
      occasion: 'Eid al-Adha',
      greeting: 'Eid Mubarak',
      guidance: 'Eid is a time for family celebration and gratitude to Allah.'
    };
  }
  
  if (currentDate.getDay() === 5) { // Friday - Jummah
    return {
      occasion: 'Jummah',
      greeting: 'Jummah Mubarak',
      guidance: 'Friday is blessed - consider attending Jummah prayers with family.'
    };
  }
  
  return {};
}

/**
 * Evaluate conversation for Islamic marriage readiness
 */
export function evaluateMarriageReadiness(
  conversationHistory: string[], 
  userProfile: any
): {
  readinessScore: number; // 0-100
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
} {
  let readinessScore = 50; // Base score
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const nextSteps: string[] = [];
  
  const allContent = conversationHistory.join(' ').toLowerCase();
  
  // Positive indicators
  if (allContent.includes('family') && allContent.includes('involve')) {
    readinessScore += 15;
    strengths.push('Shows commitment to family involvement');
  }
  
  if (allContent.includes('islamic') && (allContent.includes('value') || allContent.includes('practice'))) {
    readinessScore += 15;
    strengths.push('Demonstrates Islamic values focus');
  }
  
  if (allContent.includes('guardian') && allContent.includes('approval')) {
    readinessScore += 10;
    strengths.push('Respects guardian oversight');
  }
  
  if (allContent.includes('marriage') && allContent.includes('serious')) {
    readinessScore += 10;
    strengths.push('Shows serious marriage intention');
  }
  
  // Areas needing improvement
  if (!allContent.includes('family')) {
    areasForImprovement.push('More discussion about family involvement needed');
    nextSteps.push('Encourage family meetings and discussions');
  }
  
  if (!allContent.includes('future') && !allContent.includes('goals')) {
    areasForImprovement.push('Future planning discussions needed');
    nextSteps.push('Discuss life goals and future Islamic household vision');
  }
  
  if (conversationHistory.length < 10) {
    areasForImprovement.push('More conversation needed for proper assessment');
    nextSteps.push('Continue getting to know each other with family guidance');
  }
  
  // Cap the score
  readinessScore = Math.max(0, Math.min(100, readinessScore));
  
  // Default next steps if none added
  if (nextSteps.length === 0) {
    if (readinessScore >= 80) {
      nextSteps.push('Consider arranging a formal family meeting');
    } else if (readinessScore >= 60) {
      nextSteps.push('Continue conversations with guardian guidance');
    } else {
      nextSteps.push('Focus on building Islamic foundation in conversations');
    }
  }
  
  return {
    readinessScore,
    strengths,
    areasForImprovement,
    nextSteps
  };
}

/**
 * Helper to format Islamic compliance report
 */
export function formatComplianceReport(
  validation: IslamicValidationResult,
  cultural: CulturalContext,
  suggestions: string[]
): string {
  let report = `Islamic Compliance Report\n`;
  report += `========================\n\n`;
  report += `Compliance Score: ${validation.complianceScore}/100\n`;
  report += `Category: ${validation.category}\n`;
  report += `Status: ${validation.isCompliant ? 'COMPLIANT' : 'NEEDS REVIEW'}\n\n`;
  
  if (validation.flags.length > 0) {
    report += `Flags: ${validation.flags.join(', ')}\n\n`;
  }
  
  if (suggestions.length > 0) {
    report += `Suggestions:\n`;
    suggestions.forEach(suggestion => {
      report += `- ${suggestion}\n`;
    });
    report += '\n';
  }
  
  report += `Cultural Context: ${cultural.region} / ${cultural.madhab} / ${cultural.practiceLevel}\n`;
  
  return report;
}