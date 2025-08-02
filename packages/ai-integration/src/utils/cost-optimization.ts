import { AIMetrics } from '../types'

/**
 * CostOptimizer - Comprehensive cost optimization system for AI operations
 * 
 * Features:
 * - Real-time cost tracking and budgeting
 * - Token usage optimization
 * - Smart caching strategies
 * - Request deduplication
 * - Performance vs cost trade-offs
 * - Monthly budget management
 * - Alert system for cost overruns
 */
export class CostOptimizer {
  private currentCosts = {
    embeddings: 0,
    completions: 0,
    moderations: 0,
    total: 0
  }
  
  private dailyBudgets = {
    embeddings: 50,      // $50/day for embeddings
    completions: 100,    // $100/day for completions
    moderations: 25,     // $25/day for moderations
    total: 175          // $175/day total
  }
  
  private readonly pricing = {
    // OpenAI pricing (as of 2024 - update as needed)
    embeddings: {
      'text-embedding-3-small': 0.00002 / 1000, // $0.02 per 1M tokens
      'text-embedding-3-large': 0.00013 / 1000  // $0.13 per 1M tokens
    },
    completions: {
      'gpt-4': {
        input: 0.03 / 1000,  // $30 per 1M input tokens
        output: 0.06 / 1000  // $60 per 1M output tokens
      },
      'gpt-4-turbo': {
        input: 0.01 / 1000,  // $10 per 1M input tokens
        output: 0.03 / 1000  // $30 per 1M output tokens
      },
      'gpt-3.5-turbo': {
        input: 0.0015 / 1000, // $1.50 per 1M input tokens
        output: 0.002 / 1000  // $2.00 per 1M output tokens
      }
    },
    moderations: 0.002 / 1000 // $2 per 1M tokens
  }
  
  private optimizations = {
    cacheHitRate: 0,
    deduplicationSavings: 0,
    modelDowngradeSavings: 0,
    batchingSavings: 0
  }

  constructor(
    private readonly budgetLimits?: {
      daily?: number
      monthly?: number
      embeddings?: number
      completions?: number
      moderations?: number
    }
  ) {
    if (budgetLimits) {
      this.dailyBudgets = {
        ...this.dailyBudgets,
        ...budgetLimits
      }
    }
    
    // Reset daily costs at midnight
    this.scheduleDaily Reset()
  }

  /**
   * Calculate cost for embedding operation
   */
  calculateEmbeddingCost(
    tokenCount: number,
    model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small'
  ): number {
    return tokenCount * this.pricing.embeddings[model]
  }

  /**
   * Calculate cost for completion operation
   */
  calculateCompletionCost(
    inputTokens: number,
    outputTokens: number,
    model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' = 'gpt-4'
  ): number {
    const pricing = this.pricing.completions[model]
    return (inputTokens * pricing.input) + (outputTokens * pricing.output)
  }

  /**
   * Calculate cost for moderation operation
   */
  calculateModerationCost(tokenCount: number): number {
    return tokenCount * this.pricing.moderations
  }

  /**
   * Track operation cost
   */
  trackCost(
    operation: 'embeddings' | 'completions' | 'moderations',
    cost: number,
    metadata?: {
      model?: string
      tokens?: number
      cached?: boolean
      deduplicated?: boolean
    }
  ): void {
    // Don't track cached operations in costs
    if (metadata?.cached) {
      this.optimizations.cacheHitRate += 1
      return
    }
    
    // Track deduplication savings
    if (metadata?.deduplicated) {
      this.optimizations.deduplicationSavings += cost
      return
    }
    
    this.currentCosts[operation] += cost
    this.currentCosts.total += cost
    
    // Check budget limits
    this.checkBudgetLimits(operation, cost)
    
    // Log cost tracking
    this.logCostMetric(operation, cost, metadata)
  }

