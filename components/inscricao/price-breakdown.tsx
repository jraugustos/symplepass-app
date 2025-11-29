'use client'

import { formatCurrency } from '@/lib/utils'

interface PriceBreakdownProps {
  subtotal: number
  serviceFee: number
  total: number
}

export function PriceBreakdown({ subtotal, serviceFee, total }: PriceBreakdownProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-0 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-neutral-700 font-geist">Subtotal</span>
        <span className="text-sm font-medium font-geist text-neutral-900">{formatCurrency(subtotal)}</span>
      </div>
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-t border-neutral-200">
        <span className="text-sm text-neutral-700 font-geist">Taxa de serviço</span>
        <span className="text-sm font-medium font-geist text-neutral-900">{formatCurrency(serviceFee)}</span>
      </div>
      <div className="h-px bg-neutral-200" />
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between">
        <span className="text-base sm:text-lg font-semibold tracking-tight font-geist text-neutral-900">Total a pagar</span>
        <span className="text-base sm:text-lg font-semibold tracking-tight font-geist text-neutral-900">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
