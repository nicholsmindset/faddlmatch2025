/**
 * 📊 Subscription Management Page
 * Manage current subscription and view billing information
 */

import React from 'react'
import { Metadata } from 'next'
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement'
import PackageSelection from '@/components/subscription/PackageSelection'

export const metadata: Metadata = {
  title: 'Subscription Management - FADDL Match',
  description: 'Manage your FADDL Match subscription, billing information, and plan features.',
  keywords: ['subscription', 'billing', 'islamic matrimonial', 'account management'],
  openGraph: {
    title: 'FADDL Match Subscription Management',
    description: 'Manage your Islamic matrimonial subscription and billing.',
    type: 'website',
  }
}

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your FADDL Match subscription, billing information, and explore upgrade options 
            for your Islamic matrimonial journey.
          </p>
        </div>

        {/* Subscription Management Component */}
        <div className="mb-12">
          <SubscriptionManagement />
        </div>

        {/* Upgrade Options */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore Other Plans
            </h2>
            <p className="text-gray-600">
              Discover all the features available to enhance your matrimonial journey
            </p>
          </div>
          
          <PackageSelection />
        </div>
      </div>
    </div>
  )
}