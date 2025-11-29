'use client'

import * as React from 'react'
import { cn, handleKeyboardNavigation } from '@/lib/utils'
import { ChevronDown, Check, X } from 'lucide-react'
import { FilterOption } from '@/types'

export interface FilterPillProps {
  label: string
  value: string
  onRemove: () => void
  className?: string
}

export function FilterPill({ label, value, onRemove, className }: FilterPillProps) {
  const [isRemoving, setIsRemoving] = React.useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRemoving(true)
    setTimeout(() => {
      onRemove()
    }, 200)
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full transition-all duration-200',
        isRemoving && 'opacity-0 scale-95',
        className
      )}
    >
      {label}
      <button
        onClick={handleRemove}
        className="inline-flex items-center justify-center w-3.5 h-3.5 text-white/80 hover:text-white transition-colors"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

export interface FilterGroupProps {
  children: React.ReactNode
  showDivider?: boolean
  showSort?: boolean
  onSortClick?: () => void
  className?: string
}

export function FilterGroup({
  children,
  showDivider,
  showSort,
  onSortClick,
  className,
}: FilterGroupProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
      {showDivider && <div className="w-px h-6 bg-neutral-200" />}
      {showSort && (
        <button
          onClick={onSortClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-full hover:bg-neutral-50 transition font-geist"
        >
          Ordenar
        </button>
      )}
    </div>
  )
}

export interface FilterButtonProps {
  label: string
  options: FilterOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  multiple?: boolean
  placeholder?: string
  showCount?: boolean
  disabled?: boolean
  className?: string
}

export function FilterButton({
  label,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Selecione...',
  showCount = false,
  disabled = false,
  className,
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    multiple ? [] : ''
  )
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const currentValue = value !== undefined ? value : internalValue

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (optionValue: string) => {
    if (disabled) return

    if (multiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : []
      const newValue = currentArray.includes(optionValue)
        ? currentArray.filter((v) => v !== optionValue)
        : [...currentArray, optionValue]

      if (value === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    } else {
      const newValue = currentValue === optionValue ? '' : optionValue
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const newIndex = handleKeyboardNavigation(
      e,
      focusedIndex,
      options.length,
      () => handleSelect(options[focusedIndex].value)
    )
    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex)
    }
  }

  const isSelected = (optionValue: string): boolean => {
    if (multiple && Array.isArray(currentValue)) {
      return currentValue.includes(optionValue)
    }
    return currentValue === optionValue
  }

  const getSelectedLabel = (): string => {
    if (multiple && Array.isArray(currentValue)) {
      if (currentValue.length === 0) return placeholder
      if (currentValue.length === 1) {
        const selected = options.find((opt) => opt.value === currentValue[0])
        return selected?.label || placeholder
      }
      return `${currentValue.length} selecionados`
    }

    const selected = options.find((opt) => opt.value === currentValue)
    return selected?.label || placeholder
  }

  const hasSelection = multiple
    ? Array.isArray(currentValue) && currentValue.length > 0
    : Boolean(currentValue)

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-between gap-2 px-4 py-2 rounded-lg border bg-white font-inter text-sm transition-all',
          'hover:border-neutral-300 hover:shadow-custom-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:shadow-none',
          isOpen && 'border-primary shadow-custom-sm',
          hasSelection ? 'border-primary text-neutral-900' : 'border-neutral-200 text-neutral-600'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        aria-disabled={disabled}
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">{label}:</span>
          <span className={cn('font-medium', hasSelection && 'text-primary')}>
            {getSelectedLabel()}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full mt-2 min-w-[200px] bg-white rounded-lg shadow-custom-lg border border-neutral-200 overflow-hidden z-50',
            'animate-fade-in-up'
          )}
          role="listbox"
          aria-label={`${label} options`}
          aria-activedescendant={`option-${options[focusedIndex]?.value}`}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="max-h-[300px] overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((option, index) => {
                const selected = isSelected(option.value)
                const isFocused = index === focusedIndex

                return (
                  <button
                    key={option.value}
                    id={`option-${option.value}`}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2 text-sm font-inter transition-colors',
                      'hover:bg-neutral-50',
                      selected ? 'bg-primary/5 text-primary' : 'text-neutral-700',
                      isFocused && 'bg-neutral-100'
                    )}
                    role="option"
                    aria-selected={selected}
                  >
                    <span className="flex items-center gap-2">
                      {multiple && (
                        <span
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                            selected
                              ? 'bg-primary border-primary'
                              : 'bg-white border-neutral-300'
                          )}
                        >
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </span>
                      )}
                      <span>{option.label}</span>
                    </span>
                    {showCount && option.count !== undefined && (
                      <span className="text-xs text-neutral-500 ml-2">({option.count})</span>
                    )}
                    {!multiple && selected && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
