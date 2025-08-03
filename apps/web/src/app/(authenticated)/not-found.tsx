'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search, Settings, MessageCircle } from 'lucide-react'

export default function AuthenticatedNotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo matching navigation style */}
        <motion.div 
          className="flex items-center justify-center space-x-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">FM</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
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
            <h1 className="text-7xl md:text-8xl font-bold text-green-100 mb-4">404</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              This page seems to have wandered off. 
              <br className="hidden sm:block" />
              Let's get you back to your matrimonial journey.
            </p>
          </div>

          {/* Quick Navigation */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/dashboard">
              <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                <Home className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Dashboard</p>
              </div>
            </Link>
            
            <Link href="/matches">
              <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                <Search className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Matches</p>
              </div>
            </Link>
            
            <Link href="/messages">
              <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Messages</p>
              </div>
            </Link>
            
            <Link href="/settings">
              <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                <Settings className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Settings</p>
              </div>
            </Link>
          </motion.div>

          {/* Main Action Button */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href="/dashboard">
              <button className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold">
                <ArrowLeft className="w-5 h-5" />
                <span>Return to Dashboard</span>
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
            Need assistance? Contact our{' '}
            <a href="mailto:support@faddlmatch.com" className="text-green-600 hover:text-green-700 underline">
              support team
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}