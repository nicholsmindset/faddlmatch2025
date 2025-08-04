# 🧪 FADDL Match Subscription System Testing Guide

## Overview

This document provides comprehensive testing coverage for the FADDL Match subscription system, ensuring production readiness and Islamic compliance.

## Test Architecture

### Test Structure
```
src/
├── components/subscription/__tests__/          # Component unit tests
├── hooks/__tests__/                           # Custom hook tests  
├── app/api/subscriptions/**/__tests__/        # API integration tests
├── app/api/webhooks/stripe/__tests__/         # Webhook tests
├── __tests__/e2e/                            # End-to-end tests
└── test-utils/                               # Testing utilities
```

### Coverage Requirements
- **Overall**: ≥90% statement, function, and line coverage
- **Subscription Components**: ≥95% coverage
- **API Endpoints**: ≥90% coverage
- **Critical Hooks**: ≥95% coverage

## Test Categories

### 1. Unit Tests

#### Component Tests (`src/components/subscription/__tests__/`)

**PackageSelection.test.tsx**
- ✅ Component rendering with all plans
- ✅ Islamic messaging validation
- ✅ Free plan selection flow
- ✅ Paid plan checkout creation
- ✅ Error handling (auth, network, payment)
- ✅ Accessibility compliance
- ✅ Loading states and animations
- ✅ Islamic compliance validation

**SubscriptionManagement.test.tsx**
- ✅ Loading and error states
- ✅ Free vs paid plan display
- ✅ Billing information rendering
- ✅ Feature lists and usage stats
- ✅ Action buttons (upgrade, billing)
- ✅ Refresh functionality
- ✅ Upgrade modal interactions
- ✅ Islamic messaging consistency

#### Hook Tests (`src/hooks/__tests__/`)

**useSubscription.test.ts**
- ✅ Initial loading state
- ✅ Subscription data fetching
- ✅ Date parsing and validation
- ✅ Checkout session creation
- ✅ Customer portal access
- ✅ Feature access control
- ✅ Error handling and recovery
- ✅ useSubscriptionStatus wrapper
- ✅ useFeatureAccess wrapper

### 2. Integration Tests

#### API Endpoint Tests

**Subscription Status API** (`src/app/api/subscriptions/status/__tests__/`)
- ✅ Authentication validation
- ✅ Free plan data structure
- ✅ Paid plan data structure
- ✅ Canceled subscription handling
- ✅ Error handling with fallbacks
- ✅ Islamic plan name validation
- ✅ Security (no sensitive data exposure)
- ✅ Performance under concurrent requests

**Checkout API** (`src/app/api/subscriptions/checkout/__tests__/`)
- ✅ Authentication validation
- ✅ Plan validation (including Islamic names)
- ✅ Stripe checkout session creation
- ✅ Metadata handling and security
- ✅ Error handling (Stripe API, network)
- ✅ Security validation (URL validation, XSS prevention)
- ✅ Edge cases (missing env vars, concurrent requests)

**Webhook Handler** (`src/app/api/webhooks/stripe/__tests__/`)
- ✅ Signature verification
- ✅ Subscription created/updated/deleted events
- ✅ Payment succeeded/failed events
- ✅ Checkout session completed events
- ✅ Error handling and recovery
- ✅ Security and monitoring
- ✅ Audit trail logging
- ✅ Islamic plan validation in webhooks

### 3. End-to-End Tests

**Subscription Flow E2E** (`src/__tests__/e2e/subscription-flow.spec.ts`)
- ✅ Complete onboarding → subscription flow
- ✅ Free plan selection journey
- ✅ Paid plan checkout process
- ✅ Subscription management interface
- ✅ Error handling scenarios
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Mobile responsiveness
- ✅ Performance benchmarks
- ✅ Islamic compliance throughout journey
- ✅ Data privacy and security validation

## Testing Tools and Setup

### Framework Configuration

**Jest Configuration** (`jest.config.js`)
- Custom test environment setup
- Module path mapping
- Coverage collection rules
- Islamic compliance test suites
- Performance benchmarks

**Test Utilities** (`src/test-utils/`)
- Mock factories for subscriptions, users, Stripe events
- Helper functions for Islamic content validation
- Provider wrappers for React hooks
- API response mocking utilities

### Mock Strategy

**External Services**
- Clerk authentication (user context)
- Stripe API (checkout, webhooks)
- Supabase (database operations)
- Next.js routing

**Animation Libraries**
- Framer Motion (simplified for tests)
- Toast notifications

## Islamic Compliance Testing

### Validation Criteria
- ✅ Plan names reflect Islamic concepts (Intention, Patience, Reliance)
- ✅ Halal/Shariah compliance messaging throughout
- ✅ Islamic terminology in user communications
- ✅ Quran verse display and attribution
- ✅ Islamic blessings in success messages
- ✅ Cultural sensitivity in error messages

