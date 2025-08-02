'use client'

import { useState } from 'react'
import { 
  Users, 
  Clock, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  MessageCircle,
  Calendar,
  Settings,
  RefreshCw,
  Bell,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useGuardianData } from '../hooks/useGuardianData'
import { ProfileApprovalCard } from './ProfileApprovalCard'
import { ActivityFeed } from './ActivityFeed'
import { ComplianceReport } from './ComplianceReport'
import { PermissionSettings } from './PermissionSettings'
import { formatRelativeTime } from '@/lib/utils'

export function GuardianDashboard() {
  const { data, loading, error, refreshData } = useGuardianData()
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'activity' | 'compliance' | 'settings'>('overview')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3 text-neutral-600">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading guardian dashboard...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Unable to Load Dashboard
        </h3>
        <p className="text-neutral-600 mb-4">
          {error || 'Failed to load guardian data'}
        </p>
        <Button onClick={refreshData} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try Again
        </Button>
      </div>
    )
  }

  const { supervisedProfiles, pendingApprovals, activitySummary, notifications } = data

  // Quick stats for the overview
  const urgentNotifications = notifications.filter(n => n.priority === 'high' && !n.read).length
  const profilesNeedingAttention = supervisedProfiles.filter(p => 
    p.complianceScore < 90 || p.profileStatus === 'under_review'
  ).length

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {['overview', 'approvals', 'activity', 'compliance', 'settings'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab as any)}
              className="capitalize"
            >
              {tab}
              {tab === 'approvals' && pendingApprovals.length > 0 && (
                <Badge variant="danger" size="sm" className="ml-2">
                  {pendingApprovals.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Bell className="h-4 w-4" />}
          >
            Notifications
            {urgentNotifications > 0 && (
              <Badge variant="danger" size="sm" className="ml-2">
                {urgentNotifications}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Supervised Profiles</p>
                  <p className="text-2xl font-bold text-neutral-900">{activitySummary.totalProfiles}</p>
                </div>
              </div>
              {profilesNeedingAttention > 0 && (
                <Badge variant="warning" size="sm">
                  {profilesNeedingAttention} need attention
                </Badge>
              )}
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-neutral-900">{activitySummary.pendingApprovals}</p>
                </div>
              </div>
              {activitySummary.pendingApprovals > 0 && (
                <Badge variant="warning" size="sm">
                  Action required
                </Badge>
              )}
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Avg. Compliance</p>
                  <p className="text-2xl font-bold text-neutral-900">{activitySummary.averageComplianceScore}%</p>
                </div>
              </div>
              <Badge 
                variant={activitySummary.averageComplianceScore >= 95 ? 'success' : activitySummary.averageComplianceScore >= 85 ? 'warning' : 'danger'}
                size="sm"
              >
                {activitySummary.averageComplianceScore >= 95 ? 'Excellent' : activitySummary.averageComplianceScore >= 85 ? 'Good' : 'Needs attention'}
              </Badge>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Active Conversations</p>
                  <p className="text-2xl font-bold text-neutral-900">{activitySummary.activeConversations}</p>
                </div>
              </div>
              <Badge variant="info" size="sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                {activitySummary.weeklyActivity}% active this week
              </Badge>
            </div>
          </div>

          {/* Supervised Profiles */}
          <div className="bg-white rounded-lg border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Supervised Profiles</h3>
              <p className="text-sm text-neutral-600">
                Overview of family members under your guidance
              </p>
            </div>
            <div className="p-6 space-y-4">
              {supervisedProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700">
                        {profile.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900">{profile.name}</h4>
                      <p className="text-sm text-neutral-600">
                        {profile.age} years • {profile.location}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Last active {formatRelativeTime(profile.lastActive)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {profile.pendingMatches} pending matches
                      </p>
                      <p className="text-sm text-neutral-600">
                        {profile.activeConversations} active conversations
                      </p>
                    </div>
                    
                    <Badge
                      variant={profile.complianceScore >= 95 ? 'success' : profile.complianceScore >= 85 ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {profile.complianceScore}% compliance
                    </Badge>
                    
                    <Badge
                      variant={
                        profile.guardianshipLevel === 'primary' ? 'primary' :
                        profile.guardianshipLevel === 'secondary' ? 'secondary' : 'outline'
                      }
                      size="sm"
                    >
                      {profile.guardianshipLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-6">
                <ActivityFeed profileId="all" limit={5} />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Reviews
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <p className="font-medium text-amber-900">Weekly Compliance Review</p>
                      <p className="text-sm text-amber-700">Review all supervised profiles</p>
                    </div>
                    <Badge variant="warning" size="sm">
                      Tomorrow
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium text-blue-900">Family Meeting</p>
                      <p className="text-sm text-blue-700">Discuss Aisha's marriage prospects</p>
                    </div>
                    <Badge variant="info" size="sm">
                      Friday
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Pending Approvals</h3>
              <p className="text-sm text-neutral-600">
                Review and approve requests from supervised profiles
              </p>
            </div>
            <div className="p-6 space-y-4">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-neutral-900 mb-2">
                    No Pending Approvals
                  </h4>
                  <p className="text-neutral-600">
                    All requests have been reviewed. Check back later for new submissions.
                  </p>
                </div>
              ) : (
                pendingApprovals.map((approval) => (
                  <ProfileApprovalCard key={approval.id} approval={approval} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <ActivityFeed profileId="all" />
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <ComplianceReport profiles={supervisedProfiles} />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <PermissionSettings />
        </div>
      )}
    </div>
  )
}