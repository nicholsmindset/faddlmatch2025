/**
 * 🔐 Webhook Security Testing Suite
 * Comprehensive testing for Clerk webhook signature verification and security
 */

import { test, expect } from '@playwright/test'
import crypto from 'crypto'

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  webhookSecret: process.env.CLERK_WEBHOOK_SECRET || 'test-webhook-secret',
  webhookUrl: `${process.env.TEST_BASE_URL || 'http://localhost:3000'}/api/webhooks/clerk`
}

// Webhook signature utilities
class WebhookSignatureUtils {
  static generateValidSignature(payload: string, secret: string, timestamp: string, id: string): string {
    const signedPayload = `${id}.${timestamp}.${payload}`
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret, 'base64'))
      .update(signedPayload, 'utf8')
      .digest('base64')
    
    return `v1,${signature}`
  }

  static generateInvalidSignature(): string {
    return 'v1,' + crypto.randomBytes(32).toString('base64')
  }

  static generateTimestamp(offsetSeconds: number = 0): string {
    return Math.floor(Date.now() / 1000 + offsetSeconds).toString()
  }

  static generateId(): string {
    return `msg_${crypto.randomBytes(12).toString('hex')}`
  }

  static createWebhookPayload(type: string, userId: string, additionalData: any = {}) {
    return {
      type,
      data: {
        id: userId,
        email_addresses: [{
          id: `email_${crypto.randomBytes(8).toString('hex')}`,
          email_address: `user${userId}@example.com`
        }],
        first_name: 'Test',
        last_name: 'User',
        created_at: Date.now(),
        updated_at: Date.now(),
        ...additionalData
      }
    }
  }
}

test.describe('Webhook Signature Verification', () => {
  test('should accept webhooks with valid signatures', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-user-123')
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString, 
      TEST_CONFIG.webhookSecret, 
      timestamp, 
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(200)
    const responseBody = await response.json()
    expect(responseBody.received).toBe(true)
  })

  test('should reject webhooks with invalid signatures', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-user-456')
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const invalidSignature = WebhookSignatureUtils.generateInvalidSignature()

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': invalidSignature
      }
    })

    expect(response.status()).toBe(401)
  })

  test('should reject webhooks with missing headers', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-user-789')
    const payloadString = JSON.stringify(payload)

    // Test missing svix-id
    let response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-timestamp': WebhookSignatureUtils.generateTimestamp(),
        'svix-signature': WebhookSignatureUtils.generateInvalidSignature()
      }
    })
    expect(response.status()).toBe(400)

    // Test missing svix-timestamp
    response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': WebhookSignatureUtils.generateId(),
        'svix-signature': WebhookSignatureUtils.generateInvalidSignature()
      }
    })
    expect(response.status()).toBe(400)

    // Test missing svix-signature
    response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': WebhookSignatureUtils.generateId(),
        'svix-timestamp': WebhookSignatureUtils.generateTimestamp()
      }
    })
    expect(response.status()).toBe(400)
  })

  test('should reject webhooks with expired timestamps', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-user-expired')
    const payloadString = JSON.stringify(payload)
    
    // Create timestamp that's 10 minutes old (beyond 5 minute tolerance)
    const expiredTimestamp = WebhookSignatureUtils.generateTimestamp(-600)
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      expiredTimestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': expiredTimestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(400)
  })

  test('should reject webhooks from the future', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-user-future')
    const payloadString = JSON.stringify(payload)
    
    // Create timestamp that's 10 minutes in the future
    const futureTimestamp = WebhookSignatureUtils.generateTimestamp(600)
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      futureTimestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': futureTimestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(400)
  })
})