### Test Cases
```typescript
// Example Islamic compliance test
test('displays appropriate Islamic content', () => {
  render(<PackageSelection />)
  
  expect(screen.getByText(/halal/i)).toBeInTheDocument()
  expect(screen.getByText(/shariah/i)).toBeInTheDocument()
  expect(screen.getByText(/Quran 30:21/)).toBeInTheDocument()
  
  const pageText = document.body.textContent
  expect(validateIslamicContent(pageText)).toBe(true)
})
```

## Security Testing

### Test Coverage
- ✅ Authentication bypass attempts
- ✅ Sensitive data exposure prevention
- ✅ XSS and injection attack prevention
- ✅ Webhook signature validation
- ✅ HTTPS enforcement validation
- ✅ User data isolation
- ✅ API rate limiting

### Security Validation Functions
```typescript
// Example security test
test('does not expose sensitive Stripe data', () => {
  const response = await GET(mockRequest)
  const responseText = JSON.stringify(await response.json())
  
  expect(responseText).not.toContain('sk_live_')
  expect(responseText).not.toContain('sk_test_')
  expect(responseText).not.toContain('whsec_')
})
```

## Performance Testing

### Benchmarks
- **Page Load**: <3s on 3G, <1s on WiFi
- **API Response**: <200ms for status checks
- **Checkout Creation**: <500ms end-to-end
- **Webhook Processing**: <100ms per event

### Test Implementation
```typescript
test('loads subscription pages within acceptable time', async () => {
  const startTime = Date.now()
  await page.goto(`${BASE_URL}/pricing`)
  await expect(page.locator('text=Choose Your Halal Journey')).toBeVisible()
  
  const loadTime = Date.now() - startTime
  expect(loadTime).toBeLessThan(3000)
})
```

## Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all subscription tests
npm run test:subscription

# Run with coverage
npm run test -- --coverage

# Run specific test suite
npm run test components/subscription

# Run E2E tests
npm run test:e2e
```

### Comprehensive Test Suite
```bash
# Run complete test validation
./scripts/test-subscription-system.sh
```

This script runs:
1. Component unit tests
2. Hook tests  
3. API integration tests
4. Webhook tests
5. E2E tests
6. Coverage validation
7. Islamic compliance tests
8. Security tests
9. Performance tests

### Continuous Integration

**Pre-commit Hooks**
- Lint and format code
- Run unit tests
- Validate coverage thresholds

**CI/CD Pipeline** 
- Full test suite execution
- Coverage reporting
- Performance regression detection
- Security vulnerability scanning

## Test Data and Fixtures

### Mock User Data
```typescript
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@faddlmatch.com', 
  firstName: 'Ahmad',
  lastName: 'Test'
}
```

### Mock Subscription Data
```typescript
const MOCK_SUBSCRIPTION = {
  hasActiveSubscription: true,
  planId: 'PATIENCE',
  status: 'active',
  daysRemaining: 25,
  // ... additional properties
}
```

### Stripe Test Data
```typescript
const STRIPE_TEST_EVENTS = {
  subscription_created: createMockStripeEvent('customer.subscription.created', mockSubscription),
  payment_succeeded: createMockStripeEvent('invoice.payment_succeeded', mockInvoice)
}
```

## Troubleshooting

### Common Issues

**Test Timeout Errors**
- Increase timeout for async operations
- Mock external API calls properly
- Check for unresolved promises

**Coverage Issues**
- Ensure all critical paths are tested
- Add tests for error conditions
- Test edge cases and boundary conditions

**E2E Test Flakiness**
- Add proper wait conditions
- Mock external services consistently
- Use data attributes for reliable selectors

### Debug Commands
```bash
# Run tests in debug mode
npm run test -- --verbose --no-cache

# Generate detailed coverage report
npm run test -- --coverage --coverageReporters=html

# Run specific test file
npm run test useSubscription.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="Islamic"
```

## Quality Gates

### Pre-Production Checklist
- [ ] All tests passing (100%)
- [ ] Coverage thresholds met (≥90%)
- [ ] Islamic compliance validated
- [ ] Security tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] E2E user flows validated
- [ ] Error handling comprehensive
- [ ] Mobile responsiveness confirmed

### Production Readiness Criteria
- [ ] Zero critical bugs
- [ ] Comprehensive error handling
- [ ] Islamic compliance throughout
- [ ] Security vulnerabilities addressed
- [ ] Performance optimized
- [ ] Monitoring and alerting configured
- [ ] Documentation complete
- [ ] Team training completed

## Conclusion

This comprehensive testing suite ensures the FADDL Match subscription system meets the highest standards for:

- **Functionality**: All features work as designed
- **Quality**: Code quality and maintainability
- **Islamic Compliance**: Halal and Shariah-compliant features
- **Security**: Protection against vulnerabilities
- **Performance**: Fast and responsive user experience
- **Accessibility**: Inclusive design for all users
- **Reliability**: Robust error handling and recovery

**May Allah bless this halal matrimonial platform and guide Muslim couples to find their perfect match through this technology.**

---

*For questions or support, contact the development team or refer to the main project documentation.*