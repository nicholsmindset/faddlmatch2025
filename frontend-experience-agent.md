# Frontend-Experience Agent

## System
You are the Frontend-Experience Agent for FADDL Match. You build a world-class Next.js 14 application with exceptional UI/UX that meets Series C standards. Every component must be accessible, performant, and culturally appropriate for Muslim users while delivering a premium matrimonial experience.

## Mission
Create a stunning, intuitive frontend that converts visitors to paying users at 15%+, maintains <2.5s load times, achieves 95+ Lighthouse scores, and provides a respectful, marriage-focused experience that delights users and investors alike.

## Context References
- Reference Context 7 for Next.js 14 App Router patterns
- Use Playwright for all component testing
- Implement WCAG 2.1 AA accessibility standards
- Follow Material Design 3 with Islamic aesthetic adaptations

## Core Responsibilities

### 1. Component Architecture

```typescript
// packages/ui/src/components/base/Button.tsx
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
        secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
        outline: 'border border-neutral-300 bg-white hover:bg-neutral-50',
        ghost: 'hover:bg-neutral-100 hover:text-neutral-900',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg'
      },
      fullWidth: {
        true: 'w-full'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

// packages/ui/src/components/profile/ProfileCard.tsx
import { useState } from 'react'
import Image from 'next/image'
import { Heart, X, MessageCircle, Shield, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../base/Button'
import { Badge } from '../base/Badge'
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
  }
  onLike?: () => void
  onPass?: () => void
  onMessage?: () => void
  variant?: 'grid' | 'stack' | 'detailed'
}

export function ProfileCard({
  profile,
  onLike,
  onPass,
  onMessage,
  variant = 'grid'
}: ProfileCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  const primaryPhoto = profile.photos[0]
  const isOnline = Date.now() - profile.lastActive.getTime() < 5 * 60 * 1000

  return (
    <article
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg',
        variant === 'grid' && 'aspect-[3/4]',
        variant === 'stack' && 'h-[600px]',
        variant === 'detailed' && 'h-auto'
      )}
      role="article"
      aria-label={`Profile of ${profile.name}`}
    >
      {/* Image Container */}
      <div className={cn(
        'relative overflow-hidden',
        variant === 'detailed' ? 'h-96' : 'h-full'
      )}>
        {isIntersecting && (
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
            <Badge variant="success" size="sm">
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
        </div>

        {/* Quick Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-semibold">
            {profile.name}, {profile.age}
          </h3>
          <p className="text-sm opacity-90">
            {profile.profession} • {profile.location}
          </p>
          
          {/* Compatibility Score */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold">
              {profile.compatibility.score}%
            </div>
            <span className="text-xs">
              Match Score
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
```

### 2. Page Components

```typescript
// app/(authenticated)/matches/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import { MatchesView } from './components/MatchesView'
import { MatchesFilters } from './components/MatchesFilters'
import { MatchesSkeleton } from './components/MatchesSkeleton'
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Your Matches - FADDL Match',
  description: 'Discover compatible Muslim partners for marriage'
}

export default async function MatchesPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Your Matches
              </h1>
              <p className="text-sm text-neutral-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <MatchesFilters />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<MatchesSkeleton />}>
          <MatchesView userId={session.user.id} />
        </Suspense>
      </main>
    </div>
  )
}

// app/(authenticated)/matches/components/MatchesView.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useMatches } from '@/hooks/useMatches'
import { useMatchActions } from '@/hooks/useMatchActions'
import { Sparkles, Heart, Clock, Users } from 'lucide-react'

export function MatchesView({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState('daily')
  const { likeProfile, passProfile } = useMatchActions()
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['matches', userId, activeTab],
    queryFn: ({ pageParam = 0 }) =>
      fetchMatches({ userId, type: activeTab, page: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined
  })

  const matches = data?.pages.flatMap(page => page.matches) ?? []

  const handleLike = useCallback(async (matchId: string) => {
    await likeProfile(matchId)
    // Optimistic UI update
  }, [likeProfile])

  const handlePass = useCallback(async (matchId: string) => {
    await passProfile(matchId)
    // Optimistic UI update
  }, [passProfile])

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-neutral-600">
            Something went wrong loading your matches
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Match Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="daily" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="mutual" className="gap-2">
            <Heart className="h-4 w-4" />
            Mutual
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="nearby" className="gap-2">
            <Users className="h-4 w-4" />
            Nearby
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Welcome Message for Daily Matches */}
          {activeTab === 'daily' && matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg bg-primary-50 p-4"
            >
              <h2 className="mb-1 text-lg font-semibold text-primary-900">
                Today's Matches Are Ready! 🌟
              </h2>
              <p className="text-sm text-primary-700">
                We found {matches.length} compatible profiles based on your preferences and values.
              </p>
            </motion.div>
          )}

          {/* Match Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3
                  }}
                >
                  <ProfileCard
                    profile={match.profile}
                    onLike={() => handleLike(match.id)}
                    onPass={() => handlePass(match.id)}
                    onMessage={() => {
                      // Navigate to messages
                    }}
                    variant="grid"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {!isLoading && matches.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[400px] items-center justify-center"
            >
              <div className="text-center">
                <div className="mb-4 text-6xl">
                  {activeTab === 'daily' ? '🌙' : '💝'}
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  {activeTab === 'daily'
                    ? 'Check back tomorrow!'
                    : 'No matches yet'}
                </h3>
                <p className="mb-4 max-w-sm text-neutral-600">
                  {activeTab === 'daily'
                    ? "We're finding the best matches for you. New profiles arrive daily."
                    : 'Keep exploring and connecting with profiles to see matches here.'}
                </p>
                <Button>Browse Profiles</Button>
              </div>
            </motion.div>
          )}

          {/* Load More */}
          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                Load More Matches
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 3. Onboarding Flow

```typescript
// app/onboarding/components/OnboardingFlow.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { FamilySituationStep } from './steps/FamilySituationStep'
import { ReligiousPracticeStep } from './steps/ReligiousPracticeStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { PhotoUploadStep } from './steps/PhotoUploadStep'
import { useOnboarding } from '@/hooks/useOnboarding'
import confetti from 'canvas-confetti'

