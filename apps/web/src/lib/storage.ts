/**
 * 📷 Supabase Storage Integration
 * Secure photo upload and management for FADDL Match profiles
 */

import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient()

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * 📱 Upload profile photo with Islamic compliance
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string,
  isPrivate: boolean = true
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Please upload a JPEG, PNG, or WebP image'
      }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Photo must be less than 5MB'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${uuidv4()}.${fileExt}`
    const bucketName = isPrivate ? 'profile-photos-private' : 'profile-photos-public'

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: 'Failed to upload photo. Please try again.'
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }

  } catch (error) {
    console.error('Upload exception:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * 🗑️ Delete profile photo
 */
export async function deleteProfilePhoto(
  path: string,
  isPrivate: boolean = true
): Promise<boolean> {
  try {
    const bucketName = isPrivate ? 'profile-photos-private' : 'profile-photos-public'
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path])

    return !error
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * 🔐 Get signed URL for private photos
 */
export async function getSignedPhotoUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('profile-photos-private')
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Signed URL exception:', error)
    return null
  }
}

/**
 * 📋 Get user's uploaded photos
 */
export async function getUserPhotos(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('profile-photos-private')
      .list(userId)

    if (error) {
      console.error('List photos error:', error)
      return []
    }

    return data.map(file => `${userId}/${file.name}`)
  } catch (error) {
    console.error('List photos exception:', error)
    return []
  }
}

/**
 * 🖼️ Validate image requirements
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image'
    }
  }

  // File size validation (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Photo must be less than 5MB'
    }
  }

  // Image dimensions validation (optional)
  return { valid: true }
}

/**
 * 🎨 Generate avatar URL fallback
 */
export function generateAvatarUrl(name: string, size: number = 200): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=16a34a&color=ffffff&format=png`
}