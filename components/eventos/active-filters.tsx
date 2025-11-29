'use client'

import { X } from 'lucide-react'
import { FilterPill } from '@/components/molecules/filter-button'
import { Button } from '@/components/ui/button'
import type { EventsListFilters } from '@/types'
import { formatPriceRange } from '@/lib/utils'

interface ActiveFiltersProps {
  filters: EventsListFilters
  onRemoveFilter: (filterKey: keyof EventsListFilters) => void
  onClearAll: () => void
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters: Array<{ key: keyof EventsListFilters; label: string }> = []

  // Build list of active filters
  if (filters.sport_type) {
    const sportTypeLabels: Record<string, string> = {
      corrida: 'Corrida',
      ciclismo: 'Ciclismo',
      triatlo: 'Triatlo',
      natacao: 'Natação',
      caminhada: 'Caminhada',
      crossfit: 'CrossFit',
      beach_sports: 'Beach Sports',
      trail_running: 'Trail Running',
      beach_tenis: 'Beach Tennis',
      futevolei: 'Futevôlei',
      volei_praia: 'Vôlei de Praia',
      stand_up_paddle: 'Stand Up Paddle',
      outro: 'Outro',
    }
    activeFilters.push({
      key: 'sport_type',
      label: sportTypeLabels[filters.sport_type] || filters.sport_type,
    })
  }

  if (filters.city) {
    activeFilters.push({ key: 'city', label: filters.city })
  }

  if (filters.state) {
    activeFilters.push({ key: 'state', label: filters.state })
  }

  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    const priceLabel = formatPriceRange(filters.min_price, filters.max_price)
    activeFilters.push({ key: 'min_price', label: priceLabel })
  }

  if (filters.start_date || filters.end_date) {
    const dateLabel = filters.start_date && filters.end_date
      ? `${new Date(filters.start_date).toLocaleDateString('pt-BR')} - ${new Date(filters.end_date).toLocaleDateString('pt-BR')}`
      : filters.start_date
      ? `A partir de ${new Date(filters.start_date).toLocaleDateString('pt-BR')}`
      : `Até ${filters.end_date ? new Date(filters.end_date).toLocaleDateString('pt-BR') : ''}`
    activeFilters.push({ key: 'start_date', label: dateLabel })
  }

  if (filters.sort && filters.sort !== 'date_asc') {
    const sortLabels: Record<string, string> = {
      date_asc: 'Data crescente',
      date_desc: 'Data decrescente',
      price_asc: 'Preço crescente',
      price_desc: 'Preço decrescente',
      title_asc: 'Nome A-Z',
    }
    activeFilters.push({
      key: 'sort',
      label: `Ordenar: ${sortLabels[filters.sort] || filters.sort}`,
    })
  }

  // Return null if no active filters
  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs text-neutral-600 font-medium">
        {activeFilters.length} {activeFilters.length === 1 ? 'filtro ativo' : 'filtros ativos'}:
      </span>

      {activeFilters.map((filter) => (
        <FilterPill
          key={filter.key}
          label={filter.label}
          value={filter.key}
          onRemove={() => onRemoveFilter(filter.key)}
        />
      ))}

      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-neutral-600 hover:text-neutral-900"
        >
          <X className="w-3 h-3 mr-1" />
          Limpar todos
        </Button>
      )}
    </div>
  )
}
