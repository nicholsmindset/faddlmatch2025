# FADDL Match AI Integration

Enterprise-grade AI integration package for Islamic matrimonial platform with comprehensive features for profile matching, conversation assistance, content moderation, and personalized user experiences.

## Features

### 🎯 **AI-Powered Matching**
- **Semantic Profile Embeddings**: Using OpenAI's text-embedding-3-small for 1536-dimensional vectors
- **Islamic Values Weighting**: Prioritizes religious compatibility and family values
- **Multi-dimensional Similarity**: Profile, values, interests, lifestyle, and personality matching
- **Cultural Context Awareness**: Adapts matching for different Muslim cultural backgrounds

### 💬 **Conversation Intelligence**
- **Islamic-Appropriate Suggestions**: Context-aware conversation starters and responses
- **Cultural Adaptation**: Tailored communication styles for different cultures
- **Guardian Integration**: Family involvement facilitation and notifications
- **Real-time Analysis**: Sentiment and appropriateness monitoring

### 🛡️ **Content Moderation**
- **Islamic Compliance Checking**: Automated religious appropriateness validation
- **Multi-language Support**: Content analysis across different languages
- **Cultural Sensitivity**: Respects diverse Muslim cultural practices
- **Escalation System**: Human and scholarly review queues

### 📈 **Profile Enhancement**
- **AI-Powered Suggestions**: Personalized profile improvement recommendations
- **Islamic Guidance**: Scholarly-backed advice for better profiles
- **Cultural Considerations**: Background-specific enhancement tips
- **Completeness Scoring**: Objective profile quality measurement

### 💰 **Cost Optimization**
- **Smart Caching**: 60-80% API cost reduction through intelligent caching
- **Budget Management**: Real-time cost tracking and alerts
- **Model Selection**: Automatic optimization between GPT models
- **Rate Limiting**: Prevents API overages and maintains performance

## Installation

```bash
npm install @faddl-match/ai-integration
```

## Quick Start

```typescript
import { AIIntegrationSystem } from '@faddl-match/ai-integration'

// Initialize the AI system
const ai = new AIIntegrationSystem({
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    embeddingModel: 'text-embedding-3-small',
    maxTokens: 500,
    temperature: 0.7
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!
  },
  cache: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 10000
  },
  rateLimit: {
    requestsPerMinute: 100,
    concurrentRequests: 10
  }
})
```

## Usage Examples

### Profile Embeddings & Matching

```typescript
// Generate embeddings for a new profile
const embeddings = await ai.generateProfileEmbedding(userProfile, userPreferences)

// Find compatible matches
const matches = await ai.findSimilarProfiles(userId, 20, 0.7) // 20 matches, 70% min compatibility

// Calculate specific compatibility
const compatibility = await ai.calculateProfileCompatibility(userId1, userId2)

console.log(`Compatibility: ${(compatibility.overallScore * 100).toFixed(1)}%`)
console.log(`Islamic alignment: ${(compatibility.islamicAlignment * 100).toFixed(1)}%`)
```

### Conversation Intelligence

```typescript
// Generate conversation suggestions
const context = {
  participants: [
    { id: userId1, gender: 'male', culturalBackground: 'south_asian', languagePreference: 'english', communicationStyle: 'formal' },
    { id: userId2, gender: 'female', culturalBackground: 'arab', languagePreference: 'english', communicationStyle: 'formal' }
  ],
  stage: 'introduction',
  guardianInvolved: true,
  previousMessages: 0
}

const suggestions = await ai.generateConversationSuggestions(context, userId1, recipientProfile)

// Analyze message appropriateness
const analysis = await ai.analyzeConversation(message, context, senderProfile)

if (analysis.escalationNeeded) {
  console.log('Guardian notification required:', analysis.guardianAlert)
}
```

### Content Moderation

```typescript
// Moderate user content
const moderationRequest = {
  content: "Assalamu alaikum sister, I hope to find a righteous spouse...",
  contentType: 'message' as const,
  userId: userId,
  context: {
    recipientId: recipientId,
    conversationId: conversationId
  },
  culturalContext: {
    primaryLanguage: 'english',
    culturalBackground: 'south_asian',
    religiousLevel: 'often' as const
  }
}

const moderation = await ai.moderateContent(moderationRequest)

if (moderation.approved) {
  // Allow message
  console.log(`Islamic compliance: ${(moderation.islamicCompliance.score * 100).toFixed(1)}%`)
} else {
  // Block message and provide guidance
  console.log('Guidance:', moderation.islamicCompliance.guidance)
}
```

### Profile Enhancement

