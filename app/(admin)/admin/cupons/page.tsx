import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllCoupons } from '@/lib/data/admin-coupons'
import { CouponsPageClient } from '@/components/admin/coupons-page-client'

export const metadata = {
  title: 'Cupons - Admin Symplepass',
}

interface SearchParams {
  status?: 'active' | 'expired' | 'disabled'
  search?: string
  page?: string
}

export default async function CuponsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const filters = {
    status: searchParams.status,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 50,
  }

  const { coupons, total } = await getAllCoupons(filters)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Cupons</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cupons de Desconto</h1>
          <p className="text-neutral-600 mt-1">
            Gerencie cupons promocionais ({total} total)
          </p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <CouponsPageClient coupons={coupons} />
      </div>
    </div>
  )
}
