'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SPORT_CATEGORIES, getSportLabel, type SportCategoryKey } from '@/lib/constants/sports'
import type { SportType, UserPreferences } from '@/types'

const STORAGE_KEY = 'symplepass-preferences'

type PreferencesTabProps = {
  preferences: UserPreferences
  onUpdate: (favorite_sports: SportType[]) => Promise<{ error?: string }> | void
}

export function PreferencesTab({ preferences, onUpdate }: PreferencesTabProps) {
  const [selectedSports, setSelectedSports] = useState<SportType[]>(preferences.favorite_sports || [])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'success' | 'error'>('success')
  const [isSaving, setIsSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<SportCategoryKey>>(new Set())

  useEffect(() => {
    if (preferences.favorite_sports?.length) {
      setSelectedSports(preferences.favorite_sports)
    } else if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setSelectedSports(JSON.parse(stored))
        } catch {
          // ignore parse error
        }
      }
    }
  }, [preferences.favorite_sports])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSports))
    }
  }, [selectedSports])

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport as SportType)
        ? prev.filter((item) => item !== sport)
        : [...prev, sport as SportType]
    )
  }

  const toggleCategory = (categoryKey: SportCategoryKey) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey)
      } else {
        newSet.add(categoryKey)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatusMessage(null)
    const result = await onUpdate(selectedSports)
    if (result && 'error' in result && result.error) {
      setStatusMessage(result.error)
      setStatusType('error')
    } else {
      setStatusMessage('Preferências salvas com sucesso!')
      setStatusType('success')
    }
    setIsSaving(false)
  }

  const getSelectedCountForCategory = (categoryKey: SportCategoryKey): number => {
    const category = SPORT_CATEGORIES[categoryKey]
    return category.items.filter((item) => selectedSports.includes(item.value as SportType)).length
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Preferências esportivas
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900">Monte sua jornada ideal</h2>
        <p className="text-sm text-neutral-500">
          Sua seleção nos ajuda a recomendar eventos com distâncias, terrenos e experiências alinhadas
          ao seu estilo.
        </p>
      </div>

      <div className="space-y-3">
        {(Object.entries(SPORT_CATEGORIES) as [SportCategoryKey, typeof SPORT_CATEGORIES[SportCategoryKey]][]).map(
          ([categoryKey, category]) => {
            const isExpanded = expandedCategories.has(categoryKey)
            const selectedCount = getSelectedCountForCategory(categoryKey)

            return (
              <div
                key={categoryKey}
                className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryKey)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-neutral-900">
                      {category.label}
                    </span>
                    {selectedCount > 0 && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-neutral-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-neutral-50 p-4">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {category.items.map((item) => {
                        const isSelected = selectedSports.includes(item.value as SportType)
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleSport(item.value)}
                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                              isSelected
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : 'border-neutral-300'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <span
                              className={`text-sm ${
                                isSelected ? 'font-medium text-neutral-900' : 'text-neutral-700'
                              }`}
                            >
                              {item.label}
                            </span>
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

      {selectedSports.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Seus esportes ({selectedSports.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSports.map((sport) => {
              const sportLabel = getSportLabel(sport) || sport

              return (
                <span
                  key={sport}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
                >
                  {sportLabel}
                  <button
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className="ml-1 rounded-full hover:bg-orange-200 p-0.5"
                    aria-label={`Remover ${sportLabel}`}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            statusType === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p>
          Suas preferências atualizam recomendações de eventos, newsletter e alertas de inscrição
        </p>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          className="rounded-xl px-6 py-2"
        >
          Salvar preferências
        </Button>
      </div>
    </div>
  )
}

export default PreferencesTab
