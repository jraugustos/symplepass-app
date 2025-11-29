'use client'

import { useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ShirtGender, ShirtSizesByGender } from '@/types'
import { GENDER_LABELS, DEFAULT_SHIRT_SIZES_BY_GENDER } from '@/lib/constants/shirt-sizes'
import { cn } from '@/lib/utils'

interface ShirtSizesConfigProps {
  config: ShirtSizesByGender | null
  onChange: (config: ShirtSizesByGender) => void
  error?: string
}

export function ShirtSizesConfig({ config, onChange, error }: ShirtSizesConfigProps) {
  const [selectedGender, setSelectedGender] = useState<ShirtGender>('masculino')
  const [newSize, setNewSize] = useState('')
  const [sizeError, setSizeError] = useState<string | null>(null)

  // Initialize config with defaults if null
  const currentConfig: ShirtSizesByGender = config || {
    masculino: [...DEFAULT_SHIRT_SIZES_BY_GENDER.masculino],
    feminino: [...DEFAULT_SHIRT_SIZES_BY_GENDER.feminino],
    infantil: [...DEFAULT_SHIRT_SIZES_BY_GENDER.infantil],
  }

  const currentSizes = currentConfig[selectedGender] || []

  const handleAddSize = () => {
    const trimmedSize = newSize.trim().toUpperCase()
    if (!trimmedSize) return

    if (currentSizes.includes(trimmedSize)) {
      setSizeError('Este tamanho já existe')
      return
    }

    const updatedConfig = {
      ...currentConfig,
      [selectedGender]: [...currentSizes, trimmedSize],
    }

    onChange(updatedConfig)
    setNewSize('')
    setSizeError(null)
  }

  const handleRemoveSize = (index: number) => {
    const updatedSizes = currentSizes.filter((_, i) => i !== index)
    const updatedConfig = {
      ...currentConfig,
      [selectedGender]: updatedSizes,
    }
    onChange(updatedConfig)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updatedSizes = [...currentSizes]
    ;[updatedSizes[index - 1], updatedSizes[index]] = [
      updatedSizes[index],
      updatedSizes[index - 1],
    ]
    const updatedConfig = {
      ...currentConfig,
      [selectedGender]: updatedSizes,
    }
    onChange(updatedConfig)
  }

  const handleMoveDown = (index: number) => {
    if (index === currentSizes.length - 1) return
    const updatedSizes = [...currentSizes]
    ;[updatedSizes[index], updatedSizes[index + 1]] = [
      updatedSizes[index + 1],
      updatedSizes[index],
    ]
    const updatedConfig = {
      ...currentConfig,
      [selectedGender]: updatedSizes,
    }
    onChange(updatedConfig)
  }

  const handleResetToDefaults = () => {
    const updatedConfig = {
      ...currentConfig,
      [selectedGender]: [...DEFAULT_SHIRT_SIZES_BY_GENDER[selectedGender]],
    }
    onChange(updatedConfig)
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Tamanhos de Camiseta por Gênero</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Configure os tamanhos disponíveis para cada gênero. A ordem será mantida na seleção.
      </p>

      {/* Gender Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Selecione o gênero
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GENDER_LABELS) as ShirtGender[]).map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() => setSelectedGender(gender)}
              className={cn(
                'py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all',
                selectedGender === gender
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-900'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
              )}
            >
              {GENDER_LABELS[gender]}
            </button>
          ))}
        </div>
      </div>

      {/* Add new size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Adicionar tamanho para {GENDER_LABELS[selectedGender].toLowerCase()}
        </label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ex: PP, XGG, 2, 4, 6"
            value={newSize}
            onChange={(e) => {
              setNewSize(e.target.value)
              setSizeError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddSize()
              }
            }}
            className="flex-1"
          />
          <Button type="button" onClick={handleAddSize} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
        {sizeError && <p className="text-sm text-red-600 mt-1">{sizeError}</p>}
      </div>

      {/* Display current sizes */}
      {currentSizes.length > 0 ? (
        <div className="space-y-2 mb-4">
          {currentSizes.map((size, index) => (
            <div
              key={`${selectedGender}-${size}-${index}`}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
            >
              <span className="font-medium">{size}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === currentSizes.length - 1}
                  className="p-1 rounded hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSize(index)}
                  className="p-1 rounded hover:bg-red-100 text-red-600"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 mb-4">
          Nenhum tamanho configurado para {GENDER_LABELS[selectedGender].toLowerCase()}.
        </p>
      )}

      {/* Reset button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleResetToDefaults}
        className="text-cyan-600 hover:text-cyan-700"
      >
        Restaurar tamanhos padrão para {GENDER_LABELS[selectedGender].toLowerCase()}
      </Button>

      {/* Summary of all genders */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <p className="text-sm font-medium text-neutral-700 mb-3">Resumo de todos os gêneros:</p>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(GENDER_LABELS) as ShirtGender[]).map((gender) => (
            <div key={gender} className="bg-neutral-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-neutral-600 mb-2">
                {GENDER_LABELS[gender]}
              </p>
              <div className="flex flex-wrap gap-1">
                {currentConfig[gender]?.length > 0 ? (
                  currentConfig[gender].map((size, idx) => (
                    <span
                      key={`${gender}-summary-${idx}`}
                      className="inline-block px-2 py-1 text-xs font-medium bg-white border border-neutral-200 rounded"
                    >
                      {size}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400">Nenhum tamanho</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
    </Card>
  )
}
