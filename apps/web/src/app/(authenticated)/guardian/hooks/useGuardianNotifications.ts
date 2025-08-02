import { useState, useEffect, useCallback } from 'react'

export interface GuardianNotification {
  id: string
  type: 'approval_needed' | 'compliance_issue' | 'activity_alert' | 'meeting_request' | 'message_flagged' | 'profile_update'
  title: string
  message: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  actionRequired: boolean
  profileId?: string
  profileName?: string
  category: 'approval' | 'security' | 'activity' | 'compliance' | 'system'
  actions?: Array<{
    id: string
    label: string
    type: 'primary' | 'secondary' | 'danger'
    action: string
  }>
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  immediateAlerts: boolean
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string   // HH:MM format
  }
  categories: {
    approval: boolean
    security: boolean
    activity: boolean
    compliance: boolean
    system: boolean
  }
  frequency: 'immediate' | 'hourly' | 'daily'
}

export function useGuardianNotifications() {
  const [notifications, setNotifications] = useState<GuardianNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock notifications data
      const mockNotifications: GuardianNotification[] = [
        {
          id: '1',
          type: 'approval_needed',
          title: 'Match Approval Required',
          message: 'Aisha has received a new match request from Ahmed (92% compatibility)',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          priority: 'high',
          read: false,
          actionRequired: true,
          profileId: '1',
          profileName: 'Aisha',
          category: 'approval',
          actions: [
            { id: 'approve', label: 'Approve Match', type: 'primary', action: 'approve_match' },
            { id: 'review', label: 'Review Profile', type: 'secondary', action: 'review_match' },
            { id: 'deny', label: 'Deny', type: 'danger', action: 'deny_match' }
          ],
          metadata: { matchId: 'match_123', compatibilityScore: 92 }
        },
        {
          id: '2',
          type: 'meeting_request',
          title: 'Meeting Request - Urgent',
          message: 'Aisha and Omar have requested a chaperoned meeting at the local masjid this Friday',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          priority: 'urgent',
          read: false,
          actionRequired: true,
          profileId: '1',
          profileName: 'Aisha',
          category: 'approval',
          actions: [
            { id: 'approve', label: 'Approve Meeting', type: 'primary', action: 'approve_meeting' },
            { id: 'suggest', label: 'Suggest Alternative', type: 'secondary', action: 'suggest_alternative' },
            { id: 'deny', label: 'Deny Request', type: 'danger', action: 'deny_meeting' }
          ],
          metadata: { meetingDate: '2024-08-09', location: 'Central Masjid', requestedBy: 'both' }
        },
        {
          id: '3',
          type: 'message_flagged',
          title: 'Message Requires Review',
          message: 'A message from Yusuf to Fatima has been flagged for guardian review',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          priority: 'medium',
          read: false,
          actionRequired: true,
          profileId: '2',
          profileName: 'Fatima',
          category: 'compliance',
          actions: [
            { id: 'approve', label: 'Approve Message', type: 'primary', action: 'approve_message' },
            { id: 'review', label: 'Full Review', type: 'secondary', action: 'review_conversation' },
            { id: 'block', label: 'Block Sender', type: 'danger', action: 'block_sender' }
          ],
          metadata: { messageId: 'msg_456', flagReason: 'contains_meeting_reference' }
        },
        {
          id: '4',
          type: 'activity_alert',
          title: 'Unusual Activity Detected',
          message: 'Aisha has been active at unusual hours (2:30 AM - 3:15 AM)',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          priority: 'medium',
          read: true,
          actionRequired: false,
          profileId: '1',
          profileName: 'Aisha',
          category: 'activity',
          metadata: { activityType: 'late_night_usage', duration: 45 }
        },
        {
          id: '5',
          type: 'compliance_issue',
          title: 'Profile Compliance Update',
          message: 'Fatima\'s compliance score has dropped to 88% due to messaging patterns',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          priority: 'low',
          read: true,
          actionRequired: false,
          profileId: '2',
          profileName: 'Fatima',
          category: 'compliance',
          metadata: { previousScore: 95, currentScore: 88, reasons: ['frequent_messaging', 'late_responses'] }
        }
      ]

      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockPreferences: NotificationPreferences = {
        email: true,
        push: true,
        sms: false,
        immediateAlerts: true,
        quietHours: {
          enabled: true,
          start: '23:00',
          end: '07:00'
        },
        categories: {
          approval: true,
          security: true,
          activity: true,
          compliance: true,
          system: false
        },
        frequency: 'immediate'
      }

      setPreferences(mockPreferences)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (err) {
      // Revert on error
      fetchNotifications()
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
    }
  }, [fetchNotifications])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      setUnreadCount(0)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      // Revert on error
      fetchNotifications()
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
    }
  }, [fetchNotifications])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId)
      
      // Optimistically update UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (err) {
      // Revert on error
      fetchNotifications()
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [notifications, fetchNotifications])

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      // Revert on error
      fetchPreferences()
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    }
  }, [fetchPreferences])

  // Process notification action
  const processNotificationAction = useCallback(async (
    notificationId: string, 
    actionId: string
  ) => {
    try {
      // Find the notification and action
      const notification = notifications.find(n => n.id === notificationId)
      const action = notification?.actions?.find(a => a.id === actionId)
      
      if (!notification || !action) {
        throw new Error('Notification or action not found')
      }

      // Mark as read and remove action requirement
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, actionRequired: false }
            : n
        )
      )

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      return {
        success: true,
        message: `${action.label} completed successfully`
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process action'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    }
  }, [notifications])

  // Initialize
  useEffect(() => {
    fetchNotifications()
    fetchPreferences()
  }, [fetchNotifications, fetchPreferences])

  // Get notifications by category
  const getNotificationsByCategory = useCallback((category: string) => {
    return notifications.filter(n => n.category === category)
  }, [notifications])

  // Get urgent notifications
  const getUrgentNotifications = useCallback(() => {
    return notifications.filter(n => n.priority === 'urgent' && !n.read)
  }, [notifications])

  return {
    notifications,
    preferences,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    processNotificationAction,
    getNotificationsByCategory,
    getUrgentNotifications,
    refreshNotifications: fetchNotifications
  }
}