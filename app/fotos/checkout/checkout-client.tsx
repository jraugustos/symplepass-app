'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ShieldCheck, ArrowRight, Camera, Layers, ImageIcon, Mail, Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationHeader } from '@/components/molecules/navigation-header'
import { formatCurrency, cn } from '@/lib/utils'
import type { PhotoCheckoutResponse } from '@/types'

interface PhotoCheckoutClientProps {
  event: {
    id: string
    title: string
    slug: string
    banner_url: string | null
    start_date: string
    location: {
      city: string
      state: string
    }
  }
  selectedPhotos: Array<{
    id: string
    file_name: string
    thumbnail_path: string
    thumbnailUrl: string
  }>
  packages: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  /** @deprecated Use appliedTier instead */
  bestPackage: {
    id: string
    name: string
    quantity: number
    price: number
  } | null
  appliedTier?: {
    id: string
    min_quantity: number
    price_per_photo: number
  } | null
  pricePerPhoto?: number | null
  totalPrice: number
  user: {
    id: string
    email: string
    full_name: string | null
  }
}

export function PhotoCheckoutClient({
  event,
  selectedPhotos,
  packages,
  bestPackage,
  appliedTier,
  pricePerPhoto,
  totalPrice,
  user,
}: PhotoCheckoutClientProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid = termsAccepted && selectedPhotos.length > 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) {
      setError('Aceite os termos para continuar.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/photos/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          photoIds: selectedPhotos.map((p) => p.id),
          totalAmount: totalPrice,
          packageId: bestPackage?.id || null,
          // New fields for progressive pricing
          appliedTierId: appliedTier?.id || null,
          pricePerPhotoApplied: pricePerPhoto || null,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.error || 'Não foi possível iniciar o pagamento.')
      }

      const data = (await response.json()) as PhotoCheckoutResponse

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('Resposta inválida do servidor.')
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Erro inesperado. Tente novamente.'
      setError(message)
      setIsSubmitting(false)
    }
  }, [isFormValid, isSubmitting, event.id, selectedPhotos, totalPrice, bestPackage?.id])

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 pb-28">
      {/* Header + Hero with gradient background */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600">
        <NavigationHeader
          variant="transparent"
          sticky={false}
          isAuthenticated={true}
          userName={user.full_name || ''}
          userEmail={user.email}
        />
        <div className="border-b border-white/20" />
        <div className="container relative z-10 mx-auto px-5 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Camera className="h-6 w-6 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Compra de Fotos</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-white font-geist">
            Finalize sua compra
          </h1>
        </div>
      </div>

      <div className="container mx-auto flex-1 px-5 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Selected photos section */}
          <section>
            <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
              Suas fotos selecionadas
            </h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {selectedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100"
                  >
                    {photo.thumbnailUrl ? (
                      <Image
                        src={photo.thumbnailUrl}
                        alt={photo.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-neutral-500">
                {selectedPhotos.length} {selectedPhotos.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </p>
            </div>
          </section>

          {/* Event details section */}
          <section>
            <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
              Detalhes do evento
            </h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="flex gap-4">
                {event.banner_url && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                    <Image
                      src={event.banner_url}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-neutral-900 font-geist truncate">
                    {event.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {formatDate(event.start_date)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {event.location.city}, {event.location.state}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing tier section (new progressive pricing) */}
          {appliedTier && (
            <section>
              <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
                Faixa de preço aplicada
              </h2>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900 font-geist">
                      {appliedTier.min_quantity}+ fotos
                    </p>
                    <p className="text-sm text-orange-700">
                      {formatCurrency(appliedTier.price_per_photo)} por foto
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
          {/* Legacy: Package section (deprecated, for backward compatibility) */}
          {!appliedTier && bestPackage && (
            <section>
              <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
                Pacote aplicado
              </h2>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900 font-geist">
                      {bestPackage.name}
                    </p>
                    <p className="text-sm text-orange-700">
                      {bestPackage.quantity} {bestPackage.quantity === 1 ? 'foto' : 'fotos'} por{' '}
                      {formatCurrency(Number(bestPackage.price))}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Price breakdown section */}
          <section>
            <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
              Resumo de valores
            </h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">
                  {selectedPhotos.length} {selectedPhotos.length === 1 ? 'foto' : 'fotos'}
                </span>
                <span className="text-neutral-900 font-medium">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between">
                <span className="font-semibold text-neutral-900 font-geist">Total</span>
                <span className="font-bold text-xl text-orange-600 font-geist">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </section>

          {/* How it works section */}
          <section>
            <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
              Como funciona
            </h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 font-geist">Pagamento seguro</p>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      Você será redirecionado para o Stripe, nossa plataforma de pagamento segura.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 font-geist">Confirmação por e-mail</p>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      Após o pagamento, você receberá um e-mail em <span className="font-medium">{user.email}</span> com a confirmação.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 font-geist">Download imediato</p>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      O link para download das fotos em alta resolução estará disponível imediatamente após a confirmação do pagamento.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 font-geist">Acesso garantido</p>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      Você terá acesso às suas fotos por tempo ilimitado através da sua conta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Terms checkbox section */}
          <section className="mt-8">
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                className="peer sr-only"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label
                htmlFor="terms"
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-neutral-300 bg-white transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500 shrink-0"
              >
                <svg
                  className={cn(
                    'h-3 w-3 text-white transition-opacity',
                    termsAccepted ? 'opacity-100' : 'opacity-0'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </label>
              <label htmlFor="terms" className="text-sm text-neutral-600 font-inter cursor-pointer">
                Li e concordo com os{' '}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 underline underline-offset-2 hover:text-orange-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  Termos de uso
                </a>
                {' '}e{' '}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 underline underline-offset-2 hover:text-orange-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  Política de privacidade
                </a>
                .
              </label>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Simplified sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <ShieldCheck className="h-4 w-4 text-neutral-400" />
              <span className="text-xs text-neutral-500 font-inter">Pagamento seguro via Stripe</span>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto order-1 sm:order-2"
              style={{ backgroundImage: 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))' }}
              isLoading={isSubmitting}
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Processando...' : 'Prosseguir para Pagamento'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
