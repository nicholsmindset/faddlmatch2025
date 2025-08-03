'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Smartphone,
  Mail,
  Lock,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react'

export function SettingsInterface() {
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('account')

  // Settings state
  const [settings, setSettings] = useState({
    // Account Settings
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    language: 'en',
    timezone: 'Asia/Singapore',
    
    // Notification Settings
    emailNotifications: {
      newMatches: true,
      messages: true,
      profileViews: true,
      guardianUpdates: true,
      systemUpdates: false
    },
    pushNotifications: {
      newMatches: true,
      messages: true,
      profileViews: false,
      guardianUpdates: true
    },
    
    // Privacy Settings
    profileVisibility: 'matches', // 'public', 'matches', 'guardian_only'
    photoVisibility: 'matches',
    lastSeenVisibility: true,
    readReceiptsEnabled: true,
    showOnlineStatus: true,
    allowSearchByEmail: false,
    allowSearchByPhone: false,
    
    // Security Settings
    twoFactorEnabled: false,
    loginAlerts: true,
    deviceManagement: true
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real app, save settings to API
      console.log('Saving settings:', settings)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, call delete account API
      console.log('Delete account requested')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Eye className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="p-6 space-y-6">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  disabled
                />
                <p className="text-xs text-neutral-600">Email is managed by your authentication provider</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+65 9xxx xxxx"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ms">Bahasa Melayu</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="ur">اردو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                    <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (GMT+8)</SelectItem>
                    <SelectItem value="Asia/Jakarta">Jakarta (GMT+7)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="p-6 space-y-6">
          <div className="space-y-8">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-neutral-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Email Notifications</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(settings.emailNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        emailNotifications: {
                          ...prev.emailNotifications,
                          [key]: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Push Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-neutral-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Push Notifications</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(settings.pushNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        pushNotifications: {
                          ...prev.pushNotifications,
                          [key]: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="p-6 space-y-6">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select
                  value={settings.profileVisibility}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, profileVisibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="matches">Matches Only</SelectItem>
                    <SelectItem value="guardian_only">Guardian Approved Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Photo Visibility</Label>
                <Select
                  value={settings.photoVisibility}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, photoVisibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="matches">Matches Only</SelectItem>
                    <SelectItem value="guardian_only">Guardian Approved Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Activity & Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Show when I was last seen</Label>
                  <input
                    type="checkbox"
                    checked={settings.lastSeenVisibility}
                    onChange={(e) => setSettings(prev => ({ ...prev, lastSeenVisibility: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Enable read receipts</Label>
                  <input
                    type="checkbox"
                    checked={settings.readReceiptsEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, readReceiptsEnabled: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Show online status</Label>
                  <input
                    type="checkbox"
                    checked={settings.showOnlineStatus}
                    onChange={(e) => setSettings(prev => ({ ...prev, showOnlineStatus: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Search & Discovery</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Allow others to find me by email</Label>
                  <input
                    type="checkbox"
                    checked={settings.allowSearchByEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowSearchByEmail: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Allow others to find me by phone</Label>
                  <input
                    type="checkbox"
                    checked={settings.allowSearchByPhone}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowSearchByPhone: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="p-6 space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Authentication</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-neutral-600">Add an extra layer of security to your account</p>
                  </div>
                  <Button
                    variant={settings.twoFactorEnabled ? "outline" : "primary"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                  >
                    {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-neutral-600">Get notified when someone logs into your account</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.loginAlerts}
                    onChange={(e) => setSettings(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Account Management</h3>
              
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Smartphone className="h-4 w-4" />
                  Manage Devices
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Eye className="h-4 w-4" />
                  Download My Data
                </Button>
              </div>
            </div>
            
            {/* Danger Zone */}
            <div className="border-t border-neutral-200 pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Danger Zone</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 border-red-300 text-red-700 hover:bg-red-100 gap-2"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Save Button */}
      <div className="p-6 border-t border-neutral-200">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}