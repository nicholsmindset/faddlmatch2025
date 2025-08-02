/**
 * API Client Hook for FADDL Match
 * Centralized hook for accessing all API services with
 * authentication, caching, and error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { FaddlMatchApiClient } from '../index'
import { MessagingService } from '../services/messaging'
import { GuardianService } from '../services/guardian'
import { MatchesService } from '../services/matches'
import { NotificationsService } from '../services/notifications'
import type { ApiClientConfig } from '../index'

export interface UseAPIClientOptions extends ApiClientConfig {
  userId: string
  isGuardian?: boolean
  enableCaching?: boolean
  retryAttempts?: number
  timeout?: number
}

export interface APIClientState {
  isInitialized: boolean
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastActivity: Date | null
}

export interface APIServices {
  core: FaddlMatchApiClient
  messaging: MessagingService
  guardian: GuardianService
  matches: MatchesService
  notifications: NotificationsService
}

export function useAPIClient(options: UseAPIClientOptions) {
  const {
    supabaseUrl,
    supabaseKey,
    authToken,
    userId,
    isGuardian = false,
    enableCaching = true,
    retryAttempts = 3,
    timeout = 30000
  } = options

  // State
  const [state, setState] = useState<APIClientState>({
    isInitialized: false,
    isAuthenticated: !!authToken,
    isLoading: false,
    error: null,
    connectionStatus: 'disconnected',
    lastActivity: null
  })

  // Services ref
  const servicesRef = useRef<APIServices | null>(null)
  const initializingRef = useRef(false)

  /**
   * Initialize API services
   */
  const initializeServices = useCallback(async () => {
    if (servicesRef.current || initializingRef.current) {
      return servicesRef.current
    }

    initializingRef.current = true
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Initialize core API client
      const coreClient = new FaddlMatchApiClient({
        supabaseUrl,
        supabaseKey,
        authToken
      })

      const baseUrl = `${supabaseUrl}/functions/v1`

      // Initialize specialized services
      const messaging = new MessagingService(
        coreClient.getSupabaseClient(),
        authToken,
        userId,
        baseUrl
      )

      const guardian = new GuardianService(
        coreClient.getSupabaseClient(),
        authToken,
        userId,
        baseUrl,
        isGuardian
      )

      const matches = new MatchesService(
        coreClient.getSupabaseClient(),
        authToken,
        userId,
        baseUrl
      )

      const notifications = new NotificationsService(
        coreClient.getSupabaseClient(),
        authToken,
        userId,
        baseUrl
      )

      const services: APIServices = {
        core: coreClient,
        messaging,
        guardian,
        matches,
        notifications
      }

      servicesRef.current = services

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        connectionStatus: 'connected',
        lastActivity: new Date()
      }))

      return services
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize API client'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        connectionStatus: 'error'
      }))

      throw error
    } finally {
      initializingRef.current = false
    }
  }, [supabaseUrl, supabaseKey, authToken, userId, isGuardian])

  /**
   * Update authentication token
   */
  const updateAuthToken = useCallback((newToken: string) => {
    if (servicesRef.current) {
      servicesRef.current.core.setAuthToken(newToken)
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: !!newToken,
        lastActivity: new Date()
      }))
    }
  }, [])

  /**
   * Retry failed operations
   */
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    attempts: number = retryAttempts
  ): Promise<T> => {
    let lastError: Error

    for (let i = 0; i < attempts; i++) {
      try {
        const result = await operation()
        setState(prev => ({ 
          ...prev, 
          error: null, 
          connectionStatus: 'connected',
          lastActivity: new Date()
        }))
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (i < attempts - 1) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, i), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    setState(prev => ({ 
      ...prev, 
      error: lastError!.message,
      connectionStatus: 'error'
    }))
    
    throw lastError!
  }, [retryAttempts])

  /**
   * Execute API call with error handling and retry logic
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await retry(operation)
      return result
    } catch (error) {
      throw error
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [retry])

  /**
   * Health check for API services
   */
  const healthCheck = useCallback(async (): Promise<boolean> => {
    if (!servicesRef.current) {
      return false
    }

    try {
      // Simple health check - attempt to get user profile
      const response = await servicesRef.current.core.getProfile(userId)
      const isHealthy = response.success || response.error?.includes('not found')
      
      setState(prev => ({
        ...prev,
        connectionStatus: isHealthy ? 'connected' : 'error',
        lastActivity: new Date()
      }))

      return isHealthy
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: 'Health check failed'
      }))
      return false
    }
  }, [userId])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Reset API client
   */
  const reset = useCallback(async () => {
    // Cleanup existing services
    if (servicesRef.current) {
      servicesRef.current.messaging.destroy()
      servicesRef.current.guardian.destroy()
      servicesRef.current.matches.destroy()
      servicesRef.current.notifications.destroy()
    }

    servicesRef.current = null
    initializingRef.current = false

    setState({
      isInitialized: false,
      isAuthenticated: !!authToken,
      isLoading: false,
      error: null,
      connectionStatus: 'disconnected',
      lastActivity: null
    })

    // Re-initialize
    await initializeServices()
  }, [authToken, initializeServices])

  /**
   * Get API services (initialize if needed)
   */
  const getServices = useCallback(async (): Promise<APIServices> => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    return initializeServices()
  }, [initializeServices])

  // Auto-initialize on mount
  useEffect(() => {
    if (authToken && userId && !state.isInitialized && !initializingRef.current) {
      initializeServices().catch(console.error)
    }
  }, [authToken, userId, state.isInitialized, initializeServices])

  // Periodic health checks
  useEffect(() => {
    if (!state.isInitialized || !authToken) {
      return
    }

    const healthCheckInterval = setInterval(() => {
      healthCheck().catch(console.error)
    }, 60000) // Check every minute

    return () => clearInterval(healthCheckInterval)
  }, [state.isInitialized, authToken, healthCheck])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (servicesRef.current) {
        servicesRef.current.messaging.destroy()
        servicesRef.current.guardian.destroy()
        servicesRef.current.matches.destroy()
        servicesRef.current.notifications.destroy()
      }
    }
  }, [])

  // Convenience methods for common operations
  const api = {
    // Profile operations
    getProfile: useCallback(async () => {
      const services = await getServices()
      return executeWithRetry(() => services.core.getProfile(userId))
    }, [getServices, executeWithRetry, userId]),

    updateProfile: useCallback(async (updates: any) => {
      const services = await getServices()
      return executeWithRetry(() => services.core.updateProfile(userId, updates))
    }, [getServices, executeWithRetry, userId]),

    // Messaging operations
    sendMessage: useCallback(async (request: any) => {
      const services = await getServices()
      return executeWithRetry(() => services.messaging.sendMessage(request))
    }, [getServices, executeWithRetry]),

    getConversations: useCallback(async (limit?: number) => {
      const services = await getServices()
      return executeWithRetry(() => services.messaging.getConversations(limit))
    }, [getServices, executeWithRetry]),

    // Match operations
    getDailyMatches: useCallback(async () => {
      const services = await getServices()
      return executeWithRetry(() => services.matches.getDailyMatches())
    }, [getServices, executeWithRetry]),

    respondToMatch: useCallback(async (matchId: string, response: 'accepted' | 'rejected') => {
      const services = await getServices()
      return executeWithRetry(() => services.matches.respondToMatch(matchId, response))
    }, [getServices, executeWithRetry]),

    // Guardian operations
    getDashboard: useCallback(async () => {
      const services = await getServices()
      return executeWithRetry(() => services.guardian.getDashboard())
    }, [getServices, executeWithRetry]),

    reviewApproval: useCallback(async (requestId: string, decision: 'approved' | 'rejected', notes?: string) => {
      const services = await getServices()
      return executeWithRetry(() => services.guardian.reviewApprovalRequest(requestId, decision, notes))
    }, [getServices, executeWithRetry]),

    // Notification operations
    getNotifications: useCallback(async (options?: any) => {
      const services = await getServices()
      return executeWithRetry(() => services.notifications.getNotifications(options))
    }, [getServices, executeWithRetry]),

    markNotificationRead: useCallback(async (notificationId: string) => {
      const services = await getServices()
      return executeWithRetry(() => services.notifications.markAsRead(notificationId))
    }, [getServices, executeWithRetry])
  }

  return {
    // State
    state,
    
    // Services (async getter)
    getServices,
    
    // Direct service access (may be null if not initialized)
    services: servicesRef.current,
    
    // Actions
    updateAuthToken,
    healthCheck,
    clearError,
    reset,
    
    // Convenience API methods
    api,
    
    // Utilities
    executeWithRetry,
    retry
  }
}