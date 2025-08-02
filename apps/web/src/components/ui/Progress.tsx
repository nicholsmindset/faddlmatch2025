import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  label?: string
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    }
    
    const variantClasses = {
      default: 'bg-primary-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      danger: 'bg-red-600'
    }

    return (
      <div className="w-full">
        {(showLabel || label) && (
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              {label || 'Progress'}
            </span>
            <span className="text-neutral-600">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(
            'w-full overflow-hidden rounded-full bg-neutral-200',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'