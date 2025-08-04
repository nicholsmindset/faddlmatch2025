/**
 * 🚨 Production Alerting System
 * Real-time monitoring and alerting for critical subscription system events
 */

import { isProduction } from '@/lib/env'
import { metrics } from './metrics'

/**
 * 🎯 Alert types and severity levels
 */
export enum AlertType {
  // System health alerts
  HIGH_ERROR_RATE = 'high_error_rate',
  SLOW_RESPONSE_TIME = 'slow_response_time',
  HIGH_MEMORY_USAGE = 'high_memory_usage',
  
  // Business critical alerts
  PAYMENT_FAILURES = 'payment_failures',
  WEBHOOK_FAILURES = 'webhook_failures',
  HIGH_CHURN_RATE = 'high_churn_rate',
  REVENUE_DROP = 'revenue_drop',
  
  // Security alerts
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MULTIPLE_AUTH_FAILURES = 'multiple_auth_failures',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  
  // Infrastructure alerts
  DATABASE_CONNECTION_ISSUES = 'database_connection_issues',
  STRIPE_API_ISSUES = 'stripe_api_issues',
  THIRD_PARTY_SERVICE_DOWN = 'third_party_service_down'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 📋 Alert configuration interface
 */
interface AlertConfig {
  type: AlertType
  severity: AlertSeverity
  threshold: number
  windowMinutes: number
  cooldownMinutes: number
  enabled: boolean
  channels: AlertChannel[]
}

/**
 * 📢 Alert delivery channels
 */
export enum AlertChannel {
  CONSOLE = 'console',
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms'
}

/**
 * 📊 Alert data interface
 */
interface AlertData {
  type: AlertType
  severity: AlertSeverity
  message: string
  details: Record<string, any>
  timestamp: Date
  threshold: number
  currentValue: number
  affectedUsers?: string[]
  suggestedActions?: string[]
}

/**
 * 🔧 Default alert configurations
 */
const DEFAULT_ALERT_CONFIGS: Record<AlertType, AlertConfig> = {
  [AlertType.HIGH_ERROR_RATE]: {
    type: AlertType.HIGH_ERROR_RATE,
    severity: AlertSeverity.HIGH,
    threshold: 5, // 5% error rate
    windowMinutes: 5,
    cooldownMinutes: 15,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK]
  },
  
  [AlertType.SLOW_RESPONSE_TIME]: {
    type: AlertType.SLOW_RESPONSE_TIME,
    severity: AlertSeverity.MEDIUM,
    threshold: 2000, // 2 seconds
    windowMinutes: 5,
    cooldownMinutes: 10,
    enabled: true,
    channels: [AlertChannel.CONSOLE]
  },
  
  [AlertType.HIGH_MEMORY_USAGE]: {
    type: AlertType.HIGH_MEMORY_USAGE,
    severity: AlertSeverity.MEDIUM,
    threshold: 500, // 500MB
    windowMinutes: 10,
    cooldownMinutes: 20,
    enabled: true,
    channels: [AlertChannel.CONSOLE]
  },
  