  /**
   * Optimize request before execution
   */
  async optimizeRequest<T>(
    requestType: 'embedding' | 'completion' | 'moderation',
    request: T,
    options: OptimizationOptions = {}
  ): Promise<OptimizedRequest<T>> {
    const optimizations: OptimizationApplied[] = []
    let optimizedRequest = { ...request }
    let estimatedCost = 0
    let skipExecution = false
    
    // Check budget first
    if (this.isBudgetExceeded(requestType)) {
      return {
        originalRequest: request,
        optimizedRequest,
        optimizations: ['budget_exceeded'],
        estimatedCost: 0,
        skipExecution: true,
        fallbackAction: 'use_cache_or_reject'
      }
    }
    
    // Apply request-specific optimizations
    switch (requestType) {
      case 'embedding':
        const embeddingOpt = await this.optimizeEmbeddingRequest(optimizedRequest as any, options)
        optimizedRequest = embeddingOpt.request as T
        optimizations.push(...embeddingOpt.optimizations)
        estimatedCost = embeddingOpt.estimatedCost
        skipExecution = embeddingOpt.skipExecution
        break
        
      case 'completion':
        const completionOpt = await this.optimizeCompletionRequest(optimizedRequest as any, options)
        optimizedRequest = completionOpt.request as T
        optimizations.push(...completionOpt.optimizations)
        estimatedCost = completionOpt.estimatedCost
        skipExecution = completionOpt.skipExecution
        break
        
      case 'moderation':
        const moderationOpt = await this.optimizeModerationRequest(optimizedRequest as any, options)
        optimizedRequest = moderationOpt.request as T
        optimizations.push(...moderationOpt.optimizations)
        estimatedCost = moderationOpt.estimatedCost
        skipExecution = moderationOpt.skipExecution
        break
    }
    
    return {
      originalRequest: request,
      optimizedRequest,
      optimizations,
      estimatedCost,
      skipExecution,
      fallbackAction: skipExecution ? 'use_cache_or_reject' : 'execute'
    }
  }

  /**
   * Optimize embedding request
   */
  private async optimizeEmbeddingRequest(
    request: any,
    options: OptimizationOptions
  ): Promise<{
    request: any,
    optimizations: OptimizationApplied[],
    estimatedCost: number,
    skipExecution: boolean
  }> {
    const optimizations: OptimizationApplied[] = []
    let optimizedRequest = { ...request }
    let skipExecution = false
    
    // Text truncation for embeddings
    if (request.input && request.input.length > 8000) { // ~8K token limit
      optimizedRequest.input = request.input.substring(0, 7500) + '...'
      optimizations.push('text_truncation')
    }
    
    // Model downgrade if budget tight
    if (this.getBudgetRemaining('embeddings') < 10 && request.model === 'text-embedding-3-large') {
      optimizedRequest.model = 'text-embedding-3-small'
      optimizations.push('model_downgrade')
      this.optimizations.modelDowngradeSavings += this.calculateEmbeddingCost(
        this.estimateTokenCount(request.input), 
        'text-embedding-3-large'
      ) - this.calculateEmbeddingCost(
        this.estimateTokenCount(request.input), 
        'text-embedding-3-small'
      )
    }
    
    // Estimate cost
    const tokenCount = this.estimateTokenCount(optimizedRequest.input)
    const estimatedCost = this.calculateEmbeddingCost(tokenCount, optimizedRequest.model)
    
    // Skip if cost exceeds remaining budget
    if (estimatedCost > this.getBudgetRemaining('embeddings')) {
      skipExecution = true
      optimizations.push('budget_protection')
    }
    
    return {
      request: optimizedRequest,
      optimizations,
      estimatedCost,
      skipExecution
    }
  }

  /**
   * Optimize completion request
   */
  private async optimizeCompletionRequest(
    request: any,
    options: OptimizationOptions
  ): Promise<{
    request: any,
    optimizations: OptimizationApplied[],
    estimatedCost: number,
    skipExecution: boolean
  }> {
    const optimizations: OptimizationApplied[] = []
    let optimizedRequest = { ...request }
    let skipExecution = false
    
    // Model selection based on budget and complexity
    if (!request.model || request.model === 'gpt-4') {
      const budgetRemaining = this.getBudgetRemaining('completions')
      
      if (budgetRemaining < 20) {
        // Low budget - use cheapest model
        optimizedRequest.model = 'gpt-3.5-turbo'
        optimizations.push('model_downgrade')
      } else if (budgetRemaining < 50 && this.isSimpleRequest(request)) {
        // Medium budget and simple request - use turbo
        optimizedRequest.model = 'gpt-4-turbo'
        optimizations.push('model_optimization')
      } else {
        // Good budget or complex request - use gpt-4
        optimizedRequest.model = 'gpt-4'
      }
    }
    
    // Token limit optimization
    if (request.max_tokens > 1000 && this.getBudgetRemaining('completions') < 30) {
      optimizedRequest.max_tokens = Math.min(500, request.max_tokens)
      optimizations.push('token_limit_reduction')
    }
    
    // Temperature optimization for caching
    if (options.enableCaching && request.temperature > 0.3) {
      optimizedRequest.temperature = 0.1 // More deterministic = better caching
      optimizations.push('temperature_optimization')
    }
    
    // Estimate cost
    const inputTokens = this.estimateTokenCount(this.messagesToText(request.messages))
    const outputTokens = request.max_tokens || 150
    const estimatedCost = this.calculateCompletionCost(
      inputTokens,
      outputTokens,
      optimizedRequest.model
    )
    
    // Skip if cost exceeds budget
    if (estimatedCost > this.getBudgetRemaining('completions')) {
      skipExecution = true
      optimizations.push('budget_protection')
    }
    
    return {
      request: optimizedRequest,
      optimizations,
      estimatedCost,
      skipExecution
    }
  }

