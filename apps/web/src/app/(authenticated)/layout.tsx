'use client'

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs'
import { Navigation } from '@/components/layout/Navigation'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { UserProvider } from '@/contexts/UserContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 🔒 PRODUCTION SECURITY: Enforce authentication for all routes
  return (
    <>
      <SignedOut>
        <AuthenticationRequired />
      </SignedOut>
      <SignedIn>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </SignedIn>
    </>
  )
}

// 🚨 Component to handle unauthenticated access
function AuthenticationRequired() {
  const router = useRouter()
  
  useEffect(() => {
    // Log security event
    console.log('[SECURITY] Unauthorized access attempt to authenticated route', {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
    
    // Redirect to sign-in with return URL and helpful message
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
    router.push(`/sign-in?redirect_url=${returnUrl}&reason=auth_required`)
  }, [router])
  
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}

// 🔐 Component for authenticated users with additional security
function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  useEffect(() => {
    if (isLoaded && user) {
      // Log successful authentication
      console.log('[SECURITY] Authenticated user access', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        lastSignIn: user.lastSignInAt,
        url: window.location.href
      })
      
      // 🛡️ Additional security checks
      const lastSignIn = user.lastSignInAt
      if (lastSignIn) {
        const sessionAge = Date.now() - new Date(lastSignIn).getTime()
        const MAX_SESSION_AGE = 24 * 60 * 60 * 1000 // 24 hours
        
        if (sessionAge > MAX_SESSION_AGE) {
          console.log('[SECURITY] Session expired, forcing re-authentication', {
            userId: user.id,
            sessionAge,
            lastSignIn
          })
          
          // Force re-authentication for old sessions
          router.push('/sign-in?reason=session_expired')
          return
        }
      }
      
      // 🔍 Check if user needs to complete onboarding
      const hasCompletedOnboarding = user.publicMetadata?.onboardingCompleted
      const currentPath = window.location.pathname
      
      if (!hasCompletedOnboarding && !currentPath.includes('/onboarding') && !currentPath.includes('/settings')) {
        console.log('[SECURITY] User needs onboarding, redirecting', {
          userId: user.id,
          currentPath
        })
        
        // Allow access to settings but redirect other pages to onboarding
        if (!currentPath.includes('/settings')) {
          router.push('/onboarding')
          return
        }
      }
    }
  }, [isLoaded, user, router])
  
  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <UserProvider>
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <Breadcrumb />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </UserProvider>
  )
}