/**
 * Shared JWT Validation Library for FADDL Match Platform
 * 
 * Provides enterprise-grade JWT validation with cryptographic verification,
 * user extraction, and comprehensive security logging.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

// JWT Header and Payload interfaces
interface JWTHeader {
  alg: string
  typ: string
  kid?: string
}

interface ClerkJWTPayload {
  sub: string // User ID
  iss: string // Issuer (Clerk)
  aud: string | string[] // Audience
  exp: number // Expiration timestamp
  iat: number // Issued at timestamp
  nbf?: number // Not before timestamp
  azp?: string // Authorized party
  session_id?: string
  user_id?: string
  email?: string
  email_verified?: boolean
  [key: string]: any
}

interface ValidationResult {
  valid: boolean
  userId?: string
  sessionId?: string
  error?: string
  errorCode?: string
  payload?: ClerkJWTPayload
}

interface SecurityEvent {
  event_type: 'jwt_validation_failed' | 'jwt_validation_success' | 'suspicious_activity'
  user_id?: string
  ip_address?: string
  user_agent?: string
  error_details?: string
  timestamp: string
}

// JWT Validation Configuration
const JWT_CONFIG = {
  // Clerk configuration
  clerk: {
    issuer: 'https://clerk.dev',
    audience: Deno.env.get('CLERK_JWT_AUDIENCE') || 'faddl-match',
    allowedAlgorithms: ['RS256', 'ES256']
  },
  
  // Validation settings
  validation: {
    clockTolerance: 30, // 30 seconds tolerance for time-based claims
    maxAge: 3600, // Maximum token age in seconds (1 hour)
    requireNotBefore: false,
    requireAudience: true,
    requireIssuer: true
  },
  
  // Rate limiting
  rateLimiting: {
    maxFailedAttempts: 5,
    windowMinutes: 15,
    blockDurationMinutes: 30
  }
}

/**
 * Decodes JWT without verification (for header/payload inspection)
 */
function decodeJWT(token: string): { header: JWTHeader; payload: ClerkJWTPayload } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

    return { header, payload }
  } catch (error) {
    console.error('JWT decode error:', error)
    return null
  }
}

/**
 * Validates JWT signature using Clerk's public keys
 */
async function validateJWTSignature(token: string, header: JWTHeader): Promise<boolean> {
  try {
    // In production, fetch Clerk's public keys from JWKS endpoint
    // For now, we'll implement basic validation
    
    const clerkJWKSUrl = `https://${Deno.env.get('CLERK_FRONTEND_API')}.clerk.accounts.dev/.well-known/jwks.json`
    
    // Fetch public keys (implement caching in production)
    const response = await fetch(clerkJWKSUrl, {
      headers: {
        'User-Agent': 'FADDL-Match/1.0'
      }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch JWKS:', response.status)
      return false
    }
    
    const jwks = await response.json()
    
    // Find matching key by kid
    const key = jwks.keys.find((k: any) => k.kid === header.kid)
    if (!key) {
      console.error('No matching key found for kid:', header.kid)
      return false
    }
    
    // Validate signature using Web Crypto API
    const keyData = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const parts = token.split('.')
    const message = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    const signature = new Uint8Array(
      Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')))
        .map(c => c.charCodeAt(0))
    )
    
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      keyData,
      signature,
      message
    )
  } catch (error) {
    console.error('JWT signature validation error:', error)
    return false
  }
}

/**
 * Validates JWT time-based claims
 */
