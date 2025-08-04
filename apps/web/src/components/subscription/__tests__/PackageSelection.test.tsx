/**
 * 🧪 PackageSelection Component Tests
 * Comprehensive testing for subscription package selection
 */

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { render, mockFetch, mockFetchError, createMockUser, validateIslamicContent } from '@/test-utils/testHelpers'
import { PackageSelection } from '../PackageSelection'

// Mock modules
jest.mock('sonner')
jest.mock('next/navigation')
jest.mock('@clerk/nextjs')

describe('PackageSelection Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }

  const mockUser = createMockUser()
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
    })
    // Reset window.location.href
    delete (window as any).location
    window.location = { href: 'https://faddlmatch.com' } as any
  })

  describe('Component Rendering', () => {
    it('renders all subscription plans', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      // Check for plan names
      expect(screen.getByText('Intention')).toBeInTheDocument()
      expect(screen.getByText('Patience')).toBeInTheDocument()
      expect(screen.getByText('Reliance')).toBeInTheDocument()

      // Check for pricing
      expect(screen.getByText('Free')).toBeInTheDocument()
      expect(screen.getByText('$29')).toBeInTheDocument()
      expect(screen.getByText('$59')).toBeInTheDocument()
    })

    it('displays Islamic compliance messaging', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      // Check for Islamic content
      const islamicTexts = screen.getAllByText(/halal|islamic|shariah/i)
      expect(islamicTexts.length).toBeGreaterThan(0)

      // Validate specific Islamic compliance badge
      expect(screen.getByText(/100% Halal & Shariah Compliant/i)).toBeInTheDocument()
    })

    it('highlights the most popular plan', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      expect(screen.getByText('⭐ Most Popular Choice')).toBeInTheDocument()
    })

    it('shows Islamic wisdom quote', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      expect(screen.getByText(/among His signs is that He created for you mates/i)).toBeInTheDocument()
      expect(screen.getByText('- Quran 30:21')).toBeInTheDocument()
    })

    it('displays trust indicators', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      expect(screen.getByText('100% Halal Compliant')).toBeInTheDocument()
      expect(screen.getByText('10,000+ Success Stories')).toBeInTheDocument()
      expect(screen.getByText('50,000+ Active Members')).toBeInTheDocument()
    })
  })

  describe('Free Plan Selection', () => {
    it('handles free plan selection correctly', async () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      const freeButton = screen.getByRole('button', { name: /start free journey/i })
      await userEvent.click(freeButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Alhamdulillah! Welcome to FADDL Match!',
          expect.objectContaining({
            description: 'Starting your free Islamic matrimonial journey...',
          })
        )
      })

      // Should call onComplete and redirect after delay
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 2000 })
    })

    it('validates Islamic messaging in free plan selection', async () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      const freeButton = screen.getByRole('button', { name: /start free journey/i })
      await userEvent.click(freeButton)

      await waitFor(() => {
        const toastCall = (toast.success as jest.Mock).mock.calls[0]
        const [title, options] = toastCall
        expect(validateIslamicContent(title)).toBe(true)
        expect(validateIslamicContent(options.description)).toBe(true)
      })
    })
  })

  describe('Paid Plan Selection', () => {
    it('creates checkout session for paid plans', async () => {
      const mockCheckoutResponse = {
        checkoutUrl: 'https://checkout.stripe.com/test-session'
      }
      mockFetch(mockCheckoutResponse)

      render(<PackageSelection onComplete={mockOnComplete} />)

      const patienceButton = screen.getByRole('button', { name: /choose patience/i })
      await userEvent.click(patienceButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/subscriptions/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'PATIENCE',
            returnUrl: 'https://faddlmatch.com/subscription/success',
            metadata: {
              userId: mockUser.id,
              selectedAt: expect.any(String),
            },
          }),
        })
      })

      // Should redirect to Stripe checkout
      await waitFor(() => {
        expect(window.location.href).toBe(mockCheckoutResponse.checkoutUrl)
      }, { timeout: 1500 })
    })

    it('shows loading state during checkout creation', async () => {
      // Delay the fetch response
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ checkoutUrl: 'https://checkout.stripe.com/test' })
          }), 500)
        )
      )

      render(<PackageSelection onComplete={mockOnComplete} />)

      const patienceButton = screen.getByRole('button', { name: /choose patience/i })
      await userEvent.click(patienceButton)

      // Check loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('displays success message with Islamic blessing', async () => {
      mockFetch({ checkoutUrl: 'https://checkout.stripe.com/test' })

      render(<PackageSelection onComplete={mockOnComplete} />)

      const relianceButton = screen.getByRole('button', { name: /choose reliance/i })
      await userEvent.click(relianceButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Redirecting to secure payment',
          expect.objectContaining({
            description: 'May Allah facilitate your journey to finding your perfect match'
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('handles unauthenticated users', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      })

      render(<PackageSelection onComplete={mockOnComplete} />)

      const patienceButton = screen.getByRole('button', { name: /choose patience/i })
      await userEvent.click(patienceButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Please sign in to continue your halal matrimonial journey',
          expect.objectContaining({
            description: 'Your profile will be saved and ready when you return',
            action: expect.objectContaining({
              label: 'Sign In',
            }),
          })
        )
      })
    })

    it('handles checkout API errors', async () => {
      const errorMessage = 'Payment processing temporarily unavailable'
      mockFetch({ error: errorMessage }, false, 500)

      render(<PackageSelection onComplete={mockOnComplete} />)

      const patienceButton = screen.getByRole('button', { name: /choose patience/i })
      await userEvent.click(patienceButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Checkout Failed',
          expect.objectContaining({
            description: expect.stringContaining(errorMessage),
            action: expect.objectContaining({
              label: 'Contact Support',
            }),
          })
        )
      })
    })

    it('handles network errors gracefully', async () => {
      mockFetchError('Network error')

      render(<PackageSelection onComplete={mockOnComplete} />)

      const patienceButton = screen.getByRole('button', { name: /choose patience/i })
      await userEvent.click(patienceButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Checkout Failed',
          expect.objectContaining({
            description: expect.stringContaining('Network error'),
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      // Check for proper button roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      // Check for headings hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      const firstButton = screen.getByRole('button', { name: /start free journey/i })
      
      // Focus and trigger with keyboard
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      fireEvent.keyDown(firstButton, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Plan Features Display', () => {
    it('shows correct features for each plan', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      // Intention plan features
      expect(screen.getByText(/5 daily matches/i)).toBeInTheDocument()
      expect(screen.getByText(/basic messaging/i)).toBeInTheDocument()

      // Patience plan features
      expect(screen.getByText(/unlimited matches/i)).toBeInTheDocument()
      expect(screen.getByText(/see who likes you/i)).toBeInTheDocument()

      // Reliance plan features
      expect(screen.getByText(/video calls/i)).toBeInTheDocument()
      expect(screen.getByText(/family scheduler/i)).toBeInTheDocument()
    })

    it('displays money-back guarantee for paid plans', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      const guaranteeTexts = screen.getAllByText(/30-day money-back guarantee/i)
      expect(guaranteeTexts.length).toBe(2) // For Patience and Reliance plans
    })
  })

  describe('Islamic Compliance Validation', () => {
    it('validates all displayed text contains appropriate Islamic references', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      // Get all text content
      const pageText = document.body.textContent || ''
      
      // Should contain Islamic terms
      expect(validateIslamicContent(pageText)).toBe(true)
      
      // Should contain specific Islamic references
      expect(pageText).toMatch(/halal/i)
      expect(pageText).toMatch(/shariah/i)
      expect(pageText).toMatch(/islamic/i)
      expect(pageText).toMatch(/matrimonial/i)
    })

    it('displays Quran verse correctly', () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      expect(screen.getByText(/And among His signs is that He created for you mates/i)).toBeInTheDocument()
      expect(screen.getByText('- Quran 30:21')).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('applies custom className', () => {
      render(<PackageSelection onComplete={mockOnComplete} className="custom-class" />)
      
      // Check if custom class is applied to plan cards
      const cards = document.querySelectorAll('.custom-class')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('calls onComplete callback for free plan', async () => {
      render(<PackageSelection onComplete={mockOnComplete} />)

      const freeButton = screen.getByRole('button', { name: /start free journey/i })
      await userEvent.click(freeButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      }, { timeout: 2000 })
    })
  })

  describe('Loading States', () => {
    it('handles user loading state', () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false,
      })

      render(<PackageSelection onComplete={mockOnComplete} />)

      // Component should still render even when user is loading
      expect(screen.getByText('Choose Your')).toBeInTheDocument()
    })

    it('prevents multiple simultaneous checkout requests', async () => {
      mockFetch({ checkoutUrl: 'https://checkout.stripe.com/test' })

      render(<PackageSelection onComplete={mockOnComplete} />)

      const patienceButton = screen.getByRole('button', { name: /choose patience/i })
      
      // Click multiple times rapidly
      await userEvent.click(patienceButton)
      await userEvent.click(patienceButton)
      await userEvent.click(patienceButton)

      // Should only make one fetch request
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })
    })
  })
})