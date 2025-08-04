/**
 * 📷 Image Upload Component
 * Islamic-compliant photo upload with privacy controls
 */

'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, X, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadProfilePhoto, validateImageFile, generateAvatarUrl } from '@/lib/storage'
import { Button } from './Button'

interface ImageUploadProps {
  currentImage?: string
  userId: string
  userName: string
  onImageChange: (url: string | null, path: string | null) => void
  isPrivate?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showPrivacyToggle?: boolean
}

const sizeClasses = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32', 
  lg: 'w-48 h-48'
}

export function ImageUpload({
  currentImage,
  userId,
  userName,
  onImageChange,
  isPrivate = true,
  className,
  size = 'lg',
  showPrivacyToggle = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [privacy, setPrivacy] = useState(isPrivate)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setIsUploading(true)
    
    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreviewUrl(previewUrl)
      
      // Upload file
      const result = await uploadProfilePhoto(file, userId, privacy)
      
      if (result.success && result.url && result.path) {
        onImageChange(result.url, result.path)
        // Clean up preview
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(result.url)
      } else {
        alert(result.error || 'Upload failed')
        setPreviewUrl(currentImage || null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayImage = previewUrl || generateAvatarUrl(userName)

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Privacy Toggle */}
      {showPrivacyToggle && (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setPrivacy(!privacy)}
            className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {privacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{privacy ? 'Private Photo' : 'Public Photo'}</span>
          </button>
          <div className="text-xs text-gray-500">
            {privacy ? 'Only approved matches can see' : 'Visible to all users'}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          sizeClasses[size],
          'relative rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors overflow-hidden group cursor-pointer',
          dragActive && 'border-green-500 bg-green-50',
          isUploading && 'opacity-75 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {/* Current/Preview Image */}
        {displayImage && (
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        )}

        {/* Upload Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center',
          !displayImage && 'bg-opacity-0 group-hover:bg-gray-50'
        )}>
          {isUploading ? (
            <div className="text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center space-y-1',
              !displayImage && 'opacity-100 text-gray-500'
            )}>
              <Camera className={cn(
                'w-8 h-8',
                displayImage ? 'text-white' : 'text-gray-400'
              )} />
              <span className={cn(
                'text-xs font-medium',
                displayImage ? 'text-white' : 'text-gray-600'
              )}>
                {displayImage ? 'Change Photo' : 'Upload Photo'}
              </span>
            </div>
          )}
        </div>

        {/* Remove Button */}
        {previewUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveImage()
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload Button Alternative */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center space-x-2"
      >
        <Upload className="w-4 h-4" />
        <span>{isUploading ? 'Uploading...' : 'Choose Photo'}</span>
      </Button>

      {/* Helper Text */}
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <div className="mb-1">JPEG, PNG, or WebP • Max 5MB</div>
        <div className="text-green-600">
          🕌 Photos are handled with Islamic privacy principles
        </div>
      </div>
    </div>
  )
}

export default ImageUpload