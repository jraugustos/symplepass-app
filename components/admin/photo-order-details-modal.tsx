'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AdminPhotoOrderWithDetails } from '@/lib/data/admin-photos'

interface PhotoOrderDetailsModalProps {
  order: AdminPhotoOrderWithDetails | null
  open: boolean
  onClose: () => void
  onDelete?: (orderId: string) => Promise<void>
  isAdmin?: boolean
}

export function PhotoOrderDetailsModal({
  order,
  open,
  onClose,
  onDelete,
  isAdmin = false,
}: PhotoOrderDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!order || !onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(order.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Error deleting order:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseModal = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Render content based on whether order is available
  const renderContent = () => {
    if (!order) {
      return (
        <>
          <ModalHeader onClose={handleCloseModal}>
            <ModalTitle>Detalhes do Pedido</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="p-8 text-center text-neutral-500">
              Nenhum pedido selecionado
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={handleCloseModal}>
              Fechar
            </Button>
          </ModalFooter>
        </>
      )
    }

    const shortCode = order.id?.slice(0, 8).toUpperCase() || 'N/A'
    const photos = order.photo_order_items?.map(item => item.event_photos).filter(Boolean) || []

    // Build thumbnail URL helper
    const getThumbnailUrl = (thumbnailPath: string | undefined) => {
      if (!thumbnailPath || !supabaseUrl) return null
      return `${supabaseUrl}/storage/v1/object/public/event-photos-watermarked/${thumbnailPath}`
    }

    // Delete confirmation view
    if (showDeleteConfirm) {
      return (
        <>
          <ModalHeader onClose={handleCloseModal}>
            <ModalTitle>Excluir Pedido</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Tem certeza que deseja excluir?
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                O pedido <span className="font-mono font-medium">{shortCode}</span> será excluído permanentemente.
                Esta ação não pode ser desfeita.
              </p>
              <div className="p-4 bg-neutral-50 rounded-lg w-full text-left">
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">Cliente:</span> {order.profiles?.full_name || 'N/A'}
                </p>
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">Valor:</span> {formatCurrency(order.total_amount)}
                </p>
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">Fotos:</span> {photos.length} foto(s)
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Pedido
                </>
              )}
            </Button>
          </ModalFooter>
        </>
      )
    }

    return (
      <>
        <ModalHeader onClose={handleCloseModal}>
          <ModalTitle>Detalhes do Pedido</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Código do Pedido</p>
              <p className="font-mono font-medium text-neutral-900">{shortCode}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Status</p>
              <Badge variant={getPaymentStatusVariant(order.payment_status)} className="mt-1">
                {getPaymentStatusLabel(order.payment_status)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Data do Pedido</p>
              <p className="text-sm text-neutral-900">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Valor Total</p>
              <p className="text-sm font-medium text-neutral-900">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>

          {/* Client Info */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Cliente</h4>
            <div className="p-4 border border-neutral-200 rounded-lg">
              <p className="font-medium text-neutral-900">{order.profiles?.full_name || 'N/A'}</p>
              <p className="text-sm text-neutral-500">{order.profiles?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Package Info */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Pacote</h4>
            <div className="p-4 border border-neutral-200 rounded-lg">
              <p className="text-neutral-900">{order.photo_packages?.name || 'Personalizado'}</p>
              {order.photo_packages && (
                <p className="text-sm text-neutral-500 mt-1">
                  {order.photo_packages.quantity} foto(s) - {formatCurrency(order.photo_packages.price)}
                </p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">
              Fotos do Pedido ({photos.length})
            </h4>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo) => {
                  const thumbnailUrl = getThumbnailUrl(photo?.thumbnail_path)
                  return (
                    <div
                      key={photo?.id}
                      className="aspect-square relative rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200"
                    >
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={photo?.file_name || 'Foto do evento'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          Sem preview
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-neutral-50 rounded-lg">
                <p className="text-neutral-500">Nenhuma foto neste pedido</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          {isAdmin && onDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <Button variant="secondary" onClick={handleCloseModal}>
            Fechar
          </Button>
        </ModalFooter>
      </>
    )
  }

  return (
    <Modal open={open} onOpenChange={handleCloseModal} size="lg">
      {renderContent()}
    </Modal>
  )
}
