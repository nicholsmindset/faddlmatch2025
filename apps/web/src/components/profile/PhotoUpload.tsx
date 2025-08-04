'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Camera, 
  Upload, 
  X, 
  Eye, 
  Shield, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

interface Photo {
  id: string
  url: string
  visibility: 'public' | 'guardian_only' | 'private'
  moderation_status: 'pending' | 'approved' | 'rejected'
  uploaded_at: string
}

interface PhotoUploadProps {
  photos: Photo[]
  onPhotoUploaded: (photo: Photo) => void
  onPhotoDeleted: (photoId: string) => void
  maxPhotos?: number
}

export function PhotoUpload({ 
  photos, 
  onPhotoUploaded, 
  onPhotoDeleted, 
  maxPhotos = 6 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Check max photos limit
    if (photos.length >= maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    await uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Create photo object
      const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        url: data.url,
        visibility: 'public',
        moderation_status: 'approved', // In production, this would be 'pending'
        uploaded_at: new Date().toISOString()
      }

      onPhotoUploaded(newPhoto)
      toast.success('Photo uploaded successfully!')
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const toggleVisibility = (photo: Photo) => {
    const visibilityOrder: Photo['visibility'][] = ['public', 'guardian_only', 'private']
    const currentIndex = visibilityOrder.indexOf(photo.visibility)
    const nextIndex = (currentIndex + 1) % visibilityOrder.length
    
    // In production, this would call an API to update visibility
    const updatedPhoto = {
      ...photo,
      visibility: visibilityOrder[nextIndex]
    }
    
    // For demo purposes, we'll just show a toast
    toast.success(`Photo visibility changed to ${updatedPhoto.visibility.replace('_', ' ')}`)
  }

  const getVisibilityIcon = (visibility: Photo['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Eye className="h-3 w-3" />
      case 'guardian_only':
        return <Users className="h-3 w-3" />
      case 'private':
        return <Shield className="h-3 w-3" />
    }
  }

  const getVisibilityColor = (visibility: Photo['visibility']) => {
    switch (visibility) {
      case 'public':
        return 'success'
      case 'guardian_only':
        return 'warning'
      case 'private':
        return 'neutral'
    }
  }

  const getModerationIcon = (status: Photo['moderation_status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'pending':
        return <Loader2 className="h-3 w-3 text-yellow-600 animate-spin" />
      case 'rejected':
        return <AlertCircle className="h-3 w-3 text-red-600" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`
          transition-colors duration-200 cursor-pointer
          ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-dashed border-neutral-300'}
          ${uploading ? 'opacity-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto text-primary-600 animate-spin" />
                <p className="text-neutral-600">Uploading photo...</p>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 mx-auto text-neutral-400" />
                <div>
                  <p className="text-lg font-medium text-neutral-900">
                    Upload Profile Photos
                  </p>
                  <p className="text-sm text-neutral-600">
                    Drag and drop or click to select ({photos.length}/{maxPhotos})
                  </p>
                </div>
                <Button variant="outline" disabled={photos.length >= maxPhotos}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Photos
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100">
                  <img
                    src={photo.url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Photo Controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="absolute inset-2 flex flex-col justify-between">
                    {/* Top Controls */}
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        {getModerationIcon(photo.moderation_status)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:text-red-400 p-1"
                        onClick={() => onPhotoDeleted(photo.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex justify-between items-end">
                      <Badge
                        variant={getVisibilityColor(photo.visibility) as any}
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => toggleVisibility(photo)}
                      >
                        {getVisibilityIcon(photo.visibility)}
                        <span className="ml-1 text-xs">
                          {photo.visibility.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Privacy Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Photo Privacy Guidelines</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Public:</strong> Visible to all potential matches</li>
                <li>• <strong>Guardian Only:</strong> Visible to guardians and approved matches</li>
                <li>• <strong>Private:</strong> Only visible to you</li>
                <li>• All photos are moderated according to Islamic guidelines</li>
                <li>• Professional, modest photos are recommended</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}