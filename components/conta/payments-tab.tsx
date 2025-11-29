'use client'

import { useMemo, useState } from 'react'
import { Download, ReceiptText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import {
  formatCurrency,
  formatDate,
  formatPaymentStatus,
  getStatusBadgeVariant,
} from '@/lib/utils'
import type { PaymentHistoryItem } from '@/types'

type PaymentsTabProps = {
  paymentHistory: PaymentHistoryItem[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaymentsTab({
  paymentHistory,
  currentPage,
  totalPages,
  onPageChange,
}: PaymentsTabProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null)
  const [downloadTarget, setDownloadTarget] = useState<string | null>(null)

  const pageNumbers = useMemo(() => {
    const pages = []
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i)
    }
    return pages
  }, [totalPages])

  const isEmpty = paymentHistory.length === 0

  const handleDownload = async (payment: PaymentHistoryItem) => {
    try {
      setDownloadTarget(payment.id)
      const response = await fetch(`/api/receipt/${payment.registration_id}`)
      if (!response.ok) throw new Error('Erro ao gerar recibo')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pagamento-${payment.registration_id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar recibo:', error)
    } finally {
      setDownloadTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Pagamentos
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900">Histórico transacional</h2>
        <p className="text-sm text-neutral-500">
          Visualize recibos, status e valores de todas as inscrições realizadas na plataforma.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 px-8 py-16 text-center text-neutral-500">
            <p className="text-lg font-semibold text-neutral-900">Nenhum pagamento registrado ainda</p>
            <p className="max-w-md text-sm">
              Assim que você concluir sua primeira inscrição paga, os recibos e status aparecerão
              aqui para facilitar o acompanhamento.
            </p>
            <Button variant="primary" className="rounded-xl" asChild>
              <a href="/eventos">Explorar eventos</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    <th className="px-6 py-4 font-semibold">Data</th>
                    <th className="px-6 py-4 font-semibold">Evento</th>
                    <th className="px-6 py-4 font-semibold">Categoria</th>
                    <th className="px-6 py-4 font-semibold">Valor</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-t border-neutral-100 text-neutral-700">
                      <td className="px-6 py-4">{formatDate(payment.payment_date)}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900">{payment.event_title}</p>
                        <p className="text-xs text-neutral-500">{payment.stripe_payment_intent_id}</p>
                      </td>
                      <td className="px-6 py-4">{payment.category_name || '--'}</td>
                      <td className="px-6 py-4 font-semibold text-neutral-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusBadgeVariant(payment.payment_status)}>
                          {formatPaymentStatus(payment.payment_status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            className="rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            Detalhes
                          </Button>
                          <Button
                            variant="secondary"
                            className="rounded-xl"
                            isLoading={downloadTarget === payment.id}
                            onClick={() => handleDownload(payment)}
                          >
                            <Download className="h-4 w-4" />
                            Recibo
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y border-t border-neutral-100 md:hidden">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">{formatDate(payment.payment_date)}</p>
                      <p className="font-semibold text-neutral-900">{payment.event_title}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(payment.payment_status)}>
                      {formatPaymentStatus(payment.payment_status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{payment.category_name}</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      Detalhes
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 rounded-xl"
                      isLoading={downloadTarget === payment.id}
                      onClick={() => handleDownload(payment)}
                    >
                      Recibo
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm">
              <p className="text-neutral-500">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
                      page === currentPage
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <ModalHeader onClose={() => setSelectedPayment(null)}>
          <ModalTitle>Detalhes do pagamento</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 text-sm text-neutral-700">
          {selectedPayment && (
            <>
              <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Evento
                  </p>
                  <p className="font-semibold text-neutral-900">{selectedPayment.event_title}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedPayment.payment_status)}>
                  {formatPaymentStatus(selectedPayment.payment_status)}
                </Badge>
              </div>

              <dl className="grid gap-3">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Categoria</dt>
                  <dd className="font-medium text-neutral-900">
                    {selectedPayment.category_name || '--'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Valor</dt>
                  <dd className="font-semibold text-neutral-900">
                    {formatCurrency(selectedPayment.amount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Data</dt>
                  <dd>{formatDate(selectedPayment.payment_date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Stripe Intent</dt>
                  <dd className="font-mono text-xs text-neutral-500">
                    {selectedPayment.stripe_payment_intent_id || '--'}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {selectedPayment && (
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => handleDownload(selectedPayment)}
              isLoading={downloadTarget === selectedPayment.id}
            >
              <ReceiptText className="h-4 w-4" />
              Baixar recibo
            </Button>
          )}
          <Button onClick={() => setSelectedPayment(null)}>Fechar</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default PaymentsTab
