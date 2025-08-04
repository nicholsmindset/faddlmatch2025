import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { FormSelect } from '@/components/ui/FormSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Badge } from '@/components/ui/Badge'
import { Users, Shield, Baby, Heart, X } from 'lucide-react'
import { useState } from 'react'

const familySituationSchema = z.object({
  guardian_enabled: z.boolean(),
  guardian_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  family_values: z.array(z.string()).min(1, 'Please select at least one family value'),
  children_preference: z.enum(['definitely', 'probably', 'maybe', 'no'], {
    required_error: 'Please select your preference about having children'
  }),
  education_level: z.enum(['high_school', 'bachelors', 'masters', 'doctorate'], {
    required_error: 'Please select your education level'
  }),
  occupation: z.string().min(2, 'Please enter your occupation'),
  ethnicity: z.enum(['malay', 'chinese', 'indian', 'eurasian', 'other'], {
    required_error: 'Please select your family background/ethnicity'
  }),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
  seeking_marriage_timeline: z.enum(['immediately', 'within_year', 'within_two_years', 'when_ready'], {
    required_error: 'Please select your marriage timeline'
  })
}).refine((data) => {
  if (data.guardian_enabled && !data.guardian_email) {
    return false
  }
  return true
}, {
  message: "Guardian email is required when guardian is enabled",
  path: ["guardian_email"]
})

type FamilySituationData = z.infer<typeof familySituationSchema>

interface FamilySituationStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
}

const FAMILY_VALUES = [
  'Respect', 'Kindness', 'Faith', 'Honesty', 'Patience', 'Generosity',
  'Forgiveness', 'Loyalty', 'Compassion', 'Wisdom', 'Gratitude', 'Humility'
]

const INTERESTS = [
  'Reading Quran', 'Islamic Studies', 'Cooking', 'Traveling', 'Reading',
  'Sports', 'Photography', 'Art', 'Music', 'Technology', 'Fitness',
  'Volunteering', 'Nature', 'Learning Languages', 'Business', 'Science'
]

const LANGUAGES = [
  'English', 'Arabic', 'Malay', 'Tamil', 'Mandarin', 'Hindi', 'Urdu',
  'Bengali', 'Indonesian', 'Turkish', 'French', 'Spanish'
]

