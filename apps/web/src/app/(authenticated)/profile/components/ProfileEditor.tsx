'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useUserContext } from '@/contexts/UserContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { 
  User, 
  Heart, 
  MapPin, 
  Briefcase, 
  BookOpen,
  Users,
  Settings,
  Camera,
  Save,
  Plus,
  X
} from 'lucide-react'

export function ProfileEditor() {
  const { user } = useUser()
  const { profile, loading, refetchProfile } = useUserContext()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    yearOfBirth: new Date().getFullYear() - 25,
    gender: 'male',
    location: '',
    bio: '',
    
    // Religious Info
    religious_level: 'practicing',
    prayer_frequency: 'regularly',
    hijab_preference: 'preferred',
    beard_preference: 'preferred',
    
    // Personal Info
    education_level: 'bachelors',
    occupation: '',
    interests: [] as string[],
    languages: ['English'],
    seeking_marriage_timeline: 'within_year',
    
    // Family Info
    guardian_enabled: false,
    guardian_email: '',
    family_values: [] as string[],
    children_preference: 'maybe',
    
    // Preferences
    age_range: [22, 35] as [number, number],
    location_radius_km: 50,
    education_preference: [] as string[],
    religious_level_preference: ['practicing', 'devout']
  })

  const [newInterest, setNewInterest] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real app, you'd call the API here
      console.log('Saving profile:', formData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      await refetchProfile()
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }))
      setNewLanguage('')
    }
  }

  const removeLanguage = (language: string) => {
    if (formData.languages.length > 1) { // Keep at least one language
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter(l => l !== language)
      }))
    }
  }

  const addFamilyValue = () => {
    if (newValue.trim() && !formData.family_values.includes(newValue.trim())) {
      setFormData(prev => ({
        ...prev,
        family_values: [...prev.family_values, newValue.trim()]
      }))
      setNewValue('')
    }
  }

  const removeFamilyValue = (value: string) => {
    setFormData(prev => ({
      ...prev,
      family_values: prev.family_values.filter(v => v !== value)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-islamic-green"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="gap-2">
            <User className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="religious" className="gap-2">
            <Heart className="h-4 w-4" />
            Religious
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="family" className="gap-2">
            <Users className="h-4 w-4" />
            Family
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yearOfBirth">Year of Birth</Label>
              <Select
                value={formData.yearOfBirth.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, yearOfBirth: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Central Singapore"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">About Me</Label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full min-h-[120px] p-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-islamic-green"
              placeholder="Tell potential matches about yourself..."
            />
          </div>
        </TabsContent>

        {/* Religious Information */}
        <TabsContent value="religious" className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Religious Level</Label>
              <Select
                value={formData.religious_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, religious_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="practicing">Practicing</SelectItem>
                  <SelectItem value="devout">Devout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Prayer Frequency</Label>
              <Select
                value={formData.prayer_frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, prayer_frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarely">Rarely</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="regularly">Regularly</SelectItem>
                  <SelectItem value="always">Always</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.gender === 'male' && (
              <div className="space-y-2">
                <Label>Hijab Preference (for spouse)</Label>
                <Select
                  value={formData.hijab_preference}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, hijab_preference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {formData.gender === 'female' && (
              <div className="space-y-2">
                <Label>Beard Preference (for spouse)</Label>
                <Select
                  value={formData.beard_preference}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, beard_preference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Personal Information */}
        <TabsContent value="personal" className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Education Level</Label>
              <Select
                value={formData.education_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, education_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder="e.g., Software Engineer"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Marriage Timeline</Label>
              <Select
                value={formData.seeking_marriage_timeline}
                onValueChange={(value) => setFormData(prev => ({ ...prev, seeking_marriage_timeline: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="within_year">Within a year</SelectItem>
                  <SelectItem value="within_two_years">Within two years</SelectItem>
                  <SelectItem value="when_ready">When ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Interests */}
          <div className="space-y-4">
            <Label>Interests & Hobbies</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="gap-1">
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest"
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <Button onClick={addInterest} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Languages */}
          <div className="space-y-4">
            <Label>Languages Spoken</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.languages.map((language) => (
                <Badge key={language} variant="secondary" className="gap-1">
                  {language}
                  {formData.languages.length > 1 && (
                    <button
                      onClick={() => removeLanguage(language)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language"
                onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
              />
              <Button onClick={addLanguage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Family Information */}
        <TabsContent value="family" className="p-6 space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="guardian_enabled"
                  checked={formData.guardian_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardian_enabled: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="guardian_enabled">Enable Guardian Oversight</Label>
              </div>
              
              {formData.guardian_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="guardian_email">Guardian Email</Label>
                  <Input
                    id="guardian_email"
                    type="email"
                    value={formData.guardian_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_email: e.target.value }))}
                    placeholder="guardian@example.com"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Children Preference</Label>
              <Select
                value={formData.children_preference}
                onValueChange={(value) => setFormData(prev => ({ ...prev, children_preference: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="definitely">Definitely want children</SelectItem>
                  <SelectItem value="probably">Probably want children</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                  <SelectItem value="no">Don't want children</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Family Values */}
            <div className="space-y-4">
              <Label>Family Values</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.family_values.map((value) => (
                  <Badge key={value} variant="secondary" className="gap-1">
                    {value}
                    <button
                      onClick={() => removeFamilyValue(value)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Add a family value"
                  onKeyPress={(e) => e.key === 'Enter' && addFamilyValue()}
                />
                <Button onClick={addFamilyValue} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="p-6 space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Preferred Age Range</Label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  value={formData.age_range[0]}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    age_range: [parseInt(e.target.value), prev.age_range[1]]
                  }))}
                  className="w-20"
                />
                <span>to</span>
                <Input
                  type="number"
                  value={formData.age_range[1]}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    age_range: [prev.age_range[0], parseInt(e.target.value)]
                  }))}
                  className="w-20"
                />
                <span>years old</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location_radius">Search Radius (km)</Label>
              <Input
                id="location_radius"
                type="number"
                value={formData.location_radius_km}
                onChange={(e) => setFormData(prev => ({ ...prev, location_radius_km: parseInt(e.target.value) }))}
                min="1"
                max="500"
              />
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
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  )
}