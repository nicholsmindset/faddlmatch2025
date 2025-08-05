import { supabase } from './client'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  gender: 'male' | 'female'
  age: number
}

export interface SignInData {
  email: string
  password: string
}

export const auth = {
  // Sign up new user
  async signUp({ email, password, fullName, gender, age }: SignUpData) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            gender: gender,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: fullName,
          gender: gender,
          age: age,
          location: 'Singapore', // Default, user can update later
          education_level: 'bachelors', // Default
          profession: 'Not specified', // Default
          religious_practice_level: 'practicing', // Default
          prayer_frequency: '5 times daily', // Default
          marital_status: 'never_married', // Default
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  // Sign in existing user
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Signin error:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Signout error:', error)
      throw error
    }
  },

  // Get current user
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  // Get user profile
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get profile error:', error)
      return null
    }
  },

  // Update profile
  async updateProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }
}

// Browse profiles (for matching)
export const profiles = {
  async getMatches(userId: string, userGender: string) {
    try {
      // Get opposite gender profiles
      const oppositeGender = userGender === 'male' ? 'female' : 'male'
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', oppositeGender)
        .eq('profile_active', true)
        .neq('user_id', userId)
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get matches error:', error)
      return []
    }
  }
}

// Matches functionality
export const matches = {
  async expressInterest(userId: string, matchedUserId: string) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .upsert({
          user_id: userId,
          matched_user_id: matchedUserId,
          user_interested: true,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Express interest error:', error)
      throw error
    }
  },

  async getMyMatches(userId: string) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          matched_profile:matched_user_id(*)
        `)
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get my matches error:', error)
      return []
    }
  }
}

// Messages functionality
export const messages = {
  async sendMessage(matchId: string, senderId: string, receiverId: string, text: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          receiver_id: receiverId,
          message_text: text
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Send message error:', error)
      throw error
    }
  },

  async getMessages(matchId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get messages error:', error)
      return []
    }
  }
}
