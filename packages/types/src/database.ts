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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          properties: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          guardian_approved: boolean
          id: string
          is_active: boolean
          last_message_at: string | null
          match_id: string
          message_count: number
          started_at: string
        }
        Insert: {
          guardian_approved?: boolean
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          match_id: string
          message_count?: number
          started_at?: string
        }
        Update: {
          guardian_approved?: boolean
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          match_id?: string
          message_count?: number
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          }
        ]
      }
      guardians: {
        Row: {
          approval_required: boolean
          can_view_messages: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          approval_required?: boolean
          can_view_messages?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          approval_required?: boolean
          can_view_messages?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          compatibility_score: number
          expires_at: string
          id: string
          matched_at: string
          score_breakdown: Json
          user_a_id: string
          user_a_responded_at: string | null
          user_a_status: Database["public"]["Enums"]["match_status"]
          user_b_id: string
          user_b_responded_at: string | null
          user_b_status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          compatibility_score: number
          expires_at?: string
          id?: string
          matched_at?: string
          score_breakdown?: Json
          user_a_id: string
          user_a_responded_at?: string | null
          user_a_status?: Database["public"]["Enums"]["match_status"]
          user_b_id: string
          user_b_responded_at?: string | null
          user_b_status?: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          compatibility_score?: number
          expires_at?: string
          id?: string
          matched_at?: string
          score_breakdown?: Json
          user_a_id?: string
          user_a_responded_at?: string | null
          user_a_status?: Database["public"]["Enums"]["match_status"]
          user_b_id?: string
          user_b_responded_at?: string | null
          user_b_status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          metadata: Json
          moderation_score: number | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          read_at: string | null
          recipient_id: string
          sender_id: string
          sent_at: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          metadata?: Json
          moderation_score?: number | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sent_at?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          metadata?: Json
          moderation_score?: number | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sent_at?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      partner_preferences: {
        Row: {
          accept_children: boolean
          created_at: string
          deal_breakers: string[] | null
          id: string
          max_age: number
          min_age: number
          min_modest_dress: Database["public"]["Enums"]["prayer_frequency"] | null
          min_prayer_frequency: Database["public"]["Enums"]["prayer_frequency"] | null
          preferred_locations: Database["public"]["Enums"]["location_zone"][] | null
          top_qualities: string[] | null
          updated_at: string
          user_id: string
          want_more_children: boolean | null
        }
        Insert: {
          accept_children?: boolean
          created_at?: string
          deal_breakers?: string[] | null
          id?: string
          max_age?: number
          min_age?: number
          min_modest_dress?: Database["public"]["Enums"]["prayer_frequency"] | null
          min_prayer_frequency?: Database["public"]["Enums"]["prayer_frequency"] | null
          preferred_locations?: Database["public"]["Enums"]["location_zone"][] | null
          top_qualities?: string[] | null
          updated_at?: string
          user_id: string
          want_more_children?: boolean | null
        }
        Update: {
          accept_children?: boolean
          created_at?: string
          deal_breakers?: string[] | null
          id?: string
          max_age?: number
          min_age?: number
          min_modest_dress?: Database["public"]["Enums"]["prayer_frequency"] | null
          min_prayer_frequency?: Database["public"]["Enums"]["prayer_frequency"] | null
          preferred_locations?: Database["public"]["Enums"]["location_zone"][] | null
          top_qualities?: string[] | null
          updated_at?: string
          user_id?: string
          want_more_children?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_photos: {
        Row: {
          blur_url: string | null
          id: string
          is_primary: boolean
          moderation_notes: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          uploaded_at: string
          url: string
          user_id: string
          visibility: string
        }
        Insert: {
          blur_url?: string | null
          id?: string
          is_primary?: boolean
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          uploaded_at?: string
          url: string
          user_id: string
          visibility?: string
        }
        Update: {
          blur_url?: string | null
          id?: string
          is_primary?: boolean
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          uploaded_at?: string
          url?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          children_ages: number[] | null
          children_count: number
          created_at: string
          education: string | null
          ethnicity: Database["public"]["Enums"]["ethnicity"]
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          has_children: boolean
          id: string
          languages: string[]
          last_name: string
          location_zone: Database["public"]["Enums"]["location_zone"]
          looking_for: string | null
          marital_status: Database["public"]["Enums"]["marital_status"]
          modest_dress: Database["public"]["Enums"]["prayer_frequency"]
          open_to_more_children: boolean
          prayer_frequency: Database["public"]["Enums"]["prayer_frequency"]
          preferences: Json
          profession: string | null
          profile_completed_at: string | null
          profile_embedding: string | null
          updated_at: string
          user_id: string
          values_embedding: string | null
          year_of_birth: number
        }
        Insert: {
          bio?: string | null
          children_ages?: number[] | null
          children_count?: number
          created_at?: string
          education?: string | null
          ethnicity: Database["public"]["Enums"]["ethnicity"]
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          has_children?: boolean
          id?: string
          languages: string[]
          last_name: string
          location_zone: Database["public"]["Enums"]["location_zone"]
          looking_for?: string | null
          marital_status: Database["public"]["Enums"]["marital_status"]
          modest_dress: Database["public"]["Enums"]["prayer_frequency"]
          open_to_more_children?: boolean
          prayer_frequency: Database["public"]["Enums"]["prayer_frequency"]
          preferences?: Json
          profession?: string | null
          profile_completed_at?: string | null
          profile_embedding?: string | null
          updated_at?: string
          user_id: string
          values_embedding?: string | null
          year_of_birth: number
        }
        Update: {
          bio?: string | null
          children_ages?: number[] | null
          children_count?: number
          created_at?: string
          education?: string | null
          ethnicity?: Database["public"]["Enums"]["ethnicity"]
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          has_children?: boolean
          id?: string
          languages?: string[]
          last_name?: string
          location_zone?: Database["public"]["Enums"]["location_zone"]
          looking_for?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"]
          modest_dress?: Database["public"]["Enums"]["prayer_frequency"]
          open_to_more_children?: boolean
          prayer_frequency?: Database["public"]["Enums"]["prayer_frequency"]
          preferences?: Json
          profession?: string | null
          profile_completed_at?: string | null
          profile_embedding?: string | null
          updated_at?: string
          user_id?: string
          values_embedding?: string | null
          year_of_birth?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          email_verified_at: string | null
          id: string
          last_active_at: string
          phone: string | null
          phone_verified_at: string | null
          status: Database["public"]["Enums"]["user_status"]
          subscription_expires_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          email_verified_at?: string | null
          id?: string
          last_active_at?: string
          phone?: string | null
          phone_verified_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          email_verified_at?: string | null
          id?: string
          last_active_at?: string
          phone?: string | null
          phone_verified_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_matches: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      create_monthly_partitions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
      mark_messages_read: {
        Args: {
          p_conversation_id: string
          p_user_id: string
        }
        Returns: number
      }
      respond_to_match: {
        Args: {
          p_match_id: string
          p_user_id: string
          p_response: Database["public"]["Enums"]["match_status"]
        }
        Returns: boolean
      }
      send_message: {
        Args: {
          p_conversation_id: string
          p_sender_id: string
          p_recipient_id: string
          p_content: string
          p_type?: Database["public"]["Enums"]["message_type"]
          p_metadata?: Json
        }
        Returns: string
      }
      update_user_last_active: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      ethnicity: "malay" | "chinese" | "indian" | "eurasian" | "other"
      gender: "male" | "female"
      location_zone: "north" | "south" | "east" | "west" | "central"
      marital_status: "divorced" | "widowed"
      match_status: "pending" | "mutual" | "rejected" | "expired"
      message_type: "text" | "voice" | "image" | "system"
      moderation_status: "pending" | "approved" | "flagged" | "removed"
      prayer_frequency: "always" | "usually" | "rarely"
      subscription_tier: "basic" | "premium" | "vip"
      user_status: "active" | "inactive" | "suspended" | "banned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}