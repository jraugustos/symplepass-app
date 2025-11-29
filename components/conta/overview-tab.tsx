'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Download,
  MapPin,
  QrCode,
  Sparkles,
  Star,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import type {
  RegistrationWithDetails,
  TabId,
  UserPanelStats,
  UserPreferences,
} from '@/types'

type OverviewTabProps = {
  stats: UserPanelStats
  upcomingEvents: RegistrationWithDetails[]
  preferences: UserPreferences
  onTabChange: (tab: TabId) => void
}

const SPORT_LABELS: Record<string, string> = {
  corrida: 'Corrida',
  ciclismo: 'Ciclismo',
  triatlo: 'Triathlon',
  natacao: 'Natação',
  caminhada: 'Caminhada',
  crossfit: 'Crossfit',
  beach_sports: 'Beach Sports',
  trail_running: 'Trail Running',
  outro: 'Outros esportes',
}

export function OverviewTab({
  stats,
  upcomingEvents,
  preferences,
  onTabChange,
}: OverviewTabProps) {
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithDetails | null>(
    null
  )
  const [downloadTarget, setDownloadTarget] = useState<string | null>(null)

  const highlightedSports = useMemo(() => {
    if (!preferences.favorite_sports?.length) return ['Descubra novos esportes']
    return preferences.favorite_sports.map((sport) => SPORT_LABELS[sport] ?? sport)
  }, [preferences.favorite_sports])

  const limitedUpcoming = useMemo(() => upcomingEvents.slice(0, 3), [upcomingEvents])

  const statCards = [
    {
      label: 'Próximos eventos',
      value: stats.upcomingEvents.toString(),
      helper: 'Eventos confirmados',
    },
    {
      label: 'Pagamentos pendentes',
      value: stats.pendingPayments.toString(),
      helper: 'Aguardando confirmação',
    },
    {
      label: 'Eventos participados',
      value: stats.totalPaidEvents.toString(),
      helper: 'Total de participações',
    },
  ]

  const handleDownloadReceipt = async (registrationId: string) => {
    try {
      setDownloadTarget(registrationId)
      const response = await fetch(`/api/receipt/${registrationId}`)

      if (!response.ok) {
        throw new Error('Não foi possível gerar o comprovante')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `comprovante-${registrationId}.pdf`
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

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100">
                <Sparkles className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <h3 className="font-geist text-lg font-semibold tracking-tight text-neutral-900">Resumo rápido</h3>
                <p className="font-geist text-sm text-neutral-600">Veja seus próximos eventos e status da conta</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="font-geist text-3xl font-semibold tracking-tight text-neutral-900">{card.value}</p>
                  <p className="font-geist mt-1 text-xs text-neutral-600">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <h4 className="font-geist text-lg font-medium tracking-tight text-neutral-900">Próximos eventos</h4>
              <button
                type="button"
                onClick={() => onTabChange('eventos')}
                className="font-geist text-sm text-neutral-600 transition hover:text-neutral-900"
              >
                Ver todos
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {limitedUpcoming.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                  <p className="text-sm font-medium text-neutral-600">
                    Você ainda não tem eventos futuros. Que tal descobrir algo novo?
                  </p>
                  <Button
                    variant="primary"
                    className="mt-4 rounded-xl px-5 py-2"
                    onClick={() => onTabChange('eventos')}
                  >
                    Explorar eventos
                  </Button>
                </div>
              )}

              {limitedUpcoming.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={getStatusBadgeVariant(registration.payment_status)}
                        size="sm"
                      >
                        {formatPaymentStatus(registration.payment_status)}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {formatRegistrationStatus(registration.status)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {registration.event.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {formatDateShort(registration.event.start_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {extractLocationString(registration.event.location)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {registration.category?.name} • {formatCurrency(registration.amount_paid || 0)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <Button
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => setSelectedRegistration(registration)}
                    >
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-xl border border-neutral-200 bg-white text-neutral-700"
                      isLoading={downloadTarget === registration.id}
                      onClick={() => handleDownloadReceipt(registration.id)}
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="primary"
                      className="rounded-xl"
                      asChild
                      ripple={false}
                    >
                      <a href={`/eventos/${registration.event.slug}`} className="flex items-center gap-2">
                        Detalhes
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h4 className="font-geist text-lg font-semibold tracking-tight text-neutral-900">Atalhos</h4>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Editar dados', tab: 'dados' as TabId },
                { label: 'Ver faturas', tab: 'pagamentos' as TabId },
                { label: 'Notificações', tab: 'config' as TabId },
                { label: 'Meus ingressos', tab: 'eventos' as TabId },
              ].map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  className="font-geist inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-normal transition hover:bg-neutral-100"
                  onClick={() => onTabChange(shortcut.tab)}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100">
                <Star className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <h4 className="font-geist text-lg font-semibold tracking-tight text-neutral-900">Preferências</h4>
                <p className="font-geist text-sm text-neutral-600">Esportes que você mais gosta</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {highlightedSports.map((sport) => (
                <Badge key={sport} variant="secondary">
                  {sport}
                </Badge>
              ))}
            </div>
            <button
              className="font-geist mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-normal transition hover:bg-neutral-200"
              onClick={() => onTabChange('preferencias')}
            >
              Editar preferências
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-[0_25px_60px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/70 p-3 text-amber-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
                  Descubra mais
                </p>
                <h3 className="text-lg font-semibold text-amber-800">
                  Eventos recomendados pra você
                </h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-amber-900/80">
              Atualize suas preferências para receber eventos alinhados ao seu estilo, distância e
              localização preferida.
            </p>
            <Button
              variant="primary"
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_15px_40px_rgba(251,146,60,0.35)]"
              asChild
            >
              <a href="/eventos" className="inline-flex items-center justify-center gap-2">
                Ver agenda
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Modal open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <ModalHeader onClose={() => setSelectedRegistration(null)}>
          <ModalTitle>QR Code do evento</ModalTitle>
        </ModalHeader>
        <ModalBody className="flex flex-col items-center gap-4">
          <p className="text-sm text-neutral-600">
            Apresente este código no credenciamento ou na retirada do kit.
          </p>
          {selectedRegistration?.qr_code ? (
            <Image
              src={selectedRegistration.qr_code}
              alt="QR Code do ingresso"
              width={160}
              height={160}
              unoptimized
              className="h-40 w-40 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 object-contain"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
              <QrCode className="h-10 w-10" />
            </div>
          )}
          {selectedRegistration && (
            <div className="text-center">
              <p className="font-geist text-sm font-semibold text-neutral-900">
                {selectedRegistration.event.title}
              </p>
              <p className="text-xs text-neutral-500">
                {generateTicketCode(selectedRegistration.id)}
              </p>
            </div>
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

export default OverviewTab