  [AlertType.PAYMENT_FAILURES]: {
    type: AlertType.PAYMENT_FAILURES,
    severity: AlertSeverity.CRITICAL,
    threshold: 15, // 15% payment failure rate
    windowMinutes: 15,
    cooldownMinutes: 30,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK, AlertChannel.EMAIL]
  },
  
  [AlertType.WEBHOOK_FAILURES]: {
    type: AlertType.WEBHOOK_FAILURES,
    severity: AlertSeverity.HIGH,
    threshold: 90, // Below 90% success rate
    windowMinutes: 10,
    cooldownMinutes: 20,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK]
  },
  
  [AlertType.HIGH_CHURN_RATE]: {
    type: AlertType.HIGH_CHURN_RATE,
    severity: AlertSeverity.HIGH,
    threshold: 10, // 10% churn rate
    windowMinutes: 60,
    cooldownMinutes: 240, // 4 hours
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.EMAIL]
  },
  
  [AlertType.REVENUE_DROP]: {
    type: AlertType.REVENUE_DROP,
    severity: AlertSeverity.CRITICAL,
    threshold: 20, // 20% revenue drop
    windowMinutes: 120,
    cooldownMinutes: 480, // 8 hours
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.EMAIL, AlertChannel.SLACK]
  },
  
  [AlertType.SUSPICIOUS_ACTIVITY]: {
    type: AlertType.SUSPICIOUS_ACTIVITY,
    severity: AlertSeverity.HIGH,
    threshold: 10, // 10 suspicious requests
    windowMinutes: 5,
    cooldownMinutes: 15,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK]
  },
  
  [AlertType.MULTIPLE_AUTH_FAILURES]: {
    type: AlertType.MULTIPLE_AUTH_FAILURES,
    severity: AlertSeverity.MEDIUM,
    threshold: 20, // 20 auth failures
    windowMinutes: 10,
    cooldownMinutes: 30,
    enabled: true,
    channels: [AlertChannel.CONSOLE]
  },
  
  [AlertType.RATE_LIMIT_EXCEEDED]: {
    type: AlertType.RATE_LIMIT_EXCEEDED,
    severity: AlertSeverity.MEDIUM,
    threshold: 50, // 50 rate limit hits
    windowMinutes: 5,
    cooldownMinutes: 15,
    enabled: true,
    channels: [AlertChannel.CONSOLE]
  },
  
  [AlertType.DATABASE_CONNECTION_ISSUES]: {
    type: AlertType.DATABASE_CONNECTION_ISSUES,
    severity: AlertSeverity.CRITICAL,
    threshold: 1, // Any database connection issue
    windowMinutes: 1,
    cooldownMinutes: 5,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK, AlertChannel.EMAIL]
  },
  
  [AlertType.STRIPE_API_ISSUES]: {
    type: AlertType.STRIPE_API_ISSUES,
    severity: AlertSeverity.CRITICAL,
    threshold: 5, // 5 consecutive Stripe API failures
    windowMinutes: 5,
    cooldownMinutes: 15,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK, AlertChannel.EMAIL]
  },
  
  [AlertType.THIRD_PARTY_SERVICE_DOWN]: {
    type: AlertType.THIRD_PARTY_SERVICE_DOWN,
    severity: AlertSeverity.HIGH,
    threshold: 3, // 3 consecutive failures
    windowMinutes: 5,
    cooldownMinutes: 20,
    enabled: true,
    channels: [AlertChannel.CONSOLE, AlertChannel.SLACK]
  }
}

/**
 * 🚨 Production alert manager
 */
class AlertManager {
  private configs: Map<AlertType, AlertConfig> = new Map()
  private lastAlertTimes: Map<AlertType, Date> = new Map()
  private alertHistory: AlertData[] = []

  constructor() {
    // Initialize with default configurations
    Object.values(DEFAULT_ALERT_CONFIGS).forEach(config => {
      this.configs.set(config.type, config)
    })
    
    // Start monitoring loop
    if (isProduction()) {
      setInterval(() => this.checkAlerts(), 60 * 1000) // Check every minute
    }
  }

  /**
   * 🔍 Main alert checking logic
   */
  private async checkAlerts(): Promise<void> {
    try {
      const allMetrics = metrics.getAllMetrics()
      const healthStatus = metrics.getHealthStatus()

      // Check performance alerts
      await this.checkErrorRate(allMetrics.performance.errorRate)
      await this.checkResponseTime(allMetrics.performance.p95ResponseTime)
      await this.checkMemoryUsage(allMetrics.performance.memoryUsage)

      // Check business alerts
      await this.checkPaymentFailures(allMetrics.business.paymentFailureRate)
      await this.checkWebhookFailures(allMetrics.stripe.webhookSuccessRate)

      // Check security alerts
      await this.checkSuspiciousActivity(allMetrics.security.suspiciousRequests)
      await this.checkAuthFailures(allMetrics.security.authenticationFailures)
      await this.checkRateLimitHits(allMetrics.security.rateLimitHits)

      // Check overall health
      if (healthStatus.status === 'critical') {
        await this.triggerAlert(AlertType.HIGH_ERROR_RATE, {
          message: 'System health is critical',
          details: {
            healthScore: healthStatus.score,
            issues: healthStatus.issues
          },
          currentValue: healthStatus.score,
          suggestedActions: [
            'Check system logs for errors',
            'Verify all services are running',
            'Check resource usage and scaling'
          ]
        })
      }

    } catch (error) {
      console.error('[ALERTS] Error during alert checking:', error)
    }
  }

