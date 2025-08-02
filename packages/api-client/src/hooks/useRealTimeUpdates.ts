/**
 * Real-time Updates Hook for FADDL Match
 * Comprehensive React hook for managing real-time subscriptions,
 * connection health, and performance monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { RealtimeConnectionManager } from '../realtime/connection'
import { RealtimeSubscriptionManager } from '../realtime/subscriptions'
import type { 
  ConnectionHealth, 
  PerformanceMetrics,
  RealtimeEvent,
  MessageEvent,
  MatchEvent,
  GuardianEvent,
  PresenceEvent,
  NotificationEvent,
  RealtimeConnectionConfig
} from '../realtime/types'

export interface UseRealTimeUpdatesOptions {
  userId: string
  authToken: string
  supabaseUrl: string
  supabaseKey: string
  isGuardian?: boolean
  connectionConfig?: Partial<RealtimeConnectionConfig>
  autoConnect?: boolean
  enableMetrics?: boolean
}

export interface RealTimeState {
  isConnected: boolean
  isConnecting: boolean
  health: ConnectionHealth | null
  metrics: PerformanceMetrics | null
  error: string | null
  subscriptionCount: number
  reconnectAttempts: number
}

export interface RealTimeActions {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  reconnect: () => Promise<void>
  subscribeToMessages: (conversationId: string) => Promise<string>
  subscribeToMatches: () => Promise<string>
  subscribeToGuardianNotifications: (guardianId: string) => Promise<string>
  subscribeToPresence: (conversationId: string) => Promise<string>
  subscribeToNotifications: () => Promise<string>
  unsubscribe: (subscriptionId: string) => Promise<void>
  unsubscribeAll: () => Promise<void>
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => Promise<void>
  sendPresenceUpdate: (conversationId: string, status: 'online' | 'offline') => Promise<void>
}

export interface RealTimeEvents {
  onMessage: (callback: (event: MessageEvent) => void) => () => void
  onMatch: (callback: (event: MatchEvent) => void) => () => void
  onGuardian: (callback: (event: GuardianEvent) => void) => () => void
  onPresence: (callback: (event: PresenceEvent) => void) => () => void
  onNotification: (callback: (event: NotificationEvent) => void) => () => void
  onConnectionChange: (callback: (isConnected: boolean) => void) => () => void
  onError: (callback: (error: string) => void) => () => void
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions) {
  const {
    userId,
    authToken,
    supabaseUrl,
    supabaseKey,
    isGuardian = false,
    connectionConfig,
    autoConnect = true,
    enableMetrics = true
  } = options

  // State
  const [state, setState] = useState<RealTimeState>({
    isConnected: false,
    isConnecting: false,
    health: null,
    metrics: null,
    error: null,
    subscriptionCount: 0,
    reconnectAttempts: 0
  })

  // Refs for managers
  const connectionManagerRef = useRef<RealtimeConnectionManager | null>(null)
  const subscriptionManagerRef = useRef<RealtimeSubscriptionManager | null>(null)
  const eventListenersRef = useRef(new Map<string, Set<Function>>())
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Initialize connection and subscription managers
   */
  const initializeManagers = useCallback(() => {
    if (connectionManagerRef.current) {
      return
    }

    try {
      // Initialize connection manager
      connectionManagerRef.current = new RealtimeConnectionManager(
        supabaseUrl,
        supabaseKey,
        authToken,
        connectionConfig
      )

      // Initialize subscription manager
      subscriptionManagerRef.current = new RealtimeSubscriptionManager(
        connectionManagerRef.current,
        userId,
        isGuardian
      )

      // Setup connection event listeners
      setupConnectionEventListeners()

      // Setup subscription event listeners
      setupSubscriptionEventListeners()

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize managers'
      }))
    }
  }, [userId, authToken, supabaseUrl, supabaseKey, isGuardian, connectionConfig])

  /**
   * Setup connection event listeners
   */
  const setupConnectionEventListeners = useCallback(() => {
    const connectionManager = connectionManagerRef.current
    if (!connectionManager) return

    connectionManager.on('connection:established', (health: ConnectionHealth) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        health,
        error: null,
        reconnectAttempts: 0
      }))
      emitEvent('connectionChange', true)
    })

    connectionManager.on('connection:closed', (health: ConnectionHealth) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        health,
        reconnectAttempts: prev.reconnectAttempts + 1
      }))
      emitEvent('connectionChange', false)
    })

    connectionManager.on('connection:error', (error: any) => {
      const errorMessage = error.message || 'Connection error'
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMessage
      }))
      emitEvent('error', errorMessage)
    })

    connectionManager.on('connection:high_latency', ({ latency }: { latency: number }) => {
      console.warn(`High latency detected: ${latency}ms`)
    })

    if (enableMetrics) {
      connectionManager.on('performance:update', (metrics: PerformanceMetrics) => {
        setState(prev => ({
          ...prev,
          metrics,
          subscriptionCount: metrics.subscriptionCount
        }))
      })
    }
  }, [enableMetrics])

  /**
   * Setup subscription event listeners
   */
  const setupSubscriptionEventListeners = useCallback(() => {
    const subscriptionManager = subscriptionManagerRef.current
    if (!subscriptionManager) return

    subscriptionManager.on('message:received', (event: MessageEvent) => {
      emitEvent('message', event)
    })

    subscriptionManager.on('match:updated', (event: MatchEvent) => {
      emitEvent('match', event)
    })

    subscriptionManager.on('guardian:activity', (event: GuardianEvent) => {
      emitEvent('guardian', event)
    })

    subscriptionManager.on('presence:updated', (event: PresenceEvent) => {
      emitEvent('presence', event)
    })

    subscriptionManager.on('notification:received', (event: NotificationEvent) => {
      emitEvent('notification', event)
    })

    subscriptionManager.on('subscription:error', (error: any) => {
      const errorMessage = error.message || 'Subscription error'
      setState(prev => ({ ...prev, error: errorMessage }))
      emitEvent('error', errorMessage)
    })
  }, [])

  /**
   * Connect to real-time services
   */
  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      initializeManagers()
      
      if (connectionManagerRef.current) {
        await connectionManagerRef.current.connect()
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }))
      throw error
    }
  }, [state.isConnected, state.isConnecting, initializeManagers])

  /**
   * Disconnect from real-time services
   */
  const disconnect = useCallback(async () => {
    try {
      if (connectionManagerRef.current) {
        await connectionManagerRef.current.disconnect()
      }

      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        health: null,
        subscriptionCount: 0
      }))
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }, [])

  /**
   * Reconnect to real-time services
   */
  const reconnect = useCallback(async () => {
    await disconnect()
    await connect()
  }, [disconnect, connect])

  /**
   * Subscribe to message updates
   */
  const subscribeToMessages = useCallback(async (conversationId: string): Promise<string> => {
    if (!subscriptionManagerRef.current) {
      throw new Error('Subscription manager not initialized')
    }

    return subscriptionManagerRef.current.subscribeToMessages(conversationId)
  }, [])

  /**
   * Subscribe to match updates
   */
  const subscribeToMatches = useCallback(async (): Promise<string> => {
    if (!subscriptionManagerRef.current) {
      throw new Error('Subscription manager not initialized')
    }

    return subscriptionManagerRef.current.subscribeToMatches()
  }, [])

  /**
   * Subscribe to guardian notifications
   */
  const subscribeToGuardianNotifications = useCallback(async (guardianId: string): Promise<string> => {
    if (!subscriptionManagerRef.current) {
      throw new Error('Subscription manager not initialized')
    }

    return subscriptionManagerRef.current.subscribeToGuardianNotifications(guardianId)
  }, [])

  /**
   * Subscribe to presence updates
   */
  const subscribeToPresence = useCallback(async (conversationId: string): Promise<string> => {
    if (!subscriptionManagerRef.current) {
      throw new Error('Subscription manager not initialized')
    }

    return subscriptionManagerRef.current.subscribeToPresence(conversationId)
  }, [])

  /**
   * Subscribe to notifications
   */
  const subscribeToNotifications = useCallback(async (): Promise<string> => {
    if (!subscriptionManagerRef.current) {
      throw new Error('Subscription manager not initialized')
    }

    return subscriptionManagerRef.current.subscribeToNotifications()
  }, [])

  /**
   * Unsubscribe from a specific subscription
   */
  const unsubscribe = useCallback(async (subscriptionId: string): Promise<void> => {
    if (!subscriptionManagerRef.current) {
      return
    }

    await subscriptionManagerRef.current.unsubscribe(subscriptionId)
    
    setState(prev => ({
      ...prev,
      subscriptionCount: Math.max(0, prev.subscriptionCount - 1)
    }))
  }, [])

  /**
   * Unsubscribe from all subscriptions
   */
  const unsubscribeAll = useCallback(async (): Promise<void> => {
    if (!subscriptionManagerRef.current) {
      return
    }

    await subscriptionManagerRef.current.unsubscribeAll()
    
    setState(prev => ({
      ...prev,
      subscriptionCount: 0
    }))
  }, [])

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean): Promise<void> => {
    if (!subscriptionManagerRef.current) {
      return
    }

    await subscriptionManagerRef.current.sendTypingIndicator(conversationId, isTyping)
  }, [])

  /**
   * Send presence update
   */
  const sendPresenceUpdate = useCallback(async (conversationId: string, status: 'online' | 'offline'): Promise<void> => {
    if (!subscriptionManagerRef.current) {
      return
    }

    await subscriptionManagerRef.current.sendPresenceUpdate(conversationId, status)
  }, [])

  /**
   * Register event listener
   */
  const addEventListener = useCallback((event: string, callback: Function): (() => void) => {
    const listeners = eventListenersRef.current
    
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    
    listeners.get(event)!.add(callback)
    
    return () => {
      listeners.get(event)?.delete(callback)
    }
  }, [])

  /**
   * Emit event to listeners
   */
  const emitEvent = useCallback((event: string, data?: any): void => {
    const listeners = eventListenersRef.current.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error)
        }
      })
    }
  }, [])

  /**
   * Update auth token
   */
  const updateAuthToken = useCallback((newToken: string) => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.updateAuthToken(newToken)
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !state.isConnected && !state.isConnecting) {
      connect().catch(console.error)
    }
  }, [autoConnect, state.isConnected, state.isConnecting, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }

      disconnect().catch(console.error)
      
      // Cleanup managers
      connectionManagerRef.current?.destroy()
      subscriptionManagerRef.current?.destroy()
      
      // Clear event listeners
      eventListenersRef.current.clear()
    }
  }, [disconnect])

  // Actions object
  const actions: RealTimeActions = {
    connect,
    disconnect,
    reconnect,
    subscribeToMessages,
    subscribeToMatches,
    subscribeToGuardianNotifications,
    subscribeToPresence,
    subscribeToNotifications,
    unsubscribe,
    unsubscribeAll,
    sendTypingIndicator,
    sendPresenceUpdate
  }

  // Events object
  const events: RealTimeEvents = {
    onMessage: (callback) => addEventListener('message', callback),
    onMatch: (callback) => addEventListener('match', callback),
    onGuardian: (callback) => addEventListener('guardian', callback),
    onPresence: (callback) => addEventListener('presence', callback),
    onNotification: (callback) => addEventListener('notification', callback),
    onConnectionChange: (callback) => addEventListener('connectionChange', callback),
    onError: (callback) => addEventListener('error', callback)
  }

  return {
    state,
    actions,
    events,
    updateAuthToken,
    // Direct access to managers for advanced use cases
    connectionManager: connectionManagerRef.current,
    subscriptionManager: subscriptionManagerRef.current
  }
}