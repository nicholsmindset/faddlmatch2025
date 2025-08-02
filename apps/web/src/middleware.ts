import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/about',
    '/privacy',
    '/terms',
    '/auth/sign-in',
    '/auth/sign-up',
    '/api/webhooks/clerk'
  ],
  
  afterAuth(auth, req) {
    // Handle users who haven't completed onboarding
    if (auth.userId && !auth.sessionClaims?.metadata?.profileComplete) {
      const isOnboardingRoute = req.nextUrl.pathname.startsWith('/onboarding')
      const isApiRoute = req.nextUrl.pathname.startsWith('/api')
      
      if (!isOnboardingRoute && !isApiRoute) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
      }
    }
    
    // Guardian access control
    if (req.nextUrl.pathname.startsWith('/guardian')) {
      const isGuardian = auth.sessionClaims?.organizations?.some(
        org => org.role === 'guardian'
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
    
    const userTier = auth.sessionClaims?.metadata?.subscriptionTier || 'basic'
    
    for (const [tier, routes] of Object.entries(protectedRoutes)) {
      if (routes.some(route => req.nextUrl.pathname.startsWith(route))) {
        if (userTier !== tier && userTier !== 'vip') {
          return NextResponse.redirect(new URL('/upgrade', req.url))
        }
      }
    }
  },
  
  // Custom sign-in URL
  signInUrl: '/auth/sign-in',
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development'
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}