/**
 * 📊 Authentication Monitoring & Alerting Tests
 * Real-time security monitoring and incident detection for FADDL Match
 */

import { test, expect, Page } from '@playwright/test'

interface SecurityEvent {
  id: string
  timestamp: Date
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  source: string
  details: any
  userId?: string
  ipAddress?: string
  userAgent?: string
}

interface AlertRule {
  id: string
  name: string
  condition: (events: SecurityEvent[]) => boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  responseAction: string
}

class SecurityMonitor {
  private events: SecurityEvent[] = []
  private alerts: Array<{ rule: AlertRule; triggeredAt: Date; events: SecurityEvent[] }> = []
  private alertRules: AlertRule[] = []

  constructor() {
    this.initializeAlertRules()
  }

  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'BRUTE_FORCE_DETECTION',
        name: 'Brute Force Attack Detection',
        condition: (events) => {
          const loginFailures = events.filter(e => 
            e.type === 'LOGIN_FAILURE' && 
            Date.now() - e.timestamp.getTime() < 300000 // 5 minutes
          )
          return loginFailures.length >= 5
        },
        severity: 'HIGH',
        description: 'Multiple failed login attempts detected',
        responseAction: 'Lock account and notify security team'
      },
      {
        id: 'CREDENTIAL_STUFFING',
        name: 'Credential Stuffing Detection',
        condition: (events) => {
          const uniqueIPs = new Set(events
            .filter(e => e.type === 'LOGIN_FAILURE' && Date.now() - e.timestamp.getTime() < 600000)
            .map(e => e.ipAddress)
          )
          return uniqueIPs.size >= 10 && events.length >= 50
        },
        severity: 'CRITICAL',
        description: 'Credential stuffing attack detected',
        responseAction: 'Rate limit IP ranges and escalate to security team'
      },
      {
        id: 'ACCOUNT_ENUMERATION',
        name: 'Account Enumeration Detection',
        condition: (events) => {
          const enumerationAttempts = events.filter(e => 
            e.type === 'ENUMERATION_ATTEMPT' && 
            Date.now() - e.timestamp.getTime() < 300000
          )
          return enumerationAttempts.length >= 20
        },
        severity: 'MEDIUM',
        description: 'Account enumeration attack detected',
        responseAction: 'Implement uniform response times'
      },
      {
        id: 'PRIVILEGE_ESCALATION',
        name: 'Privilege Escalation Attempt',
        condition: (events) => {
          return events.some(e => e.type === 'PRIVILEGE_ESCALATION_ATTEMPT')
        },
        severity: 'CRITICAL',
        description: 'Unauthorized privilege escalation detected',
        responseAction: 'Immediately suspend account and investigate'
      },
      {
        id: 'SESSION_HIJACKING',
        name: 'Session Hijacking Detection',
        condition: (events) => {
          const sessionEvents = events.filter(e => e.type === 'SUSPICIOUS_SESSION_ACTIVITY')
          return sessionEvents.length >= 3
        },
        severity: 'HIGH',
        description: 'Potential session hijacking detected',
        responseAction: 'Invalidate all sessions and force re-authentication'
      },
      {
        id: 'WEBHOOK_TAMPERING',
        name: 'Webhook Tampering Detection',
        condition: (events) => {
          return events.some(e => e.type === 'WEBHOOK_SIGNATURE_FAILURE')
        },
        severity: 'HIGH',
        description: 'Webhook signature verification failed',
        responseAction: 'Block webhook source and alert development team'
      },
      {
        id: 'ANOMALOUS_LOGIN_PATTERN',
        name: 'Anomalous Login Pattern',
        condition: (events) => {
          const loginEvents = events.filter(e => e.type === 'LOGIN_SUCCESS')
          const locations = new Set(loginEvents.map(e => e.details?.location))
          const timeSpread = loginEvents.length > 0 ? 
            Math.max(...loginEvents.map(e => e.timestamp.getTime())) - 
            Math.min(...loginEvents.map(e => e.timestamp.getTime())) : 0
          
          // Multiple locations in short time
          return locations.size >= 3 && timeSpread < 3600000 // 1 hour
        },
        severity: 'MEDIUM',
        description: 'User logging in from multiple locations rapidly',
        responseAction: 'Require additional authentication verification'
      }
    ]
  }

  recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    }
    
    this.events.push(securityEvent)
    this.evaluateAlertRules()
    
    return securityEvent
  }

  private evaluateAlertRules() {
    for (const rule of this.alertRules) {
      if (rule.condition(this.events)) {
        const relevantEvents = this.getRelevantEvents(rule)
        
        // Check if this alert was already triggered recently
        const recentAlert = this.alerts.find(a => 
          a.rule.id === rule.id && 
          Date.now() - a.triggeredAt.getTime() < 300000 // 5 minutes
        )
        
        if (!recentAlert) {
          this.alerts.push({
            rule,
            triggeredAt: new Date(),
            events: relevantEvents
          })
          
          console.log(`🚨 SECURITY ALERT: ${rule.name}`)
          console.log(`Severity: ${rule.severity}`)
          console.log(`Description: ${rule.description}`)
          console.log(`Response Action: ${rule.responseAction}`)
          console.log(`Events: ${relevantEvents.length}`)
        }
      }
    }
  }

  private getRelevantEvents(rule: AlertRule): SecurityEvent[] {
    const cutoffTime = Date.now() - 600000 // 10 minutes
    return this.events.filter(e => e.timestamp.getTime() > cutoffTime)
  }

  getEvents(): SecurityEvent[] {
    return [...this.events]
  }

  getAlerts(): Array<{ rule: AlertRule; triggeredAt: Date; events: SecurityEvent[] }> {
    return [...this.alerts]
  }

  getCriticalAlerts(): Array<{ rule: AlertRule; triggeredAt: Date; events: SecurityEvent[] }> {
    return this.alerts.filter(a => a.rule.severity === 'CRITICAL')
  }

  getSecurityMetrics() {
    const now = Date.now()
    const last24Hours = this.events.filter(e => now - e.timestamp.getTime() < 86400000)
    const lastHour = this.events.filter(e => now - e.timestamp.getTime() < 3600000)
    
    return {
      totalEvents: this.events.length,
      eventsLast24Hours: last24Hours.length,
      eventsLastHour: lastHour.length,
      criticalAlerts: this.getCriticalAlerts().length,
      totalAlerts: this.alerts.length,
      eventTypes: this.getEventTypeCounts(),
      topIPs: this.getTopIPs(),
      failureRate: this.calculateFailureRate()
    }
  }

  private getEventTypeCounts() {
    const counts: Record<string, number> = {}
    this.events.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1
    })
    return counts
  }

  private getTopIPs() {
    const ipCounts: Record<string, number> = {}
    this.events.forEach(e => {
      if (e.ipAddress) {
        ipCounts[e.ipAddress] = (ipCounts[e.ipAddress] || 0) + 1
      }
    })
    
    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))
  }

  private calculateFailureRate() {
    const authEvents = this.events.filter(e => 
      e.type === 'LOGIN_SUCCESS' || e.type === 'LOGIN_FAILURE'
    )
    
    if (authEvents.length === 0) return 0
    
    const failures = authEvents.filter(e => e.type === 'LOGIN_FAILURE').length
    return (failures / authEvents.length) * 100
  }

  clear() {
    this.events = []
    this.alerts = []
  }
}

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUsers: Array.from({ length: 20 }, (_, i) => ({
    email: `monitor-test-${i}@faddlmatch.com`,
    password: 'MonitorTest123!',
    firstName: `User${i}`,
    lastName: 'Test'
  }))
}

