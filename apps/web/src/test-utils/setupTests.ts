/**
 * 🧪 Jest Setup File
 * Global test configuration and mocks for FADDL Match
 */

import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import 'whatwg-fetch'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@faddlmatch.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  }),
  auth: () => ({
    userId: 'test-user-id',
  }),
  SignInButton: ({ children }: any) => <button>{children}</button>,
  SignUpButton: ({ children }: any) => <button>{children}</button>,
  UserButton: () => <button>User</button>,
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => ({ userId: 'test-user-id' }),
}))

// Mock Framer Motion for better test performance
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}))

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  Toaster: () => null,
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => 
    Promise.resolve({
      redirectToCheckout: jest.fn(() => Promise.resolve({ error: null })),
      elements: jest.fn(() => ({
        create: jest.fn(() => ({
          mount: jest.fn(),
          destroy: jest.fn(),
          on: jest.fn(),
          update: jest.fn(),
        })),
      })),
    })
  ),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret'
process.env.STRIPE_PATIENCE_PRICE_ID = 'price_mock_patience'
process.env.STRIPE_RELIANCE_PRICE_ID = 'price_mock_reliance'

// Mock fetch globally
global.fetch = jest.fn()

// Mock window.location
delete (window as any).location
window.location = { 
  href: 'https://faddlmatch.com',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
} as any

// Mock window.open
window.open = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Increase timeout for async tests
jest.setTimeout(10000)

// Console error/warning suppression for known React warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: validateDOMNesting'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
  ;(fetch as jest.Mock).mockClear()
})