/**
 * 💰 Pricing Page
 * Complete pricing page for FADDL Match subscription plans
 */

import React from 'react'
import { Metadata } from 'next'
import PackageSelection from '@/components/subscription/PackageSelection'

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
  return <PackageSelection />
}