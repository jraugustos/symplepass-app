import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Image, Package, ShoppingCart, DollarSign, ClipboardList } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getEventByIdForAdmin } from '@/lib/data/admin-events'
import {
  getPhotosByEventId,
  getPhotoPackagesByEventId,
  getPhotoOrdersByEventId,
  getPhotoOrderStats,
} from '@/lib/data/admin-photos'
import { EventPhotosManagement } from '@/components/admin/event-photos-management'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  createPhotoAction,
  deletePhotoAction,
  reorderPhotosAction,
  createPhotoPackageAction,
  updatePhotoPackageAction,
  deletePhotoPackageAction,
  reorderPhotoPackagesAction,
  filterPhotoOrdersAction,
  exportPhotoOrdersAction,
} from '@/app/actions/admin-photos'
import type { PhotoOrderFilters } from '@/lib/data/admin-photos'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await getEventByIdForAdmin(params.id)

  return {
    title: event
      ? `Fotos ${event.title} - Admin Symplepass`
      : 'Fotos - Admin Symplepass',
  }
}

export default async function FotosEventoPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const event = await getEventByIdForAdmin(params.id)

  if (!event) {
    notFound()
  }

  // Fetch photos, packages, and orders in parallel
  const [photos, packages, orders, stats] = await Promise.all([
    getPhotosByEventId(params.id),
    getPhotoPackagesByEventId(params.id),
    getPhotoOrdersByEventId(params.id),
    getPhotoOrderStats(params.id),
  ])

  // Bind server actions with eventId
  const boundCreatePhoto = createPhotoAction.bind(null, params.id)
  const boundDeletePhoto = deletePhotoAction.bind(null, params.id)
  const boundReorderPhotos = reorderPhotosAction.bind(null, params.id)
  const boundCreatePackage = createPhotoPackageAction.bind(null, params.id)
  const boundUpdatePackage = updatePhotoPackageAction.bind(null, params.id)
  const boundDeletePackage = deletePhotoPackageAction.bind(null, params.id)
  const boundReorderPackages = reorderPhotoPackagesAction.bind(null, params.id)
  const boundFilterOrders = filterPhotoOrdersAction.bind(null, params.id)
  const boundExportOrders = exportPhotoOrdersAction.bind(null, params.id)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/eventos" className="hover:text-neutral-900">
          Eventos
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/eventos/${params.id}/editar`} className="hover:text-neutral-900">
          {event.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Fotos</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Fotos: {event.title}</h1>
        <p className="text-neutral-600 mt-1">
          Gerencie as fotos do evento e configure pacotes de venda
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Image className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total de Fotos</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {photos.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Pacotes</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {packages.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.totalOrders}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Pedidos Pagos</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.paidOrders}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Receita Paga</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(stats.paidRevenue)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Event Status Warning */}
      {event.status !== 'completed' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atenção:</strong> O upload de fotos é recomendado após o evento ser encerrado.
            O status atual do evento é: <strong>{event.status}</strong>
          </p>
        </div>
      )}

      {/* Photos Management */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <EventPhotosManagement
          eventId={params.id}
          photos={photos}
          packages={packages}
          orders={orders}
          totalOrders={stats?.totalOrders || orders.length}
          onPhotoCreate={boundCreatePhoto}
          onPhotoDelete={boundDeletePhoto}
          onPhotosReorder={boundReorderPhotos}
          onPackageCreate={boundCreatePackage}
          onPackageUpdate={boundUpdatePackage}
          onPackageDelete={boundDeletePackage}
          onPackagesReorder={boundReorderPackages}
          onFilterOrders={boundFilterOrders}
          onExportOrders={boundExportOrders}
        />
      </div>
    </div>
  )
}
