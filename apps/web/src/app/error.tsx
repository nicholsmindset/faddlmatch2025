'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RefreshCw, Home, AlertTriangle, Heart } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <motion.div 
          className="flex items-center justify-center space-x-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">FM</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
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
              Something Went Wrong
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We encountered an unexpected issue. Don't worry, 
              <br className="hidden sm:block" />
              our team has been notified and we're working to fix it.
            </p>
          </div>

          {/* Islamic Quote */}
          <motion.div
            className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-8 border border-orange-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Heart className="w-8 h-8 text-orange-600 mx-auto mb-4" />
            <blockquote className="text-lg font-medium text-gray-800 mb-4 italic">
              "And Allah is with those who are patient."
            </blockquote>
            <cite className="text-orange-700 font-semibold">— Quran 2:153</cite>
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
              className="group flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Try Again</span>
            </button>
            
            <Link href="/">
              <button className="group flex items-center space-x-2 px-8 py-3 bg-white text-orange-700 border-2 border-orange-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md font-semibold">
                <Home className="w-5 h-5" />
                <span>Return Home</span>
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
            If this problem persists, please{' '}
            <a href="mailto:support@faddlmatch.com" className="text-orange-600 hover:text-orange-700 underline">
              contact our support team
            </a>{' '}
            and include the error ID if available.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}