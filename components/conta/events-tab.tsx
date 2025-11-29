'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Download,
  ExternalLink,
  MapPin,
  QrCode,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import {
  extractLocationString,
  formatCurrency,
  formatDateShort,
  formatPaymentStatus,
  formatRegistrationStatus,
  generateTicketCode,
  getStatusBadgeVariant,
} from '@/lib/utils'
import type { RegistrationWithDetails } from '@/types'

type EventsTabProps = {
  registrations: RegistrationWithDetails[]
}

export function EventsTab({ registrations }: EventsTabProps) {
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithDetails | null>(
    null
  )
  const [downloadTarget, setDownloadTarget] = useState<string | null>(null)

  const openQrModal = (registration: RegistrationWithDetails) => {
    setSelectedRegistration(registration)
  }

  const handleDownloadReceipt = async (registration: RegistrationWithDetails) => {
    try {
      setDownloadTarget(registration.id)
      const response = await fetch(`/api/receipt/${registration.id}`)
      if (!response.ok) {
        throw new Error('Não foi possível gerar o recibo')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `comprovante-${registration.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error)
    } finally {
      setDownloadTarget(null)
    }
  }

  if (registrations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-inner">
          <Ticket className="h-10 w-10 text-neutral-400" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900">Nenhuma inscrição ainda</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Explore a agenda de eventos e encontre a próxima linha de chegada perfeita para você.
        </p>
        <Button asChild className="mt-6 rounded-xl px-6 py-3 text-base">
          <a href="/eventos" className="inline-flex items-center gap-2">
            Ver eventos
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Minhas inscrições
          </p>
          <h2 className="text-3xl font-semibold text-neutral-900">Histórico de eventos</h2>
          <p className="text-sm text-neutral-500">
            Acesse QR Codes, comprovantes e detalhes completos de cada participação
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {registrations.map((registration) => (
            <article
              key={registration.id}
              className="flex flex-col rounded-3xl border border-neutral-200 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
            >
              <div className="relative h-40 overflow-hidden rounded-t-3xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80" />
                {registration.event.banner_url ? (
                  <Image
                    src={registration.event.banner_url}
                    alt={registration.event.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-800 text-white">
                    {registration.event.title}
                  </div>
                )}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <Badge
                    variant={getStatusBadgeVariant(registration.payment_status)}
                    className={`shadow-lg border-0 ${
                      registration.payment_status === 'paid'
                        ? 'bg-emerald-500 text-white'
                        : registration.payment_status === 'pending'
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                    }`}
                  >
                    {formatPaymentStatus(registration.payment_status)}
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-neutral-700 border-0 shadow-lg">
                    {formatRegistrationStatus(registration.status)}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                    {registration.category?.name}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-neutral-900">
                    {registration.event.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {registration.event.description?.slice(0, 110) ?? 'Evento confirmado'}
                  </p>
                </div>

                <dl className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="sr-only">Data</dt>
                      <dd>{formatDateShort(registration.event.start_date)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="sr-only">Local</dt>
                      <dd>{extractLocationString(registration.event.location)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="sr-only">Valor</dt>
                      <dd>{formatCurrency(registration.amount_paid || 0)}</dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-auto grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => openQrModal(registration)}
                  >
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl border border-neutral-200 bg-white text-neutral-700"
                    isLoading={downloadTarget === registration.id}
                    onClick={() => handleDownloadReceipt(registration)}
                  >
                    <Download className="h-4 w-4" />
                    Recibo
                  </Button>
                  <Button variant="primary" className="rounded-xl sm:col-span-2" asChild>
                    <a
                      href={`/eventos/${registration.event.slug}`}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      Ver detalhes
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Modal open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <ModalHeader onClose={() => setSelectedRegistration(null)}>
          <ModalTitle>Ingresso digital</ModalTitle>
        </ModalHeader>
        <ModalBody className="flex flex-col items-center gap-4">
          {selectedRegistration?.qr_code ? (
            <Image
              src={selectedRegistration.qr_code}
              alt="QR Code do ingresso"
              width={192}
              height={192}
              unoptimized
              className="h-48 w-48 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 object-contain"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
              <QrCode className="h-12 w-12" />
            </div>
          )}
          {selectedRegistration && (
            <>
              <p className="text-base font-semibold text-neutral-900">
                {selectedRegistration.event.title}
              </p>
              <p className="text-sm text-neutral-500">
                Código: {generateTicketCode(selectedRegistration.id)}
              </p>
            </>
          )}
        </ModalBody>
        <ModalFooter centered>
          <Button variant="secondary" onClick={() => setSelectedRegistration(null)}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default EventsTab
