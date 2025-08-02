'use client'

import { useState } from 'react'
import { 
  Settings, 
  Shield, 
  Bell, 
  Eye, 
  Users, 
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Save,
  RotateCcw,
  Lock,
  Unlock,
  Info,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PermissionLevel {
  id: string
  name: string
  description: string
  permissions: string[]
  restrictionsCount: number
}

export function PermissionSettings() {
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Permission levels
  const [oversightLevel, setOversightLevel] = useState<'light' | 'moderate' | 'comprehensive'>('moderate')
  
  // Auto-approval settings
  const [autoApprovalSettings, setAutoApprovalSettings] = useState({
    messages: false,
    photos: false,
    meetings: false,
    lowRiskMatches: true,
    familyVerifiedProfiles: true
  })
  
  // Notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
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
    frequency: 'immediate' as 'immediate' | 'hourly' | 'daily'
  })
  
  // Privacy controls
  const [privacyControls, setPrivacyControls] = useState({
    photoVisibility: 'guardian_approved' as 'always_hidden' | 'guardian_approved' | 'always_visible',
    profileVisibility: 'verified_only' as 'public' | 'verified_only' | 'family_approved',
    messageModeration: 'all_messages' as 'none' | 'flagged_only' | 'all_messages',
    activityTracking: true,
    deviceRestrictions: false
  })

  const permissionLevels: PermissionLevel[] = [
    {
      id: 'light',
      name: 'Light Oversight',
      description: 'Basic monitoring with minimal intervention',
      permissions: [
        'View activity summaries',
        'Receive weekly reports',
        'Approve high-risk activities only'
      ],
      restrictionsCount: 3
    },
    {
      id: 'moderate',
      name: 'Moderate Oversight',
      description: 'Balanced approach with key decision points',
      permissions: [
        'All Light permissions',
        'Approve matches and meetings',
        'Review flagged messages',
        'Set privacy controls'
      ],
      restrictionsCount: 8
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Oversight',
      description: 'Full involvement in all activities',
      permissions: [
        'All Moderate permissions',
        'Approve all messages',
        'Pre-approve all photos',
        'Real-time activity monitoring',
        'Device access controls'
      ],
      restrictionsCount: 15
    }
  ]

  const handleSaveSettings = async () => {
    setSaving(true)
    setHasChanges(false)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success message (you would implement this with your notification system)
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = () => {
    setOversightLevel('moderate')
    setAutoApprovalSettings({
      messages: false,
      photos: false,
      meetings: false,
      lowRiskMatches: true,
      familyVerifiedProfiles: true
    })
    setNotificationPreferences({
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
    })
    setPrivacyControls({
      photoVisibility: 'guardian_approved',
      profileVisibility: 'verified_only',
      messageModeration: 'all_messages',
      activityTracking: true,
      deviceRestrictions: false
    })
    setHasChanges(false)
  }

  const markChanged = () => {
    if (!hasChanges) setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Guardian Settings</h2>
          <p className="text-neutral-600">Configure oversight levels and notification preferences</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="warning" size="sm">
              Unsaved changes
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetSettings}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSettings}
            disabled={!hasChanges}
            isLoading={saving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Oversight Level */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary-100 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Oversight Level</h3>
            <p className="text-sm text-neutral-600">Choose how much involvement you want in the matrimonial process</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {permissionLevels.map((level) => (
            <div
              key={level.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                oversightLevel === level.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => {
                setOversightLevel(level.id as any)
                markChanged()
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-1">{level.name}</h4>
                  <p className="text-sm text-neutral-600 mb-2">{level.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {level.restrictionsCount} controls
                  </Badge>
                  {oversightLevel === level.id && (
                    <div className="w-4 h-4 bg-primary-600 rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                {level.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-neutral-700">
                    <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Approval Settings */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <Settings className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Auto-Approval Settings</h3>
            <p className="text-sm text-neutral-600">Configure what can be automatically approved without your review</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            {
              key: 'messages',
              label: 'Message Approval',
              description: 'Allow pre-approved messages to be sent without review',
              icon: <MessageSquare className="h-4 w-4" />,
              risk: 'medium'
            },
            {
              key: 'photos',
              label: 'Photo Updates',
              description: 'Allow profile photo updates that meet guidelines',
              icon: <Eye className="h-4 w-4" />,
              risk: 'high'
            },
            {
              key: 'meetings',
              label: 'Meeting Arrangements',
              description: 'Allow chaperoned meetings at verified locations',
              icon: <Users className="h-4 w-4" />,
              risk: 'high'
            },
            {
              key: 'lowRiskMatches',
              label: 'Low-Risk Matches',
              description: 'Auto-approve matches with very high compatibility (95%+)',
              icon: <Shield className="h-4 w-4" />,
              risk: 'low'
            },
            {
              key: 'familyVerifiedProfiles',
              label: 'Family-Verified Profiles',
              description: 'Allow interactions with family-verified profiles',
              icon: <Users className="h-4 w-4" />,
              risk: 'low'
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  setting.risk === 'high' ? 'bg-red-100 text-red-600' :
                  setting.risk === 'medium' ? 'bg-amber-100 text-amber-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {setting.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-neutral-900">{setting.label}</h4>
                    <Badge 
                      variant={
                        setting.risk === 'high' ? 'danger' :
                        setting.risk === 'medium' ? 'warning' : 'success'
                      } 
                      size="sm"
                    >
                      {setting.risk} risk
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{setting.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setAutoApprovalSettings(prev => ({
                    ...prev,
                    [setting.key]: !prev[setting.key as keyof typeof prev]
                  }))
                  markChanged()
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoApprovalSettings[setting.key as keyof typeof autoApprovalSettings]
                    ? 'bg-primary-600'
                    : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoApprovalSettings[setting.key as keyof typeof autoApprovalSettings]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Notification Preferences</h3>
            <p className="text-sm text-neutral-600">Control how and when you receive guardian notifications</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Notification Methods */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-3">Notification Methods</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
                { key: 'push', label: 'Push Notifications', icon: <Bell className="h-4 w-4" /> },
                { key: 'sms', label: 'SMS', icon: <Smartphone className="h-4 w-4" /> }
              ].map((method) => (
                <div key={method.key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-neutral-200 p-1 rounded">
                      {method.icon}
                    </div>
                    <span className="font-medium text-neutral-900">{method.label}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setNotificationPreferences(prev => ({
                        ...prev,
                        [method.key]: !prev[method.key as keyof typeof prev]
                      }))
                      markChanged()
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      notificationPreferences[method.key as keyof typeof notificationPreferences]
                        ? 'bg-primary-600'
                        : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        notificationPreferences[method.key as keyof typeof notificationPreferences]
                          ? 'translate-x-5'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quiet Hours */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-3">Quiet Hours</h4>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-600" />
                  <span className="font-medium text-neutral-900">Enable quiet hours</span>
                </div>
                
                <button
                  onClick={() => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        enabled: !prev.quietHours.enabled
                      }
                    }))
                    markChanged()
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notificationPreferences.quietHours.enabled
                      ? 'bg-primary-600'
                      : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.quietHours.enabled
                        ? 'translate-x-5'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {notificationPreferences.quietHours.enabled && (
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">From</label>
                    <input
                      type="time"
                      value={notificationPreferences.quietHours.start}
                      onChange={(e) => {
                        setNotificationPreferences(prev => ({
                          ...prev,
                          quietHours: {
                            ...prev.quietHours,
                            start: e.target.value
                          }
                        }))
                        markChanged()
                      }}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">To</label>
                    <input
                      type="time"
                      value={notificationPreferences.quietHours.end}
                      onChange={(e) => {
                        setNotificationPreferences(prev => ({
                          ...prev,
                          quietHours: {
                            ...prev.quietHours,
                            end: e.target.value
                          }
                        }))
                        markChanged()
                      }}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Lock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Privacy Controls</h3>
            <p className="text-sm text-neutral-600">Manage visibility and access controls for supervised profiles</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            {
              key: 'photoVisibility',
              label: 'Photo Visibility',
              description: 'Control when profile photos are visible to potential matches',
              options: [
                { value: 'always_hidden', label: 'Always Hidden', risk: 'low' },
                { value: 'guardian_approved', label: 'Guardian Approved', risk: 'medium' },
                { value: 'always_visible', label: 'Always Visible', risk: 'high' }
              ]
            },
            {
              key: 'profileVisibility',
              label: 'Profile Visibility',
              description: 'Control who can view the full profile information',
              options: [
                { value: 'family_approved', label: 'Family Approved Only', risk: 'low' },
                { value: 'verified_only', label: 'Verified Profiles Only', risk: 'medium' },
                { value: 'public', label: 'Public Visibility', risk: 'high' }
              ]
            },
            {
              key: 'messageModeration',
              label: 'Message Moderation',
              description: 'Level of message review and filtering',
              options: [
                { value: 'all_messages', label: 'Review All Messages', risk: 'low' },
                { value: 'flagged_only', label: 'Flagged Messages Only', risk: 'medium' },
                { value: 'none', label: 'No Moderation', risk: 'high' }
              ]
            }
          ].map((control) => (
            <div key={control.key} className="p-4 bg-neutral-50 rounded-lg">
              <div className="mb-3">
                <h4 className="font-medium text-neutral-900 mb-1">{control.label}</h4>
                <p className="text-sm text-neutral-600">{control.description}</p>
              </div>
              
              <div className="space-y-2">
                {control.options.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name={control.key}
                      value={option.value}
                      checked={privacyControls[control.key as keyof typeof privacyControls] === option.value}
                      onChange={() => {
                        setPrivacyControls(prev => ({
                          ...prev,
                          [control.key]: option.value
                        }))
                        markChanged()
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-900">{option.label}</span>
                    <Badge 
                      variant={
                        option.risk === 'high' ? 'danger' :
                        option.risk === 'medium' ? 'warning' : 'success'
                      } 
                      size="sm"
                    >
                      {option.risk} risk
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 mb-2">Important Note on Islamic Values</h3>
            <p className="text-sm text-amber-800 mb-3">
              These settings help maintain Islamic principles while providing appropriate oversight. 
              Remember that the goal is to facilitate halal marriage while protecting dignity and privacy.
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Higher oversight levels provide more protection but may limit autonomy</li>
              <li>• Auto-approval should only be used for low-risk, well-understood situations</li>
              <li>• Always maintain open communication with supervised family members</li>
              <li>• Seek Islamic guidance when uncertain about appropriate boundaries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}