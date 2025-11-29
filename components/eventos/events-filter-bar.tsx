'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Calendar, MapPin, DollarSign } from 'lucide-react'
import { FilterButton } from '@/components/molecules/filter-button'
import type { EventsListFilters, FilterOption, SortOption, SportType } from '@/types'
import { buildQueryString } from '@/lib/utils'
import { ActiveFilters } from './active-filters'

/**
 * Events Filter Bar Component
 *
 * Current implementation includes: Date, City, Price, Category (Sport Type), Sort
 *
 * TODO: Add additional filters as per design spec:
 * - Gender filter (male, female, mixed, all)
 * - Event type filter (presencial, virtual, hybrid)
 * - Distance filter (for location-based proximity)
 * - Difficulty level filter (beginner, intermediate, advanced)
 *
 * These filters will require:
 * 1. Database schema updates to add corresponding columns to events table
 * 2. Extension of EventsListFilters type in types/index.ts
 * 3. Updates to getFilteredEvents query logic in lib/data/events.ts
 * 4. Additional FilterButton components in the UI layout below
 * 5. Updates to seed data to include these new fields
 */

interface EventsFilterBarProps {
  filters: EventsListFilters
  filterOptions: {
    cities: FilterOption[]
    states: FilterOption[]
    sportTypes: FilterOption[]
  }
}

export function EventsFilterBar({ filters, filterOptions }: EventsFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local state for price range inputs
  const [minPrice, setMinPrice] = useState<string>(filters.min_price?.toString() || '')
  const [maxPrice, setMaxPrice] = useState<string>(filters.max_price?.toString() || '')
  const [isPriceOpen, setIsPriceOpen] = useState(false)

  // Local state for date range inputs
  const [startDate, setStartDate] = useState<string>(filters.start_date || '')
  const [endDate, setEndDate] = useState<string>(filters.end_date || '')
  const [isDateOpen, setIsDateOpen] = useState(false)

  const updateFilters = (newFilters: Partial<EventsListFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }

    // Remove undefined and empty values
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key as keyof EventsListFilters]
      if (value === undefined || value === null || value === '') {
        delete updatedFilters[key as keyof EventsListFilters]
      }
    })

    // Reset to page 1 when filters change
    if (newFilters.page === undefined) {
      delete updatedFilters.page
    }

    const queryString = buildQueryString(updatedFilters)
    router.push(`${pathname}${queryString}`)
  }

  const handleRemoveFilter = (filterKey: keyof EventsListFilters) => {
    const newFilters = { ...filters }

    // Handle special cases
    if (filterKey === 'min_price' || filterKey === 'max_price') {
      delete newFilters.min_price
      delete newFilters.max_price
      setMinPrice('')
      setMaxPrice('')
    } else if (filterKey === 'start_date' || filterKey === 'end_date') {
      delete newFilters.start_date
      delete newFilters.end_date
      setStartDate('')
      setEndDate('')
    } else {
      delete newFilters[filterKey]
    }

    updateFilters(newFilters)
  }

  const handleClearAll = () => {
    setMinPrice('')
    setMaxPrice('')
    setStartDate('')
    setEndDate('')
    router.push(pathname)
  }

  const handlePriceApply = () => {
    let min = minPrice ? parseFloat(minPrice) : undefined
    let max = maxPrice ? parseFloat(maxPrice) : undefined

    // Validation: ensure min <= max, swap if reversed
    if (min !== undefined && max !== undefined && min > max) {
      ;[min, max] = [max, min]
      setMinPrice(min.toString())
      setMaxPrice(max.toString())
    }

    // Validation: ensure non-negative values
    if (min !== undefined && min < 0) min = 0
    if (max !== undefined && max < 0) max = 0

    updateFilters({ min_price: min, max_price: max })
    setIsPriceOpen(false)
  }

  const handleDateApply = () => {
    updateFilters({ start_date: startDate || undefined, end_date: endDate || undefined })
    setIsDateOpen(false)
  }

  const sortOptions: FilterOption[] = [
    { value: 'date_asc', label: 'Data crescente' },
    { value: 'date_desc', label: 'Data decrescente' },
    { value: 'price_asc', label: 'Preço crescente' },
    { value: 'price_desc', label: 'Preço decrescente' },
    { value: 'title_asc', label: 'Nome A-Z' },
  ]

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Date Filter */}
        <div className="relative inline-block">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-lg border bg-white font-inter text-sm transition-all hover:border-neutral-300 hover:shadow-custom-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500">Data:</span>
              <span className={startDate || endDate ? 'font-medium text-primary' : 'font-medium text-neutral-600'}>
                {startDate || endDate ? 'Selecionado' : 'Todas'}
              </span>
            </span>
          </button>

          {isDateOpen && (
            <div className="absolute top-full mt-2 min-w-[280px] bg-white rounded-lg shadow-custom-lg border border-neutral-200 z-50 p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                      updateFilters({ start_date: undefined, end_date: undefined })
                      setIsDateOpen(false)
                    }}
                    className="flex-1 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleDateApply}
                    className="flex-1 px-3 py-1.5 text-xs text-white bg-gradient-primary rounded-lg font-medium"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location (City) Filter */}
        <FilterButton
          label="Cidade"
          options={filterOptions.cities}
          value={filters.city}
          onChange={(value) => updateFilters({ city: value as string })}
          placeholder="Todas"
          showCount
        />

        {/* Price Filter */}
        <div className="relative inline-block">
          <button
            onClick={() => setIsPriceOpen(!isPriceOpen)}
            className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-lg border bg-white font-inter text-sm transition-all hover:border-neutral-300 hover:shadow-custom-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500">Preço:</span>
              <span className={minPrice || maxPrice ? 'font-medium text-primary' : 'font-medium text-neutral-600'}>
                {minPrice || maxPrice ? 'Selecionado' : 'Todos'}
              </span>
            </span>
          </button>

          {isPriceOpen && (
            <div className="absolute top-full mt-2 min-w-[280px] bg-white rounded-lg shadow-custom-lg border border-neutral-200 z-50 p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Preço mínimo (R$)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="10"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Preço máximo (R$)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="1000"
                    min="0"
                    step="10"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setMinPrice('')
                      setMaxPrice('')
                      updateFilters({ min_price: undefined, max_price: undefined })
                      setIsPriceOpen(false)
                    }}
                    className="flex-1 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handlePriceApply}
                    className="flex-1 px-3 py-1.5 text-xs text-white bg-gradient-primary rounded-lg font-medium"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category (Sport Type) Filter */}
        <FilterButton
          label="Categoria"
          options={filterOptions.sportTypes}
          value={filters.sport_type}
          onChange={(value) => updateFilters({ sport_type: value as SportType | undefined })}
          placeholder="Todas"
          showCount
        />

        {/* Sort - aligned to the right */}
        <div className="ml-auto">
          <FilterButton
            label="Ordenar"
            options={sortOptions}
            value={filters.sort || 'date_asc'}
            onChange={(value) => updateFilters({ sort: value as SortOption })}
            placeholder="Data crescente"
          />
        </div>
      </div>

      {/* Active Filters Pills */}
      <ActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />
    </div>
  )
}
