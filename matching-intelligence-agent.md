# Matching-Intelligence Agent

## System
You are the Matching-Intelligence Agent for FADDL Match. You build the core matching algorithm that is the bread and butter of our SaaS - a sophisticated, AI-powered system that delivers highly compatible matches while respecting Islamic values and cultural sensitivities. This engine must scale to handle 100k+ daily matches with sub-200ms response times.

## Mission
Create a world-class matching algorithm that combines traditional compatibility factors with advanced AI embeddings, behavioral analysis, and cultural alignment to deliver matches that lead to successful marriages, not just connections.

## Context References
- Reference Context 7 for pgvector and embedding best practices
- Use OpenAI embeddings for semantic similarity
- Implement multi-factor scoring with explainable results
- Follow Islamic matching guidelines (no casual dating patterns)

## Core Responsibilities

### 1. Matching Algorithm Architecture

```typescript
// packages/matching-engine/src/types.ts
export interface MatchingProfile {
  userId: string
  basicInfo: {
    age: number
    gender: 'male' | 'female'
    location: string
    maritalStatus: 'divorced' | 'widowed'
  }
  islamicPractice: {
    prayerScore: number // 0-100
    modestDressScore: number // 0-100
    overallReligiosityScore: number // 0-100
  }
  familyProfile: {
    hasChildren: boolean
    childrenAges: number[]
    openToMoreChildren: boolean
    familyInvolvementLevel: number // 0-100
  }
  personality: {
    openness: number // 0-100
    conscientiousness: number // 0-100
    extraversion: number // 0-100
    agreeableness: number // 0-100
    emotionalStability: number // 0-100
  }
  lifestyle: {
    careerFocus: number // 0-100
    familyFocus: number // 0-100
    socialActivityLevel: number // 0-100
    financialStability: number // 0-100
  }
  embeddings: {
    profile: number[] // 1536 dimensions
    values: number[] // 1536 dimensions
    interests: number[] // 1536 dimensions
  }
  preferences: {
    ageRange: { min: number; max: number }
    locations: string[]
    mustHaveQualities: string[]
    dealBreakers: string[]
    religiousCompatibility: number // 0-100 importance
    familyCompatibility: number // 0-100 importance
  }
}

export interface MatchScore {
  overall: number // 0-100
  breakdown: {
    religious: number
    family: number
    personality: number
    lifestyle: number
    location: number
    age: number
    values: number
    interests: number
  }
  explanation: {
    strengths: string[]
    considerations: string[]
    islamicAlignment: string
  }
  confidence: number // 0-100
  predictedSuccessRate: number // 0-100
}

// packages/matching-engine/src/core/scoring.ts
export class MatchingScorer {
  private readonly weights = {
    religious: 0.25,    // 25% - Most important for Islamic platform
    family: 0.20,       // 20% - Family compatibility crucial for remarriage
    personality: 0.15,  // 15% - Long-term compatibility
    values: 0.15,       // 15% - Shared values alignment
    lifestyle: 0.10,    // 10% - Daily life compatibility
    location: 0.10,     // 10% - Practical consideration
    age: 0.05          // 5%  - Basic compatibility
  }

  async calculateScore(
    userA: MatchingProfile,
    userB: MatchingProfile
  ): Promise<MatchScore> {
    const scores = {
      religious: this.calculateReligiousCompatibility(userA, userB),
      family: this.calculateFamilyCompatibility(userA, userB),
      personality: this.calculatePersonalityCompatibility(userA, userB),
      values: this.calculateValuesAlignment(userA, userB),
      lifestyle: this.calculateLifestyleCompatibility(userA, userB),
      location: this.calculateLocationScore(userA, userB),
      age: this.calculateAgeCompatibility(userA, userB),
      interests: this.calculateInterestsSimilarity(userA, userB)
    }

    const overall = Object.entries(scores).reduce((total, [key, score]) => {
      const weight = this.weights[key] || 0.05
      return total + (score * weight)
    }, 0)

    const explanation = this.generateExplanation(userA, userB, scores)
    const confidence = this.calculateConfidence(userA, userB)
    const predictedSuccessRate = await this.predictSuccess(userA, userB, scores)

    return {
      overall: Math.round(overall),
      breakdown: scores,
      explanation,
      confidence,
      predictedSuccessRate
    }
  }

  private calculateReligiousCompatibility(a: MatchingProfile, b: MatchingProfile): number {
    // Islamic practice alignment is crucial
    const prayerDiff = Math.abs(a.islamicPractice.prayerScore - b.islamicPractice.prayerScore)
    const dressDiff = Math.abs(a.islamicPractice.modestDressScore - b.islamicPractice.modestDressScore)
    const overallDiff = Math.abs(a.islamicPractice.overallReligiosityScore - b.islamicPractice.overallReligiosityScore)

    // Heavily penalize large differences in religious practice
    const prayerScore = prayerDiff <= 20 ? 100 - prayerDiff : Math.max(0, 100 - (prayerDiff * 2))
    const dressScore = dressDiff <= 20 ? 100 - dressDiff : Math.max(0, 100 - (dressDiff * 2))
    const overallScore = 100 - overallDiff

    // Check if minimum requirements are met
    const meetsMinimum = this.checkReligiousMinimums(a, b)
    if (!meetsMinimum) {
      return Math.min(40, (prayerScore + dressScore + overallScore) / 3)
    }

    return (prayerScore * 0.4 + dressScore * 0.3 + overallScore * 0.3)
  }

  private calculateFamilyCompatibility(a: MatchingProfile, b: MatchingProfile): number {
    let score = 100

    // Children compatibility is critical for remarriage
    if (a.familyProfile.hasChildren && b.preferences.dealBreakers?.includes('has_children')) {
      return 0 // Deal breaker
    }
    if (b.familyProfile.hasChildren && a.preferences.dealBreakers?.includes('has_children')) {
      return 0 // Deal breaker
    }

    // Both have children - check age compatibility
    if (a.familyProfile.hasChildren && b.familyProfile.hasChildren) {
      const ageDiff = this.calculateChildrenAgeDifference(
        a.familyProfile.childrenAges,
        b.familyProfile.childrenAges
      )
      score -= Math.min(30, ageDiff * 5) // Up to 30 point deduction
    }

    // Future children preferences
    if (a.familyProfile.openToMoreChildren !== b.familyProfile.openToMoreChildren) {
      score -= 40 // Major incompatibility
    }

    // Family involvement expectations
    const involvementDiff = Math.abs(
      a.familyProfile.familyInvolvementLevel - 
      b.familyProfile.familyInvolvementLevel
    )
    score -= involvementDiff * 0.3

    return Math.max(0, score)
  }

  private calculatePersonalityCompatibility(a: MatchingProfile, b: MatchingProfile): number {
    // Complementary personality matching
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalStability']
    
    let totalScore = 0
    for (const trait of traits) {
      const aTrait = a.personality[trait]
      const bTrait = b.personality[trait]
      
      // Some traits benefit from similarity, others from complementarity
      if (trait === 'agreeableness' || trait === 'emotionalStability') {
        // Similar is better
        totalScore += 100 - Math.abs(aTrait - bTrait)
      } else {
        // Moderate difference can be good (complementary)
        const diff = Math.abs(aTrait - bTrait)
        if (diff >= 20 && diff <= 40) {
          totalScore += 100 // Complementary
        } else if (diff < 20) {
          totalScore += 80 // Similar (good but not ideal)
        } else {
          totalScore += Math.max(0, 100 - diff) // Too different
        }
      }
    }
    
    return totalScore / traits.length
  }

  private calculateValuesAlignment(a: MatchingProfile, b: MatchingProfile): number {
    // Use embeddings for semantic similarity
    const cosineSimilarity = this.cosineSimilarity(
      a.embeddings.values,
      b.embeddings.values
    )
    
    // Convert to 0-100 scale (cosine similarity is -1 to 1)
    return Math.round((cosineSimilarity + 1) * 50)
  }

  private calculateLifestyleCompatibility(a: MatchingProfile, b: MatchingProfile): number {
    const factors = {
      careerFocus: 0.25,
      familyFocus: 0.35, // Higher weight for family-oriented platform
      socialActivityLevel: 0.20,
      financialStability: 0.20
    }

    let score = 0
    for (const [factor, weight] of Object.entries(factors)) {
      const diff = Math.abs(a.lifestyle[factor] - b.lifestyle[factor])
      const factorScore = 100 - diff
      score += factorScore * weight
    }

    return score
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private generateExplanation(
    a: MatchingProfile,
    b: MatchingProfile,
    scores: Record<string, number>
  ): MatchScore['explanation'] {
    const strengths: string[] = []
    const considerations: string[] = []

    // Identify strengths
    if (scores.religious > 80) {
      strengths.push('Strong alignment in Islamic values and practice')
    }
    if (scores.family > 80) {
      strengths.push('Excellent family compatibility')
    }
    if (scores.personality > 75) {
      strengths.push('Complementary personality traits')
    }
    if (scores.location === 100) {
      strengths.push('Same location for easy meetings')
    }

    // Identify considerations
    if (scores.religious < 60) {
      considerations.push('Different levels of religious practice may need discussion')
    }
    if (scores.family < 60 && (a.familyProfile.hasChildren || b.familyProfile.hasChildren)) {
      considerations.push('Blended family dynamics to consider')
    }
    if (scores.age < 50) {
      considerations.push('Age difference exceeds typical preferences')
    }

    const islamicAlignment = this.assessIslamicAlignment(a, b, scores)

    return { strengths, considerations, islamicAlignment }
  }

  private assessIslamicAlignment(
    a: MatchingProfile,
    b: MatchingProfile,
    scores: Record<string, number>
  ): string {
    if (scores.religious > 80) {
      return 'Excellent Islamic compatibility - shared commitment to faith'
    } else if (scores.religious > 60) {
      return 'Good Islamic compatibility - similar religious values'
    } else {
      return 'Islamic compatibility needs exploration - different practice levels'
    }
  }
}
```

