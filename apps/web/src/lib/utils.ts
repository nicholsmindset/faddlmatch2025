import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return formatDate(targetDate, { month: "short", day: "numeric" })
}

export function calculateAge(birthDate: Date | string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export function formatCompatibilityScore(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Very Good"
  if (score >= 70) return "Good"
  if (score >= 60) return "Fair"
  return "Low"
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + "..."
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateProfileUrl(name: string, id: string): string {
  const slug = slugify(name)
  return `/profile/${slug}-${id}`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Islamic/Cultural utilities
export function formatPrayerTime(time: string): string {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function getMarriageTimelineLabel(timeline: string): string {
  const labels = {
    immediately: "Ready now",
    within_year: "Within 1 year",
    within_two_years: "Within 2 years",
    when_ready: "When Allah wills",
  }
  return labels[timeline as keyof typeof labels] || timeline
}

export function getReligiousLevelLabel(level: string): string {
  const labels = {
    learning: "Learning",
    practicing: "Practicing",
    devout: "Very Religious",
  }
  return labels[level as keyof typeof labels] || level
}

export function getEducationLevelLabel(level: string): string {
  const labels = {
    high_school: "High School",
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
    doctorate: "Doctorate",
  }
  return labels[level as keyof typeof labels] || level
}

// Messaging utilities
export function formatMessageTime(date: Date | string | number): string {
  const messageDate = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000)
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return "Just now"
  }
  
  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  }
  
  // Same day
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }
  
  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  }
  
  // This week
  const diffInDays = Math.floor(diffInSeconds / (24 * 3600))
  if (diffInDays < 7) {
    return messageDate.toLocaleDateString("en-US", { weekday: "short" })
  }
  
  // Older than a week
  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })
}

export function formatLastSeen(date: Date | string | number): string {
  const lastSeenDate = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return "Just now"
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  
  const days = Math.floor(diffInSeconds / 86400)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function validateMessageContent(content: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check length
  if (content.length > 500) {
    errors.push('Message is too long (maximum 500 characters)')
  }
  
  if (!content.trim()) {
    errors.push('Message cannot be empty')
  }
  
  // Check for forbidden content
  const forbiddenPatterns = [
    { pattern: /\b(dating|kiss|hug|touch|meet\s+alone)\b/i, message: 'Contains inappropriate language for Islamic communication' },
    { pattern: /\b\d{10,}\b/, message: 'Contains phone number - please avoid sharing personal contact info' },
    { pattern: /\b[\w\.-]+@[\w\.-]+\.\w+\b/, message: 'Contains email address - please avoid sharing personal contact info' },
    { pattern: /\b(instagram|facebook|snapchat|whatsapp|telegram|@\w+)\b/i, message: 'Contains social media reference - please avoid sharing handles' }
  ]
  
  forbiddenPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      errors.push(message)
    }
  })
  
  // Check for warning patterns
  const warningPatterns = [
    { pattern: /\b(meet|meeting|coffee|dinner|lunch)\b/i, message: 'Consider involving family in meeting arrangements' },
    { pattern: /\b(beautiful|handsome|attractive|cute)\b/i, message: 'Keep compliments respectful and focused on character' }
  ]
  
  warningPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      warnings.push(message)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getModerationStatusLabel(status: string): string {
  const labels = {
    approved: 'Approved',
    flagged: 'Flagged',
    guardian_review: 'Under Review',
    pending: 'Pending Review'
  }
  return labels[status as keyof typeof labels] || status
}

export function isOwnMessage(messageUserId: string, currentUserId: string): boolean {
  return messageUserId === currentUserId
}