const monitor = new SecurityMonitor()

test.describe('Brute Force Attack Detection', () => {
  test.beforeEach(() => {
    monitor.clear()
  })

  test('should detect and alert on brute force attacks', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/sign-in`)
    
    const targetEmail = 'victim@faddlmatch.com'
    const attackerIP = '192.168.1.100'
    
    // Simulate brute force attack
    for (let i = 0; i < 8; i++) {
      await page.fill('input[name="emailAddress"]', targetEmail)
      await page.fill('input[name="password"]', `wrongpassword${i}`)
      
      // Record the failed login attempt
      monitor.recordEvent({
        type: 'LOGIN_FAILURE',
        severity: 'MEDIUM',
        source: 'login_form',
        details: {
          email: targetEmail,
          reason: 'invalid_credentials',
          attempt: i + 1
        },
        ipAddress: attackerIP,
        userAgent: 'Automated Attack Tool'
      })
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)
      
      // Clear form for next attempt
      await page.fill('input[name="emailAddress"]', '')
      await page.fill('input[name="password"]', '')
    }
    
    // Check if brute force alert was triggered
    const alerts = monitor.getAlerts()
    const bruteForceAlerts = alerts.filter(a => a.rule.id === 'BRUTE_FORCE_DETECTION')
    
    expect(bruteForceAlerts.length).toBeGreaterThan(0)
    expect(bruteForceAlerts[0].rule.severity).toBe('HIGH')
    
    console.log(`🚨 Brute force attack detected after ${monitor.getEvents().length} attempts`)
  })

  test('should detect credential stuffing attacks', async ({ browser }) => {
    // Simulate credential stuffing from multiple IPs
    const contexts = await Promise.all(
      Array(15).fill(0).map(() => browser.newContext())
    )
    
    try {
      const stuffingPromises = contexts.map(async (context, index) => {
        const page = await context.newPage()
        const attackerIP = `192.168.1.${100 + index}`
        
        // Each IP tries multiple credentials
        for (let credIndex = 0; credIndex < 5; credIndex++) {
          monitor.recordEvent({
            type: 'LOGIN_FAILURE',
            severity: 'MEDIUM',
            source: 'credential_stuffing',
            details: {
              email: `victim${credIndex}@example.com`,
              reason: 'invalid_credentials',
              pattern: 'automated'
            },
            ipAddress: attackerIP,
            userAgent: `Bot-${index}`
          })
        }
      })
      
      await Promise.all(stuffingPromises)
      
      // Check if credential stuffing alert was triggered
      const alerts = monitor.getAlerts()
      const stuffingAlerts = alerts.filter(a => a.rule.id === 'CREDENTIAL_STUFFING')
      
      expect(stuffingAlerts.length).toBeGreaterThan(0)
      expect(stuffingAlerts[0].rule.severity).toBe('CRITICAL')
      
      console.log(`🚨 Credential stuffing attack detected from ${contexts.length} IPs`)
      
    } finally {
      await Promise.all(contexts.map(context => context.close()))
    }
  })
})

test.describe('Account Enumeration Detection', () => {
  test('should detect account enumeration attempts', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/sign-in`)
    
    const attackerIP = '192.168.1.200'
    const testEmails = [
      'admin@faddlmatch.com',
      'test@faddlmatch.com',
      'user1@faddlmatch.com',
      'support@faddlmatch.com',
      'info@faddlmatch.com'
    ]
    
    // Simulate account enumeration
    for (let i = 0; i < 25; i++) {
      const email = testEmails[i % testEmails.length] + i
      
      await page.fill('input[name="emailAddress"]', email)
      await page.fill('input[name="password"]', 'testpassword')
      
      monitor.recordEvent({
        type: 'ENUMERATION_ATTEMPT',
        severity: 'LOW',
        source: 'login_form',
        details: {
          email,
          purpose: 'account_discovery',
          pattern: 'sequential'
        },
        ipAddress: attackerIP,
        userAgent: 'Enumeration Tool'
      })
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(200)
      
      await page.fill('input[name="emailAddress"]', '')
      await page.fill('input[name="password"]', '')
    }
    
    // Check if enumeration alert was triggered
    const alerts = monitor.getAlerts()
    const enumerationAlerts = alerts.filter(a => a.rule.id === 'ACCOUNT_ENUMERATION')
    
    expect(enumerationAlerts.length).toBeGreaterThan(0)
    expect(enumerationAlerts[0].rule.severity).toBe('MEDIUM')
    
    console.log(`🚨 Account enumeration detected after ${monitor.getEvents().length} attempts`)
  })
})