export function FamilySituationStep({ data, onUpdate, onNext }: FamilySituationStepProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(
    data.familyInfo?.family_values || data.personalInfo?.interests || []
  )
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    data.personalInfo?.interests || []
  )
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    data.personalInfo?.languages || []
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FamilySituationData>({
    resolver: zodResolver(familySituationSchema),
    defaultValues: {
      ...data.familyInfo,
      ...data.personalInfo,
      family_values: selectedValues,
      interests: selectedInterests,
      languages: selectedLanguages
    }
  })

  const guardianEnabled = watch('guardian_enabled')

  const toggleValue = (value: string, list: string[], setList: (list: string[]) => void, fieldName: string) => {
    const newList = list.includes(value)
      ? list.filter(v => v !== value)
      : [...list, value]
    setList(newList)
    setValue(fieldName as any, newList)
  }

  const onSubmit = (values: FamilySituationData) => {
    const { family_values, children_preference, guardian_enabled, guardian_email, ...personalInfo } = values
    
    onUpdate({
      familyInfo: {
        family_values,
        children_preference,
        guardian_enabled,
        guardian_email: guardian_enabled ? guardian_email : undefined
      },
      personalInfo
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Users className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Personal & Family Information
        </h3>
        <p className="text-sm text-neutral-600">
          Help us understand your background and what matters to you
        </p>
      </div>

      {/* Education & Career */}
      <div className="space-y-4">
        <h4 className="font-medium text-neutral-900 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full" />
          Education & Career
        </h4>
        
        <FormSelect
          label="Education Level"
          {...register('education_level')}
          error={errors.education_level?.message}
          required
        >
          <option value="">Select your education level</option>
          <option value="high_school">High School</option>
          <option value="bachelors">Bachelor's Degree</option>
          <option value="masters">Master's Degree</option>
          <option value="doctorate">Doctorate/PhD</option>
        </FormSelect>

        <Input
          label="Occupation"
          placeholder="e.g., Software Engineer, Teacher, Doctor"
          {...register('occupation')}
          error={errors.occupation?.message}
          required
        />

        <FormSelect
          label="Family Background/Ethnicity"
          {...register('ethnicity')}
          error={errors.ethnicity?.message}
          required
        >
          <option value="">Select your family background</option>
          <option value="malay">Malay</option>
          <option value="chinese">Chinese</option>
          <option value="indian">Indian</option>
          <option value="eurasian">Eurasian</option>
          <option value="other">Other</option>
        </FormSelect>
      </div>

      {/* Family Values */}
      <div>
        <Label required className="mb-4 block">
          Important Family Values
        </Label>
        <p className="text-sm text-neutral-600 mb-4">
          Select the values that are most important to you in a marriage
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FAMILY_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleValue(value, selectedValues, setSelectedValues, 'family_values')}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                selectedValues.includes(value)
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        {errors.family_values && <FormError>{errors.family_values.message}</FormError>}
      </div>

      {/* Interests */}
      <div>
        <Label required className="mb-4 block">
          Your Interests
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleValue(interest, selectedInterests, setSelectedInterests, 'interests')}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                selectedInterests.includes(interest)
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
        {errors.interests && <FormError>{errors.interests.message}</FormError>}
      </div>

      {/* Languages */}
      <div>
        <Label required className="mb-4 block">
          Languages You Speak
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => toggleValue(language, selectedLanguages, setSelectedLanguages, 'languages')}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                selectedLanguages.includes(language)
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
              }`}
            >
              {language}
            </button>
          ))}
        </div>
        {errors.languages && <FormError>{errors.languages.message}</FormError>}
      </div>

      {/* Marriage Timeline */}
      <div>
        <Label required className="mb-4 block">
          When are you looking to get married?
        </Label>
        <RadioGroup
          value={watch('seeking_marriage_timeline')}
          onValueChange={(value) => setValue('seeking_marriage_timeline', value as any)}
          className="space-y-3"
        >
          <Label
            htmlFor="immediately"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="immediately" id="immediately" />
            <span>Ready now - As soon as I find the right person</span>
          </Label>
          
          <Label
            htmlFor="within_year"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="within_year" id="within_year" />
            <span>Within 1 year</span>
          </Label>
          
          <Label
            htmlFor="within_two_years"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="within_two_years" id="within_two_years" />
            <span>Within 2 years</span>
          </Label>
          
          <Label
            htmlFor="when_ready"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="when_ready" id="when_ready" />
            <span>When Allah wills (In sha Allah)</span>
          </Label>
        </RadioGroup>
        {errors.seeking_marriage_timeline && <FormError>{errors.seeking_marriage_timeline.message}</FormError>}
      </div>

      {/* Children Preference */}
      <div>
        <Label required className="mb-4 block flex items-center gap-2">
          <Baby className="h-4 w-4" />
          Do you want to have children?
        </Label>
        <RadioGroup
          value={watch('children_preference')}
          onValueChange={(value) => setValue('children_preference', value as any)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Label
            htmlFor="definitely"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="definitely" id="definitely" />
            <span>Definitely yes</span>
          </Label>
          
          <Label
            htmlFor="probably"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="probably" id="probably" />
            <span>Probably yes</span>
          </Label>
          
          <Label
            htmlFor="maybe"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="maybe" id="maybe" />
            <span>Maybe/Undecided</span>
          </Label>
          
          <Label
            htmlFor="no"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="no" id="no" />
            <span>No</span>
          </Label>
        </RadioGroup>
        {errors.children_preference && <FormError>{errors.children_preference.message}</FormError>}
      </div>

      {/* Guardian System */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900">Family Guardian System</h4>
            <p className="text-sm text-blue-700 mt-1">
              Our platform supports Islamic marriage traditions by allowing family involvement in the process.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <RadioGroup
            value={guardianEnabled ? 'yes' : 'no'}
            onValueChange={(value) => setValue('guardian_enabled', value === 'yes')}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <Label
              htmlFor="guardian-yes"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-blue-200 bg-white p-4 hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
            >
              <RadioGroupItem value="yes" id="guardian-yes" />
              <div>
                <span className="font-medium">Enable Guardian</span>
                <p className="text-xs text-neutral-600">Family member oversees matches</p>
              </div>
            </Label>
            
            <Label
              htmlFor="guardian-no"
              className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-blue-200 bg-white p-4 hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
            >
              <RadioGroupItem value="no" id="guardian-no" />
              <div>
                <span className="font-medium">Self-Managed</span>
                <p className="text-xs text-neutral-600">I'll manage my own matches</p>
              </div>
            </Label>
          </RadioGroup>

          {guardianEnabled && (
            <Input
              label="Guardian Email Address"
              type="email"
              placeholder="guardian@example.com"
              {...register('guardian_email')}
              error={errors.guardian_email?.message}
              required={guardianEnabled}
            />
          )}
        </div>
      </div>

      {/* Continue Button */}
      <Button type="submit" fullWidth size="lg">
        Continue to Partner Preferences
      </Button>
    </form>
  )
}