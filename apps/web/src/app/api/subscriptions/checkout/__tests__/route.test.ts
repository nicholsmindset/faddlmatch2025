/**
 * 🧪 Subscription Checkout API Tests
 * Integration tests for subscription checkout endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { auth } from '@clerk/nextjs/server'
import { getStripeServer } from '@/lib/stripe'

// Mock dependencies
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/stripe')

describe('/api/subscriptions/checkout', () => {
  const mockUserId = 'test-user-id'
  const mockStripeCheckout = {
    sessions: {
      create: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getStripeServer as jest.Mock).mockReturnValue(mockStripeCheckout)
  })

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: null })

      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'PATIENCE' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Plan Validation', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
    })

    it('returns 400 for missing planId', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Plan ID is required')
    })

    it('returns 400 for invalid planId', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'INVALID_PLAN' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid plan ID')
    })

    it('returns 400 for free plan (INTENTION)', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'INTENTION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Free plan does not require checkout')
    })
  })

  describe('Successful Checkout Creation', () => {
    const mockCheckoutSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    }

    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      mockStripeCheckout.sessions.create.mockResolvedValue(mockCheckoutSession)
    })

    it('creates checkout session for PATIENCE plan', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'PATIENCE',
          returnUrl: 'https://faddlmatch.com/subscription/success',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe(mockCheckoutSession.url)
      expect(data.sessionId).toBe(mockCheckoutSession.id)

      expect(mockStripeCheckout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PATIENCE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: 'https://faddlmatch.com/subscription/success',
        cancel_url: expect.stringContaining('/pricing'),
        metadata: {
          userId: mockUserId,
          planId: 'PATIENCE',
        },
        subscription_data: {
          metadata: {
            userId: mockUserId,
            planId: 'PATIENCE',
          },
        },
        customer_email: undefined,
        allow_promotion_codes: true,
      })
    })

    it('creates checkout session for RELIANCE plan', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'RELIANCE',
          returnUrl: 'https://faddlmatch.com/subscription/success',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockStripeCheckout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: process.env.STRIPE_RELIANCE_PRICE_ID,
              quantity: 1,
            },
          ],
          metadata: {
            userId: mockUserId,
            planId: 'RELIANCE',
          },
        })
      )
    })

    it('uses custom return URL when provided', async () => {
      const customReturnUrl = 'https://faddlmatch.com/dashboard?welcome=true'
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'PATIENCE',
          returnUrl: customReturnUrl,
        }),
      })

      const response = await POST(request)

      expect(mockStripeCheckout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: customReturnUrl,
        })
      )
    })

    it('includes customer metadata when provided', async () => {
      const metadata = {
        source: 'onboarding',
        selectedAt: '2024-12-01T10:00:00Z',
      }

      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'PATIENCE',
          metadata,
        }),
      })

      const response = await POST(request)

      expect(mockStripeCheckout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: mockUserId,
            planId: 'PATIENCE',
            ...metadata,
          },
        })
      )
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
    })

    it('handles Stripe API errors', async () => {
      const stripeError = new Error('Your card was declined')
      mockStripeCheckout.sessions.create.mockRejectedValue(stripeError)

      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'PATIENCE' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
      expect(data.details).toBe('Your card was declined')
    })

    it('handles network timeouts', async () => {
      mockStripeCheckout.sessions.create.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
      )

      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'PATIENCE' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
    })

    it('handles invalid JSON body', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })
  })

  describe('Security Validation', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      mockStripeCheckout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      })
    })

    it('includes user ID in metadata for security', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'PATIENCE' }),
      })

      await POST(request)

      expect(mockStripeCheckout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      )
    })

    it('validates return URL is from same domain', async () => {
      const maliciousUrl = 'https://evil.com/steal-data'
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'PATIENCE',
          returnUrl: maliciousUrl,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid return URL')
    })

    it('sanitizes metadata to prevent injection', async () => {
      const maliciousMetadata = {
        '<script>alert("xss")</script>': 'value',
        normal: '<script>alert("xss")</script>',
      }

      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'PATIENCE',
          metadata: maliciousMetadata,
        }),
      })

      await POST(request)

      // Metadata should be sanitized or rejected
      const calledWith = mockStripeCheckout.sessions.create.mock.calls[0][0]
      const metadata = calledWith.metadata

      // Should not contain script tags
      Object.values(metadata).forEach((value) => {
        expect(String(value)).not.toContain('<script')
      })
    })
  })

  describe('Islamic Compliance', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      mockStripeCheckout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      })
    })

    it('only allows Islamic plan names', async () => {
      const islamicPlans = ['PATIENCE', 'RELIANCE']

      for (const planId of islamicPlans) {
        const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('includes Islamic plan metadata', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'PATIENCE' }),
      })

      await POST(request)

      expect(mockStripeCheckout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            planId: 'PATIENCE', // Islamic concept name
          }),
        })
      )
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
    })

    it('handles missing environment variables gracefully', async () => {
      // Temporarily clear env var
      const originalEnv = process.env.STRIPE_PATIENCE_PRICE_ID
      delete process.env.STRIPE_PATIENCE_PRICE_ID

      const request = new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'PATIENCE' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Plan configuration error')

      // Restore env var
      process.env.STRIPE_PATIENCE_PRICE_ID = originalEnv
    })

    it('handles concurrent checkout requests for same user', async () => {
      mockStripeCheckout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      })

      const requests = Array(3).fill(null).map(() =>
        new NextRequest('https://faddlmatch.com/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'PATIENCE' }),
        })
      )

      const responses = await Promise.all(requests.map(request => POST(request)))

      // All should succeed (no race conditions)
      responses.forEach(async (response) => {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.checkoutUrl).toBeTruthy()
      })
    })
  })
})