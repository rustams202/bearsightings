import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 shadow-sm',
  secondary: 'bg-forest-50 text-forest-700 hover:bg-forest-100 active:bg-forest-200',
  outline:   'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  ghost:     'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8  px-3 text-xs  rounded-lg  gap-1.5',
  md: 'h-10 px-4 text-sm  rounded-lg  gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" className="text-current" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
