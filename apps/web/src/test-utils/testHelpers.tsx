/**
 * 🛠️ Test Helpers
 * Utility functions and components for testing
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubscriptionPlanId, SubscriptionStatus } from '@/lib/stripe'

// Create a test wrapper with providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: process.env.NODE_ENV === 'test' ? () => {} : console.error,
    },
  })

interface AllTheProvidersProps {
  children: React.ReactNode
}

export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  emailAddresses: [{ emailAddress: 'test@faddlmatch.com' }],
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
})

export const createMockSubscription = (overrides = {}) => ({
  hasActiveSubscription: true,
  planId: 'PATIENCE' as SubscriptionPlanId,
  status: 'active' as SubscriptionStatus,
  daysRemaining: 25,
  features: ['unlimited_matches', 'advanced_filters'],
  currentPeriodEnd: new Date('2024-12-31'),
  canceledAt: null,
  subscription: {
    id: 'sub_test_123',
    stripeCustomerId: 'cus_test_123',
    stripeSubscriptionId: 'sub_stripe_123',
    status: 'active',
  },
  planDetails: {
    name: 'Patience',
    price: 29,
    currency: 'sgd',
    features: ['Unlimited matches', 'Advanced filters'],
    description: 'Most popular choice',
  },
  billing: {
    nextBilling: new Date('2024-12-31'),
    autoRenewal: true,
    daysUntilRenewal: 25,
  },
  usage: {
    dailyMatches: 'unlimited',
    messagesLeft: 'unlimited',
    profileBoosts: 0,
  },
  ...overrides,
})

export const createMockFreeSubscription = () =>
  createMockSubscription({
    hasActiveSubscription: false,
    planId: 'INTENTION',
    planDetails: {
      name: 'Intention',
      price: 0,
      currency: 'sgd',
      features: ['5 daily matches', 'Basic messaging'],
      description: 'Perfect for starting your journey',
    },
    usage: {
      dailyMatches: 5,
      messagesLeft: 50,
      profileBoosts: 0,
    },
    billing: {
      nextBilling: null,
      autoRenewal: false,
      daysUntilRenewal: 0,
    },
  })

// Mock API responses
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

export const mockErrorResponse = (message: string, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
})

// Stripe webhook event factory
export const createMockStripeEvent = (type: string, data: any) => ({
  id: `evt_test_${Date.now()}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: data,
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: `req_test_${Date.now()}`,
    idempotency_key: null,
  },
  type,
})

// Stripe subscription factory
export const createMockStripeSubscription = (overrides = {}) => ({
  id: 'sub_test_123',
  object: 'subscription',
  cancel_at_period_end: false,
  canceled_at: null,
  created: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
  current_period_start: Math.floor(Date.now() / 1000),
  customer: 'cus_test_123',
  status: 'active',
  metadata: {
    userId: 'test-user-id',
    planId: 'PATIENCE',
  },
  items: {
    data: [
      {
        id: 'si_test_123',
        price: {
          id: 'price_test_patience',
          unit_amount: 2900,
          currency: 'sgd',
        },
      },
    ],
  },
  ...overrides,
})

// Wait for async operations in tests
export const waitFor = (ms: number = 100) =>
  new Promise(resolve => setTimeout(resolve, ms))

// Mock fetch helper
export const mockFetch = (responseData: any, ok = true, status = 200) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
  })
}

// Mock fetch with error
export const mockFetchError = (error: string, status = 500) => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error))
}

// Test environment helpers
export const isTestEnvironment = () => process.env.NODE_ENV === 'test'

// Console log helpers for debugging tests
export const debugLog = (...args: any[]) => {
  if (process.env.DEBUG_TESTS) {
    console.log('[TEST DEBUG]', ...args)
  }
}

// Islamic content validation helper
export const validateIslamicContent = (text: string) => {
  const islamicTerms = ['halal', 'islamic', 'shariah', 'compliant', 'allah', 'matrimonial']
  return islamicTerms.some(term => text.toLowerCase().includes(term))
}