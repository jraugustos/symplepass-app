'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Search, Eye, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PhotoOrderDetailsModal } from './photo-order-details-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PhotoOrderFilters, AdminPhotoOrderWithDetails } from '@/lib/data/admin-photos'

interface AllPhotoOrdersClientProps {
  orders: AdminPhotoOrderWithDetails[]
  totalOrders: number
  currentPage: number
  pageSize: number
  initialFilters: PhotoOrderFilters
}

export function AllPhotoOrdersClient({
  orders,
  totalOrders,
  currentPage,
  pageSize,
  initialFilters,
}: AllPhotoOrdersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedOrder, setSelectedOrder] = useState<AdminPhotoOrderWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const totalPages = Math.ceil(totalOrders / pageSize)

  const updateSearchParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change (except when changing page)
    if (!('page' in updates)) {
      params.delete('page')
    }

    router.push(`/admin/pedidos-fotos?${params.toString()}`)
  }, [router, searchParams])

  const handleFilterChange = useCallback((key: keyof PhotoOrderFilters, value: string) => {
    updateSearchParams({ [key]: value || undefined })
  }, [updateSearchParams])

  const handleClearFilters = useCallback(() => {
    router.push('/admin/pedidos-fotos')
  }, [router])

  const handlePageChange = useCallback((newPage: number) => {
    updateSearchParams({ page: newPage.toString() })
  }, [updateSearchParams])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      // Build export URL with current filters
      const params = new URLSearchParams()
      if (initialFilters.payment_status) params.set('payment_status', initialFilters.payment_status)
      if (initialFilters.search) params.set('search', initialFilters.search)
      if (initialFilters.start_date) params.set('start_date', initialFilters.start_date)
      if (initialFilters.end_date) params.set('end_date', initialFilters.end_date)

      window.location.href = `/api/admin/photo-orders/export?${params.toString()}`
    } catch (error) {
      console.error('Error exporting orders:', error)
    } finally {
      setIsExporting(false)
    }
  }, [initialFilters])

  const handleViewDetails = useCallback((order: AdminPhotoOrderWithDetails) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
      case 'refunded':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'refunded':
        return 'Reembolsado'
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nome, email ou evento..."
              defaultValue={initialFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={initialFilters.payment_status || ''}
            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
          >
            <option value="">Todos os pagamentos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhou</option>
            <option value="refunded">Reembolsado</option>
          </Select>

          <Input
            type="date"
            defaultValue={initialFilters.start_date || ''}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            placeholder="Data inicio"
            className="w-auto"
          />

          <Input
            type="date"
            defaultValue={initialFilters.end_date || ''}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            placeholder="Data fim"
            className="w-auto"
          />

          <Button variant="ghost" onClick={handleClearFilters} size="sm">
            Limpar
          </Button>
        </div>

        <Button onClick={handleExport} variant="outline" size="sm" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Pacote
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Fotos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {orders.map((order) => {
              const shortCode = order.id?.slice(0, 8).toUpperCase() || null

              return (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      {order.profiles?.id ? (
                        <Link
                          href={`/admin/usuarios/${order.profiles.id}`}
                          className="font-medium text-neutral-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1 group"
                        >
                          {order.profiles?.full_name || 'N/A'}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : (
                        <p className="font-medium text-neutral-900">
                          {order.profiles?.full_name || 'N/A'}
                        </p>
                      )}
                      <p className="text-sm text-neutral-500">
                        {order.profiles?.email || 'N/A'}
                      </p>
                      {shortCode && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Pedido: <span className="font-mono">{shortCode}</span>
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {order.events?.slug ? (
                      <Link
                        href={`/admin/eventos/${order.event_id}/editar`}
                        className="text-sm text-neutral-700 hover:text-orange-600 transition-colors inline-flex items-center gap-1 group"
                      >
                        {order.events?.title || 'N/A'}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="text-sm text-neutral-600">{order.events?.title || 'N/A'}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {order.photo_packages?.name || 'Personalizado'}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {order.photo_order_items?.length || 0} foto(s)
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                      className="text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => {
          const shortCode = order.id?.slice(0, 8).toUpperCase() || null

          return (
            <div
              key={order.id}
              className="bg-white rounded-lg border border-neutral-200 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  {order.profiles?.id ? (
                    <Link
                      href={`/admin/usuarios/${order.profiles.id}`}
                      className="font-medium text-neutral-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
                    >
                      {order.profiles?.full_name || 'N/A'}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <p className="font-medium text-neutral-900">
                      {order.profiles?.full_name || 'N/A'}
                    </p>
                  )}
                  <p className="text-sm text-neutral-500">
                    {order.profiles?.email || 'N/A'}
                  </p>
                </div>
                <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                  {getPaymentStatusLabel(order.payment_status)}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-neutral-600">
                  <span className="font-medium">Evento:</span>{' '}
                  {order.events?.title || 'N/A'}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Pacote:</span>{' '}
                  {order.photo_packages?.name || 'Personalizado'}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Fotos:</span>{' '}
                  {order.photo_order_items?.length || 0} foto(s)
                </p>
                {shortCode && (
                  <p className="text-neutral-600">
                    <span className="font-medium">Pedido:</span>{' '}
                    <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{shortCode}</span>
                  </p>
                )}
                <p className="text-neutral-600">
                  <span className="font-medium">Valor:</span>{' '}
                  {formatCurrency(order.total_amount)}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Data:</span>{' '}
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(order)}
                  className="text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Fotos
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
          <p className="text-neutral-600">Nenhum pedido encontrado</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalOrders)} a{' '}
            {Math.min(currentPage * pageSize, totalOrders)} de {totalOrders} pedidos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-neutral-600">
              Pagina {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}

      <PhotoOrderDetailsModal
        order={selectedOrder}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