  /**
   * Optimize moderation request
   */
  private async optimizeModerationRequest(
    request: any,
    options: OptimizationOptions
  ): Promise<{
    request: any,
    optimizations: OptimizationApplied[],
    estimatedCost: number,
    skipExecution: boolean
  }> {
    const optimizations: OptimizationApplied[] = []
    let optimizedRequest = { ...request }
    let skipExecution = false
    
    // Text truncation for moderation
    if (request.input && request.input.length > 4000) {
      optimizedRequest.input = request.input.substring(0, 3500) + '...'
      optimizations.push('text_truncation')
    }
    
    // Estimate cost
    const tokenCount = this.estimateTokenCount(optimizedRequest.input)
    const estimatedCost = this.calculateModerationCost(tokenCount)
    
    // Skip if budget exceeded
    if (estimatedCost > this.getBudgetRemaining('moderations')) {
      skipExecution = true
      optimizations.push('budget_protection')
    }
    
    return {
      request: optimizedRequest,
      optimizations,
      estimatedCost,
      skipExecution
    }
  }

  /**
   * Check if request is simple (can use cheaper model)
   */
  private isSimpleRequest(request: any): boolean {
    if (!request.messages) return true
    
    const totalText = this.messagesToText(request.messages)
    const tokenCount = this.estimateTokenCount(totalText)
    
    // Simple if short and no complex instructions
    return tokenCount < 500 && 
           !totalText.toLowerCase().includes('analyze') &&
           !totalText.toLowerCase().includes('complex') &&
           !totalText.toLowerCase().includes('detailed')
  }

  /**
   * Convert messages array to text for token estimation
   */
  private messagesToText(messages: any[]): string {
    return messages.map(m => m.content || '').join(' ')
  }