test.describe('Webhook Payload Security', () => {
  test('should reject malformed JSON payloads', async ({ request }) => {
    const malformedPayload = '{"type":"user.created","data":{'
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      malformedPayload,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: malformedPayload,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(400)
  })

  test('should handle SQL injection attempts in webhook data', async ({ request }) => {
    const maliciousPayload = WebhookSignatureUtils.createWebhookPayload(
      'user.created',
      "'; DROP TABLE users; --",
      {
        email_addresses: [{
          id: 'email_malicious',
          email_address: "malicious'; DELETE FROM users; --@example.com"
        }],
        first_name: "Robert'; UPDATE users SET admin=true; --",
        last_name: "Drop Tables"
      }
    )
    
    const payloadString = JSON.stringify(maliciousPayload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    // Should either reject or handle safely
    expect([200, 400, 422]).toContain(response.status())
  })

  test('should handle XSS attempts in webhook data', async ({ request }) => {
    const xssPayload = WebhookSignatureUtils.createWebhookPayload(
      'user.updated',
      'test-user-xss',
      {
        first_name: '<script>alert("xss")</script>',
        last_name: '<img src=x onerror=alert("xss")>',
        email_addresses: [{
          id: 'email_xss',
          email_address: 'test+<script>evil()</script>@example.com'
        }]
      }
    )
    
    const payloadString = JSON.stringify(xssPayload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(200)
    
    // Verify response doesn't contain unescaped script tags
    const responseText = await response.text()
    expect(responseText).not.toContain('<script>')
    expect(responseText).not.toContain('alert(')
  })

  test('should handle oversized payloads', async ({ request }) => {
    // Create a very large payload
    const largeData = 'A'.repeat(10 * 1024 * 1024) // 10MB
    const oversizedPayload = WebhookSignatureUtils.createWebhookPayload(
      'user.created',
      'test-user-large',
      {
        large_field: largeData
      }
    )
    
    const payloadString = JSON.stringify(oversizedPayload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    // Should reject oversized payloads
    expect([413, 400, 500]).toContain(response.status())
  })
})

test.describe('Webhook Rate Limiting', () => {
  test('should enforce rate limiting on webhook endpoint', async ({ request }) => {
    const promises = []
    
    // Send 100 rapid webhook requests
    for (let i = 0; i < 100; i++) {
      const payload = WebhookSignatureUtils.createWebhookPayload('user.created', `test-user-${i}`)
      const payloadString = JSON.stringify(payload)
      const timestamp = WebhookSignatureUtils.generateTimestamp()
      const id = WebhookSignatureUtils.generateId()
      const signature = WebhookSignatureUtils.generateValidSignature(
        payloadString,
        TEST_CONFIG.webhookSecret,
        timestamp,
        id
      )

      promises.push(
        request.post(TEST_CONFIG.webhookUrl, {
          data: payloadString,
          headers: {
            'Content-Type': 'application/json',
            'svix-id': id,
            'svix-timestamp': timestamp,
            'svix-signature': signature
          }
        })
      )
    }

    const responses = await Promise.allSettled(promises)
    const rateLimitedCount = responses.filter(result => 
      result.status === 'fulfilled' && result.value.status() === 429
    ).length

    // Should start rate limiting after allowed requests
    expect(rateLimitedCount).toBeGreaterThan(30)
  })

  test('should include rate limit headers in responses', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-rate-headers')
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    const headers = response.headers()
    expect(headers['x-ratelimit-limit']).toBeDefined()
    expect(headers['x-ratelimit-remaining']).toBeDefined()
    expect(headers['x-ratelimit-reset']).toBeDefined()
  })
})

test.describe('Webhook Event Processing', () => {
  test('should process user.created events correctly', async ({ request }) => {
    const userId = `test-user-${Date.now()}`
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', userId)
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(200)
    
    const responseBody = await response.json()
    expect(responseBody.received).toBe(true)
    expect(responseBody.eventType).toBe('user.created')
  })

  test('should process user.updated events correctly', async ({ request }) => {
    const userId = `test-user-update-${Date.now()}`
    const payload = WebhookSignatureUtils.createWebhookPayload('user.updated', userId)
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    expect(response.status()).toBe(200)
    
    const responseBody = await response.json()
    expect(responseBody.received).toBe(true)
    expect(responseBody.eventType).toBe('user.updated')
  })

  test('should handle unknown event types gracefully', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('unknown.event.type', 'test-user-unknown')
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    // Should accept unknown events but not process them
    expect(response.status()).toBe(200)
  })
})

test.describe('Webhook Security Headers', () => {
  test('should include proper security headers in webhook responses', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-security-headers')
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const response = await request.post(TEST_CONFIG.webhookUrl, {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    })

    const headers = response.headers()
    
    // Check for security headers
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['content-security-policy']).toBeDefined()
  })

  test('should handle webhook replay attacks', async ({ request }) => {
    const payload = WebhookSignatureUtils.createWebhookPayload('user.created', 'test-replay-attack')
    const payloadString = JSON.stringify(payload)
    const timestamp = WebhookSignatureUtils.generateTimestamp()
    const id = WebhookSignatureUtils.generateId()
    const signature = WebhookSignatureUtils.generateValidSignature(
      payloadString,
      TEST_CONFIG.webhookSecret,
      timestamp,
      id
    )

    const webhookRequest = {
      data: payloadString,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature
      }
    }

    // Send the same webhook twice
    const response1 = await request.post(TEST_CONFIG.webhookUrl, webhookRequest)
    const response2 = await request.post(TEST_CONFIG.webhookUrl, webhookRequest)

    expect(response1.status()).toBe(200)
    // Second request should also succeed (idempotent) or be detected as replay
    expect([200, 409]).toContain(response2.status())
  })
})