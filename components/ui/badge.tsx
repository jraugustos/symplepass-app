import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'default' | 'lg'
}

export function Badge({
  className,
  variant = 'primary',
  size = 'default',
  children,
  ...props
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center gap-1 font-medium font-inter rounded-full transition-all duration-200 whitespace-nowrap'

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-2xs',
    default: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3.5 py-1 text-sm',
  }

  const variantClasses = {
    primary: 'bg-gradient-primary text-white',
    secondary: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
    success: 'bg-success/10 text-success-700 border border-success/20',
    warning: 'bg-warning/10 text-warning-700 border border-warning/30',
    error: 'bg-error/10 text-error-700 border border-error/20',
    info: 'bg-info/10 text-info-700 border border-info/30',
    neutral: 'bg-neutral-50 text-neutral-500 border border-neutral-200',
  }

  return (
    <span
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'available' | 'limited' | 'soldout' | 'coming' | 'warning'
}

export function StatusBadge({ className, status, children, ...props }: StatusBadgeProps) {
  const statusConfig = {
    available: {
      containerClass: 'text-success-700 border-success/30 bg-success/5',
      dotClass: 'bg-success',
    },
    limited: {
      containerClass: 'text-warning-700 border-warning/30 bg-warning/5',
      dotClass: 'bg-warning',
    },
    soldout: {
      containerClass: 'text-error-700 border-error/30 bg-error/5',
      dotClass: 'bg-error',
    },
    coming: {
      containerClass: 'text-info-700 border-info/30 bg-info/5',
      dotClass: 'bg-info',
    },
    warning: {
      containerClass: 'text-warning-700 border-warning/30 bg-warning/5',
      dotClass: 'bg-warning',
    },
  }

  const fallbackConfig = {
    containerClass: 'text-neutral-600 border-neutral-200 bg-neutral-50',
    dotClass: 'bg-neutral-400',
  }

  const config = statusConfig[status] || fallbackConfig

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border',
        config.containerClass,
        className
      )}
      {...props}
    >
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dotClass)} />
      {children}
    </span>
  )
}

export interface CategoryTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void
}

export function CategoryTag({ className, onRemove, children, ...props }: CategoryTagProps) {
  const [isRemoving, setIsRemoving] = React.useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRemoving(true)
    setTimeout(() => {
      onRemove?.()
    }, 200)
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-md px-3 py-1 text-xs transition-all duration-200 hover:bg-neutral-100 hover:border-neutral-300',
        onRemove && 'cursor-pointer',
        isRemoving && 'opacity-0 scale-95',
        className
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          onClick={handleRemove}
          className="inline-flex items-center justify-center w-3.5 h-3.5 text-neutral-500 hover:text-neutral-700 transition-colors"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number
  size?: 'default' | 'lg'
}

export function CountBadge({
  className,
  count,
  size = 'default',
  ...props
}: CountBadgeProps) {
  const sizeClasses = {
    default: 'min-w-[1.125rem] h-[1.125rem] text-2xs',
    lg: 'min-w-[1.375rem] h-[1.375rem] text-xs',
  }

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 px-1 font-semibold bg-gradient-primary text-white rounded-full border-2 border-white flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
