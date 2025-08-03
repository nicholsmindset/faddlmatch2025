/**
 * 💰 Pricing Page
 * Complete pricing page for FADDL Match subscription plans
 */

import React from 'react'
import { Metadata } from 'next'
import PricingSection from '@/components/subscription/PricingSection'

export const metadata: Metadata = {
  title: 'Pricing - FADDL Match',
  description: 'Choose the perfect subscription plan for your Islamic matrimonial journey. Halal-compliant features designed to help you find your ideal match.',
  keywords: ['pricing', 'subscription', 'islamic matrimonial', 'halal dating', 'muslim marriage'],
  openGraph: {
    title: 'FADDL Match Pricing - Halal Matrimonial Plans',
    description: 'Discover our Islamic-compliant subscription plans designed to help you find your perfect match.',
    type: 'website',
  }
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Conversion-focused header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            You're Almost Ready to Find Your Match! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your profile is complete. Now unlock powerful features to connect with compatible 
            Islamic partners who share your values and life goals.
          </p>
        </div>
      </div>
      
      <PricingSection showHeader={false} />
      
      {/* Trust indicators for new users */}
      <div className="bg-green-50 border-t border-green-200">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join Thousands of Muslims Finding Love
            </h3>
            <div className="flex flex-wrap justify-center gap-8 text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Guardian-approved matches</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Islamic values at the center</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Secure & private communication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}