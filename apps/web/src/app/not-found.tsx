'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Heart, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 flex items-center justify-center px-4">
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

        {/* 404 Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold text-green-100 mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              It seems this page has gone on its own journey. 
              <br className="hidden sm:block" />
              Let's help you find your way back to finding your perfect match.
            </p>
          </div>

          {/* Islamic Quote */}
          <motion.div
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-8 border border-green-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Heart className="w-8 h-8 text-green-600 mx-auto mb-4" />
            <blockquote className="text-lg font-medium text-gray-800 mb-4 italic">
              "And it is He who created all things in pairs..."
            </blockquote>
            <cite className="text-green-700 font-semibold">— Quran 51:49</cite>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href="/">
              <button className="group flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold">
                <Home className="w-5 h-5" />
                <span>Return Home</span>
              </button>
            </Link>
            
            <Link href="/dashboard">
              <button className="group flex items-center space-x-2 px-8 py-3 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md font-semibold">
                <Search className="w-5 h-5" />
                <span>Go to Dashboard</span>
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
            If you believe this is an error, please{' '}
            <a href="mailto:support@faddlmatch.com" className="text-green-600 hover:text-green-700 underline">
              contact our support team
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}