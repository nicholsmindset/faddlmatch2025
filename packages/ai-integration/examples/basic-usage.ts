/**
 * Basic Usage Examples for FADDL Match AI Integration
 * 
 * This file demonstrates common usage patterns for the AI integration system.
 * Copy and adapt these examples for your application.
 */

import { AIIntegrationSystem } from '../src'
import type { 
  UserProfile, 
  PartnerPreferences,
  ConversationContext,
  ContentModerationRequest 
} from '../src/types'

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

// Example user profiles
const userProfile: UserProfile = {
  user_id: 'user_123',
  year_of_birth: 1990,
  gender: 'male',
  location_zone: 'north_america_east',
  marital_status: 'never_married',
  has_children: false,
  children_count: 0,
  prayer_frequency: 'always',
  modest_dress: 'always',
  ethnicity: 'south_asian',
  languages: ['english', 'urdu'],
  education: 'Masters Degree',
  profession: 'Software Engineer',
  bio: 'Assalamu alaikum! I am a practicing Muslim seeking a righteous spouse to build a family with Islamic values. I pray five times daily, involved in community activities, and enjoy reading Islamic books and volunteering at the local mosque.',
  subscription_tier: 'premium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const userPreferences: PartnerPreferences = {
  user_id: 'user_123',
  min_age: 22,
  max_age: 35,
  location_zones: ['north_america_east', 'north_america_central'],
  marital_statuses: ['never_married', 'divorced'],
  wants_children: true,
  accepts_children: true,
  education_level: 'bachelors_or_higher',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

/**
 * Example 1: Generate Profile Embeddings
 */
async function generateProfileEmbeddingsExample() {
  console.log('🎯 Generating Profile Embeddings...')
  
  try {
    const embeddings = await ai.generateProfileEmbedding(userProfile, userPreferences)
    
    console.log('✅ Embeddings generated successfully!')
    console.log(`Profile ID: ${embeddings.profileId}`)
    console.log(`Model: ${embeddings.metadata.model}`)
    console.log(`Dimensions: ${embeddings.metadata.dimensions}`)
    console.log(`Generated at: ${embeddings.metadata.generatedAt}`)
    
    return embeddings
  } catch (error) {
    console.error('❌ Error generating embeddings:', error)
  }
}

/**
 * Example 2: Find Compatible Matches
 */
async function findMatchesExample() {
  console.log('💕 Finding Compatible Matches...')
  
  try {
    const matches = await ai.findSimilarProfiles(
      'user_123', 
      10,    // Find 10 matches
      0.7    // Minimum 70% compatibility
    )
    
    console.log(`✅ Found ${matches.length} compatible matches!`)
    
    matches.forEach((match, index) => {
      console.log(`\n${index + 1}. Match ${match.profileId}:`)
      console.log(`   Overall: ${(match.overallScore * 100).toFixed(1)}%`)
      console.log(`   Values: ${(match.subscores.values * 100).toFixed(1)}%`)
      console.log(`   Islamic: ${(match.islamicAlignment * 100).toFixed(1)}%`)
      console.log(`   Cultural: ${(match.culturalCompatibility * 100).toFixed(1)}%`)
      console.log(`   Explanation: ${match.explanation}`)
    })
    
    return matches
  } catch (error) {
    console.error('❌ Error finding matches:', error)
  }
}

/**
 * Example 3: Generate Conversation Suggestions
 */
async function conversationSuggestionsExample() {
  console.log('💬 Generating Conversation Suggestions...')
  
  const context: ConversationContext = {
    participants: [
      {
        id: 'user_123',
        gender: 'male',
        culturalBackground: 'south_asian',
        languagePreference: 'english',
        communicationStyle: 'formal'
      },
      {
        id: 'user_456',
        gender: 'female',
        culturalBackground: 'arab',
        languagePreference: 'english',
        communicationStyle: 'formal'
      }
    ],
    stage: 'introduction',
    guardianInvolved: true,
    previousMessages: 0
  }
  
  const recipientProfile: UserProfile = {
    ...userProfile,
    user_id: 'user_456',
    gender: 'female',
    ethnicity: 'arab',
    languages: ['english', 'arabic'],
    bio: 'Assalamu alaikum wa rahmatullahi wa barakatuh. I am seeking a righteous husband to establish a blessed Islamic household. Family is very important to me, and I hope to find someone who shares my commitment to Islamic values and community service.'
  }
  
  try {
    const suggestions = await ai.generateConversationSuggestions(
      context,
      'user_123',
      recipientProfile
    )
    
    console.log(`✅ Generated ${suggestions.length} conversation suggestions!`)
    
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.type.toUpperCase()}:`)
      console.log(`   ${suggestion.content}`)
      console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`)
      console.log(`   Context: ${suggestion.culturalContext}`)
      if (suggestion.islamicGuidance) {
        console.log(`   Islamic guidance: ${suggestion.islamicGuidance}`)
      }
    })
    
    return suggestions
  } catch (error) {
    console.error('❌ Error generating suggestions:', error)
  }
}

/**
 * Example 4: Moderate Content
 */
