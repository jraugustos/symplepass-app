'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface EventsPaginationProps {
  currentPage: number
  totalPages: number
}

export function EventsPagination({
  currentPage,
  totalPages,
}: EventsPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`/admin/eventos?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        disabled={currentPage <= 1}
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
      >
        Anterior
      </Button>
      <span className="flex items-center px-4 text-sm text-neutral-600">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
      >
        Próxima
      </Button>
    </div>
  )
}
