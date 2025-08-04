/**
 * 🚨 Production Error Handling Utilities
 * Comprehensive error handling, logging, and user-friendly responses
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { isProduction } from '@/lib/env'
import { recordSecurityIncident } from '@/lib/monitoring/metrics'

/**
 * 🎯 Standard error types for consistent handling
 */
export enum ErrorType {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found_error',
  RATE_LIMIT = 'rate_limit_error',
  STRIPE = 'stripe_error',
  DATABASE = 'database_error',
  NETWORK = 'network_error',
  INTERNAL = 'internal_error',
  BUSINESS_LOGIC = 'business_logic_error',
  SECURITY = 'security_error'
}

/**
 * 📊 Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 🔍 Error context interface
 */
export interface ErrorContext {
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: string
  metadata?: Record<string, any>
}

/**
 * 📋 Structured error interface
 */
export interface StructuredError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code: string
  details?: any
  context?: ErrorContext
  stack?: string
  retryable?: boolean
  userMessage?: string
}

/**
 * 🛡️ Production error handler class
 */
export class ProductionErrorHandler {
  /**
   * Handle and classify errors
   */
  static handleError(
    error: unknown,
    context?: ErrorContext
  ): StructuredError {
    const timestamp = new Date().toISOString()
    const baseContext = { ...context, timestamp }

    // Handle different error types
    if (error instanceof ZodError) {
      return this.handleValidationError(error, baseContext)
    }

    if (this.isStripeError(error)) {
      return this.handleStripeError(error, baseContext)
    }

    if (this.isDatabaseError(error)) {
      return this.handleDatabaseError(error, baseContext)
    }

    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, baseContext)
    }

    if (this.isAuthenticationError(error)) {
      return this.handleAuthenticationError(error, baseContext)
    }

    if (this.isRateLimitError(error)) {
      return this.handleRateLimitError(error, baseContext)
    }

    // Default to internal error
    return this.handleInternalError(error, baseContext)
  }

  /**
   * 📝 Handle validation errors
   */
  private static handleValidationError(
    error: ZodError,
    context: ErrorContext
  ): StructuredError {
    const fieldErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))

    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: 'Input validation failed',
      code: 'VALIDATION_FAILED',
      details: { fieldErrors },
      context,
      retryable: false,
      userMessage: 'Please check your input and try again.'
    }
  }

  /**
   * 💳 Handle Stripe errors
   */
  private static handleStripeError(
    error: any,
    context: ErrorContext
  ): StructuredError {
    const stripeErrorType = error.type || 'unknown_stripe_error'
    let severity = ErrorSeverity.MEDIUM
    let userMessage = 'Payment processing error. Please try again.'

    // Classify Stripe error types
    switch (stripeErrorType) {
      case 'StripeCardError':
        severity = ErrorSeverity.LOW
        userMessage = 'Your card was declined. Please try a different payment method.'
        break
      case 'StripeRateLimitError':
        severity = ErrorSeverity.HIGH
        userMessage = 'Too many requests. Please wait a moment and try again.'
        break
      case 'StripeInvalidRequestError':
        severity = ErrorSeverity.MEDIUM
        userMessage = 'Invalid payment request. Please contact support.'
        break
      case 'StripeAPIError':
        severity = ErrorSeverity.HIGH
        userMessage = 'Payment service temporarily unavailable. Please try again.'
        break
      case 'StripeConnectionError':
        severity = ErrorSeverity.HIGH
        userMessage = 'Connection error. Please check your internet and try again.'
        break
      case 'StripeAuthenticationError':
        severity = ErrorSeverity.CRITICAL
        userMessage = 'Payment authentication failed. Please contact support.'
        break
    }

    return {
      type: ErrorType.STRIPE,
      severity,
      message: `Stripe error: ${error.message || 'Unknown Stripe error'}`,
      code: stripeErrorType.toUpperCase(),
      details: {
        stripeCode: error.code,
        declineCode: error.decline_code,
        chargeId: error.charge,
        paymentIntentId: error.payment_intent?.id
      },
      context,
      retryable: ['StripeRateLimitError', 'StripeAPIError', 'StripeConnectionError'].includes(stripeErrorType),
      userMessage
    }
  }

  /**
   * 🗄️ Handle database errors
   */
  private static handleDatabaseError(
    error: any,
    context: ErrorContext
  ): StructuredError {
    let severity = ErrorSeverity.HIGH
    let userMessage = 'Database error. Please try again.'

    // Classify database errors
    if (error.code === '23505') { // Unique constraint violation
      severity = ErrorSeverity.MEDIUM
      userMessage = 'This record already exists.'
    } else if (error.code === '23503') { // Foreign key violation
      severity = ErrorSeverity.MEDIUM
      userMessage = 'Invalid reference. Please check your data.'
    } else if (error.code === 'PGRST301') { // Row not found
      severity = ErrorSeverity.LOW
      userMessage = 'Record not found.'
    }

    return {
      type: ErrorType.DATABASE,
      severity,
      message: `Database error: ${error.message || 'Unknown database error'}`,
      code: error.code || 'DATABASE_ERROR',
      details: {
        hint: error.hint,
        detail: error.detail,
        table: error.table,
        column: error.column
      },
      context,
      retryable: !['23505', '23503'].includes(error.code),
      userMessage
    }
  }

  /**
   * 🌐 Handle network errors
   */
  private static handleNetworkError(
    error: any,
    context: ErrorContext
  ): StructuredError {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: `Network error: ${error.message || 'Connection failed'}`,
      code: 'NETWORK_ERROR',
      details: {
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname
      },
      context,
      retryable: true,
      userMessage: 'Connection error. Please check your internet and try again.'
    }
  }

  /**
   * 🔐 Handle authentication errors
   */
  private static handleAuthenticationError(
    error: any,
    context: ErrorContext
  ): StructuredError {
    recordSecurityIncident('auth')

    return {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      message: `Authentication error: ${error.message || 'Authentication failed'}`,
      code: 'AUTH_FAILED',
      context,
      retryable: false,
      userMessage: 'Please sign in and try again.'
    }
  }

  /**
   * 🚦 Handle rate limit errors
   */
  private static handleRateLimitError(
    error: any,
    context: ErrorContext
  ): StructuredError {
    recordSecurityIncident('rate_limit')

    return {
      type: ErrorType.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        limit: error.limit,
        remaining: error.remaining,
        retryAfter: error.retryAfter
      },
      context,
      retryable: true,
      userMessage: 'Too many requests. Please wait a moment and try again.'
    }
  }

  /**
   * ⚠️ Handle internal errors
   */
  private static handleInternalError(
    error: unknown,
    context: ErrorContext
  ): StructuredError {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined

    return {
      type: ErrorType.INTERNAL,
      severity: ErrorSeverity.HIGH,
      message: `Internal error: ${errorMessage}`,
      code: 'INTERNAL_ERROR',
      context,
      stack: isProduction() ? undefined : stack,
      retryable: true,
      userMessage: 'Something went wrong. Please try again.'
    }
  }

  /**
   * 🔍 Error type detection helpers
   */
  private static isStripeError(error: any): boolean {
    return error && (
      error.type?.startsWith('Stripe') ||
      error.code?.startsWith('stripe_') ||
      error.raw?.type?.startsWith('stripe')
    )
  }

  private static isDatabaseError(error: any): boolean {
    return error && (
      error.code?.startsWith('23') || // PostgreSQL constraint violations
      error.code?.startsWith('PGRST') || // PostgREST errors
      error.message?.includes('database') ||
      error.message?.includes('relation') ||
      error.message?.includes('column')
    )
  }

  private static isNetworkError(error: any): boolean {
    return error && (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.syscall ||
      error.errno
    )
  }

  private static isAuthenticationError(error: any): boolean {
    return error && (
      error.message?.includes('Unauthorized') ||
      error.message?.includes('Authentication') ||
      error.status === 401 ||
      error.statusCode === 401
    )
  }

  private static isRateLimitError(error: any): boolean {
    return error && (
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.includes('rate limit')
    )
  }

  /**
   * 📝 Log structured error
   */
  static logError(structuredError: StructuredError): void {
    const logLevel = this.getLogLevel(structuredError.severity)
    const logMessage = {
      ...structuredError,
      // Remove sensitive data in production
      stack: isProduction() ? undefined : structuredError.stack
    }

    switch (logLevel) {
      case 'error':
        console.error('[ERROR]', logMessage)
        break
      case 'warn':
        console.warn('[WARN]', logMessage)
        break
      case 'info':
        console.info('[INFO]', logMessage)
        break
      default:
        console.log('[LOG]', logMessage)
    }

    // In production, you might want to send to external logging service
    if (isProduction() && structuredError.severity === ErrorSeverity.CRITICAL) {
      // Example: Send to Sentry, DataDog, etc.
      // await sendToExternalLogging(structuredError)
    }
  }

  private static getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
        return 'info'
      default:
        return 'log'
    }
  }

  /**
   * 🔄 Convert to API response
   */
  static toApiResponse(structuredError: StructuredError): NextResponse {
    const statusCode = this.getStatusCode(structuredError.type)
    
    const responseBody = {
      error: true,
      type: structuredError.type,
      message: structuredError.userMessage || structuredError.message,
      code: structuredError.code,
      timestamp: structuredError.context?.timestamp || new Date().toISOString(),
      requestId: structuredError.context?.requestId,
      retryable: structuredError.retryable || false,
      // Include details only in development
      ...(isProduction() ? {} : { 
        details: structuredError.details,
        stack: structuredError.stack 
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add retry headers for retryable errors
    if (structuredError.retryable) {
      headers['Retry-After'] = '60' // 1 minute default
    }

    // Add rate limit headers
    if (structuredError.type === ErrorType.RATE_LIMIT) {
      headers['Retry-After'] = structuredError.details?.retryAfter?.toString() || '60'
      headers['X-RateLimit-Limit'] = structuredError.details?.limit?.toString() || '0'
      headers['X-RateLimit-Remaining'] = '0'
    }

    return NextResponse.json(responseBody, { status: statusCode, headers })
  }

  /**
   * 🎯 Map error types to HTTP status codes
   */
  private static getStatusCode(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.VALIDATION:
        return 400
      case ErrorType.AUTHENTICATION:
        return 401
      case ErrorType.AUTHORIZATION:
        return 403
      case ErrorType.NOT_FOUND:
        return 404
      case ErrorType.RATE_LIMIT:
        return 429
      case ErrorType.STRIPE:
      case ErrorType.BUSINESS_LOGIC:
        return 400
      case ErrorType.DATABASE:
      case ErrorType.NETWORK:
      case ErrorType.INTERNAL:
        return 500
      case ErrorType.SECURITY:
        return 403
      default:
        return 500
    }
  }
}

/**
 * 🎯 Convenience functions for common use cases
 */
export const handleApiError = (
  error: unknown,
  context?: ErrorContext
): NextResponse => {
  const structuredError = ProductionErrorHandler.handleError(error, context)
  ProductionErrorHandler.logError(structuredError)
  return ProductionErrorHandler.toApiResponse(structuredError)
}

export const createErrorContext = (
  userId?: string,
  requestId?: string,
  endpoint?: string,
  method?: string,
  metadata?: Record<string, any>
): ErrorContext => ({
  userId,
  requestId,
  endpoint,
  method,
  timestamp: new Date().toISOString(),
  metadata
})

/**
 * 🛡️ Error boundary for API routes
 */
export const withErrorHandling = <T>(
  handler: () => Promise<T>,
  context?: ErrorContext
): Promise<T | NextResponse> => {
  return handler().catch(error => {
    return handleApiError(error, context)
  })
}