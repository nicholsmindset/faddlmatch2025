'use client'

import { motion } from 'framer-motion'

export default function AuthenticatedLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
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

        {/* Loading Animation */}
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Spinner */}
          <div className="relative">
            <motion.div
              className="w-10 h-10 border-3 border-green-200 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute top-0 left-0 w-10 h-10 border-3 border-transparent border-t-green-700 rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          {/* Loading Text */}
          <motion.p
            className="text-neutral-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}