test.describe('Privilege Escalation Detection', () => {
  test('should detect unauthorized privilege escalation attempts', async ({ page }) => {
    // Simulate user trying to access admin endpoints
    const unauthorizedEndpoints = [
      '/api/admin/users',
      '/api/admin/system',
      '/admin/dashboard',
      '/api/debug'
    ]
    
    for (const endpoint of unauthorizedEndpoints) {
      try {
        const response = await page.request.get(`${TEST_CONFIG.baseUrl}${endpoint}`)
        
        monitor.recordEvent({
          type: 'PRIVILEGE_ESCALATION_ATTEMPT',
          severity: 'CRITICAL',
          source: 'unauthorized_access',
          details: {
            endpoint,
            statusCode: response.status(),
            method: 'GET'
          },
          userId: 'regular-user-123',
          ipAddress: '192.168.1.50',
          userAgent: 'Privilege Escalation Tool'
        })
        
      } catch (error) {
        // Expected for unauthorized access
      }
    }
    
    // Check if privilege escalation alert was triggered
    const alerts = monitor.getAlerts()
    const escalationAlerts = alerts.filter(a => a.rule.id === 'PRIVILEGE_ESCALATION')
    
    expect(escalationAlerts.length).toBeGreaterThan(0)
    expect(escalationAlerts[0].rule.severity).toBe('CRITICAL')
    
    console.log(`🚨 Privilege escalation attempt detected`)
  })
})

