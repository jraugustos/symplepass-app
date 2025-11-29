'use client'

import { Badge } from '@/components/ui/badge'
import { PaymentHistoryItem, PaymentStatus } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

interface UserPaymentHistoryTableProps {
  payments: PaymentHistoryItem[]
}

export function UserPaymentHistoryTable({ payments }: UserPaymentHistoryTableProps) {
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

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        Nenhum pagamento encontrado
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
                Data Pagamento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                ID Transação
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-medium text-neutral-900">{payment.event_title}</p>
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {payment.category_name || 'N/A'}
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {formatDate(payment.payment_date)}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getPaymentStatusBadgeVariant(payment.payment_status)}>
                    {getPaymentStatusLabel(payment.payment_status)}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-4 py-4 text-sm text-neutral-500 font-mono">
                  {payment.stripe_payment_intent_id
                    ? payment.stripe_payment_intent_id.substring(0, 20) + '...'
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-1">{payment.event_title}</h3>
            <p className="text-sm text-neutral-500 mb-3">
              {payment.category_name || 'N/A'} • {formatDate(payment.payment_date)}
            </p>
            <div className="flex items-center justify-between mb-2">
              <Badge variant={getPaymentStatusBadgeVariant(payment.payment_status)}>
                {getPaymentStatusLabel(payment.payment_status)}
              </Badge>
              <p className="text-lg font-bold text-neutral-900">
                {formatCurrency(payment.amount)}
              </p>
            </div>
            {payment.stripe_payment_intent_id && (
              <p className="text-xs text-neutral-400 font-mono truncate">
                ID: {payment.stripe_payment_intent_id}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
