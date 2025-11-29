'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildQueryString, parseFiltersFromSearchParams } from '@/lib/utils'

interface LoadMoreButtonProps {
  currentPage: number
  hasMore: boolean
  totalEvents: number
  currentCount: number
}

export function LoadMoreButton({
  currentPage,
  hasMore,
  totalEvents,
  currentCount,
}: LoadMoreButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  if (!hasMore) {
    return null
  }

  const handleLoadMore = () => {
    setIsLoading(true)

    const currentFilters = parseFiltersFromSearchParams(
      Object.fromEntries(searchParams.entries())
    )

    const newFilters = {
      ...currentFilters,
      page: currentPage + 1,
    }

    const queryString = buildQueryString(newFilters)
    router.push(`${pathname}${queryString}`)

    // Reset loading state after navigation (simulated)
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      <Button
        variant="outline"
        size="lg"
        onClick={handleLoadMore}
        disabled={isLoading}
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            Carregar mais eventos
            <ChevronDown className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-sm text-neutral-500">
        Exibindo {currentCount} de {totalEvents} eventos
      </p>
    </div>
  )
}
