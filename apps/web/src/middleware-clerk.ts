import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/privacy',
  '/terms',
  '/auth/sign-in',
  '/auth/sign-up',
  '/api/webhooks/clerk'
])

export default clerkMiddleware((auth, req) => {
  try {
    // Allow public routes
    if (isPublicRoute(req)) return NextResponse.next()

    // Protect all other routes
    auth().protect()

    const { userId, sessionClaims } = auth()
    
    // Handle users who haven't completed onboarding
    if (userId && !(sessionClaims as any)?.metadata?.profileComplete) {
      const isOnboardingRoute = req.nextUrl.pathname.startsWith('/onboarding')
      const isApiRoute = req.nextUrl.pathname.startsWith('/api')
      
      if (!isOnboardingRoute && !isApiRoute) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
      }
    }
    
    // Guardian access control
    if (req.nextUrl.pathname.startsWith('/guardian')) {
      const isGuardian = (sessionClaims as any)?.organizations?.some?.(
        (org: any) => org.role === 'guardian'
      )
      
      if (!isGuardian) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    // Subscription tier access control
    const protectedRoutes = {
      premium: ['/matches/unlimited', '/analytics', '/read-receipts'],
      vip: ['/matchmaker', '/exclusive-events', '/priority-support']
    }
    
    const userTier = (sessionClaims as any)?.metadata?.subscriptionTier || 'basic'
    
    for (const [tier, routes] of Object.entries(protectedRoutes)) {
      if (routes.some(route => req.nextUrl.pathname.startsWith(route))) {
        if (userTier !== tier && userTier !== 'vip') {
          return NextResponse.redirect(new URL('/upgrade', req.url))
        }
      }
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // Fallback to allowing public access if there's an error
    return NextResponse.next()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}