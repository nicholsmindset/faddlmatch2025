import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUser } from '@clerk/nextjs'
import { Input } from '@/components/ui/Input'
import { FormSelect } from '@/components/ui/FormSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { ImageUpload } from '@/components/ui/ImageUpload'

const basicInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  yearOfBirth: z.number()
    .min(1950, 'Please enter a valid year')
    .max(new Date().getFullYear() - 18, 'You must be at least 18 years old'),
  gender: z.enum(['male', 'female'], {
    required_error: 'Please select your gender'
  }),
  location: z.enum(['north', 'south', 'east', 'west', 'central'], {
    required_error: 'Please select your location'
  }),
  bio: z.string()
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must not exceed 500 characters'),
  profilePhoto: z.string().optional(),
  profilePhotoPath: z.string().optional()
})

type BasicInfoData = z.infer<typeof basicInfoSchema>

interface BasicInfoStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function BasicInfoStep({ data, onUpdate, onNext }: BasicInfoStepProps) {
  const { user } = useUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data.basicInfo || {}
  })

  const handlePhotoChange = (url: string | null, path: string | null) => {
    setValue('profilePhoto', url || '')
    setValue('profilePhotoPath', path || '')
  }

  const onSubmit = (values: BasicInfoData) => {
    onUpdate({ basicInfo: values })
    onNext()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 18 - i)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to FADDL Match
        </h3>
        <p className="text-green-600 font-medium mb-2">
          Assalamu Alaikum & Welcome
        </p>
        <p className="text-gray-600 max-w-md mx-auto">
          FADDL is designed specifically for divorced and widowed Muslims in Singapore seeking meaningful remarriage connections. We combine Islamic values with modern technology to help you find your life partner.
        </p>
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 italic">
            "And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them..." - Quran 30:21
          </p>
        </div>
      </div>

      {/* Profile Photo Upload */}
      <div className="mb-8">
        <Label className="mb-4 block text-center">
          Profile Photo
        </Label>
        <ImageUpload
          currentImage={watch('profilePhoto')}
          userId={user?.id || ''}
          userName={`${watch('firstName') || ''} ${watch('lastName') || ''}`.trim() || 'User'}
          onImageChange={handlePhotoChange}
          isPrivate={true}
          size="lg"
          className="mx-auto"
        />
      </div>

      {/* Name Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="First Name"
          placeholder="Enter your first name"
          {...register('firstName')}
          error={errors.firstName?.message}
          required
        />
        
        <Input
          label="Last Name"
          placeholder="Enter your last name"
          {...register('lastName')}
          error={errors.lastName?.message}
          required
        />
      </div>

      {/* Year of Birth */}
      <FormSelect
        label="Year of Birth"
        placeholder="Select your birth year"
        {...register('yearOfBirth', { 
          setValueAs: (value) => value ? parseInt(value) : undefined 
        })}
        error={errors.yearOfBirth?.message}
        required
      >
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </FormSelect>

      {/* Gender Selection */}
      <div>
        <Label required className="mb-3 block">Gender</Label>
        <RadioGroup
          value={watch('gender')}
          onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="male"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="male" id="male" />
            <div>
              <span className="font-medium">Male</span>
              <p className="text-xs text-neutral-600">Brother seeking sister</p>
            </div>
          </Label>
          
          <Label
            htmlFor="female"
            className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-neutral-200 p-4 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <RadioGroupItem value="female" id="female" />
            <div>
              <span className="font-medium">Female</span>
              <p className="text-xs text-neutral-600">Sister seeking brother</p>
            </div>
          </Label>
        </RadioGroup>
        {errors.gender && <FormError>{errors.gender.message}</FormError>}
      </div>

      {/* Location in Singapore */}
      <FormSelect
        label="Location in Singapore"
        placeholder="Select your region"
        {...register('location')}
        error={errors.location?.message}
        required
      >
        <option value="north">North (Woodlands, Yishun, Sembawang)</option>
        <option value="south">South (Sentosa, Marina Bay, Harbourfront)</option>
        <option value="east">East (Tampines, Pasir Ris, Bedok)</option>
        <option value="west">West (Jurong, Clementi, Bukit Batok)</option>
        <option value="central">Central (Orchard, Bugis, City Hall)</option>
      </FormSelect>

      {/* Bio */}
      <div>
        <Label htmlFor="bio" required className="mb-2 block">
          About Yourself
        </Label>
        <textarea
          id="bio"
          rows={4}
          className="flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Share a bit about yourself, your values, and what you're looking for in a marriage partner. Be genuine and respectful."
          {...register('bio')}
        />
        <div className="mt-1 flex justify-between items-center">
          {errors.bio && <FormError>{errors.bio.message}</FormError>}
          <span className="text-xs text-neutral-500 ml-auto">
            {watch('bio')?.length || 0}/500 characters
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-600">
          💡 Tip: Mention your interests, family values, and marriage goals to attract compatible matches
        </p>
      </div>

      {/* Continue Button */}
      <Button type="submit" fullWidth size="lg" className="mt-8">
        Continue to Family & Religious Info
      </Button>
    </form>
  )
}