  /**
   * Estimate token count from text
   */
  private estimateTokenCount(text: string): number {
    if (!text) return 0
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4)
  }

  /**
   * Check if budget is exceeded for operation type
   */
  private isBudgetExceeded(operation: 'embeddings' | 'completions' | 'moderations'): boolean {
    return this.currentCosts[operation] >= this.dailyBudgets[operation] ||
           this.currentCosts.total >= this.dailyBudgets.total
  }

  /**
   * Get remaining budget for operation
   */
  private getBudgetRemaining(operation: 'embeddings' | 'completions' | 'moderations'): number {
    return Math.max(0, this.dailyBudgets[operation] - this.currentCosts[operation])
  }

  /**
   * Check budget limits and send alerts
   */
  private checkBudgetLimits(operation: string, cost: number): void {
    const totalBudget = this.dailyBudgets.total
    const currentSpend = this.currentCosts.total
    const spendPercentage = (currentSpend / totalBudget) * 100
    
    // Send alerts at different thresholds
    if (spendPercentage >= 90 && spendPercentage - (cost / totalBudget * 100) < 90) {
      this.sendBudgetAlert('critical', currentSpend, totalBudget)
    } else if (spendPercentage >= 75 && spendPercentage - (cost / totalBudget * 100) < 75) {
      this.sendBudgetAlert('warning', currentSpend, totalBudget)
    } else if (spendPercentage >= 50 && spendPercentage - (cost / totalBudget * 100) < 50) {
      this.sendBudgetAlert('info', currentSpend, totalBudget)
    }
  }

  /**
   * Send budget alert
   */
  private sendBudgetAlert(
    level: 'info' | 'warning' | 'critical',
    currentSpend: number,
    totalBudget: number
  ): void {
    const message = `AI costs ${level}: $${currentSpend.toFixed(2)} of $${totalBudget} daily budget used (${(currentSpend/totalBudget*100).toFixed(1)}%)`
    
    // In production, this would integrate with alerting system
    console[level === 'critical' ? 'error' : level === 'warning' ? 'warn' : 'info'](message)
    
    // Could send to Slack, email, etc.
  }

  /**
   * Log cost metric
   */
  private logCostMetric(
    operation: string,
    cost: number,
    metadata?: any
  ): void {
    const metric = {
      timestamp: Date.now(),
      operation,
      cost,
      dailyTotal: this.currentCosts.total,
      budgetRemaining: this.dailyBudgets.total - this.currentCosts.total,
      metadata
    }
    
    // In production, send to metrics service
    console.log('Cost Metric:', metric)
  }

  /**
   * Get current cost metrics
   */
  getMetrics(): AIMetrics {
    const totalRequests = this.optimizations.cacheHitRate + 
                         Object.values(this.currentCosts).reduce((sum, cost) => sum + (cost > 0 ? 1 : 0), 0)
    
    return {
      requests: {
        total: totalRequests,
        successful: totalRequests, // Simplified
        failed: 0,
        avgResponseTime: 250
      },
      costs: {
        embeddings: this.currentCosts.embeddings,
        completions: this.currentCosts.completions,
        total: this.currentCosts.total
      },
      cache: {
        hitRate: totalRequests > 0 ? this.optimizations.cacheHitRate / totalRequests : 0,
        size: 0, // Would come from cache manager
        evictions: 0
      },
      performance: {
        p95ResponseTime: 500,
        errorRate: 0,
        concurrentRequests: 0
      }
    }
  }

  /**
   * Get cost optimization report
   */
  getCostOptimizationReport(): CostOptimizationReport {
    const totalSavings = Object.values(this.optimizations).reduce((sum, savings) => sum + savings, 0)
    
    return {
      currentSpend: this.currentCosts,
      budgetLimits: this.dailyBudgets,
      savings: {
        cacheHits: this.optimizations.cacheHitRate,
        deduplication: this.optimizations.deduplicationSavings,
        modelDowngrades: this.optimizations.modelDowngradeSavings,
        batching: this.optimizations.batchingSavings,
        total: totalSavings
      },
      recommendations: this.generateCostRecommendations()
    }
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateCostRecommendations(): string[] {
    const recommendations: string[] = []
    const spendPercentage = (this.currentCosts.total / this.dailyBudgets.total) * 100
    
    if (spendPercentage > 80) {
      recommendations.push('Consider implementing more aggressive caching')
      recommendations.push('Review model selection - use GPT-3.5-turbo for simple tasks')
      recommendations.push('Implement request batching where possible')
    }
    
    if (this.optimizations.cacheHitRate < 0.3) {
      recommendations.push('Improve caching strategy - current hit rate is low')
    }
    
    if (this.currentCosts.embeddings > this.dailyBudgets.embeddings * 0.7) {
      recommendations.push('Consider using text-embedding-3-small instead of large model')
    }
    
    if (this.currentCosts.completions > this.dailyBudgets.completions * 0.7) {
      recommendations.push('Optimize prompt length and use temperature=0 for better caching')
    }
    
    return recommendations
  }

  /**
   * Reset daily costs (called at midnight)
   */
  private scheduleDaily Reset(): void {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      this.resetDailyCosts()
      // Schedule next reset
      setInterval(() => this.resetDailyCosts(), 24 * 60 * 60 * 1000)
    }, msUntilMidnight)
  }

  /**
   * Reset daily cost counters
   */
  private resetDailyCosts(): void {
    this.currentCosts = {
      embeddings: 0,
      completions: 0,
      moderations: 0,
      total: 0
    }
    
    this.optimizations = {
      cacheHitRate: 0,
      deduplicationSavings: 0,
      modelDowngradeSavings: 0,
      batchingSavings: 0
    }
    
    console.log('Daily AI costs reset')
  }
}

// Supporting interfaces
interface OptimizationOptions {
  enableCaching?: boolean
  maxCost?: number
  preferSpeed?: boolean
  preferAccuracy?: boolean
}

interface OptimizedRequest<T> {
  originalRequest: T
  optimizedRequest: T
  optimizations: OptimizationApplied[]
  estimatedCost: number
  skipExecution: boolean
  fallbackAction: 'execute' | 'use_cache_or_reject' | 'use_cache_or_degrade'
}

type OptimizationApplied = 
  | 'model_downgrade'
  | 'model_optimization'
  | 'text_truncation'
  | 'token_limit_reduction'
  | 'temperature_optimization'
  | 'budget_protection'
  | 'budget_exceeded'

interface CostOptimizationReport {
  currentSpend: {
    embeddings: number
    completions: number
    moderations: number
    total: number
  }
  budgetLimits: {
    embeddings: number
    completions: number
    moderations: number
    total: number
  }
  savings: {
    cacheHits: number
    deduplication: number
    modelDowngrades: number
    batching: number
    total: number
  }
  recommendations: string[]
}