'use client'

import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/onboarding'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join FADDL Match
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Begin your halal journey to find your perfect match
          </p>
          <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              100% Halal
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Islamic Values
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Secure & Private
            </span>
          </div>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xl rounded-2xl">
          <SignUp 
            redirectUrl={redirectUrl}
            signInUrl="/sign-in"
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                footerActionLink: "text-blue-600 hover:text-blue-700"
              }
            }}
          />
        </div>

        {/* Islamic Values Notice */}
        <div className="text-center bg-blue-50 p-4 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Our Promise:</strong> All interactions are guided by Islamic principles. 
            Family involvement is encouraged, and privacy is strictly maintained according to Islamic values.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our Islamic-compliant terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}