/**
 * 🛡️ Production Input Validation Middleware
 * Comprehensive validation and sanitization for subscription APIs
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

/**
 * 🧹 Sanitization utilities
 */
export class InputSanitizer {
  /**
   * Clean HTML and prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })
  }

  /**
   * Clean and validate email
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * Sanitize user input strings
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    return this.sanitizeHtml(input.trim()).slice(0, maxLength)
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // Only allow https in production
      if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs allowed in production')
      }
      return parsed.toString()
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  /**
   * Remove SQL injection attempts
   */
  static preventSqlInjection(input: string): string {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(--|\s*;|\s*\/\*|\*\/)/g,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/gi
    ]
    
    let cleaned = input
    sqlPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '')
    })
    
    return cleaned.trim()
  }
}

/**
 * 🔍 Enhanced validation schemas
 */
export const ValidationSchemas = {
  // Subscription checkout validation
  checkoutRequest: z.object({
    planId: z.enum(['INTENTION', 'PATIENCE', 'RELIANCE'])
      .refine(val => val !== 'INTENTION', 'Free plan does not require checkout'),
    successUrl: z.string()
      .url('Invalid success URL')
      .optional()
      .transform(val => val ? InputSanitizer.sanitizeUrl(val) : val),
    cancelUrl: z.string()
      .url('Invalid cancel URL')
      .optional()
      .transform(val => val ? InputSanitizer.sanitizeUrl(val) : val),
    metadata: z.record(z.string()).optional(),
  }),

  // Portal session validation
  portalRequest: z.object({
    returnUrl: z.string()
      .url('Invalid return URL')
      .optional()
      .transform(val => val ? InputSanitizer.sanitizeUrl(val) : val),
  }),

  // Subscription cancellation validation
  cancelRequest: z.object({
    subscriptionId: z.string()
      .min(1, 'Subscription ID is required')
      .max(100, 'Subscription ID too long')
      .regex(/^sub_[a-zA-Z0-9_]+$/, 'Invalid Stripe subscription ID format'),
    reason: z.string()
      .max(500, 'Reason too long')
      .optional()
      .transform(val => val ? InputSanitizer.sanitizeString(val, 500) : val),
    feedback: z.string()
      .max(2000, 'Feedback too long')
      .optional()
      .transform(val => val ? InputSanitizer.sanitizeString(val, 2000) : val),
  }),

  // Subscription reactivation validation
  reactivateRequest: z.object({
    subscriptionId: z.string()
      .min(1, 'Subscription ID is required')
      .max(100, 'Subscription ID too long')
      .regex(/^sub_[a-zA-Z0-9_]+$/, 'Invalid Stripe subscription ID format'),
  }),

  // Usage tracking validation
  usageRequest: z.object({
    feature: z.string()
      .min(1, 'Feature name is required')
      .max(100, 'Feature name too long')
      .regex(/^[a-zA-Z0-9_]+$/, 'Invalid feature name format'),
    increment: z.number()
      .int('Increment must be an integer')
      .min(1, 'Increment must be positive')
      .max(1000, 'Increment too large'),
  }),

  // Webhook validation
  webhookRequest: z.object({
    id: z.string().min(1, 'Event ID required'),
    type: z.string().min(1, 'Event type required'),
    data: z.object({
      object: z.record(z.any()),
    }),
    created: z.number(),
  }),
}

/**
 * 🚨 Validation error types
 */
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export class ValidationException extends Error {
  public readonly errors: ValidationError[]
  public readonly status: number

  constructor(errors: ValidationError[], status: number = 400) {
    super('Validation failed')
    this.errors = errors
    this.status = status
    this.name = 'ValidationException'
  }
}

/**
 * 🛡️ Request validation middleware
 */