  /**
   * 📊 Individual alert check methods
   */
  private async checkErrorRate(errorRate: number): Promise<void> {
    const config = this.configs.get(AlertType.HIGH_ERROR_RATE)
    if (!config?.enabled) return

    if (errorRate > config.threshold) {
      await this.triggerAlert(AlertType.HIGH_ERROR_RATE, {
        message: `Error rate is ${errorRate.toFixed(2)}%, exceeding threshold of ${config.threshold}%`,
        details: { errorRate, threshold: config.threshold },
        currentValue: errorRate,
        suggestedActions: [
          'Check application logs for recurring errors',
          'Verify database connectivity',
          'Check third-party service status'
        ]
      })
    }
  }

  private async checkResponseTime(responseTime: number): Promise<void> {
    const config = this.configs.get(AlertType.SLOW_RESPONSE_TIME)
    if (!config?.enabled) return

    if (responseTime > config.threshold) {
      await this.triggerAlert(AlertType.SLOW_RESPONSE_TIME, {
        message: `P95 response time is ${responseTime}ms, exceeding threshold of ${config.threshold}ms`,
        details: { responseTime, threshold: config.threshold },
        currentValue: responseTime,
        suggestedActions: [
          'Check database query performance',
          'Verify API endpoint optimization',
          'Check server resource usage'
        ]
      })
    }
  }

  private async checkMemoryUsage(memoryUsage: number): Promise<void> {
    const config = this.configs.get(AlertType.HIGH_MEMORY_USAGE)
    if (!config?.enabled) return

    if (memoryUsage > config.threshold) {
      await this.triggerAlert(AlertType.HIGH_MEMORY_USAGE, {
        message: `Memory usage is ${memoryUsage.toFixed(2)}MB, exceeding threshold of ${config.threshold}MB`,
        details: { memoryUsage, threshold: config.threshold },
        currentValue: memoryUsage,
        suggestedActions: [
          'Check for memory leaks in application',
          'Review caching strategies',
          'Consider scaling server resources'
        ]
      })
    }
  }

  private async checkPaymentFailures(failureRate: number): Promise<void> {
    const config = this.configs.get(AlertType.PAYMENT_FAILURES)
    if (!config?.enabled) return

    if (failureRate > config.threshold) {
      await this.triggerAlert(AlertType.PAYMENT_FAILURES, {
        message: `Payment failure rate is ${failureRate.toFixed(2)}%, exceeding threshold of ${config.threshold}%`,
        details: { failureRate, threshold: config.threshold },
        currentValue: failureRate,
        suggestedActions: [
          'Check Stripe dashboard for payment issues',
          'Verify payment method configurations',
          'Review declined payment reasons'
        ]
      })
    }
  }

  private async checkWebhookFailures(successRate: number): Promise<void> {
    const config = this.configs.get(AlertType.WEBHOOK_FAILURES)
    if (!config?.enabled) return

    if (successRate < config.threshold) {
      await this.triggerAlert(AlertType.WEBHOOK_FAILURES, {
        message: `Webhook success rate is ${successRate.toFixed(2)}%, below threshold of ${config.threshold}%`,
        details: { successRate, threshold: config.threshold },
        currentValue: successRate,
        suggestedActions: [
          'Check webhook endpoint health',
          'Verify webhook signature validation',
          'Review Stripe webhook logs'
        ]
      })
    }
  }

