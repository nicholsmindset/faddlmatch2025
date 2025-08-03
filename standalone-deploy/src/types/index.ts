// Essential types for FADDL Match standalone deployment

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Core enums
export type UserStatus = 'pending' | 'active' | 'suspended' | 'inactive' | 'deleted'
export type Gender = 'male' | 'female'
export type MaritalStatus = 'never_married' | 'divorced' | 'widowed'
export type LocationZone = 'north_america' | 'europe' | 'middle_east' | 'asia_pacific' | 'africa' | 'south_america'
export type PrayerFrequency = 'always' | 'usually' | 'sometimes' | 'rarely' | 'never'
export type Ethnicity = 'arab' | 'turkish' | 'persian' | 'south_asian' | 'southeast_asian' | 'east_asian' | 'african' | 'mixed' | 'other'
export type SubscriptionTier = 'free' | 'premium' | 'executive'
export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type MessageStatus = 'sent' | 'delivered' | 'read'

// User types
export interface User {
  id: string
  clerk_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  status: UserStatus
  subscription_tier: SubscriptionTier
  email_verified: boolean
  phone_verified: boolean
  profile_completed: boolean
  is_guardian_approved: boolean
  created_at: string
  updated_at: string
  last_seen: string | null
}

export interface UserProfile {
  user_id: string
  year_of_birth: number
  gender: Gender
  location_zone: LocationZone
  marital_status: MaritalStatus
  has_children: boolean
  children_count: number
  prayer_frequency: PrayerFrequency
  modest_dress: PrayerFrequency
  ethnicity: Ethnicity
  languages: string[]
  education: string | null
  profession: string | null
  bio: string | null
  height: number | null
  created_at: string
  updated_at: string
}

export interface PartnerPreferences {
  user_id: string
  min_age: number
  max_age: number
  location_zones: LocationZone[]
  marital_statuses: MaritalStatus[]
  prayer_frequency: PrayerFrequency[]
  modest_dress: PrayerFrequency[]
  ethnicities: Ethnicity[]
  has_children_ok: boolean
  education_important: boolean
  min_height: number | null
  max_height: number | null
  created_at: string
  updated_at: string
}

export interface UserPhoto {
  id: string
  user_id: string
  url: string
  is_primary: boolean
  is_approved: boolean
  uploaded_at: string
}

export interface Guardian {
  id: string
  user_id: string
  name: string
  relationship: string
  email: string | null
  phone: string | null
  approval_required: boolean
  can_view_messages: boolean
  created_at: string
}

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  status: MatchStatus
  compatibility_score: number
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface Conversation {
  id: string
  match_id: string
  is_active: boolean
  guardian_approved: boolean
  message_count: number
  started_at: string
  last_message_at: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  status: MessageStatus
  is_compliant: boolean
  compliance_score: number | null
  sent_at: string
  read_at: string | null
}

// Composite types
export interface CompleteUserProfile {
  user: User
  profile: UserProfile
  preferences: PartnerPreferences
  photos: UserPhoto[]
  guardian?: Guardian
}

export interface PublicProfile {
  id: string
  firstName: string
  lastName: string
  yearOfBirth: number
  gender: Gender
  locationZone: LocationZone
  maritalStatus: MaritalStatus
  hasChildren: boolean
  childrenCount: number
  prayerFrequency: PrayerFrequency
  modestDress: PrayerFrequency
  ethnicity: Ethnicity
  languages: string[]
  education?: string
  profession?: string
  bio?: string
  photos: UserPhoto[]
  subscriptionTier: SubscriptionTier
}

export interface MatchWithProfile {
  match: Match
  otherUser: PublicProfile
  conversation?: Conversation
}

export interface ConversationWithDetails {
  conversation: Conversation
  match: Match
  otherUser: PublicProfile
  lastMessage?: Message
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Form types for onboarding
export interface BasicInfoForm {
  firstName: string
  lastName: string
  yearOfBirth: number
  gender: Gender
  locationZone: LocationZone
}

export interface FamilySituationForm {
  maritalStatus: MaritalStatus
  hasChildren: boolean
  childrenCount: number
}

export interface ReligiousInfoForm {
  prayerFrequency: PrayerFrequency
  modestDress: PrayerFrequency
}

export interface PersonalInfoForm {
  ethnicity: Ethnicity
  languages: string[]
  education: string
  profession: string
  bio: string
  height: number
}

export interface PreferencesForm {
  minAge: number
  maxAge: number
  locationZones: LocationZone[]
  maritalStatuses: MaritalStatus[]
  prayerFrequency: PrayerFrequency[]
  modestDress: PrayerFrequency[]
  ethnicities: Ethnicity[]
  hasChildrenOk: boolean
  educationImportant: boolean
  minHeight?: number
  maxHeight?: number
}

export interface GuardianForm {
  name: string
  relationship: string
  email: string
  phone: string
  approvalRequired: boolean
  canViewMessages: boolean
}

// Hook types
export interface UseOnboardingState {
  currentStep: number
  totalSteps: number
  isComplete: boolean
  canProceed: boolean
  canGoBack: boolean
}

// Constants for options
export const LOCATION_ZONES: { value: LocationZone; label: string }[] = [
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'middle_east', label: 'Middle East' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
  { value: 'africa', label: 'Africa' },
  { value: 'south_america', label: 'South America' }
]

export const ETHNICITIES: { value: Ethnicity; label: string }[] = [
  { value: 'arab', label: 'Arab' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'persian', label: 'Persian' },
  { value: 'south_asian', label: 'South Asian' },
  { value: 'southeast_asian', label: 'Southeast Asian' },
  { value: 'east_asian', label: 'East Asian' },
  { value: 'african', label: 'African' },
  { value: 'mixed', label: 'Mixed Heritage' },
  { value: 'other', label: 'Other' }
]

export const PRAYER_FREQUENCIES: { value: PrayerFrequency; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'usually', label: 'Usually' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' }
]