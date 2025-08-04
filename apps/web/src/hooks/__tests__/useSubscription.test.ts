/**
 * 🧪 useSubscription Hook Tests
 * Comprehensive testing for subscription state management
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { useSubscription, useSubscriptionStatus, useFeatureAccess } from '../useSubscription'
import { mockFetch, mockFetchError, createMockUser, createMockSubscription, AllTheProviders } from '@/test-utils/testHelpers'
import { SubscriptionStatus } from '@/lib/stripe'

// Mock dependencies
jest.mock('@clerk/nextjs')
jest.mock('sonner')

describe('useSubscription Hook', () => {
  const mockUser = createMockUser()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    })
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Initial State', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.subscription).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('does not fetch when user is not loaded', () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: false,
      })

      renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      expect(fetch).not.toHaveBeenCalled()
    })

    it('does not fetch when user is not authenticated', () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: true,
      })

      renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('Subscription Fetching', () => {
    it('fetches subscription data successfully', async () => {
      const mockSubscriptionData = createMockSubscription()
      mockFetch(mockSubscriptionData)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.subscription).toEqual(mockSubscriptionData)
        expect(result.current.error).toBe(null)
      })

      expect(fetch).toHaveBeenCalledWith('/api/subscriptions/status')
    })

    it('handles fetch errors gracefully', async () => {
      const errorMessage = 'Failed to fetch subscription'
      mockFetch({ error: errorMessage }, false, 500)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.subscription).toBe(null)
        expect(result.current.error).toBe(errorMessage)
      })
    })

    it('parses date fields correctly', async () => {
      const mockData = createMockSubscription({
        currentPeriodEnd: '2024-12-31T23:59:59.000Z',
        canceledAt: '2024-11-15T10:30:00.000Z',
      })
      mockFetch(mockData)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.subscription?.currentPeriodEnd).toBeInstanceOf(Date)
        expect(result.current.subscription?.canceledAt).toBeInstanceOf(Date)
      })
    })

    it('handles null date fields', async () => {
      const mockData = createMockSubscription({
        currentPeriodEnd: null,
        canceledAt: null,
      })
      mockFetch(mockData)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.subscription?.currentPeriodEnd).toBe(null)
        expect(result.current.subscription?.canceledAt).toBe(null)
      })
    })
  })

  describe('Refetch Functionality', () => {
    it('refetches data successfully', async () => {
      const initialData = createMockSubscription({ planId: 'INTENTION' })
      const updatedData = createMockSubscription({ planId: 'PATIENCE' })
      
      mockFetch(initialData)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.subscription?.planId).toBe('INTENTION')
      })

      // Mock updated response
      mockFetch(updatedData)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.subscription?.planId).toBe('PATIENCE')
    })

    it('handles refetch errors', async () => {
      mockFetch(createMockSubscription())

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock error on refetch
      mockFetch({ error: 'Refetch failed' }, false, 500)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBe('Refetch failed')
    })
  })

  describe('Checkout Session Creation', () => {
    it('creates checkout session successfully', async () => {
      mockFetch(createMockSubscription())

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const checkoutResponse = { checkoutUrl: 'https://checkout.stripe.com/test' }
      mockFetch(checkoutResponse)

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      await act(async () => {
        await result.current.createCheckoutSession('PATIENCE')
      })

      expect(fetch).toHaveBeenCalledWith('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: 'PATIENCE',
        }),
      })

      expect(window.location.href).toBe(checkoutResponse.checkoutUrl)
    })

    it('handles unauthenticated user for checkout', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: true,
      })

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await act(async () => {
        await result.current.createCheckoutSession('PATIENCE')
      })

      expect(toast.error).toHaveBeenCalledWith('Please sign in to continue')
      expect(fetch).not.toHaveBeenCalledWith('/api/subscriptions/checkout', expect.any(Object))
    })

    it('handles free plan selection', async () => {
      mockFetch(createMockSubscription())

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createCheckoutSession('INTENTION')
      })

      expect(toast.info).toHaveBeenCalledWith('You are already on the free plan')
      expect(fetch).not.toHaveBeenCalledWith('/api/subscriptions/checkout', expect.any(Object))
    })

    it('handles checkout session creation errors', async () => {
      mockFetch(createMockSubscription())

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const errorMessage = 'Checkout failed'
      mockFetch({ error: errorMessage }, false, 400)

      await act(async () => {
        await result.current.createCheckoutSession('PATIENCE')
      })

      expect(result.current.error).toBe(errorMessage)
      expect(toast.error).toHaveBeenCalledWith(errorMessage)
    })
  })

  describe('Customer Portal', () => {
    it('opens customer portal successfully', async () => {
      const mockSubscriptionWithCustomer = createMockSubscription({
        subscription: {
          id: 'sub_test_123',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_stripe_123',
          status: 'active',
        },
      })
      mockFetch(mockSubscriptionWithCustomer)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const portalResponse = { portalUrl: 'https://billing.stripe.com/portal' }
      mockFetch(portalResponse)

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: 'https://faddlmatch.com/dashboard' } as any

      await act(async () => {
        await result.current.openCustomerPortal()
      })

      expect(fetch).toHaveBeenCalledWith('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: 'https://faddlmatch.com/dashboard',
        }),
      })

      expect(window.location.href).toBe(portalResponse.portalUrl)
    })

    it('handles missing customer ID', async () => {
      const mockSubscriptionWithoutCustomer = createMockSubscription({
        subscription: null,
      })
      mockFetch(mockSubscriptionWithoutCustomer)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.openCustomerPortal()
      })

      expect(toast.error).toHaveBeenCalledWith('No subscription found')
      expect(fetch).not.toHaveBeenCalledWith('/api/subscriptions/portal', expect.any(Object))
    })

    it('handles customer portal errors', async () => {
      const mockSubscriptionWithCustomer = createMockSubscription({
        subscription: {
          id: 'sub_test_123',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_stripe_123',
          status: 'active',
        },
      })
      mockFetch(mockSubscriptionWithCustomer)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const errorMessage = 'Portal access failed'
      mockFetch({ error: errorMessage }, false, 500)

      await act(async () => {
        await result.current.openCustomerPortal()
      })

      expect(result.current.error).toBe(errorMessage)
      expect(toast.error).toHaveBeenCalledWith(errorMessage)
    })
  })

  describe('Feature Access', () => {
    it('checks feature access for free plan', async () => {
      const mockFreeSubscription = createMockSubscription({
        hasActiveSubscription: false,
        planId: 'INTENTION',
      })
      mockFetch(mockFreeSubscription)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasAccess('basic_matches')).toBe(false) // No active subscription
      expect(result.current.hasAccess('unlimited_matches')).toBe(false)
    })

    it('checks feature access for paid plan', async () => {
      const mockPaidSubscription = createMockSubscription({
        hasActiveSubscription: true,
        planId: 'PATIENCE',
      })
      mockFetch(mockPaidSubscription)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasAccess('basic_matches')).toBe(true)
      expect(result.current.hasAccess('unlimited_matches')).toBe(true)
      expect(result.current.hasAccess('video_calls')).toBe(false) // Reliance only
    })

    it('checks feature availability for canceled subscription within period', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)

      const mockCanceledSubscription = createMockSubscription({
        hasActiveSubscription: false,
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: futureDate,
        planId: 'PATIENCE',
      })
      mockFetch(mockCanceledSubscription)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should still have access until period end
      expect(result.current.isFeatureEnabled('unlimited_matches')).toBe(true)
    })

    it('checks feature availability for expired canceled subscription', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)

      const mockExpiredSubscription = createMockSubscription({
        hasActiveSubscription: false,
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: pastDate,
        planId: 'PATIENCE',
      })
      mockFetch(mockExpiredSubscription)

      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should only have free plan features
      expect(result.current.isFeatureEnabled('basic_matches')).toBe(true)
      expect(result.current.isFeatureEnabled('unlimited_matches')).toBe(false)
    })

    it('defaults to free plan features when no subscription', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: AllTheProviders,
      })

      expect(result.current.hasAccess('basic_matches')).toBe(true)
      expect(result.current.hasAccess('unlimited_matches')).toBe(false)
    })
  })
})

describe('useSubscriptionStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue({
      user: createMockUser(),
      isLoaded: true,
    })
  })

  it('returns default values when loading', () => {
    jest.doMock('../useSubscription', () => ({
      useSubscription: () => ({
        subscription: null,
        loading: true,
      }),
    }))

    const { result } = renderHook(() => useSubscriptionStatus(), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasActiveSubscription).toBe(false)
    expect(result.current.planId).toBe('INTENTION')
    expect(result.current.isFreePlan).toBe(true)
  })

  it('returns correct status for active subscription', async () => {
    const mockActiveSubscription = createMockSubscription({
      hasActiveSubscription: true,
      planId: 'PATIENCE',
      status: SubscriptionStatus.ACTIVE,
      daysRemaining: 25,
    })
    mockFetch(mockActiveSubscription)

    const { result } = renderHook(() => useSubscriptionStatus(), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasActiveSubscription).toBe(true)
      expect(result.current.planId).toBe('PATIENCE')
      expect(result.current.isPaidPlan).toBe(true)
      expect(result.current.isFreePlan).toBe(false)
      expect(result.current.daysRemaining).toBe(25)
    })
  })

  it('returns correct status for canceled subscription', async () => {
    const mockCanceledSubscription = createMockSubscription({
      hasActiveSubscription: false,
      planId: 'PATIENCE',
      status: SubscriptionStatus.CANCELED,
      daysRemaining: 0,
    })
    mockFetch(mockCanceledSubscription)

    const { result } = renderHook(() => useSubscriptionStatus(), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isCanceled).toBe(true)
      expect(result.current.hasActiveSubscription).toBe(false)
    })
  })
})

describe('useFeatureAccess Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue({
      user: createMockUser(),
      isLoaded: true,
    })
  })

  it('returns correct access status for feature', async () => {
    const mockPaidSubscription = createMockSubscription({
      hasActiveSubscription: true,
      planId: 'PATIENCE',
    })
    mockFetch(mockPaidSubscription)

    const { result } = renderHook(() => useFeatureAccess('unlimited_matches'), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.hasAccess).toBe(true)
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.requiresUpgrade).toBe(false)
      expect(result.current.currentPlan).toBe('PATIENCE')
    })
  })

  it('indicates upgrade required for free plan user', async () => {
    const mockFreeSubscription = createMockSubscription({
      hasActiveSubscription: false,
      planId: 'INTENTION',
    })
    mockFetch(mockFreeSubscription)

    const { result } = renderHook(() => useFeatureAccess('unlimited_matches'), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.hasAccess).toBe(false)
      expect(result.current.requiresUpgrade).toBe(true)
      expect(result.current.currentPlan).toBe('INTENTION')
    })
  })

  it('handles loading state', () => {
    jest.doMock('../useSubscription', () => ({
      useSubscription: () => ({
        subscription: null,
        loading: true,
        hasAccess: () => false,
        isFeatureEnabled: () => false,
      }),
    }))

    const { result } = renderHook(() => useFeatureAccess('unlimited_matches'), {
      wrapper: AllTheProviders,
    })

    expect(result.current.loading).toBe(true)
  })
})