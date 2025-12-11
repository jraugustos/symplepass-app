import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllPhotoOrders, getAllPhotoOrderStats } from '@/lib/data/admin-photos'
import { AllPhotoOrdersClient } from '@/components/admin/all-photo-orders-client'
import { formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Pedidos de Fotos - Admin Symplepass',
}

interface SearchParams {
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  search?: string
  start_date?: string
  end_date?: string
  page?: string
}

export default async function PedidosFotosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const filters = {
    payment_status: searchParams.payment_status,
    search: searchParams.search,
    start_date: searchParams.start_date,
    end_date: searchParams.end_date,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 20,
  }

  const [ordersResult, stats] = await Promise.all([
    getAllPhotoOrders(filters),
    getAllPhotoOrderStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Pedidos de Fotos</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pedidos de Fotos</h1>
          <p className="text-neutral-600 mt-1">
            Gerencie todos os pedidos de fotos ({ordersResult.total} total)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-sm text-neutral-600">Total de Pedidos</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-sm text-neutral-600">Pedidos Pagos</p>
            <p className="text-2xl font-bold text-green-600">{stats.paidOrders}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-sm text-neutral-600">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-sm text-neutral-600">Receita Total</p>
            <p className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.paidRevenue)}</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <AllPhotoOrdersClient
          orders={ordersResult.orders}
          totalOrders={ordersResult.total}
          currentPage={ordersResult.page}
          pageSize={ordersResult.pageSize}
          initialFilters={filters}
        />
      </div>
    </div>
  )
}
