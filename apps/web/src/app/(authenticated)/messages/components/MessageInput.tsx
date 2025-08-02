'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Send, Paperclip, Shield, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { debounce } from '@/lib/utils'

interface MessageInputProps {
  onSend: (message: string) => Promise<void> | void
  isLoading?: boolean
  error?: string | null
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

const ISLAMIC_GUIDELINES = [
  'Keep conversations respectful and halal',
  'Avoid sharing personal contact information',
  'Consider involving family in meeting arrangements',
  'Focus on getting to know each other for marriage purposes'
]

const FORBIDDEN_KEYWORDS = [
  'dating', 'kiss', 'hug', 'touch', 'meet alone', 'private meeting',
  'instagram', 'facebook', 'snapchat', 'whatsapp', 'telegram'
]

export function MessageInput({
  onSend,
  isLoading = false,
  error = null,
  disabled = false,
  placeholder = 'Type a respectful message...',
  maxLength = 500
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [showGuidelines, setShowGuidelines] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Real-time content validation
  const validateContent = useCallback(
    debounce((content: string) => {
      const newWarnings: string[] = []
      const lowerContent = content.toLowerCase()

      // Check for forbidden keywords
      FORBIDDEN_KEYWORDS.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
          newWarnings.push(`Avoid using "${keyword}" to maintain halal communication`)
        }
      })

      // Check for phone numbers
      if (/\b\d{10,}\b/.test(content)) {
        newWarnings.push('Please avoid sharing phone numbers in messages')
      }

      // Check for email addresses
      if (/\b[\w\.-]+@[\w\.-]+\.\w+\b/.test(content)) {
        newWarnings.push('Please avoid sharing email addresses in messages')
      }

      // Check for social media handles
      if (/@\w+/.test(content)) {
        newWarnings.push('Please avoid sharing social media handles')
      }

      setWarnings(newWarnings)
    }, 300),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
      validateContent(value)
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    const trimmedMessage = message.trim()
    
    if (!trimmedMessage || isLoading || disabled) return
    
    if (warnings.length > 0) {
      // Show confirmation dialog for messages with warnings
      const proceed = window.confirm(
        'Your message contains content that may not align with Islamic guidelines. Would you like to review and edit your message?'
      )
      if (!proceed) return
    }

    try {
      await onSend(trimmedMessage)
      setMessage('')
      setWarnings([])
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const characterCount = message.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  return (
    <div className="p-4 space-y-3" data-testid="message-input">
      {/* Guidelines Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm text-neutral-600">Halal Communication</span>
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="text-primary-600 hover:text-primary-700 text-sm underline"
          >
            {showGuidelines ? 'Hide' : 'View'} Guidelines
          </button>
        </div>
        
        <Badge variant="success" size="sm">
          Moderated
        </Badge>
      </div>

      {/* Guidelines Panel */}
      {showGuidelines && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Islamic Communication Guidelines
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            {ISLAMIC_GUIDELINES.map((guideline, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Unable to send message</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Warnings Display */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Content Guidelines</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <div className="flex gap-2">
          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Accept the match to start messaging...' : placeholder}
              disabled={disabled || isLoading}
              className={`
                w-full px-3 py-2 pr-12 border border-neutral-300 rounded-lg
                text-sm resize-none focus:outline-none focus:ring-2 
                focus:ring-primary-500 focus:border-primary-500
                disabled:bg-neutral-100 disabled:cursor-not-allowed
                min-h-[40px] max-h-[120px]
                ${warnings.length > 0 ? 'border-yellow-400 focus:border-yellow-400 focus:ring-yellow-400' : ''}
              `}
              rows={1}
              data-testid="message-textarea"
            />
            
            {/* Character Count */}
            <div className={`
              absolute bottom-2 right-2 text-xs
              ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-neutral-500'}
            `}>
              {characterCount}/{maxLength}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            {/* Attachment Button (Future Feature) */}
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 text-neutral-400"
              title="Photo sharing coming soon"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading || disabled || isAtLimit}
              isLoading={isLoading}
              size="sm"
              className="h-8 w-8 p-0"
              data-testid="send-button"
            >
              {!isLoading && <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Input Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            {disabled && (
              <span className="text-yellow-600">Accept match to enable messaging</span>
            )}
            {!disabled && (
              <span>Press Enter to send, Shift+Enter for new line</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-green-600" />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}