  private async checkSuspiciousActivity(suspiciousRequests: number): Promise<void> {
    const config = this.configs.get(AlertType.SUSPICIOUS_ACTIVITY)
    if (!config?.enabled) return

    if (suspiciousRequests > config.threshold) {
      await this.triggerAlert(AlertType.SUSPICIOUS_ACTIVITY, {
        message: `Detected ${suspiciousRequests} suspicious requests, exceeding threshold of ${config.threshold}`,
        details: { suspiciousRequests, threshold: config.threshold },
        currentValue: suspiciousRequests,
        suggestedActions: [
          'Review security logs for patterns',
          'Check IP addresses for blocking',
          'Verify rate limiting configuration'
        ]
      })
    }
  }

  private async checkAuthFailures(authFailures: number): Promise<void> {
    const config = this.configs.get(AlertType.MULTIPLE_AUTH_FAILURES)
    if (!config?.enabled) return

    if (authFailures > config.threshold) {
      await this.triggerAlert(AlertType.MULTIPLE_AUTH_FAILURES, {
        message: `Detected ${authFailures} authentication failures, exceeding threshold of ${config.threshold}`,
        details: { authFailures, threshold: config.threshold },
        currentValue: authFailures,
        suggestedActions: [
          'Check for brute force attacks',
          'Review authentication logs',
          'Consider implementing account lockouts'
        ]
      })
    }
  }

  private async checkRateLimitHits(rateLimitHits: number): Promise<void> {
    const config = this.configs.get(AlertType.RATE_LIMIT_EXCEEDED)
    if (!config?.enabled) return

    if (rateLimitHits > config.threshold) {
      await this.triggerAlert(AlertType.RATE_LIMIT_EXCEEDED, {
        message: `Rate limit exceeded ${rateLimitHits} times, exceeding threshold of ${config.threshold}`,
        details: { rateLimitHits, threshold: config.threshold },
        currentValue: rateLimitHits,
        suggestedActions: [
          'Review rate limiting thresholds',
          'Check for legitimate high-usage patterns',
          'Consider adjusting rate limits'
        ]
      })
    }
  }