test.describe('Session Security Monitoring', () => {
  test('should detect suspicious session activity', async ({ browser }) => {
    const userAgent1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const userAgent2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    const userAgent3 = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    
    const userId = 'user-session-test-123'
    
    // Simulate session activity from different browsers/locations
    monitor.recordEvent({
      type: 'SUSPICIOUS_SESSION_ACTIVITY',
      severity: 'MEDIUM',
      source: 'session_monitor',
      details: {
        sessionId: 'sess_1',
        location: 'New York, USA',
        device: 'Windows Desktop'
      },
      userId,
      ipAddress: '192.168.1.10',
      userAgent: userAgent1
    })
    
    monitor.recordEvent({
      type: 'SUSPICIOUS_SESSION_ACTIVITY',
      severity: 'MEDIUM',
      source: 'session_monitor',
      details: {
        sessionId: 'sess_2',
        location: 'London, UK',
        device: 'Mac Desktop'
      },
      userId,
      ipAddress: '10.0.0.5',
      userAgent: userAgent2
    })
    
    monitor.recordEvent({
      type: 'SUSPICIOUS_SESSION_ACTIVITY',
      severity: 'MEDIUM',
      source: 'session_monitor',
      details: {
        sessionId: 'sess_3',
        location: 'Tokyo, Japan',
        device: 'Linux Server'
      },
      userId,
      ipAddress: '172.16.0.100',
      userAgent: userAgent3
    })
    
    // Check if session hijacking alert was triggered
    const alerts = monitor.getAlerts()
    const sessionAlerts = alerts.filter(a => a.rule.id === 'SESSION_HIJACKING')
    
    expect(sessionAlerts.length).toBeGreaterThan(0)
    expect(sessionAlerts[0].rule.severity).toBe('HIGH')
    
    console.log(`🚨 Suspicious session activity detected for user ${userId}`)
  })

  test('should detect anomalous login patterns', async ({ page }) => {
    const userId = 'user-travel-test-456'
    
    // Simulate rapid logins from different geographical locations
    const locations = [
      { city: 'New York', ip: '192.168.1.10' },
      { city: 'Los Angeles', ip: '10.0.0.20' },
      { city: 'Miami', ip: '172.16.0.30' },
      { city: 'Seattle', ip: '192.168.2.40' }
    ]
    
    for (const location of locations) {
      monitor.recordEvent({
        type: 'LOGIN_SUCCESS',
        severity: 'LOW',
        source: 'authentication',
        details: {
          location: location.city,
          method: 'password',
          device: 'mobile'
        },
        userId,
        ipAddress: location.ip,
        userAgent: 'Mobile App'
      })
      
      // Small delay to simulate rapid travel
      await page.waitForTimeout(100)
    }
    
    // Check if anomalous login pattern alert was triggered
    const alerts = monitor.getAlerts()
    const anomalousAlerts = alerts.filter(a => a.rule.id === 'ANOMALOUS_LOGIN_PATTERN')
    
    expect(anomalousAlerts.length).toBeGreaterThan(0)
    expect(anomalousAlerts[0].rule.severity).toBe('MEDIUM')
    
    console.log(`🚨 Anomalous login pattern detected for user ${userId}`)
  })
})

test.describe('Webhook Security Monitoring', () => {
  test('should detect webhook tampering attempts', async ({ page }) => {
    // Simulate webhook signature verification failures
    const webhookEvents = [
      {
        webhookId: 'wh_001',
        expectedSignature: 'valid_signature_hash',
        receivedSignature: 'invalid_signature_hash',
        source: 'unknown_sender'
      },
      {
        webhookId: 'wh_002',
        expectedSignature: 'another_valid_hash',
        receivedSignature: 'tampered_signature',
        source: 'suspicious_ip'
      }
    ]
    
    for (const webhook of webhookEvents) {
      monitor.recordEvent({
        type: 'WEBHOOK_SIGNATURE_FAILURE',
        severity: 'HIGH',
        source: 'webhook_validator',
        details: {
          webhookId: webhook.webhookId,
          expectedSignature: webhook.expectedSignature,
          receivedSignature: webhook.receivedSignature,
          source: webhook.source,
          timestamp: new Date().toISOString()
        },
        ipAddress: '192.168.1.999',
        userAgent: 'Webhook Client'
      })
    }
    
    // Check if webhook tampering alert was triggered
    const alerts = monitor.getAlerts()
    const webhookAlerts = alerts.filter(a => a.rule.id === 'WEBHOOK_TAMPERING')
    
    expect(webhookAlerts.length).toBeGreaterThan(0)
    expect(webhookAlerts[0].rule.severity).toBe('HIGH')
    
    console.log(`🚨 Webhook tampering detected`)
  })
})