```typescript
// Get profile improvement suggestions
const context = {
  userId: userId,
  profile: userProfile,
  preferences: userPreferences,
  interactionHistory: {
    matchesViewed: 25,
    messagesExchanged: 5,
    meetingsArranged: 1,
    profileCompleteness: 75
  },
  culturalAdaptation: {
    primaryLanguage: 'english',
    culturalBackground: 'arab',
    communicationStyle: 'formal',
    familyInvolvement: 'high'
  }
}

const suggestions = await ai.getProfileEnhancementSuggestions(context)

suggestions.forEach(suggestion => {
  console.log(`${suggestion.section}: ${suggestion.suggestion}`)
  console.log(`Priority: ${suggestion.priority} | Impact: ${(suggestion.estimatedImpact * 100).toFixed(0)}%`)
  if (suggestion.islamicGuidance) {
    console.log(`Islamic guidance: ${suggestion.islamicGuidance}`)
  }
})
```

### Match Explanations

```typescript
// Generate detailed match explanation
const explanation = await ai.generateMatchExplanation(
  similarityScore,
  userProfile,
  matchProfile,
  userPreferences,
  matchPreferences
)

console.log(`Overall compatibility: ${explanation.overallCompatibility}%`)
console.log('Strengths:', explanation.strengths)
console.log('Considerations:', explanation.considerations)
console.log(`Islamic values alignment: ${explanation.islamicValues.score}%`)

// Get display-friendly explanation
const displayText = await ai.generateDisplayExplanation(explanation, explanation.overallCompatibility >= 80)
```

## Islamic Compliance Features

### Religious Values Integration
- **Prayer Frequency Alignment**: Matches users with compatible religious practice levels
- **Lifestyle Compatibility**: Considers modesty, halal practices, and Islamic lifestyle choices
- **Family Values**: Emphasizes family-oriented goals and children considerations
- **Marriage Intentions**: Validates serious matrimonial intentions following Islamic guidelines

### Cultural Sensitivity
- **Multi-Cultural Support**: Arab, South Asian, Southeast Asian, African, Turkish, Persian, Convert, and Mixed backgrounds
- **Language Adaptation**: Respectful communication across different languages and formality levels
- **Family Involvement**: Respects varying levels of family participation in different cultures
- **Scholarly Guidance**: Integration of Islamic knowledge and scholarly advice

### Content Guidelines
- **Appropriate Communication**: Ensures conversations maintain Islamic boundaries
- **Guardian Notifications**: Alerts for content requiring family awareness
- **Privacy Protection**: Discourages inappropriate private meeting arrangements
- **Respectful Language**: Promotes dignified, marriage-focused communication

## Performance & Monitoring

### System Metrics
```typescript
// Get comprehensive system metrics
const metrics = await ai.getSystemMetrics()

console.log('Performance:', {
  requestsPerSecond: metrics.requests.total / 3600,
  successRate: (metrics.requests.successful / metrics.requests.total * 100).toFixed(1) + '%',
  avgResponseTime: metrics.requests.avgResponseTime + 'ms',
  cacheHitRate: (metrics.cache.hitRate * 100).toFixed(1) + '%'
})

// Monitor costs
const costReport = await ai.getCostOptimizationReport()
console.log('Daily spend:', `$${costReport.currentSpend.total.toFixed(2)}`)
console.log('Savings from optimization:', `$${costReport.savings.total.toFixed(2)}`)
```

### Health Monitoring
```typescript
// Check system health
const health = await ai.healthCheck()
console.log(`System status: ${health.status}`)
console.log('Component status:', health.components)

// Clear caches for maintenance
await ai.clearCaches()
```

## Configuration Options

### OpenAI Settings
```typescript
openai: {
  apiKey: string,           // Required: OpenAI API key
  model: string,            // Default: 'gpt-4'
  embeddingModel: string,   // Default: 'text-embedding-3-small'
  maxTokens: number,        // Default: 500
  temperature: number       // Default: 0.7
}
```

### Caching Configuration
```typescript
cache: {
  ttl: number,             // Time to live in milliseconds
  maxSize: number,         // Maximum cache entries
  maxMemoryMB: number      // Memory limit in MB
}
```

### Budget Management
```typescript
// Set daily budget limits
const costOptimizer = new CostOptimizer({
  daily: 200,              // $200 daily limit
  monthly: 5000,           // $5000 monthly limit
  embeddings: 75,          // $75 for embeddings
  completions: 100,        // $100 for completions
  moderations: 25          // $25 for moderations
})
```

## Error Handling

The system includes comprehensive error handling with automatic retry logic, circuit breakers, and graceful degradation:

```typescript
try {
  const result = await ai.generateProfileEmbedding(profile, preferences)
} catch (error) {
  if (error instanceof AIIntegrationError) {
    console.log('Error code:', error.code)
    console.log('User-friendly message:', ai.getUserFriendlyMessage(error))
    console.log('Recommended action:', ai.getRecommendedAction(error))
  }
}
```

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

## License

Copyright (c) 2024 FADDL Match. All rights reserved.

## Support

For technical support and integration questions, please contact the development team.