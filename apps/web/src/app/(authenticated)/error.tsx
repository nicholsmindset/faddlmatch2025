'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RefreshCw, Home, AlertTriangle, Shield, Settings } from 'lucide-react'

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Authenticated area error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header with Navigation-style Logo */}
        <motion.div 
          className="flex items-center justify-center space-x-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">FM</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">
            FADDL Match
          </h1>
        </motion.div>

        {/* Error Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="mb-8">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technical Difficulty
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We're experiencing a temporary issue with your dashboard. 
              <br className="hidden sm:block" />
              Your account and data are safe.
            </p>
          </div>

          {/* Islamic Quote */}
          <motion.div
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-8 border border-green-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-4" />
            <blockquote className="text-lg font-medium text-gray-800 mb-4 italic">
              "And whoever relies upon Allah - then He is sufficient for him."
            </blockquote>
            <cite className="text-green-700 font-semibold">— Quran 65:3</cite>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center space-x-2 text-blue-800 mb-2">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Your Privacy is Protected</h3>
            </div>
            <p className="text-sm text-blue-700">
              This technical issue does not affect your personal information or account security. 
              All your data remains encrypted and protected.
            </p>
          </motion.div>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="font-semibold text-red-900 mb-2">Error Details (Development Only):</h3>
              <p className="text-sm text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              onClick={reset}
              className="group flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh Dashboard</span>
            </button>
            
            <Link href="/dashboard">
              <button className="group flex items-center space-x-2 px-8 py-3 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md font-semibold">
                <Home className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </button>
            </Link>
            
            <Link href="/settings">
              <button className="group flex items-center space-x-2 px-6 py-3 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-200 hover:border-neutral-300 transition-all duration-300 font-medium">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </Link>
          </motion.div>

          {/* Help Text */}
          <motion.p
            className="text-sm text-gray-500 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Still having issues?{' '}
            <a href="mailto:support@faddlmatch.com" className="text-green-600 hover:text-green-700 underline">
              Contact our support team
            </a>{' '}
            - we're here to help 24/7.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}