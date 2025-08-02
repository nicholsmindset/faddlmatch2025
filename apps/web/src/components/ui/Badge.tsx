import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-neutral-100 text-neutral-900',
        secondary: 'border-transparent bg-secondary-100 text-secondary-900',
        primary: 'border-transparent bg-primary-100 text-primary-900',
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-yellow-100 text-yellow-800',
        danger: 'border-transparent bg-red-100 text-red-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
        premium: 'border-transparent bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900',
        outline: 'border-neutral-300 text-neutral-700 bg-white',
        verified: 'border-transparent bg-emerald-100 text-emerald-800'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs h-5',
        md: 'px-2.5 py-1 text-xs h-6',
        lg: 'px-3 py-1 text-sm h-7'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon,
    removable,
    onRemove,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {icon && (
          <span className="mr-1 flex-shrink-0">
            {icon}
          </span>
        )}
        <span className="truncate">{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 flex-shrink-0 rounded-full hover:bg-black/10 p-0.5"
          >
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'