  /**
   * 🚨 Trigger alert with cooldown logic
   */
  private async triggerAlert(
    alertType: AlertType,
    alertData: Partial<AlertData>
  ): Promise<void> {
    const config = this.configs.get(alertType)
    if (!config?.enabled) return

    // Check cooldown period
    const lastAlertTime = this.lastAlertTimes.get(alertType)
    if (lastAlertTime) {
      const timeSinceLastAlert = Date.now() - lastAlertTime.getTime()
      const cooldownMs = config.cooldownMinutes * 60 * 1000
      
      if (timeSinceLastAlert < cooldownMs) {
        return // Still in cooldown period
      }
    }

    // Create full alert data
    const alert: AlertData = {
      type: alertType,
      severity: config.severity,
      message: alertData.message || `Alert triggered: ${alertType}`,
      details: alertData.details || {},
      timestamp: new Date(),
      threshold: config.threshold,
      currentValue: alertData.currentValue || 0,
      affectedUsers: alertData.affectedUsers,
      suggestedActions: alertData.suggestedActions
    }

    // Record alert
    this.lastAlertTimes.set(alertType, alert.timestamp)
    this.alertHistory.push(alert)

    // Keep history limited
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000)
    }

    // Send alert through configured channels
    await this.sendAlert(alert, config.channels)
  }

  /**
   * 📢 Send alert through specified channels
   */
  private async sendAlert(alert: AlertData, channels: AlertChannel[]): Promise<void> {
    const promises = channels.map(channel => this.sendToChannel(alert, channel))
    await Promise.allSettled(promises)
  }

  /**
   * 📡 Send alert to specific channel
   */
  private async sendToChannel(alert: AlertData, channel: AlertChannel): Promise<void> {
    try {
      switch (channel) {
        case AlertChannel.CONSOLE:
          this.sendToConsole(alert)
          break
        case AlertChannel.EMAIL:
          await this.sendToEmail(alert)
          break
        case AlertChannel.SLACK:
          await this.sendToSlack(alert)
          break
        case AlertChannel.WEBHOOK:
          await this.sendToWebhook(alert)
          break
        case AlertChannel.SMS:
          await this.sendToSMS(alert)
          break
      }
    } catch (error) {
      console.error(`[ALERTS] Failed to send alert to ${channel}:`, error)
    }
  }

  /**
   * 📺 Console channel implementation
   */
  private sendToConsole(alert: AlertData): void {
    const severityEmoji = {
      [AlertSeverity.LOW]: '🟡',
      [AlertSeverity.MEDIUM]: '🟠',
      [AlertSeverity.HIGH]: '🔴',
      [AlertSeverity.CRITICAL]: '🚨'
    }

    console.log(`${severityEmoji[alert.severity]} [ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      type: alert.type,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      details: alert.details,
      suggestedActions: alert.suggestedActions,
      timestamp: alert.timestamp.toISOString()
    })
  }

  /**
   * 📧 Email channel placeholder
   */
  private async sendToEmail(alert: AlertData): Promise<void> {
    // Implement email sending logic
    console.log('[ALERTS] Email alert would be sent:', alert.message)
    // Example: await emailService.send({
    //   to: process.env.ALERT_EMAIL,
    //   subject: `[${alert.severity.toUpperCase()}] FADDL Match Alert: ${alert.type}`,
    //   body: this.formatAlertEmail(alert)
    // })
  }

  /**
   * 💬 Slack channel placeholder
   */
  private async sendToSlack(alert: AlertData): Promise<void> {
    // Implement Slack webhook integration
    console.log('[ALERTS] Slack alert would be sent:', alert.message)
    // Example: await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(this.formatSlackMessage(alert))
    // })
  }

  /**
   * 🌐 Webhook channel placeholder
   */
  private async sendToWebhook(alert: AlertData): Promise<void> {
    console.log('[ALERTS] Webhook alert would be sent:', alert.message)
  }

  /**
   * 📱 SMS channel placeholder
   */
  private async sendToSMS(alert: AlertData): Promise<void> {
    console.log('[ALERTS] SMS alert would be sent:', alert.message)
  }

  /**
   * 📊 Get alert history and statistics
   */
  getAlertHistory(hours: number = 24): AlertData[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.alertHistory.filter(alert => alert.timestamp > cutoff)
  }

  getAlertStats(): {
    totalAlerts: number
    alertsByType: Record<AlertType, number>
    alertsBySeverity: Record<AlertSeverity, number>
  } {
    const stats = {
      totalAlerts: this.alertHistory.length,
      alertsByType: {} as Record<AlertType, number>,
      alertsBySeverity: {} as Record<AlertSeverity, number>
    }

    this.alertHistory.forEach(alert => {
      stats.alertsByType[alert.type] = (stats.alertsByType[alert.type] || 0) + 1
      stats.alertsBySeverity[alert.severity] = (stats.alertsBySeverity[alert.severity] || 0) + 1
    })

    return stats
  }

  /**
   * ⚙️ Configuration management
   */
  updateAlertConfig(type: AlertType, updates: Partial<AlertConfig>): void {
    const existing = this.configs.get(type)
    if (existing) {
      this.configs.set(type, { ...existing, ...updates })
    }
  }

  getAlertConfig(type: AlertType): AlertConfig | undefined {
    return this.configs.get(type)
  }

  getAllAlertConfigs(): AlertConfig[] {
    return Array.from(this.configs.values())
  }
}

// Global alert manager instance
export const alertManager = new AlertManager()

/**
 * 🎯 Convenience functions
 */
export const triggerManualAlert = async (
  type: AlertType,
  message: string,
  details?: Record<string, any>
) => {
  await (alertManager as any).triggerAlert(type, {
    message,
    details,
    currentValue: 1
  })
}

export const getAlertHistory = (hours: number = 24) => 
  alertManager.getAlertHistory(hours)

export const getAlertStats = () => 
  alertManager.getAlertStats()

export const updateAlertConfig = (type: AlertType, updates: Partial<AlertConfig>) =>
  alertManager.updateAlertConfig(type, updates)

export default alertManager