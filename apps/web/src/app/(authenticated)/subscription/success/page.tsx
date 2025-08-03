/**
 * ✅ Subscription Success Page
 * Confirmation page after successful subscription purchase
 */

import React from 'react'
import { Suspense } from 'react'
import { CheckCircle, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

/**
 * 🎉 Success page content
 */
function SuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Success Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to Your Journey! 🎉
        </motion.h1>

        <motion.p
          className="text-xl text-gray-600 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your subscription has been successfully activated. 
          May Allah bless you in finding your perfect match.
        </motion.p>

        {/* Success Details */}
        <motion.div
          className="bg-white rounded-2xl p-8 shadow-lg border border-green-200 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            What happens next?
          </h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
                <p className="text-gray-600 text-sm">
                  Add more details to help us find better matches for you
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-blue-600 text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Explore Your Matches</h3>
                <p className="text-gray-600 text-sm">
                  Start browsing profiles and connecting with potential matches
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-blue-600 text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Start Meaningful Conversations</h3>
                <p className="text-gray-600 text-sm">
                  Use our Halal-compliant messaging and video features
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Islamic Blessing */}
        <motion.div
          className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Islamic Blessing</span>
            <Heart className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-gray-700 italic">
            "And among His signs is that He created for you mates from among yourselves, 
            that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
          </p>
          <p className="text-sm text-gray-600 mt-2">- Quran 30:21</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          <Link
            href="/matches"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            View Matches
            <Heart className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>

        {/* Support Information */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-600 text-sm mb-2">
            Need help getting started? Our support team is here for you.
          </p>
          <Link
            href="/support"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Contact Support
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * 📄 Main page component with Suspense
 */
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}