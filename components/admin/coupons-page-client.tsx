'use client'

import { useRouter } from 'next/navigation'
import { CouponsTable } from './coupons-table'
import { CouponWithDetails } from '@/types'

interface CouponsPageClientProps {
  coupons: CouponWithDetails[]
}

export function CouponsPageClient({ coupons }: CouponsPageClientProps) {
  const router = useRouter()

  const handleEditCoupon = (couponId: string) => {
    router.push(`/admin/cupons/${couponId}/editar`)
  }

  const handleDeleteCoupon = async (couponId: string) => {
    const response = await fetch(`/api/admin/coupons/${couponId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete coupon')
    }

    router.refresh()
  }

  const handleCreateCoupon = () => {
    router.push('/admin/cupons/novo')
  }

  const handleFilterChange = (filters: { status?: string; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.set('status', filters.status)
    if (filters.search) queryParams.set('search', filters.search)
    router.push(`/admin/cupons?${queryParams.toString()}`)
  }

  return (
    <CouponsTable
      coupons={coupons}
      onEditCoupon={handleEditCoupon}
      onDeleteCoupon={handleDeleteCoupon}
      onCreateCoupon={handleCreateCoupon}
      onFilterChange={handleFilterChange}
    />
  )
}
