'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 flex items-center justify-center">
      <div className="text-center">
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
              className="w-12 h-12 border-4 border-green-200 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-green-600 rounded-full"
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
            className="text-lg text-gray-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Preparing your halal journey...
          </motion.p>

          {/* Islamic Quote */}
          <motion.div
            className="mt-8 max-w-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <blockquote className="text-green-700 italic font-medium mb-2">
              "And it is He who created all things in pairs..."
            </blockquote>
            <cite className="text-green-600 text-sm">— Quran 51:49</cite>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}