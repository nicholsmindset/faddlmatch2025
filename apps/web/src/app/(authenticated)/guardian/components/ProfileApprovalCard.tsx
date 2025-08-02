'use client'

import { useState } from 'react'
import { 
  Clock, 
  User, 
  Heart, 
  MessageCircle, 
  MapPin, 
  Calendar,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useApprovalActions } from '../hooks/useApprovalActions'
import { formatRelativeTime } from '@/lib/utils'
import type { PendingApproval } from '../hooks/useGuardianData'

interface ProfileApprovalCardProps {
  approval: PendingApproval
  onApprovalProcessed?: (approvalId: string, action: string) => void
}

export function ProfileApprovalCard({ approval, onApprovalProcessed }: ProfileApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showReasonForm, setShowReasonForm] = useState(false)
  const [reason, setReason] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const { processApproval, loading } = useApprovalActions()

  const handleApproval = async (action: 'approve' | 'deny' | 'request_info') => {
    try {
      const result = await processApproval(approval.id, {
        id: approval.id,
        type: action,
        reason: reason || undefined,
        conditions: conditions.length > 0 ? conditions : undefined,
        notifyProfile: true
      })

      if (result.success) {
        onApprovalProcessed?.(approval.id, action)
        setShowReasonForm(false)
        setReason('')
        setConditions([])
      }
    } catch (error) {
      console.error('Failed to process approval:', error)
    }
  }

  const getTypeIcon = () => {
    switch (approval.type) {
      case 'match':
        return <Heart className="h-5 w-5" />
      case 'message':
        return <MessageCircle className="h-5 w-5" />
      case 'photo':
        return <Camera className="h-5 w-5" />
      case 'meeting':
        return <Calendar className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getTypeLabel = () => {
    switch (approval.type) {
      case 'match':
        return 'Match Request'
      case 'message':
        return 'Message Review'
      case 'photo':
        return 'Photo Approval'
      case 'meeting':
        return 'Meeting Request'
      default:
        return 'Request'
    }
  }

  const getPriorityColor = () => {
    switch (approval.priority) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <div className={`bg-white border-2 rounded-lg transition-all duration-200 ${
      approval.requiresImmediate 
        ? 'border-red-200 bg-red-50/50' 
        : 'border-neutral-200 hover:border-primary-200'
    }`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              approval.requiresImmediate 
                ? 'bg-red-100 text-red-600' 
                : 'bg-primary-100 text-primary-600'
            }`}>
              {getTypeIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                {getTypeLabel()}
                {approval.requiresImmediate && (
                  <Badge variant="danger" size="sm" icon={<AlertTriangle className="h-3 w-3" />}>
                    Urgent
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-neutral-600">
                For {approval.profileName}
                {approval.matchName && ` • From ${approval.matchName}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor() as any} size="sm">
              {approval.priority} priority
            </Badge>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-neutral-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-600" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-4 text-sm text-neutral-600 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatRelativeTime(approval.requestedAt)}
          </span>
          {approval.type === 'match' && (
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Background verified
            </span>
          )}
          {approval.type === 'meeting' && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Public venue
            </span>
          )}
        </div>

        {/* Context */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-700">{approval.context}</p>
          </div>
        </div>

        {/* Message Content (for message approvals) */}
        {approval.type === 'message' && approval.content && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Message Content:</h4>
            <p className="text-sm text-blue-800 italic">"{approval.content}"</p>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            {/* Additional context based on type */}
            {approval.type === 'match' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-2">Match Details</h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>• Compatibility Score: 92%</li>
                    <li>• Same City: London</li>
                    <li>• Similar Age: 2 years difference</li>
                    <li>• Educational Background: Compatible</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-2">Family Status</h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>• Family verified ✓</li>
                    <li>• References available ✓</li>
                    <li>• Similar religious level ✓</li>
                    <li>• No red flags ✓</li>
                  </ul>
                </div>
              </div>
            )}

            {approval.type === 'meeting' && (
              <div>
                <h4 className="text-sm font-medium text-neutral-900 mb-2">Meeting Details</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Proposed Date: This Friday after Jummah</li>
                    <li>• Location: Central Masjid community room</li>
                    <li>• Duration: 1-2 hours</li>
                    <li>• Chaperone: Masjid elder available</li>
                    <li>• Purpose: Getting to know each other's values</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          {!showReasonForm ? (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleApproval('approve')}
                disabled={loading}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Approve
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReasonForm(true)}
                disabled={loading}
              >
                Review
              </Button>
              
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleApproval('deny')}
                disabled={loading}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Deny
              </Button>
              
              {approval.type === 'meeting' && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                >
                  Suggest Alternative
                </Button>
              )}
            </>
          ) : (
            <div className="w-full space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide guidance or explanation..."
                  className="w-full p-3 border border-neutral-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              
              {approval.type === 'meeting' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Conditions (optional)
                  </label>
                  <div className="space-y-2">
                    {['Family member present', 'Public location only', 'Shorter duration', 'Different time'].map((condition) => (
                      <label key={condition} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={conditions.includes(condition)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConditions([...conditions, condition])
                            } else {
                              setConditions(conditions.filter(c => c !== condition))
                            }
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleApproval('approve')}
                  disabled={loading}
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                >
                  Approve with Notes
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleApproval('deny')}
                  disabled={loading}
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Deny with Reason
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReasonForm(false)
                    setReason('')
                    setConditions([])
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}