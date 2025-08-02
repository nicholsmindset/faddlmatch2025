'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { FamilySituationStep } from './steps/FamilySituationStep'
import { ReligiousPracticeStep } from './steps/ReligiousPracticeStep'
import { useOnboarding } from '@/hooks/useOnboarding'
import { ChevronLeft, Sparkles } from 'lucide-react'

const STEPS = [
  { 
    id: 'basic', 
    title: 'Basic Information', 
    component: BasicInfoStep,
    description: 'Tell us about yourself'
  },
  { 
    id: 'religious', 
    title: 'Religious Practice', 
    component: ReligiousPracticeStep,
    description: 'Your Islamic practice level'
  },
  { 
    id: 'personal', 
    title: 'Personal & Family', 
    component: FamilySituationStep,
    description: 'Your background and values'
  }
]

export function OnboardingFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const { data, updateData, submitProfile, isSubmitting, error } = useOnboarding()
  
  const progress = ((currentStep + 1) / STEPS.length) * 100
  const CurrentStepComponent = STEPS[currentStep].component

  const handleNext = async () => {
    if (currentStep === STEPS.length - 1) {
      // Final step - submit profile
      try {
        await submitProfile()
        // Show success animation
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

  if (currentStep === STEPS.length && !error) {
    // Success state
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
          >
            <Sparkles className="h-12 w-12 text-green-600" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Welcome to FADDL Match! 🎉
            </h2>
            <p className="text-lg text-neutral-600 mb-6 max-w-md mx-auto">
              Your profile is complete and you're ready to find your perfect match.
              We're redirecting you to your dashboard...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-neutral-600">
            Help us find your ideal marriage partner by sharing some information about yourself
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-neutral-600">
              {STEPS[currentStep].description}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          
          {/* Step indicators */}
          <div className="mt-4 flex justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index <= currentStep ? 'text-primary-600' : 'text-neutral-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                    index < currentStep
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : index === currentStep
                      ? 'border-primary-600 text-primary-600'
                      : 'border-neutral-300 text-neutral-400'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-primary-600' : 'bg-neutral-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl bg-white p-6 shadow-lg border border-neutral-100 md:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                {STEPS[currentStep].title}
              </h2>
            </div>
            
            <CurrentStepComponent
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          
          <div className="text-center">
            {error && (
              <p className="text-sm text-red-600 mb-2">
                {error}
              </p>
            )}
            {isSubmitting && (
              <p className="text-sm text-neutral-600">
                Creating your profile...
              </p>
            )}
          </div>
          
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Islamic Quote */}
        <div className="mt-12 text-center">
          <div className="mx-auto max-w-md rounded-lg bg-primary-50 border border-primary-200 p-4">
            <p className="text-sm text-primary-700 italic">
              "And among His signs is that He created for you mates from among yourselves, 
              so that you may find tranquility in them, and He placed between you affection and mercy."
            </p>
            <p className="text-xs text-primary-600 mt-2 font-medium">
              - Quran 30:21
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}