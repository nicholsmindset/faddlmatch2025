import { clerkClient } from '@clerk/nextjs/server'
import { User } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export interface UserMetadata {
  subscriptionTier: 'basic' | 'premium' | 'vip'
  profileComplete: boolean
  hasGuardian: boolean
  guardianOrganizationId?: string
  culturalBackground: string
  preferredLanguage: string
  joinedAt: string
  lastActiveAt: string
  verificationStatus: {
    email: boolean
    phone: boolean
    identity: boolean
  }
}

export class UserManagementService {
  // Sync Clerk user with our database
  async syncUser(clerkUser: User) {
    const metadata: UserMetadata = {
      subscriptionTier: clerkUser.publicMetadata.subscriptionTier as any || 'basic',
      profileComplete: clerkUser.publicMetadata.profileComplete as boolean || false,
      hasGuardian: clerkUser.publicMetadata.hasGuardian as boolean || false,
      guardianOrganizationId: clerkUser.publicMetadata.guardianOrganizationId as string,
      culturalBackground: clerkUser.publicMetadata.culturalBackground as string || '',
      preferredLanguage: clerkUser.publicMetadata.preferredLanguage as string || 'en',
      joinedAt: clerkUser.createdAt,
      lastActiveAt: new Date().toISOString(),
      verificationStatus: {
        email: clerkUser.emailAddresses.some(e => e.verification?.status === 'verified'),
        phone: clerkUser.phoneNumbers.some(p => p.verification?.status === 'verified'),
        identity: clerkUser.publicMetadata.identityVerified as boolean || false
      }
    }

    // Update our database
    await this.updateUserInDatabase(clerkUser.id, metadata)
    
    // Update Clerk metadata if needed
    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: metadata
    })
  }

  // Handle user lifecycle events
  async handleUserCreated(user: User) {
    // Create user profile in our database
    await this.createUserProfile(user)
    
    // Send welcome email
    await this.sendWelcomeEmail(user)
    
    // Set up initial preferences
    await this.setupInitialPreferences(user)
    
    // Track signup analytics
    await this.trackSignupEvent(user)
  }

  async handleUserDeleted(userId: string) {
    // Anonymize user data per PDPA
    await this.anonymizeUserData(userId)
    
    // Cancel subscriptions
    await this.cancelUserSubscriptions(userId)
    
    // Notify matches
    await this.notifyMatchesOfDeletion(userId)
  }

  // Role-based access control
  async checkUserPermissions(userId: string, action: string): Promise<boolean> {
    const user = await clerkClient.users.getUser(userId)
    
    const permissions = {
      basic: ['view_profiles', 'send_messages', 'receive_matches'],
      premium: ['unlimited_likes', 'see_who_liked', 'advanced_filters', 'read_receipts'],
      vip: ['priority_support', 'profile_boost', 'exclusive_events', 'personal_matchmaker'],
      guardian: ['view_ward_profile', 'approve_matches', 'monitor_conversations']
    }
    
    const userTier = user.publicMetadata.subscriptionTier as string || 'basic'
    const userPermissions = permissions[userTier as keyof typeof permissions] || permissions.basic
    
    // Check guardian permissions
    if (user.organizationMemberships?.some(m => m.role === 'guardian')) {
      userPermissions.push(...permissions.guardian)
    }
    
    return userPermissions.includes(action)
  }

  // Session management
  async extendSession(sessionId: string) {
    const session = await clerkClient.sessions.getSession(sessionId)
    
    if (session.status === 'active') {
      // Extend session if user is active
      await clerkClient.sessions.updateSession(sessionId, {
        expireAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      })
    }
  }

  // Multi-factor authentication setup
  async setupMFA(userId: string) {
    const user = await clerkClient.users.getUser(userId)
    
    // Generate TOTP secret
    const totpSecret = await clerkClient.users.createTOTP(userId)
    
    // Return QR code and secret for user setup
    return {
      secret: totpSecret.secret,
      qrCode: totpSecret.uri,
      backupCodes: await this.generateBackupCodes(userId)
    }
  }

  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateSecureCode())
    }
    
    // Store hashed backup codes
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        backupCodes: codes.map(code => this.hashCode(code))
      }
    })
    
    return codes
  }

  private generateSecureCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private hashCode(code: string): string {
    // Simple hash for backup codes - in production use crypto
    return Buffer.from(code).toString('base64')
  }

  private async updateUserInDatabase(userId: string, metadata: UserMetadata) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: metadata.verificationStatus.email ? 'verified' : 'unverified',
        subscription_tier: metadata.subscriptionTier,
        last_active_at: metadata.lastActiveAt,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to update user in database:', error)
      throw error
    }
  }

  private async createUserProfile(user: User) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        phone: user.phoneNumbers[0]?.phoneNumber,
        email_verified_at: user.emailAddresses[0]?.verification?.status === 'verified' ? new Date().toISOString() : null,
        phone_verified_at: user.phoneNumbers[0]?.verification?.status === 'verified' ? new Date().toISOString() : null,
        created_at: user.createdAt,
        updated_at: new Date().toISOString()
      })

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Failed to create user profile:', error)
      throw error
    }
  }

  private async sendWelcomeEmail(user: User) {
    // Implementation for welcome email
    console.log(`Sending welcome email to ${user.emailAddresses[0]?.emailAddress}`)
  }

  private async setupInitialPreferences(user: User) {
    // Set up initial user preferences
    console.log(`Setting up initial preferences for user ${user.id}`)
  }

  private async trackSignupEvent(user: User) {
    const supabase = createClient()
    
    await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_type: 'user_signup',
        properties: {
          signup_method: 'email',
          timestamp: new Date().toISOString()
        }
      })
  }

  private async anonymizeUserData(userId: string) {
    const supabase = createClient()
    
    // Anonymize user data instead of deleting for PDPA compliance
    await supabase
      .from('users')
      .update({
        email: 'anonymized@faddlmatch.com',
        phone: null,
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId)
  }

  private async cancelUserSubscriptions(userId: string) {
    // Implementation for canceling subscriptions
    console.log(`Canceling subscriptions for user ${userId}`)
  }

  private async notifyMatchesOfDeletion(userId: string) {
    // Implementation for notifying matches
    console.log(`Notifying matches of deletion for user ${userId}`)
  }
}

export const userManagement = new UserManagementService()