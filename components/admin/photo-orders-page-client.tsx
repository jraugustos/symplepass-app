'use client'

import { useState, useCallback, useTransition } from 'react'
import { PhotoOrdersTable } from './photo-orders-table'
import { PhotoOrderDetailsModal } from './photo-order-details-modal'
import type { PhotoOrderFilters, AdminPhotoOrderWithDetails } from '@/lib/data/admin-photos'

interface PhotoOrdersPageClientProps {
  eventId: string
  initialOrders: AdminPhotoOrderWithDetails[]
  initialTotal: number
  pageSize?: number
  isAdmin?: boolean
  onFilterOrders: (filters: PhotoOrderFilters) => Promise<{ orders: AdminPhotoOrderWithDetails[]; total: number }>
  onExportOrders: (filters: Omit<PhotoOrderFilters, 'page' | 'pageSize'>) => Promise<string>
  onDeleteOrder?: (orderId: string) => Promise<void>
}

export function PhotoOrdersPageClient({
  eventId,
  initialOrders,
  initialTotal,
  pageSize = 20,
  isAdmin = false,
  onFilterOrders,
  onExportOrders,
  onDeleteOrder,
}: PhotoOrdersPageClientProps) {
  const [orders, setOrders] = useState<AdminPhotoOrderWithDetails[]>(initialOrders)
  const [totalOrders, setTotalOrders] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFilters, setCurrentFilters] = useState<PhotoOrderFilters>({})
  const [selectedOrder, setSelectedOrder] = useState<AdminPhotoOrderWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = useCallback(async (filters: PhotoOrderFilters) => {
    const page = filters.page || 1
    setCurrentPage(page)
    setCurrentFilters(filters)

    startTransition(async () => {
      try {
        const result = await onFilterOrders({ ...filters, page, pageSize })
        setOrders(result.orders)
        setTotalOrders(result.total)
      } catch (error) {
        console.error('Error filtering orders:', error)
      }
    })
  }, [onFilterOrders, pageSize])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      // Export without pagination - get the download URL from the server action
      const { page, pageSize: _, ...exportFilters } = currentFilters
      const downloadUrl = await onExportOrders(exportFilters)
      // Trigger download by navigating to the export URL
      window.location.href = downloadUrl
    } catch (error) {
      console.error('Error exporting orders:', error)
    } finally {
      setIsExporting(false)
    }
  }, [currentFilters, onExportOrders])

  const handleViewDetails = useCallback((order: AdminPhotoOrderWithDetails) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    // Keep selectedOrder until modal animation completes
  }, [])

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    if (!onDeleteOrder) return

    await onDeleteOrder(orderId)

    // Remove the deleted order from the list
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    setTotalOrders((prev) => prev - 1)
  }, [onDeleteOrder])

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Pedidos de Fotos</h4>
        <p className="text-sm text-neutral-500 mt-1">
          Visualize e gerencie todos os pedidos de fotos do evento
        </p>
      </div>

      <PhotoOrdersTable
        orders={orders}
        totalOrders={totalOrders}
        currentPage={currentPage}
        pageSize={pageSize}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onViewDetails={handleViewDetails}
        isExporting={isExporting}
      />

      <PhotoOrderDetailsModal
        order={selectedOrder}
        open={isModalOpen}
        onClose={handleCloseModal}
        onDelete={onDeleteOrder ? handleDeleteOrder : undefined}
        isAdmin={isAdmin}
      />
    </div>
  )
}
