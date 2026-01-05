'use client'

import { formatCurrency } from '@/lib/utils'

interface PriceBreakdownProps {
  subtotal: number
  /** Club discount (non-cumulative with coupon - only one should be passed) */
  clubDiscount?: number
  /** Coupon discount (non-cumulative with club - only one should be passed) */
  couponDiscount?: number
  serviceFee: number
  total: number
}

/**
 * Price breakdown component that displays the applied discount.
 * Note: Club and coupon discounts are non-cumulative.
 * The caller should only pass one of clubDiscount or couponDiscount,
 * representing the greater discount that was applied.
 */
export function PriceBreakdown({ subtotal, clubDiscount, couponDiscount, serviceFee, total }: PriceBreakdownProps) {
  const hasClubDiscount = clubDiscount && clubDiscount > 0
  const hasCouponDiscount = couponDiscount && couponDiscount > 0

  // Only display one discount row (the applied discount)
  // Due to non-cumulative policy, only one should be provided at a time
  const showClubDiscount = hasClubDiscount && !hasCouponDiscount
  const showCouponDiscount = hasCouponDiscount && !hasClubDiscount

  // If both are somehow passed, show the greater one (defensive)
  const showClubOverCoupon = hasClubDiscount && hasCouponDiscount && clubDiscount >= couponDiscount
  const showCouponOverClub = hasClubDiscount && hasCouponDiscount && couponDiscount > clubDiscount

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-0 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-neutral-700 font-geist">Subtotal</span>
        <span className="text-sm font-medium font-geist text-neutral-900">{formatCurrency(subtotal)}</span>
      </div>

      {(showClubDiscount || showClubOverCoupon) && (
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-t border-neutral-200 bg-orange-50">
          <span className="text-sm text-orange-700 font-geist">Desconto Clube (10%)</span>
          <span className="text-sm font-medium font-geist text-orange-600">-{formatCurrency(clubDiscount)}</span>
        </div>
      )}

      {(showCouponDiscount || showCouponOverClub) && (
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-t border-neutral-200 bg-green-50">
          <span className="text-sm text-green-700 font-geist">Desconto Cupom</span>
          <span className="text-sm font-medium font-geist text-green-600">-{formatCurrency(couponDiscount)}</span>
        </div>
      )}

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
