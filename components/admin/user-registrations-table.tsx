'use client'

import { Badge } from '@/components/ui/badge'
import { RegistrationWithDetails, PaymentStatus, RegistrationStatus } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

interface UserRegistrationsTableProps {
  registrations: RegistrationWithDetails[]
}

export function UserRegistrationsTable({ registrations }: UserRegistrationsTableProps) {
  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      case 'refunded':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'refunded':
        return 'Reembolsado'
      default:
        return status
    }
  }

  const getRegistrationStatusBadgeVariant = (status: RegistrationStatus) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getRegistrationStatusLabel = (status: RegistrationStatus) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'pending':
        return 'Pendente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        Nenhuma inscrição encontrada
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Data do Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status Inscrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status Pagamento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {registrations.map((registration) => (
              <tr key={registration.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-medium text-neutral-900">
                    {registration.events?.title || 'N/A'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {registration.events?.sport_type || ''}
                  </p>
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {registration.event_categories?.name || 'N/A'}
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {registration.events?.start_date
                    ? formatDate(registration.events.start_date)
                    : 'N/A'}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getRegistrationStatusBadgeVariant(registration.status)}>
                    {getRegistrationStatusLabel(registration.status)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getPaymentStatusBadgeVariant(registration.payment_status)}>
                    {getPaymentStatusLabel(registration.payment_status)}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                  {formatCurrency(registration.event_categories?.price || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {registrations.map((registration) => (
          <div key={registration.id} className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-1">
              {registration.events?.title || 'N/A'}
            </h3>
            <p className="text-sm text-neutral-500 mb-3">
              {registration.event_categories?.name || 'N/A'} •{' '}
              {registration.events?.start_date
                ? formatDate(registration.events.start_date)
                : 'N/A'}
            </p>
            <div className="flex gap-2 mb-3">
              <Badge variant={getRegistrationStatusBadgeVariant(registration.status)}>
                {getRegistrationStatusLabel(registration.status)}
              </Badge>
              <Badge variant={getPaymentStatusBadgeVariant(registration.payment_status)}>
                {getPaymentStatusLabel(registration.payment_status)}
              </Badge>
            </div>
            <p className="text-lg font-bold text-neutral-900">
              {formatCurrency(registration.event_categories?.price || 0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
