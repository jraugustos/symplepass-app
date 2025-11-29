'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'
import { Checkbox } from './input'

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string
}

export const Select = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 text-sm font-inter text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl transition-all duration-250 outline-none',
          'hover:border-neutral-300',
          'focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10',
          'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70',
          Boolean(error) && 'border-error focus:border-error focus:ring-error/10',
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface CustomSelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  error = false,
  size = 'default',
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
    }
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  }

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex items-center justify-between w-full font-inter text-neutral-800 bg-white border border-neutral-300 rounded-xl cursor-pointer transition-all',
          'hover:border-neutral-400',
          'disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-70',
          isOpen && 'border-primary ring-2 ring-primary/10',
          error && 'border-error focus:border-error focus:ring-error/10',
          sizeClasses[size]
        )}
      >
        <span className={cn('flex items-center gap-2', !selectedOption && 'text-neutral-400')}>
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-600 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-neutral-300 rounded-xl shadow-custom-md max-h-60 overflow-y-auto',
          'transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
        role="listbox"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !option.disabled && handleSelect(option.value)}
            disabled={option.disabled}
            role="option"
            aria-selected={value === option.value}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm font-inter text-neutral-800 cursor-pointer transition-colors text-left',
              'hover:bg-neutral-50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              value === option.value && 'bg-primary-50 text-primary-600 font-medium'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface MultiSelectProps {
  options: SelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  error = false,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  const selectedOptions = options.filter((opt) => value.includes(opt.value))

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-sm font-inter bg-white border border-neutral-300 rounded-xl cursor-pointer transition-all min-h-[2.75rem]',
          'hover:border-neutral-400',
          'disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-70',
          isOpen && 'border-primary ring-2 ring-primary/10',
          error && 'border-error focus:border-error focus:ring-error/10'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 rounded font-inter"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(option.value)
                  }}
                  className="inline-flex items-center justify-center w-3 h-3 text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-neutral-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-600 transition-transform flex-shrink-0 ml-2',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-neutral-300 rounded-xl shadow-custom-md max-h-60 overflow-y-auto',
          'transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
        role="listbox"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer transition-colors',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Checkbox
              checked={value.includes(option.value)}
              onChange={() => !option.disabled && handleToggle(option.value)}
              disabled={option.disabled}
            />
            <span className="text-sm text-neutral-800 font-inter">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
