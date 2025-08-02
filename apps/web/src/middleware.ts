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
  // Allow public routes
  if (isPublicRoute(req)) return

  // Protect all other routes
  auth().protect()

  const { userId, sessionClaims } = auth()
  
  // Handle users who haven't completed onboarding
  if (userId && !sessionClaims?.metadata?.profileComplete) {
    const isOnboardingRoute = req.nextUrl.pathname.startsWith('/onboarding')
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    
    if (!isOnboardingRoute && !isApiRoute) {
      const onboardingUrl = new URL('/onboarding', req.url)
      return NextResponse.redirect(onboardingUrl)
    }
  }
  
  // Guardian access control
  if (req.nextUrl.pathname.startsWith('/guardian')) {
    const isGuardian = sessionClaims?.organizations?.some(
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
  
  const userTier = sessionClaims?.metadata?.subscriptionTier || 'basic'
  
  for (const [tier, routes] of Object.entries(protectedRoutes)) {
    if (routes.some(route => req.nextUrl.pathname.startsWith(route))) {
      if (userTier !== tier && userTier !== 'vip') {
        return NextResponse.redirect(new URL('/upgrade', req.url))
      }
    }
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}