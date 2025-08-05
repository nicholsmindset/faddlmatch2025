import { Metadata } from 'next'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export const metadata: Metadata = {
  title: 'Complete Your Profile - FADDLmatch',
  description: 'Complete your matrimonial profile to start finding matches'
}

export default function OnboardingPage() {
  return <OnboardingFlow />
}