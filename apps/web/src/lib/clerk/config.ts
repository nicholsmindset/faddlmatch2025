import { ClerkProvider } from '@clerk/nextjs'

export const clerkConfig = {
  // Appearance customization for Islamic aesthetic
  appearance: {
    baseTheme: undefined, // We'll use custom theme
    variables: {
      colorPrimary: '#2E7D32', // Islamic green
      colorBackground: '#FFFFFF',
      colorText: '#1A1A1A',
      colorTextSecondary: '#666666',
      colorDanger: '#F44336',
      colorSuccess: '#4CAF50',
      colorWarning: '#FF9800',
      colorNeutral: '#9E9E9E',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '16px',
      borderRadius: '0.5rem',
      spacingUnit: '1rem'
    },
    elements: {
      formButtonPrimary: {
        backgroundColor: '#2E7D32',
        '&:hover': {
          backgroundColor: '#1B5E20'
        }
      },
      card: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E0E0E0'
      },
      formFieldInput: {
        borderColor: '#E0E0E0',
        '&:focus': {
          borderColor: '#2E7D32',
          boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.1)'
        }
      },
      socialButtonsIconButton: {
        borderColor: '#E0E0E0',
        '&:hover': {
          backgroundColor: '#F5F5F5'
        }
      },
      headerTitle: {
        fontWeight: '600',
        fontSize: '1.5rem'
      },
      headerSubtitle: {
        color: '#666666'
      }
    },
    layout: {
      socialButtonsPlacement: 'bottom',
      socialButtonsVariant: 'iconButton',
      showOptionalFields: false
    }
  },
  
  // Localization for Singapore/Malaysia
  localization: {
    locale: 'en-SG',
    fallbackLocale: 'en',
    // Custom translations
    translations: {
      signIn: {
        title: 'Welcome Back',
        subtitle: 'Sign in to continue your journey',
        actionText: 'No account?',
        actionLink: 'Create one for free'
      },
      signUp: {
        title: 'Begin Your Journey',
        subtitle: 'Create an account to find your halal match',
        actionText: 'Already have an account?',
        actionLink: 'Sign in'
      },
      userProfile: {
        title: 'Account Settings',
        subtitle: 'Manage your account and privacy'
      }
    }
  },
  
  // Sign-in/up options
  signInOptions: {
    // Email/password is primary
    emailAddress: true,
    phoneNumber: true,
    
    // Carefully selected social providers
    socialProviders: [
      'oauth_google', // Most common
      'oauth_facebook', // With privacy considerations
      // Avoiding providers that might not align with values
    ],
    
    // Security features
    passwordRequirements: {
      minLength: 8,
      maxLength: 64,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChar: true
    }
  }
}

// Webhook configuration for Clerk events
export const clerkWebhookConfig = {
  userCreated: 'user.created',
  userUpdated: 'user.updated',
  userDeleted: 'user.deleted',
  sessionCreated: 'session.created',
  sessionEnded: 'session.ended',
  organizationCreated: 'organization.created', // For family/guardian groups
  organizationMembershipCreated: 'organizationMembership.created'
}