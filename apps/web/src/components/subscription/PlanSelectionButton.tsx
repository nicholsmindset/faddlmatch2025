/**
 * 🎯 Plan Selection Button Component
 * Handles plan selection and redirects to appropriate signup flow
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

interface PlanSelectionButtonProps {
  planId: string
  planName: string
  buttonText: string
  className: string
  children?: React.ReactNode
}

export function PlanSelectionButton({ 
  planId, 
  planName, 
  buttonText, 
  className,
  children 
}: PlanSelectionButtonProps) {
  const router = useRouter()
  const { isSignedIn } = useUser()

  const handlePlanSelection = () => {
    // Store selected plan in localStorage for post-signup retrieval
    localStorage.setItem('selectedPlan', JSON.stringify({
      planId: planId.toUpperCase(),
      planName,
      selectedAt: new Date().toISOString()
    }))

    if (isSignedIn) {
      // User is already signed in, route based on plan
      if (planId === 'intention') {
        // Free plan - go to quick onboarding then dashboard
        router.push('/onboarding?plan=intention&flow=quick')
      } else {
        // Paid plan - go to payment then full onboarding
        router.push(`/subscription?plan=${planId}`)
      }
    } else {
      // User needs to sign up - redirect to signup with plan context
      const redirectUrl = planId === 'intention' 
        ? '/onboarding?plan=intention&flow=quick'
        : `/subscription?plan=${planId}`
      
      router.push(`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`)
    }
  }

  return (
    <button 
      onClick={handlePlanSelection}
      className={className}
    >
      {children || buttonText}
    </button>
  )
}

export default PlanSelectionButton