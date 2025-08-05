import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@clerk/nextjs'

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
  const { userId } = useAuth()

  useEffect(() => {
    fetchGuardianData()
  }, [])

  const fetchGuardianData = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      // Get guardian relationships for current user
      const { data: guardianRelationships, error: relationError } = await supabase
        .from('guardian_relationships')
        .select(`
          id,
          relationship_type,
          status,
          permissions,
          supervised_profile:profiles!guardian_relationships_supervised_user_id_fkey(
            user_id,
            full_name,
            age,
            location,
            last_active_at,
            profile_active
          )
        `)
        .eq('guardian_user_id', userId)
        .eq('status', 'active')

      if (relationError) {
        throw relationError
      }

      // Transform supervised profiles
      const supervisedProfiles: SupervisedProfile[] = (guardianRelationships || []).map(rel => ({
        id: rel.supervised_profile?.user_id || '',
        name: rel.supervised_profile?.full_name?.split(' ')[0] || 'User',
        age: rel.supervised_profile?.age || 0,
        location: rel.supervised_profile?.location || 'Unknown',
        lastActive: new Date(rel.supervised_profile?.last_active_at || Date.now()),
        pendingMatches: 0, // TODO: Calculate from matches table
        activeConversations: 0, // TODO: Calculate from messages table
        complianceScore: 85, // TODO: Calculate compliance score
        guardianshipLevel: rel.relationship_type as 'primary' | 'secondary' | 'observer',
        profileStatus: rel.supervised_profile?.profile_active ? 'active' : 'paused',
        privacyLevel: 'moderate' // TODO: Get from profile settings
      }))

      // Get pending approvals (placeholder for now)
      const pendingApprovals: PendingApproval[] = []

      // Calculate activity summary
      const activitySummary: ActivitySummary = {
        totalProfiles: supervisedProfiles.length,
        pendingApprovals: pendingApprovals.length,
        activeConversations: 0, // TODO: Calculate from real data
        complianceIssues: 0,
        weeklyActivity: 0,
        averageComplianceScore: supervisedProfiles.length > 0 
          ? supervisedProfiles.reduce((sum, p) => sum + p.complianceScore, 0) / supervisedProfiles.length 
          : 0,
        lastReviewDate: new Date()
      }

      const guardianData: GuardianData = {
        supervisedProfiles,
        pendingApprovals,
        activitySummary,
        notifications: [], // TODO: Implement notifications system
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
      
      setData(guardianData)
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