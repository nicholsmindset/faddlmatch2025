import { Database } from './database'
import { PublicProfile } from './user'

export type Match = Database['public']['Tables']['matches']['Row']
export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MatchUpdate = Database['public']['Tables']['matches']['Update']

export type MatchStatus = Database['public']['Enums']['match_status']

// Composite types
export interface MatchWithProfiles {
  match: Match
  userA: PublicProfile
  userB: PublicProfile
}

export interface MatchResponse {
  matchId: string
  userId: string
  response: MatchStatus
  isMutual: boolean
}

export interface CompatibilityBreakdown {
  embeddingSimilarity: number
  locationMatch: number
  ageCompatibility: number
  religiousPractice: number
  childrenCompatibility?: number
  total: number
}

export interface PotentialMatch {
  userId: string
  compatibilityScore: number
  profile: {
    firstName: string
    yearOfBirth: number
    locationZone: string
    ethnicity: string
    prayerFrequency: string
    modestDress: string
    hasChildren: boolean
    bio?: string
  }
}