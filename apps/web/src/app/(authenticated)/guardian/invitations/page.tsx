'use client'

import { Suspense } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GuardianInvitation } from '../components/GuardianInvitation'

export default function GuardianInvitationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/guardian">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Guardian Invitations
          </h1>
          <p className="text-neutral-600">
            Invite trusted family members to help with marriage guidance
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-96">
            <div className="flex items-center gap-3 text-neutral-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading invitation management...</span>
            </div>
          </div>
        }>
          <GuardianInvitation />
        </Suspense>
      </div>
    </div>
  )
}