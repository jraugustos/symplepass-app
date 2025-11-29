'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  isLoading?: boolean
  iconOnly?: boolean
  rounded?: 'lg' | 'full'
  asChild?: boolean
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      iconOnly = false,
      rounded = 'full',
      disabled,
      children,
      asChild = false,
      ripple = true,
      onClick,
      ...props
    },
    ref
  ) => {
    // Ripple effect handler
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !isLoading) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const rippleElement = document.createElement('span')
        rippleElement.style.position = 'absolute'
        rippleElement.style.left = `${x}px`
        rippleElement.style.top = `${y}px`
        rippleElement.style.width = '0'
        rippleElement.style.height = '0'
        rippleElement.style.borderRadius = '50%'
        rippleElement.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
        rippleElement.style.transform = 'translate(-50%, -50%)'
        rippleElement.style.pointerEvents = 'none'

        button.style.position = 'relative'
        button.style.overflow = 'hidden'
        button.appendChild(rippleElement)

        // Animate the ripple
        requestAnimationFrame(() => {
          rippleElement.style.transition = 'width 0.6s, height 0.6s, opacity 0.6s'
          rippleElement.style.width = '300px'
          rippleElement.style.height = '300px'
          rippleElement.style.opacity = '0'
        })

        // Remove ripple after animation
        setTimeout(() => {
          rippleElement.remove()
        }, 600)
      }

      // Call original onClick handler
      onClick?.(e)
    }

    // Base classes
    const baseClasses =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium font-geist transition-all duration-250 cursor-pointer outline-none border border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 relative overflow-hidden'

    // Variant classes
    const variantClasses = {
      primary:
        'bg-gradient-primary text-white hover:bg-gradient-primary-hover hover:-translate-y-0.5 hover:shadow-custom-md active:translate-y-0',
      secondary:
        'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
      ghost:
        'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200 hover:text-neutral-800',
      outline:
        'bg-transparent text-primary-500 border-primary-500 hover:bg-primary-50 hover:border-primary-600',
      destructive: 'bg-error text-white hover:bg-error-600',
    }

    // Size classes for regular buttons
    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5',
      default: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-2.5',
    }

    // Icon-only button classes
    const iconOnlyClasses = {
      sm: 'w-8 h-8 p-0',
      default: 'w-10 h-10 p-0',
      lg: 'w-12 h-12 p-0',
    }

    // Rounded classes
    const roundedClasses = {
      lg: 'rounded-lg',
      full: 'rounded-full',
    }

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      iconOnly ? iconOnlyClasses[size] : sizeClasses[size],
      iconOnly ? roundedClasses.lg : roundedClasses[rounded],
      className
    )

    if (asChild) {
      // For asChild pattern (e.g., with Next.js Link)
      return React.cloneElement(children as React.ReactElement, {
        className: cn(classes, (children as React.ReactElement).props?.className),
        ref,
        ...props,
      })
    }

    return (
      <button
        className={classes}
        disabled={disabled || isLoading}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4" />
            {!iconOnly && <span>Carregando...</span>}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export default Button