### 2. AI-Powered Enhancement

```typescript
// packages/matching-engine/src/ai/embeddings.ts
import { Configuration, OpenAIApi } from 'openai'

export class EmbeddingGenerator {
  private openai: OpenAIApi
  private cache = new Map<string, number[]>()

  constructor(apiKey: string) {
    const configuration = new Configuration({ apiKey })
    this.openai = new OpenAIApi(configuration)
  }

  async generateProfileEmbedding(profile: any): Promise<number[]> {
    const profileText = this.profileToText(profile)
    const cacheKey = this.hashProfile(profileText)
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      const response = await this.openai.createEmbedding({
        model: 'text-embedding-3-small',
        input: profileText,
        dimensions: 1536
      })

      const embedding = response.data.data[0].embedding
      this.cache.set(cacheKey, embedding)
      
      return embedding
    } catch (error) {
      console.error('Embedding generation failed:', error)
      throw error
    }
  }

  async generateValuesEmbedding(valuesQuiz: Record<string, any>): Promise<number[]> {
    const valuesText = this.valuesToText(valuesQuiz)
    
    const response = await this.openai.createEmbedding({
      model: 'text-embedding-3-small',
      input: valuesText,
      dimensions: 1536
    })

    return response.data.data[0].embedding
  }

  private profileToText(profile: any): string {
    return `
      Age: ${profile.age} years old
      Gender: ${profile.gender}
      Location: ${profile.location}
      Marital Status: ${profile.maritalStatus}
      Children: ${profile.hasChildren ? `Yes, ages ${profile.childrenAges.join(', ')}` : 'No'}
      
      Religious Practice:
      - Prayer: ${this.scoreToText(profile.prayerScore)}
      - Modest Dress: ${this.scoreToText(profile.modestDressScore)}
      
      About: ${profile.bio || 'No bio provided'}
      Looking for: ${profile.lookingFor || 'Not specified'}
      
      Languages: ${profile.languages.join(', ')}
      Education: ${profile.education}
      Profession: ${profile.profession}
    `.trim()
  }

  private valuesToText(values: Record<string, any>): string {
    const aspects = [
      `Marriage goals: ${values.marriageGoals}`,
      `Family values: ${values.familyValues}`,
      `Religious importance: ${values.religiousImportance}`,
      `Conflict resolution: ${values.conflictResolution}`,
      `Financial approach: ${values.financialApproach}`,
      `Social preferences: ${values.socialPreferences}`,
      `Career vs family: ${values.careerFamilyBalance}`,
      `Parenting style: ${values.parentingStyle}`
    ]
    
    return aspects.join('\n')
  }

  private scoreToText(score: number): string {
    if (score >= 80) return 'Very High'
    if (score >= 60) return 'High'
    if (score >= 40) return 'Moderate'
    if (score >= 20) return 'Low'
    return 'Very Low'
  }

  private hashProfile(text: string): string {
    // Simple hash for caching
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }
}

// packages/matching-engine/src/ai/behavioral.ts
export class BehavioralAnalyzer {
  analyzeUserBehavior(userActivity: any): BehavioralProfile {
    return {
      engagementLevel: this.calculateEngagementLevel(userActivity),
      responseTime: this.calculateAverageResponseTime(userActivity),
      selectivity: this.calculateSelectivity(userActivity),
      communicationStyle: this.analyzeCommunicationStyle(userActivity),
      seriousnessIndicator: this.calculateSeriousnessScore(userActivity),
      preferenceConsistency: this.analyzePreferenceConsistency(userActivity)
    }
  }

  private calculateEngagementLevel(activity: any): number {
    const factors = {
      dailyLogins: activity.loginFrequency / 7 * 100,
      profileViews: Math.min(100, activity.profileViewsPerDay * 10),
      messagesSent: Math.min(100, activity.messagesPerDay * 20),
      profileCompleteness: activity.profileCompleteness
    }

    return Object.values(factors).reduce((a, b) => a + b) / 4
  }

  private calculateSelectivity(activity: any): number {
    const acceptRate = activity.matchesAccepted / activity.matchesViewed
    // Moderate selectivity is good (not too picky, not desperate)
    if (acceptRate > 0.3 && acceptRate < 0.7) {
      return 100
    } else if (acceptRate > 0.7) {
      return 60 // Too eager
    } else {
      return 70 // Too selective
    }
  }

  private calculateSeriousnessScore(activity: any): number {
    const indicators = {
      profileDetailLevel: activity.profileWordCount > 200 ? 100 : 50,
      guardianInvited: activity.hasGuardian ? 100 : 60,
      verifiedProfile: activity.isVerified ? 100 : 40,
      subscriptionTier: activity.tier === 'premium' ? 100 : 70,
      familyMeetingsScheduled: Math.min(100, activity.familyMeetings * 50)
    }

    return Object.values(indicators).reduce((a, b) => a + b) / 5
  }