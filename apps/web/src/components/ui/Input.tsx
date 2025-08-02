import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useState } from 'react'

const inputVariants = cva(
  'flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type = 'text',
    label,
    error,
    success,
    leftIcon,
    rightIcon,
    isLoading,
    id,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    const hasError = !!error
    const hasSuccess = !!success && !hasError
    
    // Determine variant based on state
    const computedVariant = hasError ? 'error' : hasSuccess ? 'success' : variant

    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: computedVariant, size }),
              leftIcon && 'pl-10',
              (rightIcon || isPassword || isLoading) && 'pr-10',
              className
            )}
            ref={ref}
            id={inputId}
            {...props}
          />
          
          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
            )}
            
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-500 hover:text-neutral-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {rightIcon && !isPassword && !isLoading && (
              <div className="text-neutral-500">
                {rightIcon}
              </div>
            )}
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

Input.displayName = 'Input'