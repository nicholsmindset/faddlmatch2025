import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
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

  return formatDate(date)
}

export function getAge(yearOfBirth: number): number {
  const currentYear = new Date().getFullYear()
  return currentYear - yearOfBirth
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.charAt(0)}.`
}

export function calculateCompatibilityScore(
  user1Preferences: any,
  user2Profile: any,
  user2Preferences: any,
  user1Profile: any
): number {
  let score = 0
  let totalFactors = 0

  // Age compatibility
  if (user1Preferences.minAge <= getAge(user2Profile.yearOfBirth) && 
      user1Preferences.maxAge >= getAge(user2Profile.yearOfBirth)) {
    score += 20
  }
  totalFactors += 20

  // Location compatibility
  if (user1Preferences.locationZones.includes(user2Profile.locationZone)) {
    score += 15
  }
  totalFactors += 15

  // Marital status compatibility
  if (user1Preferences.maritalStatuses.includes(user2Profile.maritalStatus)) {
    score += 15
  }
  totalFactors += 15

  // Prayer frequency compatibility
  if (user1Preferences.prayerFrequency.includes(user2Profile.prayerFrequency)) {
    score += 15
  }
  totalFactors += 15

  // Ethnicity compatibility
  if (user1Preferences.ethnicities.includes(user2Profile.ethnicity)) {
    score += 10
  }
  totalFactors += 10

  // Children compatibility
  if (user2Profile.hasChildren && !user1Preferences.hasChildrenOk) {
    score -= 10
  } else if (!user2Profile.hasChildren || user1Preferences.hasChildrenOk) {
    score += 10
  }
  totalFactors += 10

  // Mutual compatibility (check if user2 also finds user1 compatible)
  let mutualScore = 0
  if (user2Preferences.minAge <= getAge(user1Profile.yearOfBirth) && 
      user2Preferences.maxAge >= getAge(user1Profile.yearOfBirth)) {
    mutualScore += 5
  }
  if (user2Preferences.locationZones.includes(user1Profile.locationZone)) {
    mutualScore += 5
  }
  if (user2Preferences.maritalStatuses.includes(user1Profile.maritalStatus)) {
    mutualScore += 5
  }
  
  score += mutualScore
  totalFactors += 15

  return Math.max(0, Math.min(100, Math.round((score / totalFactors) * 100)))
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}