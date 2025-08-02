import { useState, useEffect } from 'react'

export interface SupervisedProfile {
  id: string
  name: string
  age: number
  location: string
  avatar?: string
  lastActive: Date
  pendingMatches: number
  activeConversations: number
  complianceScore: number
  guardianshipLevel: 'primary' | 'secondary' | 'observer'
  profileStatus: 'active' | 'paused' | 'under_review'
  privacyLevel: 'open' | 'moderate' | 'strict'
}

export interface PendingApproval {
  id: string
  type: 'match' | 'message' | 'photo' | 'meeting'
  profileId: string
  profileName: string
  matchName?: string
  content?: string
  requestedAt: Date
  priority: 'low' | 'medium' | 'high'
  context: string
  requiresImmediate: boolean
}

export interface ActivitySummary {
  totalProfiles: number
  pendingApprovals: number
  activeConversations: number
  complianceIssues: number
  weeklyActivity: number
  averageComplianceScore: number
  lastReviewDate: Date
}

export interface GuardianData {
  supervisedProfiles: SupervisedProfile[]
  pendingApprovals: PendingApproval[]
  activitySummary: ActivitySummary
  notifications: Array<{
    id: string
    type: 'approval_needed' | 'compliance_issue' | 'activity_alert' | 'meeting_request'
    message: string
    timestamp: Date
    priority: 'low' | 'medium' | 'high'
    read: boolean
    actionRequired: boolean
  }>
  guardianSettings: {
    notificationPreferences: {
      email: boolean
      push: boolean
      sms: boolean
      immediateAlerts: boolean
    }
    oversightLevel: 'light' | 'moderate' | 'comprehensive'
    autoApprovalSettings: {
      messages: boolean
      photos: boolean
      meetings: boolean
    }
  }
}

export function useGuardianData() {
  const [data, setData] = useState<GuardianData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGuardianData()
  }, [])

  const fetchGuardianData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data for development
      const mockData: GuardianData = {
        supervisedProfiles: [
          {
            id: '1',
            name: 'Aisha',
            age: 25,
            location: 'London, UK',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            pendingMatches: 3,
            activeConversations: 2,
            complianceScore: 95,
            guardianshipLevel: 'primary',
            profileStatus: 'active',
            privacyLevel: 'moderate'
          },
          {
            id: '2',
            name: 'Fatima',
            age: 23,
            location: 'Birmingham, UK',
            lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            pendingMatches: 5,
            activeConversations: 1,
            complianceScore: 88,
            guardianshipLevel: 'secondary',
            profileStatus: 'active',
            privacyLevel: 'strict'
          }
        ],
        pendingApprovals: [
          {
            id: '1',
            type: 'match',
            profileId: '1',
            profileName: 'Aisha',
            matchName: 'Ahmed',
            requestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            priority: 'high',
            context: 'High compatibility match (92%) from London area',
            requiresImmediate: false
          },
          {
            id: '2',
            type: 'meeting',
            profileId: '1',
            profileName: 'Aisha',
            matchName: 'Omar',
            requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            priority: 'high',
            context: 'Request for chaperoned meeting at local masjid',
            requiresImmediate: true
          },
          {
            id: '3',
            type: 'message',
            profileId: '2',
            profileName: 'Fatima',
            matchName: 'Yusuf',
            content: 'Assalamu alaikum sister, I would be honored to learn more about your family values...',
            requestedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            priority: 'medium',
            context: 'First message from potential match',
            requiresImmediate: false
          }
        ],
        activitySummary: {
          totalProfiles: 2,
          pendingApprovals: 3,
          activeConversations: 3,
          complianceIssues: 0,
          weeklyActivity: 87,
          averageComplianceScore: 91.5,
          lastReviewDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        notifications: [
          {
            id: '1',
            type: 'approval_needed',
            message: 'New match request requires your approval',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            priority: 'high',
            read: false,
            actionRequired: true
          },
          {
            id: '2',
            type: 'meeting_request',
            message: 'Meeting request for Aisha needs immediate attention',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            priority: 'high',
            read: false,
            actionRequired: true
          }
        ],
        guardianSettings: {
          notificationPreferences: {
            email: true,
            push: true,
            sms: false,
            immediateAlerts: true
          },
          oversightLevel: 'moderate',
          autoApprovalSettings: {
            messages: false,
            photos: false,
            meetings: false
          }
        }
      }
      
      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guardian data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchGuardianData()
  }

  return {
    data,
    loading,
    error,
    refreshData
  }
}