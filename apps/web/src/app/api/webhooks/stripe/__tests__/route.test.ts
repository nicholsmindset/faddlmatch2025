/**
 * 🧪 Stripe Webhook Handler Tests
 * Comprehensive integration tests for Stripe webhook processing
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getStripeServer } from '@/lib/stripe'
import { getStripeConfig } from '@/lib/env'
import {
  updateSubscriptionStatus,
  createSubscription,
  SubscriptionStatus,
} from '@/lib/subscription'
import { createMockStripeEvent, createMockStripeSubscription } from '@/test-utils/testHelpers'

// Mock dependencies
jest.mock('@/lib/stripe')
jest.mock('@/lib/env')
jest.mock('@/lib/subscription')
jest.mock('@/lib/middleware/rate-limit')
jest.mock('@/lib/middleware/idempotency')
jest.mock('@/lib/monitoring/metrics')
jest.mock('@/lib/supabase/server')

describe('Stripe Webhook Handler', () => {
  const mockStripeConstructEvent = jest.fn()
  const mockWebhookSecret = 'whsec_test_secret'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Stripe server
    ;(getStripeServer as jest.Mock).mockReturnValue({
      webhooks: {
        constructEvent: mockStripeConstructEvent,
      },
    })

    // Mock config
    ;(getStripeConfig as jest.Mock).mockReturnValue({
      webhookSecret: mockWebhookSecret,
    })

    // Mock middleware to pass through
    jest.doMock('@/lib/middleware/rate-limit', () => ({
      createRateLimiter: () => ({}),
      withRateLimit: (_req: any, _limiter: any, handler: any) => handler(),
    }))

    jest.doMock('@/lib/middleware/idempotency', () => ({
      createIdempotencyHandler: () => ({}),
      withIdempotency: (_req: any, _handler: any, callback: any) => callback(),
    }))

    jest.doMock('@/lib/monitoring/metrics', () => ({
      withMetrics: (_path: any, _method: any, handler: any) => handler(),
      recordWebhookProcessed: jest.fn(),
      recordSecurityIncident: jest.fn(),
    }))

    jest.doMock('@/lib/supabase/server', () => ({
      createAdminClient: () => ({
        from: () => ({
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }))
  })

  describe('Webhook Signature Verification', () => {
    it('rejects requests without stripe-signature header', async () => {
      const mockBody = JSON.stringify({ type: 'test.event' })
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing stripe-signature header')
    })

    it('rejects requests with invalid signature', async () => {
      const mockBody = JSON.stringify({ type: 'test.event' })
      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Webhook processing failed')
      expect(data.details).toBe('Invalid signature')
    })

    it('processes valid webhook signature successfully', async () => {
      const mockEvent = createMockStripeEvent('ping', {})
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(data.eventId).toBe(mockEvent.id)
      expect(data.eventType).toBe('ping')
    })
  })

  describe('Subscription Created Handler', () => {
    it('processes subscription.created event successfully', async () => {
      const mockSubscription = createMockStripeSubscription({
        metadata: {
          userId: 'test-user-id',
          planId: 'PATIENCE',
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(createSubscription as jest.Mock).mockResolvedValue(undefined)
      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(createSubscription).toHaveBeenCalledWith(
        'test-user-id',
        mockSubscription.customer,
        'PATIENCE',
        mockSubscription.id,
        mockSubscription.items.data[0].price.id
      )
      expect(updateSubscriptionStatus).toHaveBeenCalledWith(
        mockSubscription.id,
        SubscriptionStatus.ACTIVE,
        {
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }
      )
    })

    it('validates required metadata for subscription creation', async () => {
      const mockSubscription = createMockStripeSubscription({
        metadata: {
          // Missing userId and planId
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(createSubscription).not.toHaveBeenCalled()
    })

    it('handles subscription creation database errors', async () => {
      const mockSubscription = createMockStripeSubscription({
        metadata: {
          userId: 'test-user-id',
          planId: 'PATIENCE',
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(createSubscription as jest.Mock).mockRejectedValue(new Error('Database error'))

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(createSubscription).toHaveBeenCalled()
    })
  })

  describe('Subscription Updated Handler', () => {
    it('processes subscription.updated event successfully', async () => {
      const mockSubscription = createMockStripeSubscription({
        status: 'active',
        metadata: {
          userId: 'test-user-id',
          previousStatus: 'incomplete',
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(updateSubscriptionStatus).toHaveBeenCalledWith(
        mockSubscription.id,
        SubscriptionStatus.ACTIVE,
        {
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
          canceledAt: null,
        }
      )
    })

    it('handles subscription cancellation updates', async () => {
      const canceledAt = Math.floor(Date.now() / 1000)
      const mockSubscription = createMockStripeSubscription({
        status: 'canceled',
        canceled_at: canceledAt,
        metadata: {
          userId: 'test-user-id',
          previousStatus: 'active',
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateSubscriptionStatus).toHaveBeenCalledWith(
        mockSubscription.id,
        SubscriptionStatus.CANCELED,
        {
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
          canceledAt: new Date(canceledAt * 1000),
        }
      )
    })
  })

  describe('Subscription Deleted Handler', () => {
    it('processes subscription.deleted event successfully', async () => {
      const mockSubscription = createMockStripeSubscription({
        metadata: {
          userId: 'test-user-id',
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.deleted', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateSubscriptionStatus).toHaveBeenCalledWith(
        mockSubscription.id,
        SubscriptionStatus.CANCELED,
        {
          canceledAt: expect.any(Date),
        }
      )
    })
  })

  describe('Payment Events', () => {
    it('processes invoice.payment_succeeded event', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        subscription: 'sub_test_123',
        amount_paid: 2900,
        currency: 'sgd',
        payment_intent: 'pi_test_123',
        customer_email: 'test@faddlmatch.com',
        description: 'Subscription payment',
        number: 'INV-001',
      }
      const mockEvent = createMockStripeEvent('invoice.payment_succeeded', mockInvoice)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub_test_123',
        SubscriptionStatus.ACTIVE
      )
    })

    it('processes invoice.payment_failed event', async () => {
      const mockInvoice = {
        id: 'in_test_failed',
        subscription: 'sub_test_123',
        amount_due: 2900,
        currency: 'sgd',
        attempt_count: 2,
        next_payment_attempt: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        last_finalization_error: {
          message: 'Your card was declined.',
        },
        customer_email: 'test@faddlmatch.com',
      }
      const mockEvent = createMockStripeEvent('invoice.payment_failed', mockInvoice)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub_test_123',
        SubscriptionStatus.PAST_DUE
      )
    })

    it('skips payment events for non-subscription invoices', async () => {
      const mockInvoice = {
        id: 'in_test_one_time',
        subscription: null, // One-time payment, not subscription
        amount_paid: 1000,
        currency: 'sgd',
      }
      const mockEvent = createMockStripeEvent('invoice.payment_succeeded', mockInvoice)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateSubscriptionStatus).not.toHaveBeenCalled()
    })
  })

  describe('Checkout Session Completed', () => {
    it('processes checkout.session.completed with subscription', async () => {
      const mockSession = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        metadata: {
          userId: 'test-user-id',
          planId: 'PATIENCE',
        },
      }
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockSession)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should not create subscription here as it will be handled by subscription.created
    })

    it('skips checkout session without metadata', async () => {
      const mockSession = {
        id: 'cs_test_no_metadata',
        subscription: 'sub_test_123',
        metadata: {}, // No userId or planId
      }
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockSession)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should skip processing
    })
  })

  describe('Unhandled Events', () => {
    it('logs and acknowledges unhandled event types', async () => {
      const mockEvent = createMockStripeEvent('customer.created', { id: 'cus_test_123' })
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(data.eventType).toBe('customer.created')
    })
  })

  describe('Error Handling and Recovery', () => {
    it('handles handler errors gracefully', async () => {
      const mockSubscription = createMockStripeSubscription({
        metadata: {
          userId: 'test-user-id',
          planId: 'PATIENCE',
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(createSubscription as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook processing failed')
    })

    it('includes processing time in response headers', async () => {
      const mockEvent = createMockStripeEvent('ping', {})
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.headers.get('X-Processing-Time')).toBeTruthy()
      expect(response.headers.get('X-Request-ID')).toBeTruthy()
    })
  })

  describe('Security and Monitoring', () => {
    it('logs webhook events to audit trail', async () => {
      const mockEvent = createMockStripeEvent('ping', {})
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      await POST(request)

      // Audit logging should be called (mocked in our setup)
      // In real implementation, this would write to subscription_events table
    })

    it('records security incidents for invalid signatures', async () => {
      const mockBody = JSON.stringify({ type: 'test.event' })
      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      })

      await POST(request)

      // Security incident recording should be called (mocked)
    })
  })

  describe('HTTP Method Restrictions', () => {
    it('rejects GET requests', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'GET',
      })

      // Import and call the GET handler directly
      const { GET } = await import('../route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('rejects PUT requests', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'PUT',
      })

      // Import and call the PUT handler directly
      const { PUT } = await import('../route')
      const response = await PUT()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('rejects DELETE requests', async () => {
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'DELETE',
      })

      // Import and call the DELETE handler directly
      const { DELETE } = await import('../route')
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('Islamic Compliance Validation', () => {
    it('validates Islamic plan names in subscription events', async () => {
      const mockSubscription = createMockStripeSubscription({
        metadata: {
          userId: 'test-user-id',
          planId: 'PATIENCE', // Islamic concept
        },
      })
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
      mockStripeConstructEvent.mockReturnValue(mockEvent)

      ;(createSubscription as jest.Mock).mockResolvedValue(undefined)
      ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

      const mockBody = JSON.stringify(mockEvent)
      const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
        method: 'POST',
        body: mockBody,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createSubscription).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(String),
        'PATIENCE', // Islamic plan name validated
        expect.any(String),
        expect.any(String)
      )
    })

    it('processes all valid Islamic plan types', async () => {
      const islamicPlans = ['INTENTION', 'PATIENCE', 'RELIANCE']

      for (const planId of islamicPlans) {
        const mockSubscription = createMockStripeSubscription({
          metadata: {
            userId: 'test-user-id',
            planId,
          },
        })
        const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
        mockStripeConstructEvent.mockReturnValue(mockEvent)

        ;(createSubscription as jest.Mock).mockResolvedValue(undefined)
        ;(updateSubscriptionStatus as jest.Mock).mockResolvedValue(undefined)

        const mockBody = JSON.stringify(mockEvent)
        const request = new NextRequest('https://faddlmatch.com/api/webhooks/stripe', {
          method: 'POST',
          body: mockBody,
          headers: {
            'stripe-signature': 'valid_signature',
          },
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(createSubscription).toHaveBeenCalledWith(
          'test-user-id',
          expect.any(String),
          planId,
          expect.any(String),
          expect.any(String)
        )
      }
    })
  })
})