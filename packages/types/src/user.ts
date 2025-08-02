import { Database } from './database'

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type PartnerPreferences = Database['public']['Tables']['partner_preferences']['Row']
export type PartnerPreferencesInsert = Database['public']['Tables']['partner_preferences']['Insert']
export type PartnerPreferencesUpdate = Database['public']['Tables']['partner_preferences']['Update']

export type UserPhoto = Database['public']['Tables']['user_photos']['Row']
export type UserPhotoInsert = Database['public']['Tables']['user_photos']['Insert']
export type UserPhotoUpdate = Database['public']['Tables']['user_photos']['Update']

export type Guardian = Database['public']['Tables']['guardians']['Row']
export type GuardianInsert = Database['public']['Tables']['guardians']['Insert']
export type GuardianUpdate = Database['public']['Tables']['guardians']['Update']

// Enums
export type UserStatus = Database['public']['Enums']['user_status']
export type Gender = Database['public']['Enums']['gender']
export type MaritalStatus = Database['public']['Enums']['marital_status']
export type LocationZone = Database['public']['Enums']['location_zone']
export type PrayerFrequency = Database['public']['Enums']['prayer_frequency']
export type Ethnicity = Database['public']['Enums']['ethnicity']
export type SubscriptionTier = Database['public']['Enums']['subscription_tier']

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