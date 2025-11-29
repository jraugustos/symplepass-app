'use client'

import { Search, Frown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters?: () => void
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  const router = useRouter()

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters()
    } else {
      // Default behavior: navigate to base path to clear all filters
      router.push('/eventos')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        {hasFilters ? (
          <Search className="w-8 h-8 text-neutral-400" />
        ) : (
          <Frown className="w-8 h-8 text-neutral-400" />
        )}
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 mb-2 font-geist">
        Nenhum evento encontrado
      </h3>

      {hasFilters ? (
        <>
          <p className="text-sm text-neutral-600 mb-6 max-w-md">
            Nenhum evento corresponde aos filtros selecionados. Tente ajustar os filtros ou
            limpar todos para ver mais eventos.
          </p>
          <Button variant="primary" onClick={handleClearFilters}>
            Limpar filtros e tentar novamente
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-600 mb-6 max-w-md">
            Não há eventos disponíveis no momento. Volte em breve para conferir novos eventos!
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Voltar para a página inicial
          </Button>
        </>
      )}
    </div>
  )
}
