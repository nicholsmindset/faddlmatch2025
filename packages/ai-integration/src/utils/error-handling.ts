import { 
  AIIntegrationError, 
  EmbeddingError, 
  ModerationError, 
  ConversationError 
} from '../types'

/**
 * ErrorHandler - Comprehensive error handling system for AI integration
 * 
 * Features:
 * - Structured error classification
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Error aggregation and reporting
 * - Graceful degradation strategies
 * - Performance monitoring integration
 */
export class ErrorHandler {
  private errorCounts = new Map<string, number>()
  private lastErrors = new Map<string, Date>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  
  // Error classification and handling strategies
  private readonly errorStrategies: Record<string, ErrorStrategy> = {
    'rate_limit': {
      retryable: true,
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      fallbackAction: 'cache_or_delay'
    },
    'network_error': {
      retryable: true,
      maxRetries: 2,
      backoffMultiplier: 1.5,
      initialDelay: 500,
      fallbackAction: 'cache_or_fail'
    },
    'api_error': {
      retryable: false,
      maxRetries: 0,
      backoffMultiplier: 1,
      initialDelay: 0,
      fallbackAction: 'fail_gracefully'
    },
    'validation_error': {
      retryable: false,
      maxRetries: 0,
      backoffMultiplier: 1,
      initialDelay: 0,
      fallbackAction: 'user_feedback'
    },
    'timeout': {
      retryable: true,
      maxRetries: 2,
      backoffMultiplier: 1.5,
      initialDelay: 1000,
      fallbackAction: 'cache_or_fail'
    }
  }

  /**
   * Handle error with appropriate strategy
   */
  handle<T extends AIIntegrationError>(error: T): T {
    const errorType = this.classifyError(error)
    const strategy = this.errorStrategies[errorType] || this.errorStrategies['api_error']
    
    // Log error details
    this.logError(error, errorType, strategy)
    
    // Update error tracking
    this.updateErrorTracking(errorType)
    
    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(errorType)
    if (circuitBreaker.isOpen()) {
      throw new AIIntegrationError(
        'Service temporarily unavailable due to repeated failures',
        'CIRCUIT_BREAKER_OPEN',
        { originalError: error.message, errorType }
      )
    }
    
    // Record failure for circuit breaker
    circuitBreaker.recordFailure()
    
    return error
  }

  /**
   * Execute operation with error handling and retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries?: number
  ): Promise<T> {
    let lastError: Error | null = null
    const retries = maxRetries ?? 3
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await operation()
        
        // Operation succeeded - record success for circuit breaker
        const circuitBreaker = this.getCircuitBreaker(context)
        circuitBreaker.recordSuccess()
        
        return result
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on last attempt
        if (attempt === retries) break
        
        // Classify error and get strategy
        const errorType = this.classifyError(lastError)
        const strategy = this.errorStrategies[errorType]
        
        // Don't retry if error is not retryable
        if (!strategy.retryable) break
        
        // Calculate delay with exponential backoff
        const delay = this.calculateBackoffDelay(
          attempt,
          strategy.initialDelay,
          strategy.backoffMultiplier
        )
        
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
        await this.delay(delay)
      }
    }
    
    // All retries exhausted, handle final error
    throw this.handle(this.createAIError(lastError!, context))
  }

  /**
   * Create AI-specific error from generic error
   */
  createAIError(error: Error, context: string): AIIntegrationError {
    if (error instanceof AIIntegrationError) {
      return error
    }
    
    // Determine specific error type based on context and message
    if (context.includes('embedding') || context.includes('similarity')) {
      return new EmbeddingError(error.message, { originalError: error.message, context })
    }
    
    if (context.includes('moderation') || context.includes('compliance')) {
      return new ModerationError(error.message, { originalError: error.message, context })
    }
    
    if (context.includes('conversation') || context.includes('suggestion')) {
      return new ConversationError(error.message, { originalError: error.message, context })
    }
    
    return new AIIntegrationError(error.message, 'UNKNOWN_ERROR', { 
      originalError: error.message, 
      context 
    })
  }

