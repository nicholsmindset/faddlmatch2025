import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ratelimit } from '@/lib/ratelimit'

// 🔒 PRODUCTION SECURITY: Only truly public routes
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/sign-in(.*)',        // Clerk sign-in pages
  '/sign-up(.*)',        // Clerk sign-up pages
  '/api/webhooks/clerk', // Webhook endpoint (validated separately)
  '/api/health',         // Health check endpoint
  '/api/demo/(.*)',      // Demo endpoints for testing
  '/favicon.ico',        // Static assets
  '/robots.txt',
  '/sitemap.xml'
])

// 🛡️ Routes that require additional security validation
const isHighSecurityRoute = createRouteMatcher([
  '/settings(.*)',       // Account settings
  '/guardian(.*)',       // Guardian management
  '/messages(.*)',       // Private messaging
  '/api/user/(.*)',      // User data APIs
  '/api/messages/(.*)',  // Message APIs
  '/api/profile/(.*)'    // Profile APIs
])

// 🚦 Rate limiting configuration
const rateLimit = {
  // Generous limits for authenticated users
  authenticated: { requests: 1000, window: '1m' },
  // Strict limits for public endpoints
  public: { requests: 100, window: '1m' },
  // Very strict for auth endpoints
  auth: { requests: 20, window: '1m' },
  // Ultra strict for high-security routes
  security: { requests: 200, window: '1m' }
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  // 🔍 Security logging for monitoring
  const logSecurityEvent = (event: string, details?: any) => {
    console.log(`[SECURITY] ${event}`, {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      path: pathname,
      userAgent: request.headers.get('user-agent'),
      ...details
    })
  }

  try {
    // 🚨 CRITICAL: Apply rate limiting
    const rateLimitKey = isPublicRoute(request) 
      ? `public:${clientIP}` 
      : isHighSecurityRoute(request)
        ? `security:${clientIP}`
        : `auth:${clientIP}`
    
    const limit = isPublicRoute(request)
      ? rateLimit.public
      : isHighSecurityRoute(request)
        ? rateLimit.security
        : rateLimit.auth

    // 🚦 Rate limiting check
    const { success, remaining, reset } = await ratelimit(rateLimitKey, limit)
    if (!success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { key: rateLimitKey, limit, reset })
      
      const response = new NextResponse('Too Many Requests - Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(reset.getTime() / 1000).toString(),
          'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString()
        }
      })
      
      return response
    }
    
    // Add rate limit headers to successful responses
    const rateLimitHeaders = {
      'X-RateLimit-Limit': limit.requests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(reset.getTime() / 1000).toString()
    }

    // 🔐 Apply authentication protection
    if (!isPublicRoute(request)) {
      // 🛡️ Enhanced security for high-security routes
      if (isHighSecurityRoute(request)) {
        logSecurityEvent('HIGH_SECURITY_ACCESS', { path: pathname })
        
        // Additional security checks for sensitive routes
        const authResult = auth()
        if (!authResult.userId) {
          logSecurityEvent('UNAUTHORIZED_HIGH_SECURITY_ACCESS')
          const returnUrl = encodeURIComponent(pathname)
          return NextResponse.redirect(new URL(`/sign-in?redirect_url=${returnUrl}`, request.url))
        }
        
        // Verify session is fresh for high-security operations
        const sessionClaims = authResult.sessionClaims
        if (sessionClaims) {
          const sessionAge = Date.now() - (sessionClaims.iat || 0) * 1000
          const MAX_SESSION_AGE = 2 * 60 * 60 * 1000 // 2 hours
          
          if (sessionAge > MAX_SESSION_AGE) {
            logSecurityEvent('STALE_SESSION_HIGH_SECURITY', { sessionAge })
            const returnUrl = encodeURIComponent(pathname)
            return NextResponse.redirect(new URL(`/sign-in?reason=session_expired&redirect_url=${returnUrl}`, request.url))
          }
        }
      }
      
      // 🔒 Standard authentication protection
      try {
        auth().protect()
        logSecurityEvent('AUTH_SUCCESS', { authenticated: true })
      } catch (error) {
        logSecurityEvent('AUTH_FAILURE', { error: error instanceof Error ? error.message : 'Unknown error' })
        const returnUrl = encodeURIComponent(pathname)
        return NextResponse.redirect(new URL(`/sign-in?redirect_url=${returnUrl}`, request.url))
      }
    }

    // 🛡️ Security headers for all responses
    const response = NextResponse.next()
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Enhanced security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    
    // CSP for enhanced security
    const cspValues = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co",
      "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev"
    ]
    response.headers.set('Content-Security-Policy', cspValues.join('; '))
    
    return response
    
  } catch (error) {
    logSecurityEvent('MIDDLEWARE_ERROR', { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      stack: error instanceof Error ? error.stack : undefined 
    })
    
    // Fail securely - redirect to sign-in on any middleware error
    if (!isPublicRoute(request)) {
      const returnUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL(`/sign-in?reason=security_error&redirect_url=${returnUrl}`, request.url))
    }
    
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
}