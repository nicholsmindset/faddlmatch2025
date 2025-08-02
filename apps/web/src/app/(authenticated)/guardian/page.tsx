'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { GuardianDashboard } from './components/GuardianDashboard'

export default function GuardianPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Family Guardian Dashboard
          </h1>
          <p className="text-neutral-600">
            Providing loving oversight while respecting privacy and Islamic values
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-96">
            <div className="flex items-center gap-3 text-neutral-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading guardian dashboard...</span>
            </div>
          </div>
        }>
          <GuardianDashboard />
        </Suspense>
      </div>
    </div>
  )
}