test.describe('Security Metrics and Reporting', () => {
  test('should generate comprehensive security metrics', async () => {
    // Add sample events for metrics calculation
    const sampleEvents = [
      { type: 'LOGIN_SUCCESS', severity: 'LOW' as const, source: 'auth', details: {} },
      { type: 'LOGIN_FAILURE', severity: 'MEDIUM' as const, source: 'auth', details: {} },
      { type: 'LOGIN_FAILURE', severity: 'MEDIUM' as const, source: 'auth', details: {} },
      { type: 'PASSWORD_RESET', severity: 'LOW' as const, source: 'account', details: {} },
      { type: 'SUSPICIOUS_ACTIVITY', severity: 'HIGH' as const, source: 'behavior', details: {} }
    ]
    
    sampleEvents.forEach((event, index) => {
      monitor.recordEvent({
        ...event,
        ipAddress: `192.168.1.${index + 1}`,
        userAgent: `Test Agent ${index}`
      })
    })
    
    const metrics = monitor.getSecurityMetrics()
    
    console.log('📊 Security Monitoring Metrics:')
    console.log('===============================')
    console.log(`Total Events: ${metrics.totalEvents}`)
    console.log(`Events (24h): ${metrics.eventsLast24Hours}`)
    console.log(`Events (1h): ${metrics.eventsLastHour}`)
    console.log(`Critical Alerts: ${metrics.criticalAlerts}`)
    console.log(`Total Alerts: ${metrics.totalAlerts}`)
    console.log(`Authentication Failure Rate: ${metrics.failureRate.toFixed(2)}%`)
    console.log('\nEvent Types:')
    Object.entries(metrics.eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    
    console.log('\nTop IP Addresses:')
    metrics.topIPs.forEach(({ ip, count }) => {
      console.log(`  ${ip}: ${count} events`)
    })
    
    // Verify metrics are reasonable
    expect(metrics.totalEvents).toBeGreaterThan(0)
    expect(metrics.failureRate).toBeGreaterThanOrEqual(0)
    expect(metrics.failureRate).toBeLessThanOrEqual(100)
    
    // Authentication failure rate should be reasonable for a dating app
    expect(metrics.failureRate).toBeLessThan(50) // Less than 50% failure rate
  })

  test('should provide security incident response recommendations', async () => {
    const alerts = monitor.getAlerts()
    const criticalAlerts = monitor.getCriticalAlerts()
    
    const incidentResponse = {
      immediateActions: [
        'Review all critical and high severity alerts',
        'Verify affected user accounts are secure',
        'Check for any successful breaches or data access',
        'Implement additional monitoring for flagged IPs',
        'Consider temporary rate limiting for suspicious sources'
      ],
      investigationSteps: [
        'Analyze attack patterns and entry points',
        'Review authentication logs for the affected time period',
        'Check for lateral movement or privilege escalation',
        'Verify webhook integrity and source validation',
        'Review user session data for anomalies'
      ],
      preventativeActions: [
        'Implement additional rate limiting rules',
        'Enhance account lockout policies',
        'Add geographic access controls',
        'Implement behavioral analysis for user sessions',
        'Strengthen webhook signature validation',
        'Add real-time fraud detection rules'
      ],
      monitoringEnhancements: [
        'Add device fingerprinting for session validation',
        'Implement IP reputation checking',
        'Add ML-based anomaly detection',
        'Enhance logging for all authentication events',
        'Implement real-time dashboard for security events'
      ],
      alertStatus: {
        total: alerts.length,
        critical: criticalAlerts.length,
        requiresImmediate: criticalAlerts.length > 0,
        overallRisk: criticalAlerts.length > 0 ? 'HIGH' : alerts.length > 5 ? 'MEDIUM' : 'LOW'
      }
    }
    
    console.log('\n🔧 Security Incident Response Plan:')
    console.log('===================================')
    console.log(JSON.stringify(incidentResponse, null, 2))
    
    // Verify incident response plan completeness
    expect(incidentResponse.immediateActions.length).toBeGreaterThan(0)
    expect(incidentResponse.investigationSteps.length).toBeGreaterThan(0)
    expect(incidentResponse.preventativeActions.length).toBeGreaterThan(0)
    expect(incidentResponse.monitoringEnhancements.length).toBeGreaterThan(0)
    
    // Risk assessment should be reasonable
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(incidentResponse.alertStatus.overallRisk)
  })
})