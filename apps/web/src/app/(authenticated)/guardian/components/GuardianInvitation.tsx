'use client'

import { useState } from 'react'
import { 
  Plus, 
  Send, 
  Users, 
  Check, 
  X, 
  Clock,
  Mail,
  UserPlus,
  Crown,
  Shield,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { formatRelativeTime } from '@/lib/utils'

interface Guardian {
  id: string
  name: string
  email: string
  relationship: string
  role: 'primary' | 'secondary' | 'observer'
  status: 'active' | 'pending' | 'inactive'
  invitedAt?: Date
  joinedAt?: Date
  lastActive?: Date
  permissions: string[]
  canInviteOthers: boolean
}

interface PendingInvitation {
  id: string
  email: string
  relationship: string
  role: 'primary' | 'secondary' | 'observer'
  invitedAt: Date
  expiresAt: Date
  sentBy: string
}

export function GuardianInvitation() {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [guardians, setGuardians] = useState<Guardian[]>([
    {
      id: '1',
      name: 'Ahmed Hassan (Father)',
      email: 'ahmed.hassan@email.com',
      relationship: 'Father',
      role: 'primary',
      status: 'active',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      permissions: ['all_approvals', 'invite_guardians', 'modify_settings', 'view_all_activity'],
      canInviteOthers: true
    },
    {
      id: '2',
      name: 'Fatima Hassan (Mother)',
      email: 'fatima.hassan@email.com',
      relationship: 'Mother',
      role: 'secondary',
      status: 'active',
      joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
      permissions: ['approve_matches', 'approve_meetings', 'view_messages', 'view_activity'],
      canInviteOthers: false
    },
    {
      id: '3',
      name: 'Omar Hassan (Brother)',
      email: 'omar.hassan@email.com',
      relationship: 'Brother',
      role: 'observer',
      status: 'pending',
      invitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      permissions: ['view_activity', 'view_compliance_reports'],
      canInviteOthers: false
    }
  ])

  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([
    {
      id: '1',
      email: 'uncle.hassan@email.com',
      relationship: 'Uncle',
      role: 'observer',
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      sentBy: 'Ahmed Hassan'
    }
  ])

  // Form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    relationship: '',
    role: 'observer' as 'primary' | 'secondary' | 'observer',
    message: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!inviteForm.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!inviteForm.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!inviteForm.relationship.trim()) {
      newErrors.relationship = 'Relationship is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendInvitation = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add to pending invitations
      const newInvitation: PendingInvitation = {
        id: Date.now().toString(),
        email: inviteForm.email,
        relationship: inviteForm.relationship,
        role: inviteForm.role,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentBy: 'You'
      }
      
      setPendingInvitations(prev => [...prev, newInvitation])
      
      // Reset form
      setInviteForm({
        email: '',
        name: '',
        relationship: '',
        role: 'observer',
        message: ''
      })
      setShowInviteForm(false)
      
    } catch (error) {
      console.error('Failed to send invitation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update expiry date
      setPendingInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            : inv
        )
      )
    } catch (error) {
      console.error('Failed to resend invitation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveGuardian = async (guardianId: string) => {
    if (!confirm('Are you sure you want to remove this guardian? This action cannot be undone.')) {
      return
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setGuardians(prev => prev.filter(g => g.id !== guardianId))
    } catch (error) {
      console.error('Failed to remove guardian:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary':
        return <Crown className="h-4 w-4" />
      case 'secondary':
        return <Shield className="h-4 w-4" />
      case 'observer':
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'primary':
        return 'premium'
      case 'secondary':
        return 'primary'
      case 'observer':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'pending':
        return 'warning'
      case 'inactive':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600 mb-4">
            Invite trusted family members to help with marriage guidance and oversight
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowInviteForm(true)}
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          Invite Guardian
        </Button>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Invite Guardian</h3>
              <p className="text-sm text-neutral-600">Send an invitation to a family member</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Uncle Mahmoud"
                  error={errors.name}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="uncle.mahmoud@email.com"
                  error={errors.email}
                />
              </div>
              
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <select
                  id="relationship"
                  value={inviteForm.relationship}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, relationship: e.target.value }))}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Grandfather">Grandfather</option>
                  <option value="Grandmother">Grandmother</option>
                  <option value="Other">Other Family Member</option>
                </select>
                {errors.relationship && (
                  <p className="text-sm text-red-600 mt-1">{errors.relationship}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="role">Guardian Role</Label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="observer">Observer - View reports and activity</option>
                  <option value="secondary">Secondary - Approve matches and meetings</option>
                  <option value="primary">Primary - Full oversight and control</option>
                </select>
                
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    {inviteForm.role === 'primary' && 'Full control including settings and inviting others'}
                    {inviteForm.role === 'secondary' && 'Can approve matches, meetings, and view messages'}
                    {inviteForm.role === 'observer' && 'Can view activity reports and compliance data'}
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <textarea
                  id="message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal message to the invitation..."
                  className="w-full p-3 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-neutral-200 flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleSendInvitation}
                disabled={loading}
                isLoading={loading}
                leftIcon={<Send className="h-4 w-4" />}
                fullWidth
              >
                Send Invitation
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteForm({
                    email: '',
                    name: '',
                    relationship: '',
                    role: 'observer',
                    message: ''
                  })
                  setErrors({})
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current Guardians */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Current Guardians</h3>
          <p className="text-sm text-neutral-600">
            Family members currently involved in the matrimonial process
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {guardians.map((guardian) => (
            <div key={guardian.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  guardian.role === 'primary' ? 'bg-amber-100 text-amber-600' :
                  guardian.role === 'secondary' ? 'bg-primary-100 text-primary-600' :
                  'bg-neutral-100 text-neutral-600'
                }`}>
                  {getRoleIcon(guardian.role)}
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-neutral-900">{guardian.name}</h4>
                    <Badge variant={getRoleBadgeVariant(guardian.role) as any} size="sm">
                      {guardian.role}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(guardian.status) as any} size="sm">
                      {guardian.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-neutral-600 mb-1">{guardian.email}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {guardian.joinedAt && (
                      <span>Joined {formatRelativeTime(guardian.joinedAt)}</span>
                    )}
                    {guardian.lastActive && guardian.status === 'active' && (
                      <span>• Active {formatRelativeTime(guardian.lastActive)}</span>
                    )}
                    {guardian.status === 'pending' && guardian.invitedAt && (
                      <span>Invited {formatRelativeTime(guardian.invitedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {guardian.status === 'active' && (
                  <div className="text-right mr-4">
                    <p className="text-xs text-neutral-600 mb-1">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {guardian.permissions.slice(0, 2).map((permission) => (
                        <Badge key={permission} variant="outline" size="sm">
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {guardian.permissions.length > 2 && (
                        <Badge variant="outline" size="sm">
                          +{guardian.permissions.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  {/* Dropdown menu would go here */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Pending Invitations</h3>
            <p className="text-sm text-neutral-600">
              Invitations sent but not yet accepted
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-neutral-900">{invitation.email}</h4>
                      <Badge variant="warning" size="sm">
                        {invitation.role}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-neutral-600 mb-1">
                      {invitation.relationship} • Sent by {invitation.sentBy}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>Sent {formatRelativeTime(invitation.invitedAt)}</span>
                      <span>• Expires {formatRelativeTime(invitation.expiresAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendInvitation(invitation.id)}
                    disabled={loading}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Resend
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Islamic Guidance */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-green-900 mb-2">Islamic Guidance on Family Involvement</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>
                In Islam, marriage is not just between two individuals but involves both families. 
                Guardian involvement ensures the process follows Islamic principles and protects everyone involved.
              </p>
              <ul className="list-disc list-inside space-y-1 mt-3">
                <li>Parents and close relatives should be involved in the selection process</li>
                <li>Multiple family perspectives help ensure compatibility and good character</li>
                <li>Guardian oversight maintains modesty and appropriate boundaries</li>
                <li>Family consultation (Shura) is recommended for important decisions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}