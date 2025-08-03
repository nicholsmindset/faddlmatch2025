'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Shield, MessageCircle, Users, Quote, Star, CheckCircle, ArrowRight, Menu, X } from 'lucide-react'
import { PricingSection } from '@/components/subscription/PricingSection'
import { useState } from 'react'

export default function SimplePage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">FM</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                FADDL Match
              </h1>
            </motion.div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                 onClick={(e) => {
                   e.preventDefault()
                   document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                 }}>
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                 onClick={(e) => {
                   e.preventDefault()
                   document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                 }}>
                Pricing
              </a>
              <a href="#stories" className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                 onClick={(e) => {
                   e.preventDefault()
                   document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })
                 }}>
                Success Stories
              </a>
            </nav>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SignInButton mode="modal">
                <button className="hidden sm:block px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer font-medium">
                  Sign In
                </button>
              </SignInButton>
              
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-gray-700 hover:text-green-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </motion.div>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden mt-4 py-4 border-t border-green-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                   onClick={(e) => {
                     e.preventDefault()
                     setIsMobileMenuOpen(false)
                     document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                   }}>
                  Features
                </a>
                <a href="#pricing" className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                   onClick={(e) => {
                     e.preventDefault()
                     setIsMobileMenuOpen(false)
                     document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                   }}>
                  Pricing
                </a>
                <a href="#stories" className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                   onClick={(e) => {
                     e.preventDefault()
                     setIsMobileMenuOpen(false)
                     document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })
                   }}>
                  Success Stories
                </a>
                <SignInButton mode="modal">
                  <button className="w-full px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Find Your{' '}
              <span className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 bg-clip-text text-transparent">
                Halal Life Partner
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              A respectful, Islamic matrimonial platform designed for divorced and widowed Muslims 
              in Singapore seeking meaningful remarriage with family involvement and Islamic values at the center.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <SignInButton mode="modal">
                <button className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 cursor-pointer font-semibold flex items-center space-x-2">
                  <span>Start Free Profile</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <p className="text-sm text-gray-500 flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Free to start • Upgrade when ready</span>
              </p>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center gap-8 pt-8 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="flex items-center space-x-2 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Islamic Values</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Family Involvement</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">Meaningful Connections</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 scroll-mt-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What makes{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Faddl Match
              </span>{' '}
              different?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the unique journey of those seeking a second chance at love
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              className="text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Respectful Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Thoughtful connections for divorced and widowed Muslims through 
                question-based analysis that respects your journey and values.
              </p>
            </motion.div>

            <motion.div
              className="text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Secure Communication</h3>
              <p className="text-gray-600 leading-relaxed">
                Private messaging with Islamic communication guidelines that 
                ensure respectful and meaningful conversations.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Islamic Quote Section */}
        <section className="py-20">
          <motion.div
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-12 text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Quote className="w-12 h-12 text-green-600 mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 mb-8 leading-relaxed italic">
              "And among His signs is that He created for you mates from among yourselves, 
              that you may dwell in tranquility with them, and He has put love and mercy 
              between your hearts. Verily in that are signs for those who reflect."
            </blockquote>
            <cite className="text-lg text-green-700 font-semibold">— Quran 30:21</cite>
            
            <div className="mt-8 pt-8 border-t border-green-200">
              <blockquote className="text-xl font-medium text-gray-700 mb-4 italic">
                "The best of you are those who are best to their families..."
              </blockquote>
              <cite className="text-green-600 font-semibold">— Al-Tirmidhi (3895)</cite>
            </div>
          </motion.div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 scroll-mt-20">
          <PricingSection showHeader={true} className="" />
        </section>

        {/* Success Stories */}
        <section id="stories" className="py-20 scroll-mt-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Stories of{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Hope & New Beginnings
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Real people, real connections, real second chances
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-2xl font-medium text-gray-800 mb-8 text-center italic leading-relaxed">
              "FADDL Match helped me find my perfect match while respecting my Islamic values. 
              The guardian involvement feature gave my family confidence in the process, 
              and the respectful communication guidelines made meaningful conversations possible."
            </blockquote>
            <div className="text-center">
              <p className="font-semibold text-gray-900 text-lg">Aisha M.</p>
              <p className="text-green-600">Singapore • Married 2024</p>
            </div>
          </motion.div>
        </section>

        {/* Commitment Section */}
        <section className="py-20">
          <motion.div
            className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-12 text-center text-white max-w-5xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Our Commitment to You
            </h2>
            <p className="text-xl leading-relaxed mb-8 opacity-90">
              By joining Faddl Match, you commit to seeking marriage with pure intentions (niyyah), 
              treating all members with Islamic respect and dignity, and following our community 
              guidelines rooted in Islamic values.
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-white text-green-600 text-lg rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer font-semibold">
                Create Your Profile Today
              </button>
            </SignInButton>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-gray-200">
          <div className="text-center text-gray-500">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">FM</span>
              </div>
              <span className="text-xl font-bold text-gray-700">FADDL Match</span>
            </div>
            <p className="mb-6">&copy; 2024 FADDL Match. Built with Islamic values and modern technology.</p>
            <div className="flex justify-center space-x-8">
              <a href="#" className="hover:text-green-600 transition-colors font-medium">Privacy Policy</a>
              <a href="#" className="hover:text-green-600 transition-colors font-medium">Terms of Service</a>
              <a href="#" className="hover:text-green-600 transition-colors font-medium">About Us</a>
              <a href="#" className="hover:text-green-600 transition-colors font-medium">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}