export class RequestValidator {
  /**
   * Validate request body against schema
   */
  static async validateBody<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    try {
      const body = await request.json()
      
      // Basic security checks
      this.performSecurityChecks(body)
      
      // Validate against schema
      const result = schema.parse(body)
      
      console.log('[VALIDATION] Request body validated successfully')
      return result
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input,
        }))
        
        console.error('[VALIDATION] Request validation failed:', validationErrors)
        throw new ValidationException(validationErrors)
      }
      
      if (error instanceof SyntaxError) {
        throw new ValidationException([{
          field: 'body',
          message: 'Invalid JSON format',
          code: 'invalid_json',
        }])
      }
      
      throw error
    }
  }

  /**
   * Validate query parameters
   */
  static validateQuery<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
  ): T {
    try {
      const { searchParams } = new URL(request.url)
      const queryObject = Object.fromEntries(searchParams.entries())
      
      // Basic security checks
      this.performSecurityChecks(queryObject)
      
      const result = schema.parse(queryObject)
      
      console.log('[VALIDATION] Query parameters validated successfully')
      return result
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input,
        }))
        
        console.error('[VALIDATION] Query validation failed:', validationErrors)
        throw new ValidationException(validationErrors)
      }
      
      throw error
    }
  }

  /**
   * Validate headers
   */
  static validateHeaders(
    request: NextRequest,
    requiredHeaders: string[] = []
  ): void {
    const missing = requiredHeaders.filter(
      header => !request.headers.has(header)
    )
    
    if (missing.length > 0) {
      throw new ValidationException([{
        field: 'headers',
        message: `Missing required headers: ${missing.join(', ')}`,
        code: 'missing_headers',
      }])
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite',
    ]
    
    for (const header of suspiciousHeaders) {
      if (request.headers.has(header)) {
        console.warn(`[SECURITY] Suspicious header detected: ${header}`)
      }
    }
  }

  /**
   * Perform basic security checks
   */
  private static performSecurityChecks(data: any): void {
    const jsonString = JSON.stringify(data)
    
    // Check for potential security issues
    const securityPatterns = [
      // XSS attempts
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      
      // SQL injection attempts
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|where|into|values)\b)/gi,
      
      // Path traversal attempts
      /\.\.[\/\\]/g,
      
      // Command injection attempts
      /[;&|`$\(\)]/g,
    ]
    
    for (const pattern of securityPatterns) {
      if (pattern.test(jsonString)) {
        console.error('[SECURITY] Potentially malicious input detected:', {
          pattern: pattern.toString(),
          input: jsonString.substring(0, 200),
        })
        
        throw new ValidationException([{
          field: 'security',
          message: 'Input contains potentially malicious content',
          code: 'security_violation',
        }], 400)
      }
    }
    
    // Check payload size
    if (jsonString.length > 100000) { // 100KB limit
      throw new ValidationException([{
        field: 'size',
        message: 'Request payload too large',
        code: 'payload_too_large',
      }], 413)
    }
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return InputSanitizer.sanitizeString(obj)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = InputSanitizer.sanitizeString(key, 100)
        sanitized[cleanKey] = this.sanitizeObject(value)
      }
      return sanitized
    }
    
    return obj
  }
}

/**
 * 🎯 Validation middleware for API routes
 */
export async function withValidation<T, R>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  handler: (validatedData: T) => Promise<R>,
  options: {
    validateBody?: boolean
    validateQuery?: boolean
    requiredHeaders?: string[]
  } = { validateBody: true }
): Promise<R> {
  try {
    // Validate headers if specified
    if (options.requiredHeaders?.length) {
      RequestValidator.validateHeaders(request, options.requiredHeaders)
    }
    
    // Validate request data
    let validatedData: T
    if (options.validateQuery) {
      validatedData = RequestValidator.validateQuery(request, schema)
    } else if (options.validateBody) {
      validatedData = await RequestValidator.validateBody(request, schema)
    } else {
      throw new Error('Must specify either validateBody or validateQuery')
    }
    
    // Execute handler with validated data
    return await handler(validatedData)
    
  } catch (error) {
    if (error instanceof ValidationException) {
      console.error('[VALIDATION] Validation middleware error:', error.errors)
      throw error
    }
    
    console.error('[VALIDATION] Unexpected validation error:', error)
    throw new ValidationException([{
      field: 'unknown',
      message: 'Validation failed due to unexpected error',
      code: 'validation_error',
    }], 500)
  }
}

/**
 * 📊 Validation metrics
 */
export interface ValidationMetrics {
  totalValidations: number
  successfulValidations: number
  failedValidations: number
  securityViolations: number
  averageValidationTime: number
}

class ValidationMetricsCollector {
  private metrics: ValidationMetrics = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    securityViolations: 0,
    averageValidationTime: 0,
  }
  
  private validationTimes: number[] = []

  recordValidation(success: boolean, time: number, securityViolation: boolean = false): void {
    this.metrics.totalValidations++
    this.validationTimes.push(time)
    
    if (success) {
      this.metrics.successfulValidations++
    } else {
      this.metrics.failedValidations++
    }
    
    if (securityViolation) {
      this.metrics.securityViolations++
    }
    
    // Calculate moving average (last 100 validations)
    const recentTimes = this.validationTimes.slice(-100)
    this.metrics.averageValidationTime = 
      recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length
  }

  getMetrics(): ValidationMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.metrics = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      securityViolations: 0,
      averageValidationTime: 0,
    }
    this.validationTimes = []
  }
}

export const validationMetrics = new ValidationMetricsCollector()