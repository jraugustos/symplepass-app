'use client'

import { useRouter } from 'next/navigation'
import { CouponForm } from './coupon-form'
import { CouponFormData } from '@/types'

interface CreateCouponClientProps {
  events: Array<{ id: string; title: string }>
  userId: string
}

export function CreateCouponClient({ events, userId }: CreateCouponClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: CouponFormData) => {
    const response = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to create coupon')
    }

    router.push('/admin/cupons')
    router.refresh()
  }

  const handleCancel = () => {
    router.push('/admin/cupons')
  }

  return <CouponForm onSubmit={handleSubmit} onCancel={handleCancel} events={events} />
}