  /**
   * Classify error type for handling strategy
   */
  private classifyError(error: Error): string {
    const message = error.message.toLowerCase()
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'rate_limit'
    }
    
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return 'network_error'
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout'
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation_error'
    }
    
    if (message.includes('401') || message.includes('403') || message.includes('api key')) {
      return 'api_error'
    }
    
    return 'api_error' // Default classification
  }

  /**
   * Log error with context and strategy
   */
  private logError(error: AIIntegrationError, errorType: string, strategy: ErrorStrategy): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      errorType,
      errorCode: error.code,
      message: error.message,
      details: error.details,
      strategy: strategy.fallbackAction,
      retryable: strategy.retryable
    }
    
    // In production, this would go to your logging service
    console.error('AI Integration Error:', logEntry)
    
    // Track error metrics
    this.trackErrorMetrics(errorType, error)
  }

  /**
   * Update error tracking counters
   */
  private updateErrorTracking(errorType: string): void {
    const currentCount = this.errorCounts.get(errorType) || 0
    this.errorCounts.set(errorType, currentCount + 1)
    this.lastErrors.set(errorType, new Date())
  }

  /**
   * Get or create circuit breaker for error type
   */
  private getCircuitBreaker(errorType: string): CircuitBreaker {
    if (!this.circuitBreakers.has(errorType)) {
      this.circuitBreakers.set(errorType, new CircuitBreaker({
        failureThreshold: 5,
        timeoutMs: 60000, // 1 minute
        monitoringPeriodMs: 300000 // 5 minutes
      }))
    }
    
    return this.circuitBreakers.get(errorType)!
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(
    attempt: number,
    initialDelay: number,
    multiplier: number
  ): number {
    const delay = initialDelay * Math.pow(multiplier, attempt)
    const jitter = Math.random() * 0.1 * delay // Add 10% jitter
    return Math.min(30000, delay + jitter) // Cap at 30 seconds
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Track error metrics for monitoring
   */
  private trackErrorMetrics(errorType: string, error: AIIntegrationError): void {
    // In production, this would integrate with your metrics system
    const metrics = {
      errorType,
      errorCode: error.code,
      timestamp: Date.now(),
      count: 1
    }
    
    // Could send to DataDog, New Relic, etc.
    console.log('Error Metrics:', metrics)
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)
    const errorsByType = Object.fromEntries(this.errorCounts)
    const recentErrors = Array.from(this.lastErrors.entries())
      .filter(([_, date]) => Date.now() - date.getTime() < 3600000) // Last hour
      .length
    
    return {
      totalErrors,
      errorsByType,
      recentErrors,
      circuitBreakersOpen: Array.from(this.circuitBreakers.values())
        .filter(cb => cb.isOpen()).length
    }
  }

  /**
   * Reset error tracking (for testing or maintenance)
   */
  reset(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
    this.circuitBreakers.clear()
  }

  /**
   * Create user-friendly error message
   */
  getUserFriendlyMessage(error: AIIntegrationError): string {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        return 'Our AI service is currently busy. Please try again in a few moments.'
      
      case 'NETWORK_ERROR':
        return 'Connection issue detected. Please check your internet connection and try again.'
      
      case 'EMBEDDING_ERROR':
        return 'We encountered an issue processing your profile. Please try again later.'
      
      case 'MODERATION_ERROR':
        return 'We\'re unable to review your content right now. Please try again later.'
      
      case 'CONVERSATION_ERROR':
        return 'We\'re having trouble with conversation suggestions. Please try again later.'
      
      case 'CIRCUIT_BREAKER_OPEN':
        return 'Our AI service is temporarily unavailable. Please try again in a few minutes.'
      
      default:
        return 'We encountered a temporary issue. Please try again later.'
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: AIIntegrationError): boolean {
    const errorType = this.classifyError(error)
    const strategy = this.errorStrategies[errorType]
    return strategy.retryable
  }

  /**
   * Get recommended action for error
   */
  getRecommendedAction(error: AIIntegrationError): string {
    const errorType = this.classifyError(error)
    const strategy = this.errorStrategies[errorType]
    
    switch (strategy.fallbackAction) {
      case 'cache_or_delay':
        return 'Try using cached data or wait before retrying'
      case 'cache_or_fail':
        return 'Use cached data if available, otherwise fail gracefully'
      case 'fail_gracefully':
        return 'Provide fallback functionality or inform user'
      case 'user_feedback':
        return 'Request user to correct input or try different approach'
      default:
        return 'Log error and continue with fallback behavior'
    }
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(private options: {
    failureThreshold: number
    timeoutMs: number
    monitoringPeriodMs: number
  }) {}

  recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  recordSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.timeoutMs) {
        this.state = 'HALF_OPEN'
        return false
      }
      return true
    }
    
    return false
  }

  getState(): string {
    return this.state
  }
}

// Supporting interfaces
interface ErrorStrategy {
  retryable: boolean
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  fallbackAction: 'cache_or_delay' | 'cache_or_fail' | 'fail_gracefully' | 'user_feedback'
}

interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  recentErrors: number
  circuitBreakersOpen: number
}