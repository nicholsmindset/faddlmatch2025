import { useState } from 'react'
import Image from 'next/image'
import { Heart, X, MessageCircle, Shield, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface ProfileCardProps {
  profile: {
    id: string
    name: string
    age: number
    location: string
    profession: string
    photos: Array<{
      url: string
      blurUrl?: string
      visibility: 'public' | 'matches' | 'approved'
    }>
    bio: string
    compatibility: {
      score: number
      strengths: string[]
    }
    lastActive: Date
    verified: boolean
    premiumMember: boolean
    religiousLevel?: string
    educationLevel?: string
    guardianEnabled?: boolean
  }
  onLike?: () => void
  onPass?: () => void
  onMessage?: () => void
  variant?: 'grid' | 'stack' | 'detailed'
  className?: string
}

export function ProfileCard({
  profile,
  onLike,
  onPass,
  onMessage,
  variant = 'grid',
  className
}: ProfileCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  const primaryPhoto = profile.photos[0]
  const isOnline = Date.now() - profile.lastActive.getTime() < 5 * 60 * 1000

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500'
    if (score >= 80) return 'bg-green-500'
    if (score >= 70) return 'bg-blue-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-neutral-500'
  }

  const getCompatibilityLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match'
    if (score >= 80) return 'Very Good Match'
    if (score >= 70) return 'Good Match'
    if (score >= 60) return 'Fair Match'
    return 'Low Match'
  }

  return (
    <article
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg border border-neutral-100',
        variant === 'grid' && 'aspect-[3/4]',
        variant === 'stack' && 'h-[600px]',
        variant === 'detailed' && 'h-auto',
        className
      )}
      role="article"
      aria-label={`Profile of ${profile.name}`}
    >
      {/* Image Container */}
      <div className={cn(
        'relative overflow-hidden',
        variant === 'detailed' ? 'h-96' : 'h-full'
      )}>
        {isIntersecting && primaryPhoto && (
          <>
            {/* Blur placeholder */}
            {primaryPhoto.blurUrl && !imageLoaded && (
              <Image
                src={primaryPhoto.blurUrl}
                alt=""
                fill
                className="object-cover"
                priority={false}
              />
            )}
            
            {/* Main image */}
            <Image
              src={primaryPhoto.url}
              alt={`${profile.name}'s photo`}
              fill
              className={cn(
                'object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {profile.verified && (
            <Badge variant="verified" size="sm">
              <Shield className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
          {profile.premiumMember && (
            <Badge variant="premium" size="sm">
              Premium
            </Badge>
          )}
          {isOnline && (
            <Badge variant="success" size="sm">
              <Clock className="mr-1 h-3 w-3" />
              Online
            </Badge>
          )}
          {profile.guardianEnabled && (
            <Badge variant="info" size="sm">
              Guardian Approved
            </Badge>
          )}
        </div>

        {/* Quick Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-semibold">
            {profile.name}, {profile.age}
          </h3>
          <p className="text-sm opacity-90">
            {profile.profession} • {profile.location}
          </p>
          
          {/* Religious & Education Level */}
          {(profile.religiousLevel || profile.educationLevel) && (
            <div className="mt-1 flex items-center gap-2 text-xs opacity-80">
              {profile.religiousLevel && (
                <span className="capitalize">{profile.religiousLevel} Muslim</span>
              )}
              {profile.religiousLevel && profile.educationLevel && (
                <span>•</span>
              )}
              {profile.educationLevel && (
                <span className="capitalize">{profile.educationLevel.replace('_', ' ')}</span>
              )}
            </div>
          )}
          
          {/* Compatibility Score */}
          <div className="mt-2 flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white',
              getCompatibilityColor(profile.compatibility.score)
            )}>
              {profile.compatibility.score}%
            </div>
            <span className="text-xs">
              {getCompatibilityLabel(profile.compatibility.score)}
            </span>
          </div>
        </div>
      </div>

      {/* Details Section (for detailed variant) */}
      {variant === 'detailed' && (
        <div className="p-4">
          <p className="mb-4 line-clamp-3 text-sm text-neutral-600">
            {profile.bio}
          </p>
          
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium text-neutral-700">
              Compatibility Strengths
            </h4>
            <div className="flex flex-wrap gap-1">
              {profile.compatibility.strengths.map((strength, i) => (
                <Badge key={i} variant="secondary" size="sm">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100',
        variant === 'detailed' && 'relative bg-neutral-50 opacity-100'
      )}>
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full bg-white/90 p-0 hover:bg-white"
          onClick={onPass}
          aria-label="Pass on this profile"
        >
          <X className="h-6 w-6 text-neutral-600" />
        </Button>
        
        <Button
          size="lg"
          variant="primary"
          className="h-16 w-16 rounded-full p-0"
          onClick={onLike}
          aria-label="Like this profile"
        >
          <Heart className="h-7 w-7" />
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full bg-white/90 p-0 hover:bg-white"
          onClick={onMessage}
          aria-label="Send a message"
        >
          <MessageCircle className="h-6 w-6 text-neutral-600" />
        </Button>
      </div>
    </article>
  )
}