function validateJWTClaims(payload: ClerkJWTPayload): { valid: boolean; error?: string } {
  const now = Math.floor(Date.now() / 1000)
  const tolerance = JWT_CONFIG.validation.clockTolerance

  // Check expiration
  if (payload.exp && now > payload.exp + tolerance) {
    return { valid: false, error: 'Token has expired' }
  }

  // Check not before
  if (JWT_CONFIG.validation.requireNotBefore && payload.nbf && now < payload.nbf - tolerance) {
    return { valid: false, error: 'Token not yet valid' }
  }

  // Check issued at
  if (payload.iat && now < payload.iat - tolerance) {
    return { valid: false, error: 'Token issued in the future' }
  }

  // Check maximum age
  if (payload.iat && now > payload.iat + JWT_CONFIG.validation.maxAge + tolerance) {
    return { valid: false, error: 'Token is too old' }
  }

  // Check issuer
  if (JWT_CONFIG.validation.requireIssuer && payload.iss !== JWT_CONFIG.clerk.issuer) {
    return { valid: false, error: 'Invalid issuer' }
  }

  // Check audience
  if (JWT_CONFIG.validation.requireAudience) {
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!audience.includes(JWT_CONFIG.clerk.audience)) {
      return { valid: false, error: 'Invalid audience' }
    }
  }

  return { valid: true }
}

/**
 * Checks rate limiting for failed JWT validation attempts
 */
async function checkRateLimit(
  identifier: string,
  supabaseClient: any
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = new Date(Date.now() - JWT_CONFIG.rateLimiting.windowMinutes * 60 * 1000)
  
  try {
    const { data: failedAttempts, error } = await supabaseClient
      .from('security_events')
      .select('id')
      .eq('event_type', 'jwt_validation_failed')
      .eq('ip_address', identifier)
      .gte('created_at', windowStart.toISOString())

    if (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true, remainingAttempts: JWT_CONFIG.rateLimiting.maxFailedAttempts }
    }

    const attemptCount = failedAttempts?.length || 0
    const remaining = Math.max(0, JWT_CONFIG.rateLimiting.maxFailedAttempts - attemptCount)

    return {
      allowed: attemptCount < JWT_CONFIG.rateLimiting.maxFailedAttempts,
      remainingAttempts: remaining
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    return { allowed: true, remainingAttempts: JWT_CONFIG.rateLimiting.maxFailedAttempts }
  }
}

/**
 * Logs security events for monitoring and alerting
 */