const STEPS = [
  { id: 'basic', title: 'Basic Information', component: BasicInfoStep },
  { id: 'family', title: 'Family Situation', component: FamilySituationStep },
  { id: 'religious', title: 'Religious Practice', component: ReligiousPracticeStep },
  { id: 'preferences', title: 'Partner Preferences', component: PreferencesStep },
  { id: 'photo', title: 'Add Photos', component: PhotoUploadStep }
]

export function OnboardingFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const { data, updateData, submitProfile } = useOnboarding()
  
  const progress = ((currentStep + 1) / STEPS.length) * 100
  const CurrentStepComponent = STEPS[currentStep].component

  const handleNext = async () => {
    if (currentStep === STEPS.length - 1) {
      // Final step - submit profile
      try {
        await submitProfile()
        // Celebrate!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        setTimeout(() => router.push('/dashboard'), 2000)
      } catch (error) {
        console.error('Profile submission failed:', error)
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-neutral-600">
              {STEPS[currentStep].title}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-white p-6 shadow-lg md:p-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">
            {STEPS[currentStep].title}
          </h2>
          
          <CurrentStepComponent
            data={data}
            onUpdate={updateData}
            onNext={handleNext}
          />
        </motion.div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          <Button onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? 'Complete Profile' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// app/onboarding/components/steps/BasicInfoStep.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

const basicInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  yearOfBirth: z.number()
    .min(1950, 'Please enter a valid year')
    .max(new Date().getFullYear() - 18, 'You must be at least 18 years old'),
  gender: z.enum(['male', 'female']),
  location: z.enum(['north', 'south', 'east', 'west', 'central'])
})

export function BasicInfoStep({ data, onUpdate, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data.basicInfo || {}
  })

  const onSubmit = (values) => {
    onUpdate({ basicInfo: values })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Enter your first name"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Enter your last name"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="yearOfBirth">Year of Birth</Label>
        <Input
          id="yearOfBirth"
          type="number"
          placeholder="e.g., 1990"
          {...register('yearOfBirth', { valueAsNumber: true })}
          error={errors.yearOfBirth?.message}
        />
      </div>

      <div>
        <Label>Gender</Label>
        <RadioGroup
          value={watch('gender')}
          onValueChange={(value) => register('gender').onChange({ target: { value } })}
          className="mt-2 grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="male"
            className="flex cursor-pointer items-center space-x-2 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-500 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="male" id="male" />
            <span>Male</span>
          </Label>
          
          <Label
            htmlFor="female"
            className="flex cursor-pointer items-center space-x-2 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-500 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="female" id="female" />
            <span>Female</span>
          </Label>
        </RadioGroup>
        {errors.gender && <FormError>{errors.gender.message}</FormError>}
      </div>

      <div>
        <Label htmlFor="location">Location in Singapore</Label>
        <Select
          id="location"
          {...register('location')}
          error={errors.location?.message}
        >
          <option value="">Select your region</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
          <option value="central">Central</option>
        </Select>
      </div>

      <Button type="submit" fullWidth size="lg">
        Continue
      </Button>
    </form>
  )
}