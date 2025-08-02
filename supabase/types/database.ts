// Database type definitions for FADDL Match
// Generated from Supabase schema with Islamic matrimonial enhancements

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          email_verified_at: string | null
          phone_verified_at: string | null
          status: 'active' | 'inactive' | 'suspended' | 'banned'
          subscription_tier: 'basic' | 'premium' | 'vip'
          subscription_expires_at: string | null
          last_active_at: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          phone?: string | null
          email_verified_at?: string | null
          phone_verified_at?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'banned'
          subscription_tier?: 'basic' | 'premium' | 'vip'
          subscription_expires_at?: string | null
          last_active_at?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          email_verified_at?: string | null
          phone_verified_at?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'banned'
          subscription_tier?: 'basic' | 'premium' | 'vip'
          subscription_expires_at?: string | null
          last_active_at?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          year_of_birth: number
          gender: 'male' | 'female'
          location_zone: 'north' | 'south' | 'east' | 'west' | 'central'
          marital_status: 'divorced' | 'widowed'
          has_children: boolean
          children_count: number
          children_ages: number[] | null
          open_to_more_children: boolean
          prayer_frequency: 'always' | 'usually' | 'rarely'
          modest_dress: 'always' | 'usually' | 'rarely'
          ethnicity: 'malay' | 'chinese' | 'indian' | 'eurasian' | 'other'
          languages: string[]
          education: string | null
          profession: string | null
          bio: string | null
          looking_for: string | null
          preferences: Json
          profile_embedding: number[] | null
          values_embedding: number[] | null
          profile_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          year_of_birth: number
          gender: 'male' | 'female'
          location_zone: 'north' | 'south' | 'east' | 'west' | 'central'
          marital_status: 'divorced' | 'widowed'
          has_children?: boolean
          children_count?: number
          children_ages?: number[] | null
          open_to_more_children?: boolean
          prayer_frequency: 'always' | 'usually' | 'rarely'
          modest_dress: 'always' | 'usually' | 'rarely'
          ethnicity: 'malay' | 'chinese' | 'indian' | 'eurasian' | 'other'
          languages: string[]
          education?: string | null
          profession?: string | null
          bio?: string | null
          looking_for?: string | null
          preferences?: Json
          profile_embedding?: number[] | null
          values_embedding?: number[] | null
          profile_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          year_of_birth?: number
          gender?: 'male' | 'female'
          location_zone?: 'north' | 'south' | 'east' | 'west' | 'central'
          marital_status?: 'divorced' | 'widowed'
          has_children?: boolean
          children_count?: number
          children_ages?: number[] | null
          open_to_more_children?: boolean
          prayer_frequency?: 'always' | 'usually' | 'rarely'
          modest_dress?: 'always' | 'usually' | 'rarely'
          ethnicity?: 'malay' | 'chinese' | 'indian' | 'eurasian' | 'other'
          languages?: string[]
          education?: string | null
          profession?: string | null
          bio?: string | null
          looking_for?: string | null
          preferences?: Json
          profile_embedding?: number[] | null
          values_embedding?: number[] | null
          profile_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      partner_preferences: {
        Row: {
          id: string
          user_id: string
          min_age: number
          max_age: number
          preferred_locations: ('north' | 'south' | 'east' | 'west' | 'central')[] | null
          top_qualities: string[] | null
          deal_breakers: string[] | null
          min_prayer_frequency: 'always' | 'usually' | 'rarely' | null
          min_modest_dress: 'always' | 'usually' | 'rarely' | null
          accept_children: boolean
          want_more_children: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          min_age?: number
          max_age?: number
          preferred_locations?: ('north' | 'south' | 'east' | 'west' | 'central')[] | null
          top_qualities?: string[] | null
          deal_breakers?: string[] | null
          min_prayer_frequency?: 'always' | 'usually' | 'rarely' | null
          min_modest_dress?: 'always' | 'usually' | 'rarely' | null
          accept_children?: boolean
          want_more_children?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          min_age?: number
          max_age?: number
          preferred_locations?: ('north' | 'south' | 'east' | 'west' | 'central')[] | null
          top_qualities?: string[] | null
          deal_breakers?: string[] | null
          min_prayer_frequency?: 'always' | 'usually' | 'rarely' | null
          min_modest_dress?: 'always' | 'usually' | 'rarely' | null
          accept_children?: boolean
          want_more_children?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_photos: {
        Row: {
          id: string
          user_id: string
          url: string
          blur_url: string | null
          is_primary: boolean
          visibility: string
          moderation_status: 'pending' | 'approved' | 'flagged' | 'removed'
          moderation_notes: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          blur_url?: string | null
          is_primary?: boolean
          visibility?: string
          moderation_status?: 'pending' | 'approved' | 'flagged' | 'removed'
          moderation_notes?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          blur_url?: string | null
          is_primary?: boolean
          visibility?: string
          moderation_status?: 'pending' | 'approved' | 'flagged' | 'removed'
          moderation_notes?: string | null
          uploaded_at?: string
        }
      }
      guardians: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship: string
          email?: string | null
          phone?: string | null
          approval_required?: boolean
          can_view_messages?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relationship?: string
          email?: string | null
          phone?: string | null
          approval_required?: boolean
          can_view_messages?: boolean
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user_a_id: string
          user_b_id: string
          compatibility_score: number
          score_breakdown: Json
          user_a_status: 'pending' | 'mutual' | 'rejected' | 'expired'
          user_b_status: 'pending' | 'mutual' | 'rejected' | 'expired'
          matched_at: string
          user_a_responded_at: string | null
          user_b_responded_at: string | null
          expires_at: string
        }
        Insert: {
          id?: string
          user_a_id: string
          user_b_id: string
          compatibility_score: number
          score_breakdown?: Json
          user_a_status?: 'pending' | 'mutual' | 'rejected' | 'expired'
          user_b_status?: 'pending' | 'mutual' | 'rejected' | 'expired'
          matched_at?: string
          user_a_responded_at?: string | null
          user_b_responded_at?: string | null
          expires_at?: string
        }
        Update: {
          id?: string
          user_a_id?: string
          user_b_id?: string
          compatibility_score?: number
          score_breakdown?: Json
          user_a_status?: 'pending' | 'mutual' | 'rejected' | 'expired'
          user_b_status?: 'pending' | 'mutual' | 'rejected' | 'expired'
          matched_at?: string
          user_a_responded_at?: string | null
          user_b_responded_at?: string | null
          expires_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          match_id: string
          started_at: string
          last_message_at: string | null
          message_count: number
          is_active: boolean
          guardian_approved: boolean
        }
        Insert: {
          id?: string
          match_id: string
          started_at?: string
          last_message_at?: string | null
          message_count?: number
          is_active?: boolean
          guardian_approved?: boolean
        }
        Update: {
          id?: string
          match_id?: string
          started_at?: string
          last_message_at?: string | null
          message_count?: number
          is_active?: boolean
          guardian_approved?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string | null
          type: 'text' | 'voice' | 'image' | 'system'
          metadata: Json
          sent_at: string
          delivered_at: string | null
          read_at: string | null
          moderation_status: 'pending' | 'approved' | 'flagged' | 'removed'
          moderation_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          content?: string | null
          type?: 'text' | 'voice' | 'image' | 'system'
          metadata?: Json
          sent_at?: string
          delivered_at?: string | null
          read_at?: string | null
          moderation_status?: 'pending' | 'approved' | 'flagged' | 'removed'
          moderation_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string | null
          type?: 'text' | 'voice' | 'image' | 'system'
          metadata?: Json
          sent_at?: string
          delivered_at?: string | null
          read_at?: string | null
          moderation_status?: 'pending' | 'approved' | 'flagged' | 'removed'
          moderation_score?: number | null
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          properties?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_potential_matches: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          user_id: string
          compatibility_score: number
          profile: Json
        }[]
      }
      update_user_last_active: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }
      create_match: {
        Args: {
          p_user_a_id: string
          p_user_b_id: string
          p_compatibility_score: number
          p_score_breakdown?: Json
        }
        Returns: string
      }
      respond_to_match: {
        Args: {
          p_match_id: string
          p_user_id: string
          p_response: 'pending' | 'mutual' | 'rejected' | 'expired'
        }
        Returns: boolean
      }
      send_message: {
        Args: {
          p_conversation_id: string
          p_sender_id: string
          p_recipient_id: string
          p_content: string
          p_type?: 'text' | 'voice' | 'image' | 'system'
          p_metadata?: Json
        }
        Returns: string
      }
      mark_messages_read: {
        Args: {
          p_conversation_id: string
          p_user_id: string
        }
        Returns: number
      }
      cleanup_expired_matches: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          total_matches: number
          mutual_matches: number
          pending_matches: number
          messages_sent: number
          messages_received: number
          avg_compatibility_score: number
          profile_views: number
        }[]
      }
      create_monthly_partitions: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      user_status: 'active' | 'inactive' | 'suspended' | 'banned'
      gender: 'male' | 'female'
      marital_status: 'divorced' | 'widowed'
      location_zone: 'north' | 'south' | 'east' | 'west' | 'central'
      prayer_frequency: 'always' | 'usually' | 'rarely'
      ethnicity: 'malay' | 'chinese' | 'indian' | 'eurasian' | 'other'
      subscription_tier: 'basic' | 'premium' | 'vip'
      match_status: 'pending' | 'mutual' | 'rejected' | 'expired'
      message_type: 'text' | 'voice' | 'image' | 'system'
      moderation_status: 'pending' | 'approved' | 'flagged' | 'removed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Match = Database['public']['Tables']['matches']['Row']
