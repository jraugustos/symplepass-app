import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getCouponById } from '@/lib/data/admin-coupons'
import { getAllEventsForAdmin } from '@/lib/data/admin-events'
import { EditCouponClient } from '@/components/admin/edit-coupon-client'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { coupon } = await getCouponById(params.id)

  return {
    title: coupon
      ? `Editar ${coupon.code} - Cupons - Admin Symplepass`
      : 'Editar Cupom - Admin Symplepass',
  }
}

export default async function EditarCupomPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const { coupon, error } = await getCouponById(params.id)

  if (!coupon || error) {
    notFound()
  }

  const { events } = await getAllEventsForAdmin({ pageSize: 1000 })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/cupons" className="hover:text-neutral-900">
          Cupons
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Editar {coupon.code}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Editar Cupom: {coupon.code}</h1>
        <p className="text-neutral-600 mt-1">Atualize os detalhes do cupom</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <EditCouponClient coupon={coupon} events={events} />
      </div>
    </div>
  )
}
