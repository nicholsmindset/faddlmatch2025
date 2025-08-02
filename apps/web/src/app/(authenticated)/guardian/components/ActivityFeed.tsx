'use client'

import { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Heart, 
  Eye, 
  Calendar, 
  Camera,
  Shield,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'message' | 'match' | 'profile_view' | 'photo_update' | 'meeting_request' | 'compliance_alert' | 'login' | 'approval'
  profileId: string
  profileName: string
  timestamp: Date
  description: string
  status: 'approved' | 'denied' | 'pending' | 'flagged' | 'info'
  priority: 'low' | 'medium' | 'high'
  metadata?: {
    matchName?: string
    messageContent?: string
    viewerName?: string
    photoCount?: number
    meetingLocation?: string
    complianceScore?: number
    deviceInfo?: string
    guardianName?: string
  }
  actionRequired: boolean
  category: 'communication' | 'matching' | 'safety' | 'compliance' | 'system'
}

interface ActivityFeedProps {
  profileId?: string // 'all' for all profiles, specific ID for single profile
  limit?: number
  showFilters?: boolean
}

export function ActivityFeed({ profileId = 'all', limit = 20, showFilters = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged' | 'today'>('all')

  useEffect(() => {
    fetchActivities()
  }, [profileId, limit, filter])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock activity data
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'message',
          profileId: '1',
          profileName: 'Aisha',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          description: 'New message received from Ahmed',
          status: 'pending',
          priority: 'medium',
          actionRequired: true,
          category: 'communication',
          metadata: {
            matchName: 'Ahmed',
            messageContent: 'Assalamu alaikum sister, I hope you are well. I would love to learn more about your family values and interests.'
          }
        },
        {
          id: '2',
          type: 'match',
          profileId: '1',
          profileName: 'Aisha',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          description: 'New match request from Omar (95% compatibility)',
          status: 'pending',
          priority: 'high',
          actionRequired: true,
          category: 'matching',
          metadata: {
            matchName: 'Omar'
          }
        },
        {
          id: '3',
          type: 'meeting_request',
          profileId: '1',
          profileName: 'Aisha',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          description: 'Meeting request for Friday at Central Masjid',
          status: 'pending',
          priority: 'high',
          actionRequired: true,
          category: 'communication',
          metadata: {
            matchName: 'Omar',
            meetingLocation: 'Central Masjid'
          }
        },
        {
          id: '4',
          type: 'profile_view',
          profileId: '2',
          profileName: 'Fatima',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          description: 'Profile viewed by Yusuf',
          status: 'info',
          priority: 'low',
          actionRequired: false,
          category: 'matching',
          metadata: {
            viewerName: 'Yusuf'
          }
        },
        {
          id: '5',
          type: 'compliance_alert',
          profileId: '2',
          profileName: 'Fatima',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          description: 'Compliance score decreased to 88%',
          status: 'flagged',
          priority: 'medium',
          actionRequired: false,
          category: 'compliance',
          metadata: {
            complianceScore: 88
          }
        },
        {
          id: '6',
          type: 'approval',
          profileId: '1',
          profileName: 'Aisha',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          description: 'Match with Khalid approved by Father',
          status: 'approved',
          priority: 'low',
          actionRequired: false,
          category: 'matching',
          metadata: {
            matchName: 'Khalid',
            guardianName: 'Father'
          }
        },
        {
          id: '7',
          type: 'photo_update',
          profileId: '1',
          profileName: 'Aisha',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          description: 'Profile photos updated (2 new photos)',
          status: 'pending',
          priority: 'medium',
          actionRequired: true,
          category: 'compliance',
          metadata: {
            photoCount: 2
          }
        },
        {
          id: '8',
          type: 'login',
          profileId: '2',
          profileName: 'Fatima',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          description: 'Logged in from new device (iPhone)',
          status: 'info',
          priority: 'low',
          actionRequired: false,
          category: 'system',
          metadata: {
            deviceInfo: 'iPhone 14 Pro - London, UK'
          }
        }
      ]

      // Filter activities based on profileId
      let filteredActivities = profileId === 'all' 
        ? mockActivities 
        : mockActivities.filter(a => a.profileId === profileId)

      // Apply additional filters
      switch (filter) {
        case 'pending':
          filteredActivities = filteredActivities.filter(a => a.status === 'pending')
          break
        case 'flagged':
          filteredActivities = filteredActivities.filter(a => a.status === 'flagged')
          break
        case 'today':
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          filteredActivities = filteredActivities.filter(a => a.timestamp >= today)
          break
      }

      // Limit results
      if (limit) {
        filteredActivities = filteredActivities.slice(0, limit)
      }

      setActivities(filteredActivities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />
      case 'match':
        return <Heart className="h-4 w-4" />
      case 'profile_view':
        return <Eye className="h-4 w-4" />
      case 'meeting_request':
        return <Calendar className="h-4 w-4" />
      case 'photo_update':
        return <Camera className="h-4 w-4" />
      case 'compliance_alert':
        return <Shield className="h-4 w-4" />
      case 'login':
        return <User className="h-4 w-4" />
      case 'approval':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'denied':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-600" />
      case 'flagged':
        return <AlertTriangle className="h-3 w-3 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadgeVariant = (status: ActivityItem['status']) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'denied':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'flagged':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: ActivityItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/50'
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50/50'
      default:
        return 'border-l-neutral-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-neutral-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading activities...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <p className="text-neutral-600">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchActivities} className="mt-3">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filter:</span>
            {['all', 'pending', 'flagged', 'today'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterOption as any)}
                className="capitalize"
              >
                {filterOption}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchActivities}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600">No activities found</p>
          <p className="text-sm text-neutral-500">
            {filter !== 'all' ? `No ${filter} activities to display` : 'Check back later for updates'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`border-l-4 p-4 bg-white rounded-r-lg border border-neutral-200 ${getPriorityColor(activity.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    activity.priority === 'high' ? 'bg-red-100 text-red-600' :
                    activity.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-neutral-900">{activity.description}</h4>
                      {getStatusIcon(activity.status)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-neutral-600 mb-2">
                      <span>{activity.profileName}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                      <span>•</span>
                      <span className="capitalize">{activity.category}</span>
                    </div>

                    {/* Additional details based on activity type */}
                    {activity.metadata && (
                      <div className="mt-2">
                        {activity.type === 'message' && activity.metadata.messageContent && (
                          <div className="bg-neutral-50 rounded-lg p-3 border">
                            <p className="text-sm text-neutral-700 italic">
                              "{activity.metadata.messageContent.slice(0, 100)}
                              {activity.metadata.messageContent.length > 100 ? '...' : ''}"
                            </p>
                          </div>
                        )}
                        
                        {activity.type === 'compliance_alert' && activity.metadata.complianceScore && (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-sm text-amber-800">
                              New compliance score: {activity.metadata.complianceScore}%
                            </p>
                          </div>
                        )}
                        
                        {activity.type === 'login' && activity.metadata.deviceInfo && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-sm text-blue-800">
                              Device: {activity.metadata.deviceInfo}
                            </p>
                          </div>
                        )}
                        
                        {activity.type === 'meeting_request' && activity.metadata.meetingLocation && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-purple-800">
                              Requested location: {activity.metadata.meetingLocation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getStatusBadgeVariant(activity.status) as any}
                    size="sm"
                  >
                    {activity.status}
                  </Badge>
                  
                  {activity.actionRequired && (
                    <Badge variant="warning" size="sm">
                      Action needed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}