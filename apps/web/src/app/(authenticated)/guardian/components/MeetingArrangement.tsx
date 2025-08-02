'use client'

import { useState } from 'react'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageCircle,
  Phone,
  Video,
  Star,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface MeetingRequest {
  id: string
  profileName: string
  matchName: string
  requestedBy: 'profile' | 'match' | 'both'
  proposedDate: Date
  proposedTime: string
  location: {
    name: string
    address: string
    type: 'masjid' | 'family_home' | 'public_space' | 'community_center'
    verified: boolean
  }
  duration: string
  purpose: string
  chaperoneRequired: boolean
  proposedChaperones: string[]
  status: 'pending' | 'approved' | 'denied' | 'counter_proposed' | 'completed'
  guardianNotes?: string
  conditions?: string[]
  requestedAt: Date
  respondedAt?: Date
  priority: 'low' | 'medium' | 'high'
}

interface MeetingTemplate {
  id: string
  name: string
  type: 'first_meeting' | 'family_introduction' | 'formal_proposal' | 'engagement_discussion'
  location: {
    name: string
    address: string
    type: string
  }
  duration: string
  chaperoneRequired: boolean
  guidelines: string[]
  isActive: boolean
}

export function MeetingArrangement() {
  const [selectedTab, setSelectedTab] = useState<'requests' | 'templates' | 'history'>('requests')
  const [showApprovalForm, setShowApprovalForm] = useState<string | null>(null)
  const [showTemplateForm, setShowTemplateForm] = useState(false)

  // Mock meeting requests
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([
    {
      id: '1',
      profileName: 'Aisha',
      matchName: 'Omar',
      requestedBy: 'both',
      proposedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      proposedTime: '14:30',
      location: {
        name: 'Central Masjid',
        address: '123 Islamic Center Dr, London',
        type: 'masjid',
        verified: true
      },
      duration: '2 hours',
      purpose: 'Getting to know each other better and discussing family values',
      chaperoneRequired: true,
      proposedChaperones: ['Imam Abdullah', 'Sister Khadija'],
      status: 'pending',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      priority: 'high'
    },
    {
      id: '2',
      profileName: 'Fatima',
      matchName: 'Yusuf',
      requestedBy: 'match',
      proposedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      proposedTime: '15:00',
      location: {
        name: 'Community Garden Café',
        address: '456 Park Lane, Birmingham',
        type: 'public_space',
        verified: true
      },
      duration: '1.5 hours',
      purpose: 'Casual meeting to discuss interests and compatibility',
      chaperoneRequired: true,
      proposedChaperones: ['Family friend'],
      status: 'pending',
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      priority: 'medium'
    }
  ])

  // Mock meeting templates
  const [meetingTemplates, setMeetingTemplates] = useState<MeetingTemplate[]>([
    {
      id: '1',
      name: 'First Meeting at Masjid',
      type: 'first_meeting',
      location: {
        name: 'Central Masjid',
        address: '123 Islamic Center Dr, London',
        type: 'masjid'
      },
      duration: '1-2 hours',
      chaperoneRequired: true,
      guidelines: [
        'Meeting in masjid community room',
        'Imam or elder present as chaperone',
        'Focus on Islamic values and life goals',
        'Maintain proper Islamic etiquette'
      ],
      isActive: true
    },
    {
      id: '2',
      name: 'Family Introduction Meeting',
      type: 'family_introduction',
      location: {
        name: 'Family Home',
        address: 'Family residence',
        type: 'family_home'
      },
      duration: '2-3 hours',
      chaperoneRequired: true,
      guidelines: [
        'Both families present',
        'Traditional Islamic hospitality',
        'Discussion of family backgrounds',
        'Q&A session about expectations'
      ],
      isActive: true
    }
  ])

  const [approvalForm, setApprovalForm] = useState({
    decision: '' as 'approve' | 'deny' | 'counter_propose',
    conditions: [] as string[],
    notes: '',
    counterProposal: {
      date: '',
      time: '',
      location: '',
      duration: '',
      additionalRequirements: ''
    }
  })

  const handleApprovalSubmit = async (requestId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMeetingRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                status: approvalForm.decision === 'approve' ? 'approved' : 
                       approvalForm.decision === 'deny' ? 'denied' : 'counter_proposed',
                guardianNotes: approvalForm.notes,
                conditions: approvalForm.conditions,
                respondedAt: new Date()
              }
            : request
        )
      )

      setShowApprovalForm(null)
      setApprovalForm({
        decision: '' as any,
        conditions: [],
        notes: '',
        counterProposal: {
          date: '',
          time: '',
          location: '',
          duration: '',
          additionalRequirements: ''
        }
      })
    } catch (error) {
      console.error('Failed to process meeting approval:', error)
    }
  }

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'masjid':
        return '🕌'
      case 'family_home':
        return '🏠'
      case 'public_space':
        return '🏛️'
      case 'community_center':
        return '🏢'
      default:
        return '📍'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'denied':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'counter_proposed':
        return 'info'
      case 'completed':
        return 'verified'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Meeting Arrangements</h2>
          <p className="text-neutral-600">Manage and approve meeting requests with Islamic guidelines</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {[
          { id: 'requests', label: 'Pending Requests', count: meetingRequests.filter(r => r.status === 'pending').length },
          { id: 'templates', label: 'Meeting Templates', count: meetingTemplates.filter(t => t.isActive).length },
          { id: 'history', label: 'Meeting History', count: 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <Badge variant="outline" size="sm" className="ml-2">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Pending Requests Tab */}
      {selectedTab === 'requests' && (
        <div className="space-y-4">
          {meetingRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
              <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No Pending Requests</h3>
              <p className="text-neutral-600">
                All meeting requests have been reviewed. New requests will appear here.
              </p>
            </div>
          ) : (
            meetingRequests
              .filter(r => r.status === 'pending')
              .map((request) => (
                <div
                  key={request.id}
                  className={`bg-white border-l-4 rounded-r-lg border border-neutral-200 ${getPriorityColor(request.priority)}`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            Meeting Request: {request.profileName} & {request.matchName}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(request.status) as any} size="sm">
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {request.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Requested {formatRelativeTime(request.requestedAt)} by {
                            request.requestedBy === 'both' ? 'both parties' :
                            request.requestedBy === 'profile' ? request.profileName :
                            request.matchName
                          }
                        </p>
                      </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-3">Meeting Details</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-neutral-500" />
                            <span className="text-sm text-neutral-700">
                              {formatDate(request.proposedDate)} at {request.proposedTime}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-neutral-500 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-900">
                                  {getLocationIcon(request.location.type)} {request.location.name}
                                </span>
                                {request.location.verified && (
                                  <Badge variant="success" size="sm" icon={<CheckCircle className="h-3 w-3" />}>
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600">{request.location.address}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-neutral-500" />
                            <span className="text-sm text-neutral-700">Duration: {request.duration}</span>
                          </div>
                          
                          {request.chaperoneRequired && (
                            <div className="flex items-start gap-3">
                              <Users className="h-4 w-4 text-neutral-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-neutral-900">Chaperones Required</p>
                                <p className="text-sm text-neutral-600">
                                  {request.proposedChaperones.join(', ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-3">Purpose & Context</h4>
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <p className="text-sm text-neutral-700">{request.purpose}</p>
                        </div>
                        
                        {request.location.type === 'masjid' && (
                          <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-900">Islamic Guidelines Met</span>
                            </div>
                            <ul className="text-sm text-green-800 space-y-1">
                              <li>• Sacred and respectful environment</li>
                              <li>• Community oversight available</li>
                              <li>• Proper Islamic etiquette expected</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setShowApprovalForm(request.id)}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                      >
                        Review & Approve
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<MessageCircle className="h-4 w-4" />}
                      >
                        Request More Info
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Deny Request
                      </Button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Meeting Templates Tab */}
      {selectedTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Pre-configured meeting templates for common scenarios
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTemplateForm(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {meetingTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">{template.name}</h3>
                      <Badge variant="outline" size="sm">
                        {template.type.replace('_', ' ')}
                      </Badge>
                      {template.isActive && (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {template.location.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {template.duration}
                      </span>
                      {template.chaperoneRequired && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Chaperone required
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Guidelines</h4>
                  <ul className="space-y-1">
                    {template.guidelines.map((guideline, index) => (
                      <li key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                        <span className="text-neutral-400 mt-1">•</span>
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting History Tab */}
      {selectedTab === 'history' && (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
          <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Meeting History</h3>
          <p className="text-neutral-600">
            Completed meetings will appear here for reference and follow-up.
          </p>
        </div>
      )}

      {/* Approval Form Modal */}
      {showApprovalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Review Meeting Request</h3>
              <p className="text-sm text-neutral-600">Approve, deny, or propose changes to the meeting</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Decision Selection */}
              <div>
                <Label>Decision</Label>
                <div className="mt-2 space-y-3">
                  {[
                    { value: 'approve', label: 'Approve as Proposed', icon: <CheckCircle className="h-4 w-4" />, color: 'green' },
                    { value: 'counter_propose', label: 'Approve with Changes', icon: <Edit className="h-4 w-4" />, color: 'blue' },
                    { value: 'deny', label: 'Deny Request', icon: <XCircle className="h-4 w-4" />, color: 'red' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value={option.value}
                        checked={approvalForm.decision === option.value}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, decision: e.target.value as any }))}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <div className={`flex items-center gap-2 text-${option.color}-700`}>
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              {(approvalForm.decision === 'approve' || approvalForm.decision === 'counter_propose') && (
                <div>
                  <Label>Additional Conditions (Optional)</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      'Family member must be present',
                      'Meeting duration limited to 1 hour',
                      'Public location only',
                      'Masjid elder as chaperone',
                      'No private conversation'
                    ].map((condition) => (
                      <label key={condition} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={approvalForm.conditions.includes(condition)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApprovalForm(prev => ({
                                ...prev,
                                conditions: [...prev.conditions, condition]
                              }))
                            } else {
                              setApprovalForm(prev => ({
                                ...prev,
                                conditions: prev.conditions.filter(c => c !== condition)
                              }))
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

              {/* Counter Proposal Details */}
              {approvalForm.decision === 'counter_propose' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900">Propose Alternative Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="alt_date">Alternative Date</Label>
                      <Input
                        id="alt_date"
                        type="date"
                        value={approvalForm.counterProposal.date}
                        onChange={(e) => setApprovalForm(prev => ({
                          ...prev,
                          counterProposal: { ...prev.counterProposal, date: e.target.value }
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="alt_time">Alternative Time</Label>
                      <Input
                        id="alt_time"
                        type="time"
                        value={approvalForm.counterProposal.time}
                        onChange={(e) => setApprovalForm(prev => ({
                          ...prev,
                          counterProposal: { ...prev.counterProposal, time: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="alt_location">Alternative Location</Label>
                    <Input
                      id="alt_location"
                      value={approvalForm.counterProposal.location}
                      onChange={(e) => setApprovalForm(prev => ({
                        ...prev,
                        counterProposal: { ...prev.counterProposal, location: e.target.value }
                      }))}
                      placeholder="Suggest different location..."
                    />
                  </div>
                </div>
              )}

              {/* Guardian Notes */}
              <div>
                <Label htmlFor="notes">Guardian Notes</Label>
                <textarea
                  id="notes"
                  value={approvalForm.notes}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add guidance, advice, or reasoning for your decision..."
                  className="w-full p-3 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-neutral-200 flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => handleApprovalSubmit(showApprovalForm)}
                disabled={!approvalForm.decision}
                fullWidth
              >
                Submit Decision
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setShowApprovalForm(null)
                  setApprovalForm({
                    decision: '' as any,
                    conditions: [],
                    notes: '',
                    counterProposal: {
                      date: '',
                      time: '',
                      location: '',
                      duration: '',
                      additionalRequirements: ''
                    }
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Islamic Guidelines */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-green-900 mb-2">Islamic Meeting Guidelines</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>
                Ensure all meetings follow Islamic principles of modesty and proper conduct:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-3">
                <li>Meetings should take place in public or semi-public spaces</li>
                <li>A mahram (family member) or trusted chaperone should be present</li>
                <li>Maintain appropriate physical distance and interaction</li>
                <li>Focus on getting to know character, values, and life goals</li>
                <li>Keep meetings purposeful and time-bounded</li>
                <li>Avoid isolated or inappropriate locations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}