export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MatchUpdate = Database['public']['Tables']['matches']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type Guardian = Database['public']['Tables']['guardians']['Row']
export type GuardianInsert = Database['public']['Tables']['guardians']['Insert']
export type GuardianUpdate = Database['public']['Tables']['guardians']['Update']

export type PartnerPreferences = Database['public']['Tables']['partner_preferences']['Row']
export type PartnerPreferencesInsert = Database['public']['Tables']['partner_preferences']['Insert']
export type PartnerPreferencesUpdate = Database['public']['Tables']['partner_preferences']['Update']

export type UserPhoto = Database['public']['Tables']['user_photos']['Row']
export type UserPhotoInsert = Database['public']['Tables']['user_photos']['Insert']
export type UserPhotoUpdate = Database['public']['Tables']['user_photos']['Update']

export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert']
export type AnalyticsEventUpdate = Database['public']['Tables']['analytics_events']['Update']

// Enum types for type safety
export type UserStatus = Database['public']['Enums']['user_status']
export type Gender = Database['public']['Enums']['gender']
export type MaritalStatus = Database['public']['Enums']['marital_status']
export type LocationZone = Database['public']['Enums']['location_zone']
export type PrayerFrequency = Database['public']['Enums']['prayer_frequency']
export type Ethnicity = Database['public']['Enums']['ethnicity']
export type SubscriptionTier = Database['public']['Enums']['subscription_tier']
export type MatchStatus = Database['public']['Enums']['match_status']
export type MessageType = Database['public']['Enums']['message_type']
export type ModerationStatus = Database['public']['Enums']['moderation_status']

// Complex query result types
export type PotentialMatch = {
  user_id: string
  compatibility_score: number
  profile: Json
}

export type UserStats = {
  total_matches: number
  mutual_matches: number
  pending_matches: number
  messages_sent: number
  messages_received: number
  avg_compatibility_score: number
  profile_views: number
}

// Profile with related data for client use
export type ExtendedUserProfile = UserProfile & {
  user: User
  partner_preferences: PartnerPreferences | null
  photos: UserPhoto[]
  guardian: Guardian | null
  stats: UserStats | null
}

// Match with participant details
export type ExtendedMatch = Match & {
  user_a_profile: UserProfile
  user_b_profile: UserProfile
  conversation: Conversation | null
}

// Conversation with latest messages
export type ExtendedConversation = Conversation & {
  match: ExtendedMatch
  latest_messages: Message[]
  unread_count: number
}