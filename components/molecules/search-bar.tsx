'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Search, X, Calendar, MapPin, SlidersHorizontal, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBarVariant } from '@/types'

export interface QuickFilter {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface SearchBarProps {
  variant?: SearchBarVariant
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  onFilterClick?: () => void
  showLocationFilter?: boolean
  showDateFilter?: boolean
  locationValue?: string
  dateValue?: string
  onLocationChange?: (value: string) => void
  onDateChange?: (value: string) => void
  suggestions?: string[]
  onSuggestionClick?: (value: string) => void
  quickFilters?: QuickFilter[]
  onQuickFilterClick?: (value: string) => void
  onClearFilters?: () => void
  className?: string
  activeEventsCount?: number
}

export function SearchBar({
  variant = 'simple',
  placeholder = 'Buscar eventos...',
  value,
  onChange,
  onSearch,
  onFilterClick,
  showLocationFilter = false,
  showDateFilter = false,
  locationValue = '',
  dateValue = '',
  onLocationChange,
  onDateChange,
  suggestions = [],
  onSuggestionClick,
  quickFilters = [],
  onQuickFilterClick,
  onClearFilters,
  className,
  activeEventsCount,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState(value || '')
  const [internalLocation, setInternalLocation] = React.useState(locationValue)
  const [internalDate, setInternalDate] = React.useState(dateValue)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const searchValue = value !== undefined ? value : internalValue
  const locationVal = locationValue !== undefined ? locationValue : internalLocation
  const dateVal = dateValue !== undefined ? dateValue : internalDate

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (locationValue === undefined) {
      setInternalLocation(newValue)
    }
    onLocationChange?.(newValue)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (dateValue === undefined) {
      setInternalDate(newValue)
    }
    onDateChange?.(newValue)
  }

  const handleClear = () => {
    if (value === undefined) {
      setInternalValue('')
    }
    onChange?.('')
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  // Hero variant - large search bar with backdrop blur and suggestions
  if (variant === 'hero') {
    const handleSuggestion = (suggestion: string) => {
      if (value === undefined) {
        setInternalValue(suggestion)
      }
      onChange?.(suggestion)
      onSuggestionClick?.(suggestion)
    }

    return (
      <div className={cn('w-full max-w-2xl mx-auto', className)}>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/20"
        >
          {activeEventsCount !== undefined && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/85 text-xs font-medium mb-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-white" />
                <span>{activeEventsCount.toLocaleString('pt-BR')} eventos ativos</span>
              </div>
              <span className="text-white/80 text-[13px]">Busque por cidade, modalidade ou data</span>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-stretch gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white/95 border border-white/60 rounded-full px-4 py-0.5 shadow-inner backdrop-blur">
                <Search className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-geist text-neutral-900 placeholder:text-neutral-400 py-2.5"
                  aria-label="Search events"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4b1f0e] via-[#7c3712] to-[#b3531b] px-5 py-2.5 text-sm font-semibold font-geist text-white shadow-[0_15px_35px_rgba(87,35,15,0.45)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300"
              >
                Buscar
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>
            </div>
            {/* Suggestion tags */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestion(suggestion)}
                    className="text-xs text-white border-white/30 border rounded-full px-2 py-1 hover:bg-white/10 cursor-pointer transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    )
  }

  // Events variant - compact with rounded-full style
  if (variant === 'events') {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'w-full bg-white rounded-xl p-6 border border-neutral-200',
          className
        )}
      >
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 inline-flex items-center text-neutral-400">
              <Search className="w-[18px] h-[18px]" />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full rounded-full border border-neutral-200 px-4 pl-10 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-geist bg-white text-neutral-900"
              aria-label="Search events"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-5 transition hover:bg-neutral-800 text-sm font-medium text-white font-geist bg-gradient-primary border-0 rounded-full"
          >
            Buscar
          </button>
        </div>
      </form>
    )
  }

  // Filters variant - with quick filter chips
  if (variant === 'filters') {
    return (
      <div className={cn('w-full bg-white rounded-xl p-6 border border-neutral-200', className)}>
        <div className="space-y-4">
          {/* Search input */}
          <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-geist"
              />
            </div>

            {/* Filter button */}
            {onFilterClick && (
              <button
                type="button"
                onClick={onFilterClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition font-geist"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </button>
            )}

            {/* Search button */}
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg hover:opacity-90 transition font-geist"
            >
              Buscar
            </button>
          </form>

          {/* Quick filter chips */}
          {quickFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter, index) => {
                const Icon = filter.icon
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onQuickFilterClick?.(filter.value)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-full hover:bg-neutral-50 transition font-geist"
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {filter.label}
                  </button>
                )
              })}
              {onClearFilters && quickFilters.length > 0 && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 rounded-full hover:bg-red-100 transition font-geist"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Simple variant - minimal design
  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-neutral-50 rounded-lg border border-neutral-200 focus-within:border-primary focus-within:bg-white transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm font-inter text-neutral-900 placeholder:text-neutral-400"
          aria-label="Search"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-neutral-200 transition-colors flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        )}
      </div>
    </form>
  )
}
