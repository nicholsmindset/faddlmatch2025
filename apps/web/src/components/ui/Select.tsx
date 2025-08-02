import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronDown, AlertCircle } from 'lucide-react'

const selectVariants = cva(
  'flex w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-neutral-300 focus-visible:border-primary-500',
        error: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500'
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  label?: string
  error?: string
  success?: string
  placeholder?: string
  options?: Array<{
    value: string
    label: string
    disabled?: boolean
  }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    variant, 
    size, 
    label,
    error,
    success,
    placeholder,
    options,
    children,
    id,
    ...props 
  }, ref) => {
    const hasError = !!error
    const hasSuccess = !!success && !hasError
    
    // Determine variant based on state
    const computedVariant = hasError ? 'error' : hasSuccess ? 'success' : variant

    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId}
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            className={cn(
              selectVariants({ variant: computedVariant, size }),
              'pr-10',
              className
            )}
            ref={ref}
            id={selectId}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {options ? (
              options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value} 
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          
          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </div>
        </div>
        
        {/* Helper text */}
        {(error || success) && (
          <div className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            hasError && "text-red-600",
            hasSuccess && "text-green-600"
          )}>
            {hasError && <AlertCircle className="h-3 w-3" />}
            <span>{error || success}</span>
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'