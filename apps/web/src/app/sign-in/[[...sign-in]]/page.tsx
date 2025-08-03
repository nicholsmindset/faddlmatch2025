'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back to FADDL Match
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Continue your halal journey to find your perfect match
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xl rounded-2xl">
          <SignIn 
            redirectUrl={redirectUrl}
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                footerActionLink: "text-blue-600 hover:text-blue-700"
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Islamic-compliant terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}