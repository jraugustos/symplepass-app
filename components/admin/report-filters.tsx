'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { ReportFilters as ReportFiltersType, SportType, PaymentStatus } from '@/types'

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFiltersType) => void
  events?: Array<{ id: string; title: string }>
}

export function ReportFilters({ onFilterChange, events = [] }: ReportFiltersProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [eventId, setEventId] = useState('')
  const [sportType, setSportType] = useState<SportType | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')

  const handleApplyFilters = () => {
    onFilterChange({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      event_id: eventId || undefined,
      sport_type: sportType || undefined,
      payment_status: paymentStatus || undefined,
    })
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setEventId('')
    setSportType('')
    setPaymentStatus('')
    onFilterChange({})
  }

  return (
    <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <h3 className="font-semibold text-neutral-900">Filtros</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Data Início
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Data Fim
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {events.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Evento
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os eventos</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Esporte
          </label>
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value as SportType | '')}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
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
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Status Pagamento
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | '')}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhou</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          <Search className="h-4 w-4 mr-2" />
          Aplicar Filtros
        </Button>
        <Button onClick={handleClearFilters} variant="outline" size="sm">
          Limpar Filtros
        </Button>
      </div>
    </div>
  )
}
