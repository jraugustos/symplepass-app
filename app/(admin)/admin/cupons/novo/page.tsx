import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllEventsForAdmin } from '@/lib/data/admin-events'
import { CreateCouponClient } from '@/components/admin/create-coupon-client'

export const metadata = {
  title: 'Novo Cupom - Admin Symplepass',
}

export default async function NovoCupomPage() {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
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
        <span className="text-neutral-900 font-medium">Novo Cupom</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Criar Novo Cupom</h1>
        <p className="text-neutral-600 mt-1">Preencha os detalhes do cupom</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <CreateCouponClient events={events} userId={result.user.id} />
      </div>
    </div>
  )
}
