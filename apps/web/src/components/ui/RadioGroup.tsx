import { forwardRef, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupContextValue {
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue>({})

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  required?: boolean
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, disabled, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider
        value={{
          name,
          value,
          onValueChange,
          disabled
        }}
      >
        <div
          ref={ref}
          className={cn('grid gap-2', className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = useContext(RadioGroupContext)
    
    return (
      <input
        ref={ref}
        type="radio"
        className={cn(
          'h-4 w-4 rounded-full border border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          context.disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        name={context.name}
        value={value}
        checked={context.value === value}
        onChange={(e) => {
          if (e.target.checked) {
            context.onValueChange?.(value as string)
          }
        }}
        disabled={context.disabled || props.disabled}
        {...props}
      />
    )
  }
)

RadioGroupItem.displayName = 'RadioGroupItem'