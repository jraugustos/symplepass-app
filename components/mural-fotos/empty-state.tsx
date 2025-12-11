'use client'

import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function MuralEmptyState() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Camera className="w-8 h-8 text-neutral-400" />
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 mb-2 font-geist">
        Nenhum evento com fotos disponível
      </h3>

      <p className="text-sm text-neutral-600 mb-6 max-w-md">
        As fotos dos eventos serão disponibilizadas após sua conclusão.
        Enquanto isso, confira os eventos ativos!
      </p>

      <Button variant="primary" onClick={() => router.push('/eventos')}>
        Ver eventos ativos
      </Button>
    </div>
  )
}
