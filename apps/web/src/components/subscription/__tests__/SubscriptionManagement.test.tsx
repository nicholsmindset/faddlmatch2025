/**
 * 🧪 SubscriptionManagement Component Tests
 * Comprehensive testing for subscription management interface
 */

import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { render, createMockSubscription, createMockFreeSubscription } from '@/test-utils/testHelpers'
import { SubscriptionManagement } from '../SubscriptionManagement'
import { useSubscription } from '@/hooks/useSubscription'

// Mock the useSubscription hook
jest.mock('@/hooks/useSubscription')
jest.mock('sonner')

describe('SubscriptionManagement Component', () => {
  const mockRefetch = jest.fn()
  const mockOpenCustomerPortal = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('displays loading skeleton when data is loading', () => {
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: null,
        loading: true,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      // Check for loading skeleton
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('displays error message when subscription fetch fails', () => {
      const errorMessage = 'Failed to load subscription data'
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: null,
        loading: false,
        error: errorMessage,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Subscription Status Error')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('allows retry when error occurs', async () => {
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: null,
        loading: false,
        error: 'Network error',
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Free Plan Display', () => {
    it('displays free plan information correctly', () => {
      const mockFreeSubscription = createMockFreeSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockFreeSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Intention Plan')).toBeInTheDocument()
      expect(screen.getByText('Free Plan')).toBeInTheDocument()
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    it('shows upgrade button for free plan', () => {
      const mockFreeSubscription = createMockFreeSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockFreeSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByRole('button', { name: /upgrade plan/i })).toBeInTheDocument()
    })
  })

  describe('Paid Plan Display', () => {
    it('displays paid plan information correctly', () => {
      const mockPaidSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockPaidSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Patience Plan')).toBeInTheDocument()
      expect(screen.getByText('Active Subscription')).toBeInTheDocument()
      expect(screen.getByText('$29')).toBeInTheDocument()
      expect(screen.getByText('/month')).toBeInTheDocument()
    })

    it('shows billing information for active subscription', () => {
      const mockPaidSubscription = createMockSubscription({
        billing: {
          nextBilling: new Date('2024-12-31'),
          autoRenewal: true,
          daysUntilRenewal: 25,
        },
        daysRemaining: 25,
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockPaidSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Billing Information')).toBeInTheDocument()
      expect(screen.getByText('12/31/2024')).toBeInTheDocument()
      expect(screen.getByText('Enabled')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('displays usage statistics', () => {
      const mockPaidSubscription = createMockSubscription({
        usage: {
          dailyMatches: 'unlimited',
          messagesLeft: 'unlimited',
          profileBoosts: 2,
        },
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockPaidSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Usage This Month')).toBeInTheDocument()
      expect(screen.getByText('unlimited')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Plan Features', () => {
    it('displays current plan features', () => {
      const mockSubscription = createMockSubscription({
        planDetails: {
          name: 'Patience',
          price: 29,
          currency: 'sgd',
          features: ['Unlimited matches', 'Advanced filters', 'Priority support'],
          description: 'Most popular choice',
        },
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Current Features')).toBeInTheDocument()
      expect(screen.getByText('Unlimited matches')).toBeInTheDocument()
      expect(screen.getByText('Advanced filters')).toBeInTheDocument()
      expect(screen.getByText('Priority support')).toBeInTheDocument()
    })

    it('truncates features in compact mode', () => {
      const mockSubscription = createMockSubscription({
        planDetails: {
          name: 'Patience',
          price: 29,
          currency: 'sgd',
          features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6'],
          description: 'Test plan',
        },
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement compact={true} />)

      expect(screen.getByText('+2 more features')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('shows manage billing button for paid plans', () => {
      const mockPaidSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockPaidSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByRole('button', { name: /manage billing/i })).toBeInTheDocument()
    })

    it('opens customer portal when manage billing is clicked', async () => {
      const mockPaidSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockPaidSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const manageBillingButton = screen.getByRole('button', { name: /manage billing/i })
      await userEvent.click(manageBillingButton)

      expect(mockOpenCustomerPortal).toHaveBeenCalled()
    })

    it('shows upgrade button for non-premium plans', () => {
      const mockPatienceSubscription = createMockSubscription({
        planId: 'PATIENCE',
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockPatienceSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByRole('button', { name: /upgrade to premium/i })).toBeInTheDocument()
    })

    it('does not show upgrade button for reliance plan', () => {
      const mockRelianceSubscription = createMockSubscription({
        planId: 'RELIANCE',
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockRelianceSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.queryByRole('button', { name: /upgrade to premium/i })).not.toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('allows manual refresh of subscription data', async () => {
      const mockSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const refreshButton = screen.getByTitle('Refresh subscription status')
      await userEvent.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('shows success toast after successful refresh', async () => {
      const mockSubscription = createMockSubscription()
      mockRefetch.mockResolvedValueOnce(undefined)
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const refreshButton = screen.getByTitle('Refresh subscription status')
      await userEvent.click(refreshButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Subscription status updated')
      })
    })

    it('shows error toast when refresh fails', async () => {
      const mockSubscription = createMockSubscription()
      mockRefetch.mockRejectedValueOnce(new Error('Refresh failed'))
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const refreshButton = screen.getByTitle('Refresh subscription status')
      await userEvent.click(refreshButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to refresh subscription status')
      })
    })
  })

  describe('Upgrade Modal', () => {
    it('opens upgrade modal when upgrade button is clicked', async () => {
      const mockFreeSubscription = createMockFreeSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockFreeSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const upgradeButton = screen.getByRole('button', { name: /upgrade plan/i })
      await userEvent.click(upgradeButton)

      expect(screen.getByText('Upgrade Your Plan')).toBeInTheDocument()
      expect(screen.getByText(/Ready to unlock more features/i)).toBeInTheDocument()
    })

    it('closes upgrade modal when close button is clicked', async () => {
      const mockFreeSubscription = createMockFreeSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockFreeSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      // Open modal
      const upgradeButton = screen.getByRole('button', { name: /upgrade plan/i })
      await userEvent.click(upgradeButton)

      // Close modal
      const closeButton = screen.getByRole('button', { name: '' }) // X button
      await userEvent.click(closeButton)

      expect(screen.queryByText('Upgrade Your Plan')).not.toBeInTheDocument()
    })

    it('redirects to pricing page when view plans is clicked', async () => {
      const mockFreeSubscription = createMockFreeSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockFreeSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      render(<SubscriptionManagement />)

      // Open modal
      const upgradeButton = screen.getByRole('button', { name: /upgrade plan/i })
      await userEvent.click(upgradeButton)

      // Click view plans
      const viewPlansButton = screen.getByRole('button', { name: /view all plans/i })
      await userEvent.click(viewPlansButton)

      expect(window.location.href).toBe('/pricing')
    })
  })

  describe('Islamic Compliance', () => {
    it('displays halal guarantee message', () => {
      const mockSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Halal Guarantee')).toBeInTheDocument()
      expect(screen.getByText(/All our features are designed to be completely Shariah-compliant/i)).toBeInTheDocument()
      expect(screen.getByText(/May Allah bless your journey/i)).toBeInTheDocument()
    })
  })

  describe('Subscription Status Display', () => {
    it('shows active status with green indicator', () => {
      const mockActiveSubscription = createMockSubscription({
        hasActiveSubscription: true,
        status: 'active',
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockActiveSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const statusElement = screen.getByText('Active')
      expect(statusElement).toBeInTheDocument()
      expect(statusElement.closest('.bg-green-100')).toBeInTheDocument()
    })

    it('shows canceled subscription with appropriate messaging', () => {
      const mockCanceledSubscription = createMockSubscription({
        hasActiveSubscription: false,
        status: 'canceled',
        billing: {
          nextBilling: null,
          autoRenewal: false,
          daysUntilRenewal: 0,
        },
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockCanceledSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles customer portal errors gracefully', async () => {
      const mockSubscription = createMockSubscription()
      mockOpenCustomerPortal.mockRejectedValueOnce(new Error('Portal error'))
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      const manageBillingButton = screen.getByRole('button', { name: /manage billing/i })
      await userEvent.click(manageBillingButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to open billing portal')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and semantic structure', () => {
      const mockSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement />)

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)

      // Check for proper button accessibility
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const mockSubscription = createMockSubscription()
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement className="custom-class" />)

      expect(document.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('renders in compact mode', () => {
      const mockSubscription = createMockSubscription({
        planDetails: {
          name: 'Patience',
          price: 29,
          currency: 'sgd',
          features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
          description: 'Test plan',
        },
      })
      ;(useSubscription as jest.Mock).mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        refetch: mockRefetch,
        openCustomerPortal: mockOpenCustomerPortal,
      })

      render(<SubscriptionManagement compact={true} />)

      // In compact mode, should show truncated features
      expect(screen.getByText('+1 more features')).toBeInTheDocument()
    })
  })
})