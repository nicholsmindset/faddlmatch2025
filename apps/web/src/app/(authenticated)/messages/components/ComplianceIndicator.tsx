'use client'

import { Shield, Clock, AlertTriangle, Eye, Heart, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface ComplianceIndicatorProps {
  type: 'guardian_oversight' | 'content_moderation' | 'halal_guidelines' | 'privacy_protection' | 'family_involvement'
  message?: string
  severity?: 'info' | 'warning' | 'error'
  isActive?: boolean
}

const COMPLIANCE_CONFIG = {
  guardian_oversight: {
    icon: Eye,
    title: 'Guardian Oversight Active',
    description: 'This conversation is monitored by guardians to ensure Islamic guidelines are followed.',
    color: 'info',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  content_moderation: {
    icon: Shield,
    title: 'Content Moderation',
    description: 'All messages are automatically reviewed for Islamic compliance.',
    color: 'success',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
  halal_guidelines: {
    icon: Heart,
    title: 'Halal Communication',
    description: 'Please maintain respectful conversation according to Islamic principles.',
    color: 'primary',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    textColor: 'text-primary-700'
  },
  privacy_protection: {
    icon: Shield,
    title: 'Privacy Protected',
    description: 'Your personal information is safeguarded according to Islamic values.',
    color: 'success',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
  family_involvement: {
    icon: Users,
    title: 'Family Involvement Encouraged',
    description: 'Consider involving your family or guardian in important conversations.',
    color: 'info',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  }
}

export function ComplianceIndicator({
  type,
  message,
  severity = 'info',
  isActive = true
}: ComplianceIndicatorProps) {
  const config = COMPLIANCE_CONFIG[type]
  const Icon = config.icon

  if (!isActive) return null

  const getSeverityStyles = () => {
    switch (severity) {
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-600'
        }
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-600'
        }
      default:
        return {
          bgColor: config.bgColor,
          borderColor: config.borderColor,
          textColor: config.textColor,
          iconColor: config.textColor
        }
    }
  }

  const styles = getSeverityStyles()

  return (
    <div 
      className={`
        ${styles.bgColor} ${styles.borderColor} ${styles.textColor}
        border rounded-lg p-3 mx-4 my-2
      `}
      data-testid={`compliance-indicator-${type}`}
    >
      <div className="flex items-start gap-3">
        <div className={`${styles.iconColor} mt-0.5 flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">
              {config.title}
            </h4>
            
            <Badge 
              variant={severity === 'error' ? 'danger' : severity === 'warning' ? 'warning' : config.color as any}
              size="sm"
            >
              Active
            </Badge>
          </div>
          
          <p className="text-sm opacity-90">
            {message || config.description}
          </p>

          {/* Additional context based on type */}
          {type === 'guardian_oversight' && (
            <div className="mt-2 text-xs opacity-75">
              <p>• Messages may be reviewed by your guardian</p>
              <p>• This ensures Islamic courtship guidelines are followed</p>
              <p>• Your privacy and dignity are always protected</p>
            </div>
          )}

          {type === 'content_moderation' && (
            <div className="mt-2 text-xs opacity-75">
              <p>• Automatic screening for inappropriate content</p>
              <p>• Messages are checked against Islamic guidelines</p>
              <p>• Flagged content will require review</p>
            </div>
          )}

          {type === 'halal_guidelines' && (
            <div className="mt-2 text-xs opacity-75">
              <p>• Keep conversations respectful and purposeful</p>
              <p>• Avoid sharing personal contact information</p>
              <p>• Focus on getting to know each other for marriage</p>
            </div>
          )}

          {type === 'family_involvement' && (
            <div className="mt-2 text-xs opacity-75">
              <p>• Include family members in important decisions</p>
              <p>• Share significant conversations with your guardian</p>
              <p>• Plan meetings with family supervision</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Specialized compliance indicators for different scenarios
export function GuardianOversightIndicator({ 
  isActive = true, 
  guardianName 
}: { 
  isActive?: boolean
  guardianName?: string 
}) {
  return (
    <ComplianceIndicator
      type="guardian_oversight"
      message={guardianName 
        ? `${guardianName} is overseeing this conversation to ensure Islamic guidelines.`
        : undefined
      }
      isActive={isActive}
    />
  )
}

export function ContentModerationIndicator({ 
  isActive = true,
  moderationLevel = 'standard'
}: { 
  isActive?: boolean
  moderationLevel?: 'standard' | 'strict' | 'custom'
}) {
  const getMessage = () => {
    switch (moderationLevel) {
      case 'strict':
        return 'Enhanced content moderation is active for additional protection.'
      case 'custom':
        return 'Custom moderation settings are applied based on your preferences.'
      default:
        return 'Standard content moderation is protecting your conversations.'
    }
  }

  return (
    <ComplianceIndicator
      type="content_moderation"
      message={getMessage()}
      isActive={isActive}
    />
  )
}

export function HalalGuidelinesIndicator({ 
  isActive = true,
  showDetails = false
}: { 
  isActive?: boolean
  showDetails?: boolean
}) {
  return (
    <ComplianceIndicator
      type="halal_guidelines"
      message={showDetails 
        ? 'Remember to maintain respectful conversation, avoid inappropriate topics, and keep the focus on marriage compatibility.'
        : undefined
      }
      isActive={isActive}
    />
  )
}

export function PrivacyProtectionIndicator({ 
  isActive = true 
}: { 
  isActive?: boolean 
}) {
  return (
    <ComplianceIndicator
      type="privacy_protection"
      message="Your conversations are encrypted and protected according to Islamic privacy principles."
      isActive={isActive}
    />
  )
}

export function FamilyInvolvementIndicator({ 
  isActive = true,
  severity = 'info' as const
}: { 
  isActive?: boolean
  severity?: 'info' | 'warning'
}) {
  return (
    <ComplianceIndicator
      type="family_involvement"
      severity={severity}
      message={severity === 'warning' 
        ? 'Consider involving your family before making important decisions about this match.'
        : undefined
      }
      isActive={isActive}
    />
  )
}