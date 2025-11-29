import { BadgeCheck, Calendar, MapPin, CreditCard, Users } from 'lucide-react'
import { formatCurrency, formatCPF, formatPhone } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface RegistrationSummaryProps {
  eventTitle: string
  eventDate: string
  eventLocation: string
  categoryName: string
  amountPaid: number
  paymentStatus: string
  transactionId: string | null
  partnerData?: {
    name: string
    email: string
    cpf: string
    phone: string
    shirtSize: string
  } | null
}

export function RegistrationSummary({
  eventTitle,
  eventDate,
  eventLocation,
  categoryName,
  amountPaid,
  paymentStatus,
  transactionId,
  partnerData,
}: RegistrationSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" data-animate>
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <BadgeCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-emerald-600">Evento confirmado</p>
            <h3 className="text-2xl font-semibold text-slate-900">{eventTitle}</h3>
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p>{categoryName}</p>
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              {eventDate}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              {eventLocation}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-100 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Valor pago</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(amountPaid)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Status</p>
            <Badge variant="success" className="mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
              <CreditCard className="h-3.5 w-3.5" />
              {paymentStatus}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Transação</p>
            <p className="text-sm font-medium text-slate-600 truncate">{transactionId || 'N/D'}</p>
          </div>
        </div>
      </div>

      {partnerData && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-slate-900">Dados do Parceiro(a)</h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Nome</p>
              <p className="text-sm font-medium text-slate-900">{partnerData.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900">{partnerData.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">CPF</p>
              <p className="text-sm font-medium text-slate-900">{formatCPF(partnerData.cpf)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Telefone</p>
              <p className="text-sm font-medium text-slate-900">{formatPhone(partnerData.phone)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Tamanho da camiseta</p>
              <p className="text-sm font-medium text-slate-900">{partnerData.shirtSize}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
