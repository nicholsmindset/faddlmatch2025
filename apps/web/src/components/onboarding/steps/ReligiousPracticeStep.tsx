import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Select } from '@/components/ui/Select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Church, Heart, Star } from 'lucide-react'

const religiousInfoSchema = z.object({
  religious_level: z.enum(['learning', 'practicing', 'devout'], {
    required_error: 'Please select your religious commitment level'
  }),
  prayer_frequency: z.enum(['rarely', 'sometimes', 'regularly', 'always'], {
    required_error: 'Please select your prayer frequency'
  }),
  hijab_preference: z.enum(['required', 'preferred', 'optional']).optional(),
  beard_preference: z.enum(['required', 'preferred', 'optional']).optional()
})

type ReligiousInfoData = z.infer<typeof religiousInfoSchema>

interface ReligiousPracticeStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function ReligiousPracticeStep({ data, onUpdate, onNext }: ReligiousPracticeStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<ReligiousInfoData>({
    resolver: zodResolver(religiousInfoSchema),
    defaultValues: data.religiousInfo || {}
  })

  const onSubmit = (values: ReligiousInfoData) => {
    onUpdate({ religiousInfo: values })
    onNext()
  }

  const userGender = data.basicInfo?.gender

  const religiousLevels = [
    {
      value: 'learning',
      label: 'Learning',
      description: 'Still learning about Islam and developing practice',
      icon: <Star className="h-5 w-5" />
    },
    {
      value: 'practicing',
      label: 'Practicing',
      description: 'Regular practice with continued spiritual growth',
      icon: <Heart className="h-5 w-5" />
    },
    {
      value: 'devout',
      label: 'Very Religious',
      description: 'Strong commitment to Islamic principles and practice',
      icon: <Church className="h-5 w-5" />
    }
  ]

  const prayerFrequencies = [
    { value: 'rarely', label: 'Rarely', description: 'Occasionally' },
    { value: 'sometimes', label: 'Sometimes', description: 'Few times a week' },
    { value: 'regularly', label: 'Regularly', description: 'Most daily prayers' },
    { value: 'always', label: 'Always', description: 'All five daily prayers' }
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Church className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Your Religious Practice
        </h3>
        <p className="text-sm text-neutral-600">
          Help us understand your level of Islamic practice to find compatible matches
        </p>
      </div>

      {/* Religious Commitment Level */}
      <div>
        <Label required className="mb-4 block text-base font-medium">
          How would you describe your religious commitment?
        </Label>
        <RadioGroup
          value={watch('religious_level')}
          onValueChange={(value) => setValue('religious_level', value as any)}
          className="space-y-3"
        >
          {religiousLevels.map((level) => (
            <Label
              key={level.value}
              htmlFor={`religious-${level.value}`}
              className="flex cursor-pointer items-start space-x-4 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value={level.value} id={`religious-${level.value}`} className="mt-1" />
              <div className="flex items-start space-x-3">
                <div className="text-primary-600 mt-0.5">
                  {level.icon}
                </div>
                <div>
                  <span className="font-medium text-neutral-900">{level.label}</span>
                  <p className="text-sm text-neutral-600 mt-1">{level.description}</p>
                </div>
              </div>
            </Label>
          ))}
        </RadioGroup>
        {errors.religious_level && <FormError>{errors.religious_level.message}</FormError>}
      </div>

      {/* Prayer Frequency */}
      <div>
        <Label required className="mb-4 block text-base font-medium">
          How often do you pray?
        </Label>
        <RadioGroup
          value={watch('prayer_frequency')}
          onValueChange={(value) => setValue('prayer_frequency', value as any)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {prayerFrequencies.map((freq) => (
            <Label
              key={freq.value}
              htmlFor={`prayer-${freq.value}`}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value={freq.value} id={`prayer-${freq.value}`} />
              <div>
                <span className="font-medium text-neutral-900">{freq.label}</span>
                <p className="text-xs text-neutral-600">{freq.description}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
        {errors.prayer_frequency && <FormError>{errors.prayer_frequency.message}</FormError>}
      </div>

      {/* Gender-specific preferences */}
      {userGender === 'male' && (
        <div>
          <Label className="mb-4 block text-base font-medium">
            Hijab preference for your future spouse
          </Label>
          <RadioGroup
            value={watch('hijab_preference')}
            onValueChange={(value) => setValue('hijab_preference', value as any)}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <Label
              htmlFor="hijab-required"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value="required" id="hijab-required" />
              <div>
                <span className="font-medium">Required</span>
                <p className="text-xs text-neutral-600">Must wear hijab</p>
              </div>
            </Label>
            
            <Label
              htmlFor="hijab-preferred"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value="preferred" id="hijab-preferred" />
              <div>
                <span className="font-medium">Preferred</span>
                <p className="text-xs text-neutral-600">Prefer hijab</p>
              </div>
            </Label>
            
            <Label
              htmlFor="hijab-optional"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value="optional" id="hijab-optional" />
              <div>
                <span className="font-medium">Optional</span>
                <p className="text-xs text-neutral-600">Personal choice</p>
              </div>
            </Label>
          </RadioGroup>
        </div>
      )}

      {userGender === 'female' && (
        <div>
          <Label className="mb-4 block text-base font-medium">
            Beard preference for your future spouse
          </Label>
          <RadioGroup
            value={watch('beard_preference')}
            onValueChange={(value) => setValue('beard_preference', value as any)}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <Label
              htmlFor="beard-required"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value="required" id="beard-required" />
              <div>
                <span className="font-medium">Required</span>
                <p className="text-xs text-neutral-600">Must have beard</p>
              </div>
            </Label>
            
            <Label
              htmlFor="beard-preferred"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value="preferred" id="beard-preferred" />
              <div>
                <span className="font-medium">Preferred</span>
                <p className="text-xs text-neutral-600">Prefer beard</p>
              </div>
            </Label>
            
            <Label
              htmlFor="beard-optional"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <RadioGroupItem value="optional" id="beard-optional" />
              <div>
                <span className="font-medium">Optional</span>
                <p className="text-xs text-neutral-600">Personal choice</p>
              </div>
            </Label>
          </RadioGroup>
        </div>
      )}

      {/* Important Note */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Heart className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              Remember: This is about compatibility
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              We use this information to match you with someone who shares similar values and 
              religious practices. There's no judgment here - we're all on our own journey.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button type="submit" fullWidth size="lg">
        Continue to Personal Information
      </Button>
    </form>
  )
}