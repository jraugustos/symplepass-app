'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Bike,
  Flame,
  Footprints,
  HeartPulse,
  Mountain,
  Waves,
  Wind,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SportType, UserPreferences } from '@/types'

const STORAGE_KEY = 'symplepass-preferences'

const SPORT_OPTIONS: { id: SportType; label: string; description: string; icon: React.ReactNode }[] =
  [
    { id: 'corrida', label: 'Corrida de rua', description: '5k a maratonas', icon: <Activity /> },
    { id: 'triatlo', label: 'Triathlon', description: 'Swim, bike, run', icon: <HeartPulse /> },
    { id: 'ciclismo', label: 'Ciclismo', description: 'Estrada e speed', icon: <Bike /> },
    { id: 'natacao', label: 'Natação', description: 'Águas abertas', icon: <Waves /> },
    { id: 'caminhada', label: 'Caminhada', description: 'Experiências leves', icon: <Footprints /> },
    { id: 'crossfit', label: 'Crossfit', description: 'Força e condicionamento', icon: <Flame /> },
    { id: 'beach_sports', label: 'Beach Sports', description: 'Beach run, tenis', icon: <Wind /> },
    { id: 'trail_running', label: 'Trail Running', description: 'Montanha & trilhas', icon: <Mountain /> },
  ]

type PreferencesTabProps = {
  preferences: UserPreferences
  onUpdate: (favorite_sports: SportType[]) => Promise<{ error?: string }> | void
}

export function PreferencesTab({ preferences, onUpdate }: PreferencesTabProps) {
  const [selectedSports, setSelectedSports] = useState<SportType[]>(preferences.favorite_sports || [])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const toggleSport = (sport: SportType) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((item) => item !== sport) : [...prev, sport]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatusMessage(null)
    const result = await onUpdate(selectedSports)
    if (result && 'error' in result && result.error) {
      setStatusMessage(result.error)
    } else {
      setStatusMessage('Preferências salvas com sucesso!')
    }
    setIsSaving(false)
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

      <div className="grid gap-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)] md:grid-cols-2 lg:grid-cols-3">
        {SPORT_OPTIONS.map((option) => {
          const isSelected = selectedSports.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleSport(option.id)}
              className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-orange-400 bg-orange-50 shadow-[0_20px_40px_rgba(251,146,60,0.25)]'
                  : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/70 p-2 text-neutral-700">{option.icon}</div>
                <span
                  className={`h-3 w-3 rounded-full border ${
                    isSelected ? 'border-orange-500 bg-orange-500' : 'border-neutral-300'
                  }`}
                />
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-900">{option.label}</p>
                <p className="text-xs text-neutral-500">{option.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
