/**
 * Connection Status Hook for FADDL Match
 * Monitor network connectivity, API health, and real-time connection status
 * with intelligent fallback strategies and user feedback
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionHealth, PerformanceMetrics } from '../realtime/types'

export interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown'
  downlink: number
  rtt: number
  saveData: boolean
}

export interface APIHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  latency: number
  errorRate: number
  lastCheck: Date
  uptime: number
  services: {
    messaging: 'healthy' | 'degraded' | 'unhealthy'
    matches: 'healthy' | 'degraded' | 'unhealthy'
    guardian: 'healthy' | 'degraded' | 'unhealthy'
    notifications: 'healthy' | 'degraded' | 'unhealthy'
  }
}

export interface RealtimeStatus {
  isConnected: boolean
  isReconnecting: boolean
  health: ConnectionHealth | null
  metrics: PerformanceMetrics | null
  subscriptionCount: number
  lastActivity: Date | null
}

export interface ConnectionStatusState {
  network: NetworkStatus
  api: APIHealth
  realtime: RealtimeStatus
  overall: 'excellent' | 'good' | 'poor' | 'offline'
  recommendations: string[]
  isInitialized: boolean
}

export interface UseConnectionStatusOptions {
  enableNetworkMonitoring?: boolean
  enableAPIHealthChecks?: boolean
  enableRealtimeMonitoring?: boolean
  healthCheckInterval?: number
  apiEndpoint?: string
  authToken?: string
  onStatusChange?: (status: ConnectionStatusState) => void
  onRecommendation?: (recommendations: string[]) => void
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}) {
  const {
    enableNetworkMonitoring = true,
    enableAPIHealthChecks = true,
    enableRealtimeMonitoring = true,
    healthCheckInterval = 60000, // 1 minute
    apiEndpoint,
    authToken,
    onStatusChange,
    onRecommendation
  } = options

  // State
  const [status, setStatus] = useState<ConnectionStatusState>({
    network: {
      isOnline: navigator.onLine,
      isSlowConnection: false,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    },
    api: {
      status: 'unknown',
      latency: 0,
      errorRate: 0,
      lastCheck: new Date(),
      uptime: 100,
      services: {
        messaging: 'healthy',
        matches: 'healthy',
        guardian: 'healthy',
        notifications: 'healthy'
      }
    },
    realtime: {
      isConnected: false,
      isReconnecting: false,
      health: null,
      metrics: null,
      subscriptionCount: 0,
      lastActivity: null
    },
    overall: 'offline',
    recommendations: [],
    isInitialized: false
  })

  // Refs
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const networkConnectionRef = useRef<any>(null)
  const previousStatusRef = useRef<ConnectionStatusState>(status)

  /**
   * Get network connection information
   */
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (!connection) {
      return {
        isOnline: navigator.onLine,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      }
    }

    networkConnectionRef.current = connection

    const isSlowConnection = connection.effectiveType === '2g' || 
                           connection.effectiveType === 'slow-2g' ||
                           connection.downlink < 1

    return {
      isOnline: navigator.onLine,
      isSlowConnection,
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    }
  }, [])

  /**
   * Perform API health check
   */
  const performAPIHealthCheck = useCallback(async (): Promise<APIHealth> => {
    if (!apiEndpoint || !authToken) {
      return status.api
    }

    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Test core API endpoint
      const response = await fetch(`${apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const latency = Date.now() - startTime
      const isHealthy = response.ok

      if (!isHealthy) {
        errors.push(`API returned ${response.status}`)
      }

      // Test individual services (simplified)
      const serviceTests = await Promise.allSettled([
        fetch(`${apiEndpoint}/messages-health`, { 
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000)
        }),
        fetch(`${apiEndpoint}/matches-health`, { 
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000)
        }),
        fetch(`${apiEndpoint}/guardian-health`, { 
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000)
        }),
        fetch(`${apiEndpoint}/notifications-health`, { 
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000)
        })
      ])

      const services = {
        messaging: serviceTests[0].status === 'fulfilled' && serviceTests[0].value.ok ? 'healthy' : 'unhealthy',
        matches: serviceTests[1].status === 'fulfilled' && serviceTests[1].value.ok ? 'healthy' : 'unhealthy',
        guardian: serviceTests[2].status === 'fulfilled' && serviceTests[2].value.ok ? 'healthy' : 'unhealthy',
        notifications: serviceTests[3].status === 'fulfilled' && serviceTests[3].value.ok ? 'healthy' : 'unhealthy'
      } as const

      const errorRate = errors.length > 0 ? (errors.length / 5) * 100 : 0
      const healthyServices = Object.values(services).filter(s => s === 'healthy').length
      const uptime = (healthyServices / 4) * 100

      let apiStatus: 'healthy' | 'degraded' | 'unhealthy'
      if (uptime >= 90) {
        apiStatus = 'healthy'
      } else if (uptime >= 50) {
        apiStatus = 'degraded'
      } else {
        apiStatus = 'unhealthy'
      }

      return {
        status: apiStatus,
        latency,
        errorRate,
        lastCheck: new Date(),
        uptime,
        services
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: 0,
        errorRate: 100,
        lastCheck: new Date(),
        uptime: 0,
        services: {
          messaging: 'unhealthy',
          matches: 'unhealthy',
          guardian: 'unhealthy',
          notifications: 'unhealthy'
        }
      }
    }
  }, [apiEndpoint, authToken, status.api])

  /**
   * Calculate overall connection status
   */
  const calculateOverallStatus = useCallback((
    network: NetworkStatus,
    api: APIHealth,
    realtime: RealtimeStatus
  ): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!network.isOnline) {
      return 'offline'
    }

    const networkScore = network.isSlowConnection ? 2 : 4
    const apiScore = api.status === 'healthy' ? 4 : api.status === 'degraded' ? 2 : 0
    const realtimeScore = realtime.isConnected ? 2 : 0

    const totalScore = networkScore + apiScore + realtimeScore

    if (totalScore >= 9) return 'excellent'
    if (totalScore >= 6) return 'good'
    if (totalScore >= 3) return 'poor'
    return 'offline'
  }, [])

  /**
   * Generate recommendations based on status
   */
  const generateRecommendations = useCallback((
    network: NetworkStatus,
    api: APIHealth,
    realtime: RealtimeStatus
  ): string[] => {
    const recommendations: string[] = []

    if (!network.isOnline) {
      recommendations.push('Check your internet connection')
      return recommendations
    }

    if (network.isSlowConnection) {
      recommendations.push('Slow connection detected - consider switching to WiFi')
      recommendations.push('Some features may be limited to save data')
    }

    if (api.status === 'unhealthy') {
      recommendations.push('API services are experiencing issues')
      recommendations.push('Try refreshing the page or check back later')
    } else if (api.status === 'degraded') {
      recommendations.push('Some features may be slower than usual')
    }

    if (!realtime.isConnected && network.isOnline) {
      recommendations.push('Real-time features are unavailable')
      recommendations.push('You may not receive instant notifications')
    }

    if (api.latency > 1000) {
      recommendations.push('High latency detected - responses may be slower')
    }

    return recommendations
  }, [])

  /**
   * Update connection status
   */
  const updateStatus = useCallback((updates: Partial<ConnectionStatusState>) => {
    setStatus(prevStatus => {
      const newStatus = { ...prevStatus, ...updates }
      
      // Recalculate overall status and recommendations
      const overall = calculateOverallStatus(newStatus.network, newStatus.api, newStatus.realtime)
      const recommendations = generateRecommendations(newStatus.network, newStatus.api, newStatus.realtime)
      
      const finalStatus = {
        ...newStatus,
        overall,
        recommendations,
        isInitialized: true
      }

      // Notify if status changed significantly
      const previousOverall = previousStatusRef.current.overall
      if (previousOverall !== overall) {
        onStatusChange?.(finalStatus)
      }

      // Notify if recommendations changed
      const previousRecommendations = previousStatusRef.current.recommendations
      if (JSON.stringify(previousRecommendations) !== JSON.stringify(recommendations)) {
        onRecommendation?.(recommendations)
      }

      previousStatusRef.current = finalStatus
      return finalStatus
    })
  }, [calculateOverallStatus, generateRecommendations, onStatusChange, onRecommendation])

  /**
   * Update network status
   */
  const updateNetworkStatus = useCallback(() => {
    if (!enableNetworkMonitoring) return

    const networkInfo = getNetworkInfo()
    updateStatus({ network: networkInfo })
  }, [enableNetworkMonitoring, getNetworkInfo, updateStatus])

  /**
   * Update API health status
   */
  const updateAPIHealth = useCallback(async () => {
    if (!enableAPIHealthChecks) return

    try {
      const apiHealth = await performAPIHealthCheck()
      updateStatus({ api: apiHealth })
    } catch (error) {
      console.error('API health check failed:', error)
    }
  }, [enableAPIHealthChecks, performAPIHealthCheck, updateStatus])

  /**
   * Update realtime status
   */
  const updateRealtimeStatus = useCallback((realtimeStatus: Partial<RealtimeStatus>) => {
    if (!enableRealtimeMonitoring) return

    updateStatus({ 
      realtime: { 
        ...status.realtime, 
        ...realtimeStatus 
      } 
    })
  }, [enableRealtimeMonitoring, status.realtime, updateStatus])

  /**
   * Manual refresh of all status
   */
  const refresh = useCallback(async () => {
    updateNetworkStatus()
    await updateAPIHealth()
  }, [updateNetworkStatus, updateAPIHealth])

  /**
   * Get status summary for display
   */
  const getStatusSummary = useCallback(() => {
    const { network, api, realtime, overall } = status

    return {
      overall,
      isOnline: network.isOnline,
      isSlowConnection: network.isSlowConnection,
      apiStatus: api.status,
      realtimeConnected: realtime.isConnected,
      latency: api.latency,
      recommendations: status.recommendations
    }
  }, [status])

  // Initialize and setup event listeners
  useEffect(() => {
    if (enableNetworkMonitoring) {
      // Initial network status
      updateNetworkStatus()

      // Network event listeners
      const handleOnline = () => updateNetworkStatus()
      const handleOffline = () => updateNetworkStatus()
      const handleConnectionChange = () => updateNetworkStatus()

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      if (networkConnectionRef.current) {
        networkConnectionRef.current.addEventListener('change', handleConnectionChange)
      }

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        
        if (networkConnectionRef.current) {
          networkConnectionRef.current.removeEventListener('change', handleConnectionChange)
        }
      }
    }
  }, [enableNetworkMonitoring, updateNetworkStatus])

  // Setup periodic health checks
  useEffect(() => {
    if (enableAPIHealthChecks && healthCheckInterval > 0) {
      // Initial health check
      updateAPIHealth()

      // Periodic health checks
      healthCheckIntervalRef.current = setInterval(updateAPIHealth, healthCheckInterval)

      return () => {
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current)
        }
      }
    }
  }, [enableAPIHealthChecks, healthCheckInterval, updateAPIHealth])

  // Cleanup
  useEffect(() => {
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
      }
    }
  }, [])

  return {
    status,
    updateRealtimeStatus,
    refresh,
    getStatusSummary,
    // Utilities
    isOnline: status.network.isOnline,
    isSlowConnection: status.network.isSlowConnection,
    overallStatus: status.overall,
    recommendations: status.recommendations
  }
}