async function logSecurityEvent(
  event: SecurityEvent,
  supabaseClient: any
): Promise<void> {
  try {
    await supabaseClient
      .from('security_events')
      .insert({
        event_type: event.event_type,
        user_id: event.user_id,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        event_data: {
          error_details: event.error_details,
          timestamp: event.timestamp
        },
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Main JWT validation function
 * 
 * @param token - JWT token to validate
 * @param req - Request object for IP/User-Agent extraction
 * @param supabaseClient - Supabase client for logging
 * @returns ValidationResult with user information or error
 */
export async function validateJWT(
  token: string,
  req: Request,
  supabaseClient: any
): Promise<ValidationResult> {
  const ip = req.headers.get('cf-connecting-ip') || 
            req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // Check rate limiting first
  const rateLimit = await checkRateLimit(ip, supabaseClient)
  if (!rateLimit.allowed) {
    await logSecurityEvent({
      event_type: 'suspicious_activity',
      ip_address: ip,
      user_agent: userAgent,
      error_details: 'Rate limit exceeded for JWT validation',
      timestamp: new Date().toISOString()
    }, supabaseClient)

    return {
      valid: false,
      error: 'Too many failed authentication attempts',
      errorCode: 'RATE_LIMITED'
    }
  }

  // Decode JWT
  const decoded = decodeJWT(token)
  if (!decoded) {
    await logSecurityEvent({
      event_type: 'jwt_validation_failed',
      ip_address: ip,
      user_agent: userAgent,
      error_details: 'Malformed JWT token',
      timestamp: new Date().toISOString()
    }, supabaseClient)

    return {
      valid: false,
      error: 'Malformed JWT token',
      errorCode: 'MALFORMED_TOKEN'
    }
  }

  const { header, payload } = decoded

  // Validate algorithm
  if (!JWT_CONFIG.clerk.allowedAlgorithms.includes(header.alg)) {
    await logSecurityEvent({
      event_type: 'jwt_validation_failed',
      ip_address: ip,
      user_agent: userAgent,
      error_details: `Unsupported algorithm: ${header.alg}`,
      timestamp: new Date().toISOString()
    }, supabaseClient)

    return {
      valid: false,
      error: 'Unsupported signing algorithm',
      errorCode: 'INVALID_ALGORITHM'
    }
  }

  // Validate time-based claims
  const claimsValidation = validateJWTClaims(payload)
  if (!claimsValidation.valid) {
    await logSecurityEvent({
      event_type: 'jwt_validation_failed',
      user_id: payload.sub,
      ip_address: ip,
      user_agent: userAgent,
      error_details: claimsValidation.error,
      timestamp: new Date().toISOString()
    }, supabaseClient)

    return {
      valid: false,
      error: claimsValidation.error,
      errorCode: 'INVALID_CLAIMS'
    }
  }

  // Validate signature
  const signatureValid = await validateJWTSignature(token, header)
  if (!signatureValid) {
    await logSecurityEvent({
      event_type: 'jwt_validation_failed',
      user_id: payload.sub,
      ip_address: ip,
      user_agent: userAgent,
      error_details: 'Invalid JWT signature',
      timestamp: new Date().toISOString()
    }, supabaseClient)

    return {
      valid: false,
      error: 'Invalid token signature',
      errorCode: 'INVALID_SIGNATURE'
    }
  }

  // Extract user information
  const userId = payload.sub || payload.user_id
  if (!userId) {
    await logSecurityEvent({
      event_type: 'jwt_validation_failed',
      ip_address: ip,
      user_agent: userAgent,
      error_details: 'No user ID found in token',
      timestamp: new Date().toISOString()
    }, supabaseClient)

    return {
      valid: false,
      error: 'No user ID found in token',
      errorCode: 'MISSING_USER_ID'
    }
  }

  // Log successful validation
  await logSecurityEvent({
    event_type: 'jwt_validation_success',
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    timestamp: new Date().toISOString()
  }, supabaseClient)

  return {
    valid: true,
    userId,
    sessionId: payload.session_id,
    payload
  }
}

/**
 * Simplified authentication middleware for edge functions
 */
export async function authenticateRequest(req: Request): Promise<{
  authenticated: boolean
  userId?: string
  sessionId?: string
  error?: string
  errorCode?: string
  supabaseClient?: any
}> {
  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Check Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or invalid authorization header',
      errorCode: 'MISSING_AUTH_HEADER'
    }
  }

  // Extract token
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return {
      authenticated: false,
      error: 'Empty authorization token',
      errorCode: 'EMPTY_TOKEN'
    }
  }

  // Validate JWT
  const validation = await validateJWT(token, req, supabaseClient)
  if (!validation.valid) {
    return {
      authenticated: false,
      error: validation.error,
      errorCode: validation.errorCode
    }
  }

  return {
    authenticated: true,
    userId: validation.userId,
    sessionId: validation.sessionId,
    supabaseClient
  }
}

/**
 * Security event monitoring for suspicious patterns
 */
export async function monitorSecurityEvents(supabaseClient: any): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    // Check for suspicious activity patterns
    const { data: suspiciousEvents, error } = await supabaseClient
      .from('security_events')
      .select('ip_address, user_agent, event_type')
      .eq('event_type', 'jwt_validation_failed')
      .gte('created_at', oneHourAgo)

    if (error) {
      console.error('Security monitoring error:', error)
      return
    }

    // Group by IP address
    const ipGroups = suspiciousEvents?.reduce((acc: any, event: any) => {
      acc[event.ip_address] = (acc[event.ip_address] || 0) + 1
      return acc
    }, {})

    // Alert on IPs with excessive failed attempts
    for (const [ip, count] of Object.entries(ipGroups || {})) {
      if ((count as number) > 20) {
        console.warn(`⚠️ Suspicious activity detected from IP ${ip}: ${count} failed attempts in last hour`)
        
        // Log high-priority security event
        await logSecurityEvent({
          event_type: 'suspicious_activity',
          ip_address: ip,
          user_agent: 'monitoring',
          error_details: `${count} failed JWT validation attempts in 1 hour`,
          timestamp: new Date().toISOString()
        }, supabaseClient)
      }
    }
  } catch (error) {
    console.error('Security monitoring error:', error)
  }
}