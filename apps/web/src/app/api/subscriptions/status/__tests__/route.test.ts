/**
 * 🧪 Subscription Status API Tests
 * Integration tests for subscription status endpoint
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { auth } from '@clerk/nextjs/server'
import { getUserSubscription, getSubscriptionAnalytics } from '@/lib/subscription'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'

// Mock dependencies
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/subscription')

describe('/api/subscriptions/status', () => {
  const mockUserId = 'test-user-id'
  const mockRequest = new NextRequest('https://faddlmatch.com/api/subscriptions/status')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: null })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('processes request for authenticated user', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: false,
        planId: 'INTENTION',
        status: 'active',
        daysRemaining: 0,
        features: SUBSCRIPTION_PLANS.INTENTION.features,
        currentPeriodEnd: null,
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.planId).toBe('INTENTION')
      expect(data.hasActiveSubscription).toBe(false)
    })
  })

  describe('Free Plan Response', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: false,
        planId: 'INTENTION',
        status: 'active',
        daysRemaining: 0,
        features: SUBSCRIPTION_PLANS.INTENTION.features,
        currentPeriodEnd: null,
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)
    })

    it('returns correct free plan data structure', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data).toMatchObject({
        hasActiveSubscription: false,
        planId: 'INTENTION',
        status: 'active',
        daysRemaining: 0,
        features: SUBSCRIPTION_PLANS.INTENTION.features,
        planDetails: {
          name: 'Intention',
          price: 0,
          currency: 'usd',
          features: SUBSCRIPTION_PLANS.INTENTION.features,
          description: 'Perfect for starting your matrimonial journey',
        },
        billing: {
          nextBilling: null,
          autoRenewal: false,
          daysUntilRenewal: 0,
        },
        usage: {
          dailyMatches: 5,
          messagesLeft: 50,
          profileBoosts: 0,
        },
        subscription: null,
      })
    })

    it('includes plan details with correct Islamic messaging', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.planDetails.description).toContain('matrimonial')
      expect(data.planDetails.name).toBe('Intention')
      expect(data.planDetails.price).toBe(0)
    })
  })

  describe('Paid Plan Response', () => {
    const mockPaidAnalytics = {
      hasActiveSubscription: true,
      planId: 'PATIENCE',
      status: 'active',
      daysRemaining: 25,
      features: SUBSCRIPTION_PLANS.PATIENCE.features,
      currentPeriodEnd: new Date('2024-12-31'),
      canceledAt: null,
    }

    const mockSubscription = {
      id: 'sub_test_123',
      stripeCustomerId: 'cus_test_123',
      stripeSubscriptionId: 'sub_stripe_123',
      planId: 'PATIENCE',
      status: 'active',
      currentPeriodStart: new Date('2024-12-01'),
      currentPeriodEnd: new Date('2024-12-31'),
      canceledAt: null,
    }

    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue(mockPaidAnalytics)
      ;(getUserSubscription as jest.Mock).mockResolvedValue(mockSubscription)
    })

    it('returns correct paid plan data structure', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data).toMatchObject({
        hasActiveSubscription: true,
        planId: 'PATIENCE',
        status: 'active',
        daysRemaining: 25,
        features: SUBSCRIPTION_PLANS.PATIENCE.features,
        planDetails: {
          name: 'Patience',
          price: 29,
          currency: 'sgd',
          features: SUBSCRIPTION_PLANS.PATIENCE.features,
          description: 'Most popular choice for serious seekers',
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
        subscription: {
          id: 'sub_test_123',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_stripe_123',
          status: 'active',
        },
      })
    })

    it('includes correct usage stats for paid plans', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.usage.dailyMatches).toBe('unlimited')
      expect(data.usage.messagesLeft).toBe('unlimited')
    })

    it('shows correct billing information', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.billing.nextBilling).toEqual(new Date('2024-12-31'))
      expect(data.billing.autoRenewal).toBe(true)
      expect(data.billing.daysUntilRenewal).toBe(25)
    })
  })

  describe('Premium Plan (Reliance) Response', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: true,
        planId: 'RELIANCE',
        status: 'active',
        daysRemaining: 15,
        features: SUBSCRIPTION_PLANS.RELIANCE.features,
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test_premium',
        stripeCustomerId: 'cus_test_premium',
        stripeSubscriptionId: 'sub_stripe_premium',
        planId: 'RELIANCE',
        status: 'active',
        currentPeriodStart: new Date('2024-12-01'),
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: null,
      })
    })

    it('returns correct premium plan features and usage', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.planId).toBe('RELIANCE')
      expect(data.planDetails.name).toBe('Reliance')
      expect(data.planDetails.price).toBe(59)
      expect(data.usage.profileBoosts).toBe(4) // Premium gets profile boosts
    })
  })

  describe('Canceled Subscription Handling', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: false,
        planId: 'PATIENCE',
        status: 'canceled',
        daysRemaining: 10,
        features: SUBSCRIPTION_PLANS.PATIENCE.features,
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: new Date('2024-12-15'),
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test_canceled',
        stripeCustomerId: 'cus_test_canceled',
        stripeSubscriptionId: 'sub_stripe_canceled',
        planId: 'PATIENCE',
        status: 'canceled',
        currentPeriodStart: new Date('2024-12-01'),
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: new Date('2024-12-15'),
      })
    })

    it('shows correct billing information for canceled subscription', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.billing.autoRenewal).toBe(false) // Canceled subscription
      expect(data.billing.nextBilling).toEqual(new Date('2024-12-31'))
      expect(data.daysRemaining).toBe(10)
    })

    it('maintains plan features until period end', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.planId).toBe('PATIENCE')
      expect(data.features).toEqual(SUBSCRIPTION_PLANS.PATIENCE.features)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
    })

    it('returns default free plan on analytics error', async () => {
      ;(getSubscriptionAnalytics as jest.Mock).mockRejectedValue(new Error('Database error'))
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasActiveSubscription).toBe(false)
      expect(data.planId).toBe('INTENTION')
      expect(data.error).toBe('Could not fetch subscription details, showing free plan')
    })

    it('returns default free plan on subscription fetch error', async () => {
      ;(getSubscriptionAnalytics as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(getUserSubscription as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasActiveSubscription).toBe(false)
      expect(data.planId).toBe('INTENTION')
      expect(data.planDetails.name).toBe('Intention')
    })

    it('handles missing plan details gracefully', async () => {
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: true,
        planId: 'UNKNOWN_PLAN',
        status: 'active',
        daysRemaining: 25,
        features: [],
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.planDetails.name).toBe('Unknown')
      expect(data.planDetails.price).toBe(0)
      expect(data.planDetails.features).toEqual([])
    })
  })

  describe('Data Validation', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
    })

    it('validates plan ID consistency', async () => {
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: true,
        planId: 'PATIENCE',
        status: 'active',
        daysRemaining: 25,
        features: SUBSCRIPTION_PLANS.PATIENCE.features,
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test_123',
        planId: 'PATIENCE',
        status: 'active',
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.planId).toBe('PATIENCE')
      expect(data.subscription.planId).toBe('PATIENCE')
    })

    it('validates date formats in response', async () => {
      const currentPeriodEnd = new Date('2024-12-31T23:59:59.999Z')
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: true,
        planId: 'PATIENCE',
        status: 'active',
        daysRemaining: 25,
        features: SUBSCRIPTION_PLANS.PATIENCE.features,
        currentPeriodEnd,
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test_123',
        currentPeriodEnd,
        canceledAt: null,
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.billing.nextBilling).toEqual(currentPeriodEnd)
      expect(data.subscription.currentPeriodEnd).toEqual(currentPeriodEnd)
    })
  })

  describe('Islamic Compliance', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: false,
        planId: 'INTENTION',
        status: 'active',
        daysRemaining: 0,
        features: SUBSCRIPTION_PLANS.INTENTION.features,
        currentPeriodEnd: null,
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)
    })

    it('includes Islamic terminology in plan descriptions', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.planDetails.description).toContain('matrimonial')
    })

    it('validates plan names use Islamic concepts', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()

      // Plan names should reflect Islamic values (Intention, Patience, Reliance)
      expect(['Intention', 'Patience', 'Reliance']).toContain(data.planDetails.name)
    })
  })

  describe('Security', () => {
    it('does not expose sensitive Stripe data in response', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: true,
        planId: 'PATIENCE',
        status: 'active',
        daysRemaining: 25,
        features: SUBSCRIPTION_PLANS.PATIENCE.features,
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test_123',
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_stripe_123',
        stripePriceId: 'price_test_patience',
        status: 'active',
      })

      const response = await GET(mockRequest)
      const data = await response.json()
      const responseText = JSON.stringify(data)

      // Should not expose sensitive Stripe details
      expect(responseText).not.toContain('stripePriceId')
      expect(responseText).not.toContain('price_test_patience')
      
      // Should include necessary public IDs for functionality
      expect(data.subscription.stripeCustomerId).toBe('cus_test_123')
      expect(data.subscription.stripeSubscriptionId).toBe('sub_stripe_123')
    })

    it('validates user ownership of subscription data', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: true,
        planId: 'PATIENCE',
        status: 'active',
        daysRemaining: 25,
        features: SUBSCRIPTION_PLANS.PATIENCE.features,
        currentPeriodEnd: new Date('2024-12-31'),
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)

      await GET(mockRequest)

      // Verify that the service functions were called with the correct user ID
      expect(getSubscriptionAnalytics).toHaveBeenCalledWith(mockUserId)
      expect(getUserSubscription).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('Performance', () => {
    it('handles concurrent requests efficiently', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(getSubscriptionAnalytics as jest.Mock).mockResolvedValue({
        hasActiveSubscription: false,
        planId: 'INTENTION',
        status: 'active',
        daysRemaining: 0,
        features: SUBSCRIPTION_PLANS.INTENTION.features,
        currentPeriodEnd: null,
        canceledAt: null,
      })
      ;(getUserSubscription as jest.Mock).mockResolvedValue(null)

      // Simulate concurrent requests
      const requests = Array(5).fill(null).map(() => GET(mockRequest))
      const responses = await Promise.all(requests)

      // All should succeed
      responses.forEach(async (response) => {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.planId).toBe('INTENTION')
      })
    })
  })
})