async function contentModerationExample() {
  console.log('🛡️ Moderating Content...')
  
  const testMessages = [
    "Assalamu alaikum sister, I hope this message finds you in good health and iman.",
    "Hi, you look beautiful in your photos. Want to meet privately?",
    "I am interested in getting to know you for marriage purposes with family involvement.",
    "Let's go out for drinks this weekend and have some fun.",
    "May Allah bless our conversation. I would like my family to contact yours."
  ]
  
  for (const message of testMessages) {
    const request: ContentModerationRequest = {
      content: message,
      contentType: 'message',
      userId: 'user_123',
      context: {
        recipientId: 'user_456',
        conversationId: 'conv_789'
      },
      culturalContext: {
        primaryLanguage: 'english',
        culturalBackground: 'south_asian',
        religiousLevel: 'often'
      }
    }
    
    try {
      const result = await ai.moderateContent(request)
      
      console.log(`\n📝 Message: "${message.substring(0, 50)}..."`)
      console.log(`   Approved: ${result.approved ? '✅' : '❌'}`)
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`)
      console.log(`   Islamic Compliance: ${(result.islamicCompliance.score * 100).toFixed(0)}%`)
      console.log(`   Cultural Sensitivity: ${(result.culturalSensitivity.score * 100).toFixed(0)}%`)
      
      if (result.islamicCompliance.violations.length > 0) {
        console.log(`   Violations: ${result.islamicCompliance.violations.join(', ')}`)
      }
      
      if (result.islamicCompliance.guidance) {
        console.log(`   Guidance: ${result.islamicCompliance.guidance}`)
      }
      
      if (result.escalation.required) {
        console.log(`   Escalation: ${result.escalation.reason}`)
        console.log(`   Severity: ${result.escalation.severity}`)
      }
      
    } catch (error) {
      console.error(`❌ Error moderating message: ${error}`)
    }
  }
}

/**
 * Example 5: Profile Enhancement Suggestions
 */
async function profileEnhancementExample() {
  console.log('📈 Getting Profile Enhancement Suggestions...')
  
  const context = {
    userId: 'user_123',
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
      culturalBackground: 'south_asian',
      communicationStyle: 'formal',
      familyInvolvement: 'high'
    }
  }
  
  try {
    const suggestions = await ai.getProfileEnhancementSuggestions(context)
    
    console.log(`✅ Generated ${suggestions.length} enhancement suggestions!`)
    
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.section.toUpperCase()} SECTION:`)
      console.log(`   💡 ${suggestion.suggestion}`)
      console.log(`   📋 Reasoning: ${suggestion.reasoning}`)
      console.log(`   ⭐ Priority: ${suggestion.priority}`)
      console.log(`   📊 Impact: ${(suggestion.estimatedImpact * 100).toFixed(0)}%`)
      
      if (suggestion.islamicGuidance) {
        console.log(`   🕌 Islamic Guidance: ${suggestion.islamicGuidance}`)
      }
      
      if (suggestion.culturalConsideration) {
        console.log(`   🌍 Cultural Note: ${suggestion.culturalConsideration}`)
      }
    })
    
    return suggestions
    
  } catch (error) {
    console.error('❌ Error getting enhancement suggestions:', error)
  }
}

/**
 * Example 6: System Monitoring
 */
async function systemMonitoringExample() {
  console.log('📊 System Monitoring...')
  
  try {
    // Get system metrics
    const metrics = await ai.getSystemMetrics()
    
    console.log('✅ System Metrics:')
    console.log(`   Total Requests: ${metrics.requests.total}`)
    console.log(`   Success Rate: ${(metrics.requests.successful / metrics.requests.total * 100).toFixed(1)}%`)
    console.log(`   Avg Response Time: ${metrics.requests.avgResponseTime}ms`)
    console.log(`   Cache Hit Rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`)
    console.log(`   Error Rate: ${(metrics.performance.errorRate * 100).toFixed(2)}%`)
    
    // Get cost information
    const costReport = await ai.getCostOptimizationReport()
    
    console.log('\n💰 Cost Information:')
    console.log(`   Daily Spend: $${costReport.currentSpend.total.toFixed(2)}`)
    console.log(`   Budget Remaining: $${(costReport.budgetLimits.total - costReport.currentSpend.total).toFixed(2)}`)
    console.log(`   Total Savings: $${costReport.savings.total.toFixed(2)}`)
    
    if (costReport.recommendations.length > 0) {
      console.log('\n💡 Cost Optimization Recommendations:')
      costReport.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
    }
    
    // Health check
    const health = await ai.healthCheck()
    
    console.log(`\n🏥 System Health: ${health.status.toUpperCase()}`)
    Object.entries(health.components).forEach(([component, status]) => {
      const emoji = status === 'up' ? '✅' : status === 'degraded' ? '⚠️' : '❌'
      console.log(`   ${emoji} ${component}: ${status}`)
    })
    
  } catch (error) {
    console.error('❌ Error getting system metrics:', error)
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 FADDL Match AI Integration Examples\n')
  
  try {
    await generateProfileEmbeddingsExample()
    console.log('\n' + '='.repeat(60) + '\n')
    
    await findMatchesExample()  
    console.log('\n' + '='.repeat(60) + '\n')
    
    await conversationSuggestionsExample()
    console.log('\n' + '='.repeat(60) + '\n')
    
    await contentModerationExample()
    console.log('\n' + '='.repeat(60) + '\n')
    
    await profileEnhancementExample()
    console.log('\n' + '='.repeat(60) + '\n')
    
    await systemMonitoringExample()
    
    console.log('\n🎉 All examples completed successfully!')
    
  } catch (error) {
    console.error('❌ Error running examples:', error)
  }
}

// Export functions for individual testing
export {
  generateProfileEmbeddingsExample,
  findMatchesExample,
  conversationSuggestionsExample,
  contentModerationExample,
  profileEnhancementExample,
  systemMonitoringExample,
  runAllExamples
}

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples()
}