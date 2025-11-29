'use client'

import { useRouter } from 'next/navigation'
import { CouponForm } from './coupon-form'
import { CouponFormData, Coupon } from '@/types'

interface EditCouponClientProps {
  coupon: Coupon
  events: Array<{ id: string; title: string }>
}

export function EditCouponClient({ coupon, events }: EditCouponClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: CouponFormData) => {
    const response = await fetch('/api/admin/coupons', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: coupon.id, ...data }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to update coupon')
    }

    router.push('/admin/cupons')
    router.refresh()
  }

  const handleCancel = () => {
    router.push('/admin/cupons')
  }

  const initialData: Partial<CouponFormData> = {
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    event_id: coupon.event_id,
    valid_from: coupon.valid_from.substring(0, 16),
    valid_until: coupon.valid_until.substring(0, 16),
    max_uses: coupon.max_uses,
    status: coupon.status,
  }

  return (
    <CouponForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      events={events}
    />
  )
}
