/**
 * Basic Usage Example - FADDL Match Real-Time API Integration
 * Demonstrates core functionality with Islamic compliance and guardian oversight
 */

import React, { useEffect, useState } from 'react'
import { 
  useRealTimeUpdates, 
  useAPIClient, 
  useConnectionStatus,
  type Message,
  type Match,
  type Notification
} from '@faddlmatch/api-client'

interface ExampleAppProps {
  userId: string
  authToken: string
  supabaseUrl: string
  supabaseKey: string
  isGuardian?: boolean
}

export function ExampleApp({
  userId,
  authToken,
  supabaseUrl,
  supabaseKey,
  isGuardian = false
}: ExampleAppProps) {
  // Connection status monitoring
  const { status, recommendations } = useConnectionStatus({
    enableNetworkMonitoring: true,
    enableAPIHealthChecks: true,
    apiEndpoint: `${supabaseUrl}/functions/v1`,
    authToken,
    onStatusChange: (newStatus) => {
      console.log('Connection status changed:', newStatus.overall)
    }
  })

  // API client with all services
  const { api, services, state: apiState } = useAPIClient({
    supabaseUrl,
    supabaseKey,
    authToken,
    userId,
    isGuardian,
    enableCaching: true,
    retryAttempts: 3
  })

  // Real-time updates
  const { 
    state: realtimeState, 
    actions: realtimeActions, 
    events 
  } = useRealTimeUpdates({
    userId,
    authToken,
    supabaseUrl,
    supabaseKey,
    isGuardian,
    autoConnect: true,
    enableMetrics: true
  })

  // Component state
  const [messages, setMessages] = useState<Message[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)

  // Initialize subscriptions
  useEffect(() => {
    if (!realtimeState.isConnected) return

    const initializeSubscriptions = async () => {
      try {
        // Subscribe to matches
        await realtimeActions.subscribeToMatches()
        
        // Subscribe to notifications
        await realtimeActions.subscribeToNotifications()
        
        // Subscribe to messages if conversation is active
        if (activeConversation) {
          await realtimeActions.subscribeToMessages(activeConversation)
        }
      } catch (error) {
        console.error('Failed to initialize subscriptions:', error)
      }
    }

    initializeSubscriptions()
  }, [realtimeState.isConnected, activeConversation, realtimeActions])

  // Handle real-time events
  useEffect(() => {
    // New message handler with Islamic compliance
    const unsubscribeMessages = events.onMessage((message) => {
      console.log('New message received:', message)
      
      // Automatically filtered for Islamic compliance
      if (message.conversationId === activeConversation) {
        setMessages(prev => [...prev, message])
      }
      
      // Play notification sound if message is compliant
      if (message.moderationStatus === 'approved') {
        playNotificationSound()
      }
    })

    // Match updates
    const unsubscribeMatches = events.onMatch((match) => {
      console.log('Match update:', match)
      
      if (match.type === 'match:new') {
        setMatches(prev => [...prev, match])
        showMatchNotification(match)
      } else if (match.type === 'match:mutual') {
        showMutualMatchCelebration(match)
      }
    })

    // Guardian events (if user is guardian)
    const unsubscribeGuardian = events.onGuardian((guardianEvent) => {
      console.log('Guardian event:', guardianEvent)
      
      if (guardianEvent.type === 'guardian:approval_request') {
        showGuardianApprovalNotification(guardianEvent)
      }
    })

    // Notification events
    const unsubscribeNotifications = events.onNotification((notification) => {
      console.log('New notification:', notification)
      setNotifications(prev => [...prev, notification])
      
      // Show system notification based on priority
      if (notification.priority === 'urgent') {
        showSystemNotification(notification)
      }
    })

    // Connection status changes
    const unsubscribeConnection = events.onConnectionChange((isConnected) => {
      if (isConnected) {
        console.log('Real-time connection established')
        showConnectionStatus('Connected', 'success')
      } else {
        console.log('Real-time connection lost')
        showConnectionStatus('Disconnected', 'error')
      }
    })

    return () => {
      unsubscribeMessages()
      unsubscribeMatches()
      unsubscribeGuardian()
      unsubscribeNotifications()
      unsubscribeConnection()
    }
  }, [events, activeConversation])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load conversations
        const conversations = await api.getConversations(20)
        console.log('Loaded conversations:', conversations)

        // Load daily matches
        const dailyMatches = await api.getDailyMatches()
        setMatches(dailyMatches.matches || [])

        // Load notifications
        const { notifications: notifs } = await api.getNotifications({
          status: 'unread',
          limit: 50
        })
        setNotifications(notifs)

        // Load guardian dashboard if guardian
        if (isGuardian && services) {
          const dashboard = await services.guardian.getDashboard()
          console.log('Guardian dashboard:', dashboard)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    if (apiState.isInitialized) {
      loadInitialData()
    }
  }, [apiState.isInitialized, api, services, isGuardian])

  // Send message with Islamic compliance
  const sendMessage = async (content: string) => {
    if (!activeConversation || !services) return

    try {
      const response = await services.messaging.sendMessage({
        conversationId: activeConversation,
        content,
        messageType: 'text'
      })

      if (response.requiresApproval) {
        showComplianceNotification('Message sent for guardian review')
      } else {
        console.log('Message sent successfully:', response.messageId)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      showErrorNotification('Failed to send message')
    }
  }

  // Respond to match with guardian workflow
  const respondToMatch = async (matchId: string, response: 'accepted' | 'rejected') => {
    try {
      const result = await api.respondToMatch(matchId, response)
      
      if (result.requiresGuardianApproval) {
        showComplianceNotification('Match response sent for guardian approval')
      } else if (result.isMutual) {
        showMutualMatchCelebration(result)
        // Auto-subscribe to new conversation
        if (result.conversationId) {
          setActiveConversation(result.conversationId)
          await realtimeActions.subscribeToMessages(result.conversationId)
        }
      }
    } catch (error) {
      console.error('Failed to respond to match:', error)
      showErrorNotification('Failed to respond to match')
    }
  }

  // Guardian approval action
  const handleGuardianApproval = async (requestId: string, decision: 'approved' | 'rejected') => {
    if (!services) return

    try {
      await services.guardian.reviewApprovalRequest(
        requestId,
        decision,
        decision === 'approved' ? 'Approved with Islamic values in mind' : 'Declined'
      )
      
      showSuccessNotification(`Request ${decision} successfully`)
    } catch (error) {
      console.error('Failed to process guardian approval:', error)
      showErrorNotification('Failed to process approval')
    }
  }

  // Helper functions
  const playNotificationSound = () => {
    // Islamic notification sound
    const audio = new Audio('/sounds/islamic-notification.mp3')
    audio.play().catch(console.error)
  }

  const showMatchNotification = (match: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Match Found!', {
        body: `You have a new match with ${match.compatibility}% compatibility`,
        icon: '/icons/match-notification.png'
      })
    }
  }

  const showMutualMatchCelebration = (match: any) => {
    console.log('🎉 Mutual match celebration!', match)
    // Show celebration animation
  }

  const showGuardianApprovalNotification = (event: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Guardian Approval Required', {
        body: 'A new match requires your approval',
        icon: '/icons/guardian-notification.png'
      })
    }
  }

  const showSystemNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/system-notification.png'
      })
    }
  }

  const showConnectionStatus = (message: string, type: 'success' | 'error') => {
    console.log(`Connection: ${message} (${type})`)
    // Show UI notification
  }

  const showComplianceNotification = (message: string) => {
    console.log('Islamic Compliance:', message)
    // Show compliance UI notification
  }

  const showSuccessNotification = (message: string) => {
    console.log('Success:', message)
    // Show success UI notification
  }

  const showErrorNotification = (message: string) => {
    console.error('Error:', message)
    // Show error UI notification
  }

  return (
    <div className="faddl-match-app">
      <header className="app-header">
        <h1>FADDL Match - Real-Time Demo</h1>
        <div className="status-indicators">
          <div className={`status-indicator ${status.overall}`}>
            Network: {status.overall}
          </div>
          <div className={`status-indicator ${realtimeState.isConnected ? 'connected' : 'disconnected'}`}>
            Real-time: {realtimeState.isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="subscriptions">
            Active Subscriptions: {realtimeState.subscriptionCount}
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Connection Recommendations */}
        {recommendations.length > 0 && (
          <div className="recommendations">
            <h3>Connection Recommendations:</h3>
            <ul>
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Matches Section */}
        <section className="matches-section">
          <h2>Daily Matches ({matches.length})</h2>
          <div className="matches-grid">
            {matches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-info">
                  <h3>{match.otherUser.firstName}</h3>
                  <p>Compatibility: {match.compatibilityScore}%</p>
                  <p>Religious Level: {match.otherUser.religiousProfile.religiousLevel}</p>
                </div>
                <div className="match-actions">
                  <button 
                    onClick={() => respondToMatch(match.id, 'accepted')}
                    className="accept-btn"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => respondToMatch(match.id, 'rejected')}
                    className="reject-btn"
                  >
                    Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Messages Section */}
        <section className="messages-section">
          <h2>Messages</h2>
          {activeConversation && (
            <div className="message-thread">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.senderId === userId ? 'own' : 'other'}`}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-meta">
                    {message.timestamp.toLocaleTimeString()}
                    {message.moderationStatus === 'pending' && (
                      <span className="moderation-badge">Pending Review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="message-input">
            <input 
              type="text" 
              placeholder="Type your message (Islamic values maintained)..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value.trim())
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </section>

        {/* Guardian Section (if guardian) */}
        {isGuardian && (
          <section className="guardian-section">
            <h2>Guardian Dashboard</h2>
            <div className="guardian-stats">
              <div className="stat">
                <h3>Pending Approvals</h3>
                <p>3</p>
              </div>
              <div className="stat">
                <h3>Compliance Score</h3>
                <p>95%</p>
              </div>
            </div>
            <div className="approval-requests">
              {/* Guardian approval UI would go here */}
            </div>
          </section>
        )}

        {/* Notifications Section */}
        <section className="notifications-section">
          <h2>Notifications ({notifications.filter(n => n.status === 'unread').length} unread)</h2>
          <div className="notifications-list">
            {notifications.slice(0, 5).map((notification) => (
              <div 
                key={notification.id} 
                className={`notification ${notification.status} ${notification.priority}`}
              >
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                </div>
                <div className="notification-meta">
                  {notification.createdAt.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Performance Metrics */}
        {realtimeState.metrics && (
          <section className="metrics-section">
            <h2>Performance Metrics</h2>
            <div className="metrics-grid">
              <div className="metric">
                <h3>Latency</h3>
                <p>{realtimeState.metrics.connectionLatency}ms</p>
              </div>
              <div className="metric">
                <h3>Event Throughput</h3>
                <p>{realtimeState.metrics.eventThroughput}/sec</p>
              </div>
              <div className="metric">
                <h3>Error Rate</h3>
                <p>{realtimeState.metrics.errorRate.toFixed(2)}%</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default ExampleApp