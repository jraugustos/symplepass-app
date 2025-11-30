'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPORT_CATEGORIES, type SportCategoryKey } from '@/lib/constants/sports'

interface SportInterestsSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  maxSelections?: number
  disabled?: boolean
  error?: string
}

export function SportInterestsSelector({
  value = [],
  onChange,
  maxSelections,
  disabled = false,
  error,
}: SportInterestsSelectorProps) {
  const handleToggle = (sportValue: string) => {
    if (disabled) return

    if (value.includes(sportValue)) {
      onChange(value.filter((v) => v !== sportValue))
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return
      }
      onChange([...value, sportValue])
    }
  }

  const handleSelectCategory = (categoryKey: SportCategoryKey) => {
    if (disabled) return

    const category = SPORT_CATEGORIES[categoryKey]
    const categoryValues: string[] = category.items.map((item) => item.value)
    const allSelected = categoryValues.every((v) => value.includes(v))

    if (allSelected) {
      onChange(value.filter((v) => !categoryValues.includes(v)))
    } else {
      const newValues = [...new Set([...value, ...categoryValues])]
      if (maxSelections && newValues.length > maxSelections) {
        return
      }
      onChange(newValues)
    }
  }

  return (
    <div className="space-y-4">
      {maxSelections && (
        <p className="text-sm text-neutral-500">
          Selecione até {maxSelections} esportes ({value.length}/{maxSelections})
        </p>
      )}

      <div className="space-y-6">
        {(Object.entries(SPORT_CATEGORIES) as [SportCategoryKey, typeof SPORT_CATEGORIES[SportCategoryKey]][]).map(
          ([categoryKey, category]) => {
            const categoryValues = category.items.map((item) => item.value)
            const selectedCount = categoryValues.filter((v) => value.includes(v)).length
            const allSelected = selectedCount === categoryValues.length

            return (
              <div key={categoryKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-neutral-700">{category.label}</h4>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(categoryKey)}
                    disabled={disabled}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full transition-colors',
                      allSelected
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.items.map((sport) => {
                    const isSelected = value.includes(sport.value)
                    const isDisabled =
                      disabled || (!isSelected && maxSelections !== undefined && value.length >= maxSelections)

                    return (
                      <button
                        key={sport.value}
                        type="button"
                        onClick={() => handleToggle(sport.value)}
                        disabled={isDisabled}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                          isSelected
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                          isDisabled && !isSelected && 'opacity-50 cursor-not-allowed',
                          !isDisabled && 'hover:scale-105'
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {sport.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          }
        )}
      </div>

      {error && <p className="text-sm text-error mt-2">{error}</p>}
    </div>
  )
}

// Compact version for inline use (e.g., in modals)
interface SportInterestsCompactProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function SportInterestsCompact({ value = [], onChange, disabled = false }: SportInterestsCompactProps) {
  const [expandedCategory, setExpandedCategory] = React.useState<SportCategoryKey | null>(null)

  const handleToggle = (sportValue: string) => {
    if (disabled) return

    if (value.includes(sportValue)) {
      onChange(value.filter((v) => v !== sportValue))
    } else {
      onChange([...value, sportValue])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(Object.entries(SPORT_CATEGORIES) as [SportCategoryKey, typeof SPORT_CATEGORIES[SportCategoryKey]][]).map(
          ([categoryKey, category]) => {
            const selectedCount = category.items.filter((item) => value.includes(item.value)).length
            const isExpanded = expandedCategory === categoryKey

            return (
              <div key={categoryKey} className="relative">
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                    selectedCount > 0
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300',
                    isExpanded && 'ring-2 ring-primary-200'
                  )}
                >
                  {category.label}
                  {selectedCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px]">
                      {selectedCount}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 min-w-[200px] max-w-[300px]">
                    <div className="flex flex-wrap gap-1.5">
                      {category.items.map((sport) => {
                        const isSelected = value.includes(sport.value)

                        return (
                          <button
                            key={sport.value}
                            type="button"
                            onClick={() => handleToggle(sport.value)}
                            disabled={disabled}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
                              isSelected
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {sport.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          }
        )}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-neutral-500">{value.length} esporte(s) selecionado(s)</p>
      )}
    </div>
  )
}
