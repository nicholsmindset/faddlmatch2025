import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const FormError = forwardRef<HTMLDivElement, FormErrorProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-1 flex items-center gap-1 text-xs text-red-600',
          className
        )}
        {...props}
      >
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <span>{children}</span>
      </div>
    )
  }
)

FormError.displayName = 'FormError'