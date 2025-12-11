'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  Download,
  Eye,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import {
  formatCurrency,
  formatDate,
} from '@/lib/utils'
import type { PhotoOrderWithDetails } from '@/lib/data/photo-orders'

type PhotoOrdersTabProps = {
  photoOrders: PhotoOrderWithDetails[]
}

export function PhotoOrdersTab({ photoOrders }: PhotoOrdersTabProps) {
  const [selectedOrder, setSelectedOrder] = useState<PhotoOrderWithDetails | null>(null)

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

  const isEmpty = photoOrders.length === 0
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const getThumbnailUrl = (thumbnailPath: string | undefined) => {
    if (!thumbnailPath || !supabaseUrl) return null
    return `${supabaseUrl}/storage/v1/object/public/event-photos-watermarked/${thumbnailPath}`
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Minhas fotos
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900">Pedidos de fotos</h2>
        <p className="text-sm text-neutral-500">
          Acompanhe e baixe as fotos dos eventos que você participou.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 px-8 py-16 text-center text-neutral-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <Camera className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-lg font-semibold text-neutral-900">Nenhum pedido de fotos ainda</p>
            <p className="max-w-md text-sm">
              Participe de eventos e adquira fotos profissionais para guardar suas melhores memórias.
            </p>
            <Button variant="primary" className="rounded-xl" asChild>
              <a href="/eventos">Explorar eventos</a>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    <th className="px-6 py-4 font-semibold">Pedido</th>
                    <th className="px-6 py-4 font-semibold">Evento</th>
                    <th className="px-6 py-4 font-semibold">Pacote</th>
                    <th className="px-6 py-4 font-semibold">Fotos</th>
                    <th className="px-6 py-4 font-semibold">Valor</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {photoOrders.map((order) => {
                    const photoCount = order.items?.length || 0
                    const shortCode = order.id.slice(0, 8).toUpperCase()

                    return (
                      <tr key={order.id} className="border-t border-neutral-100 text-neutral-700">
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs text-neutral-500">#{shortCode}</p>
                          <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-neutral-900">{order.event?.title || 'Evento'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {order.package?.name || 'Personalizado'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5">
                            <ImageIcon className="h-4 w-4 text-neutral-400" />
                            {photoCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-neutral-900">
                          {formatCurrency(Number(order.total_amount))}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                            {getPaymentStatusLabel(order.payment_status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                            {order.payment_status === 'paid' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                className="rounded-xl"
                                asChild
                              >
                                <Link href={`/fotos/download/${order.id}`}>
                                  <Download className="h-4 w-4" />
                                  Baixar
                                </Link>
                              </Button>
                            ) : order.payment_status === 'pending' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                className="rounded-xl"
                                asChild
                              >
                                <Link href={`/fotos/checkout?eventId=${order.event_id}`}>
                                  Pagar
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="divide-y border-t border-neutral-100 md:hidden">
              {photoOrders.map((order) => {
                const photoCount = order.items?.length || 0
                const shortCode = order.id.slice(0, 8).toUpperCase()

                return (
                  <div key={order.id} className="space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-neutral-500">#{shortCode}</p>
                        <p className="font-semibold text-neutral-900">{order.event?.title || 'Evento'}</p>
                        <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                      </div>
                      <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                        {getPaymentStatusLabel(order.payment_status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">
                        {order.package?.name || 'Personalizado'} • {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                      </span>
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(Number(order.total_amount))}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Ver detalhes
                      </Button>
                      {order.payment_status === 'paid' ? (
                        <Button
                          variant="primary"
                          className="flex-1 rounded-xl"
                          asChild
                        >
                          <Link href={`/fotos/download/${order.id}`}>
                            <Download className="h-4 w-4" />
                            Baixar fotos
                          </Link>
                        </Button>
                      ) : order.payment_status === 'pending' ? (
                        <Button
                          variant="primary"
                          className="flex-1 rounded-xl"
                          asChild
                        >
                          <Link href={`/fotos/checkout?eventId=${order.event_id}`}>
                            Finalizar pagamento
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <ModalHeader onClose={() => setSelectedOrder(null)}>
          <ModalTitle>Detalhes do pedido</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 text-sm text-neutral-700">
          {selectedOrder && (
            <>
              <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Evento
                  </p>
                  <p className="font-semibold text-neutral-900">{selectedOrder.event?.title || 'Evento'}</p>
                </div>
                <Badge variant={getPaymentStatusVariant(selectedOrder.payment_status)}>
                  {getPaymentStatusLabel(selectedOrder.payment_status)}
                </Badge>
              </div>

              <dl className="grid gap-3">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Código do pedido</dt>
                  <dd className="font-mono text-xs text-neutral-900">
                    #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Pacote</dt>
                  <dd className="font-medium text-neutral-900">
                    {selectedOrder.package?.name || 'Personalizado'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Quantidade de fotos</dt>
                  <dd className="font-medium text-neutral-900">
                    {selectedOrder.items?.length || 0} {(selectedOrder.items?.length || 0) === 1 ? 'foto' : 'fotos'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Valor total</dt>
                  <dd className="font-semibold text-neutral-900">
                    {formatCurrency(Number(selectedOrder.total_amount))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Data do pedido</dt>
                  <dd>{formatDate(selectedOrder.created_at)}</dd>
                </div>
              </dl>

              {/* Photos Preview */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Fotos do pedido
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedOrder.items.slice(0, 8).map((item) => {
                      const thumbnailUrl = getThumbnailUrl(item.photo?.thumbnail_path)
                      return (
                        <div
                          key={item.id}
                          className="aspect-square relative rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200"
                        >
                          {thumbnailUrl ? (
                            <Image
                              src={thumbnailUrl}
                              alt={item.photo?.file_name || 'Foto'}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-400">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {selectedOrder.items.length > 8 && (
                      <div className="aspect-square flex items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-sm text-neutral-500">
                        +{selectedOrder.items.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {selectedOrder && selectedOrder.payment_status === 'paid' && (
            <Button variant="primary" className="rounded-xl" asChild>
              <Link href={`/fotos/download/${selectedOrder.id}`}>
                <Download className="h-4 w-4" />
                Baixar fotos
              </Link>
            </Button>
          )}
          {selectedOrder && selectedOrder.payment_status === 'pending' && (
            <Button variant="primary" className="rounded-xl" asChild>
              <Link href={`/fotos/checkout?eventId=${selectedOrder.event_id}`}>
                Finalizar pagamento
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Fechar</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default PhotoOrdersTab
