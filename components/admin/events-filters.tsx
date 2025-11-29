'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EventStatus, SportType } from '@/types/database.types'

interface EventsFiltersProps {
  initialSearch?: string
  initialStatus?: EventStatus
  initialSportType?: SportType
}

export function EventsFilters({
  initialSearch,
  initialStatus,
  initialSportType,
}: EventsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()

    const search = formData.get('search') as string
    const status = formData.get('status') as string
    const sportType = formData.get('sport_type') as string

    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (sportType) params.set('sport_type', sportType)

    router.push(`/admin/eventos?${params.toString()}`)
  }

  const handleClear = () => {
    router.push('/admin/eventos')
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <Input
          name="search"
          placeholder="Buscar eventos..."
          defaultValue={initialSearch}
          className="flex-1"
        />
        <Select name="status" defaultValue={initialStatus || ''}>
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="cancelled">Cancelado</option>
          <option value="completed">Concluído</option>
        </Select>
        <Select name="sport_type" defaultValue={initialSportType || ''}>
          <option value="">Todos os esportes</option>
          <option value="corrida">Corrida</option>
          <option value="ciclismo">Ciclismo</option>
          <option value="triatlo">Triatlo</option>
          <option value="natacao">Natação</option>
          <option value="caminhada">Caminhada</option>
          <option value="crossfit">CrossFit</option>
          <option value="beach_sports">Beach Sports</option>
          <option value="trail_running">Trail Running</option>
          <option value="outro">Outro</option>
        </Select>
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="ghost" onClick={handleClear}>
          Limpar
        </Button>
      </form>
    </div>
  )
}
