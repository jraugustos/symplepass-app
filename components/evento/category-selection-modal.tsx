'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { EventCategory, Event } from '@/types/database.types'
import type { ShirtSize, ShirtGender, ShirtSizesByGender } from '@/types'
import { DEFAULT_SHIRT_SIZES_BY_GENDER, GENDER_LABELS } from '@/lib/constants/shirt-sizes'

interface CategorySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  category: EventCategory | null
  event: Event
  eventSlug: string
}

export default function CategorySelectionModal({
  isOpen,
  onClose,
  category,
  event,
  eventSlug,
}: CategorySelectionModalProps) {
  const router = useRouter()
  const [selectedGender, setSelectedGender] = useState<ShirtGender | null>(null)
  const [selectedSize, setSelectedSize] = useState<ShirtSize>('')
  const [partnerGender, setPartnerGender] = useState<ShirtGender | null>(null)
  const [partnerSize, setPartnerSize] = useState<ShirtSize>('')
  const [partnerName, setPartnerName] = useState('')
  const [registrationType, setRegistrationType] = useState<'individual' | 'dupla'>('individual')

  // Parse shirt sizes config from event
  const shirtSizesConfig: ShirtSizesByGender | null =
    event.shirt_sizes_config || null

  const genderOptions: ShirtGender[] = shirtSizesConfig
    ? (Object.keys(GENDER_LABELS) as ShirtGender[]).filter(
      (gender) => shirtSizesConfig[gender] && shirtSizesConfig[gender]!.length > 0
    )
    : (Object.keys(GENDER_LABELS) as ShirtGender[]).filter(
      (gender) => DEFAULT_SHIRT_SIZES_BY_GENDER[gender]?.length > 0
    )

  const getSizesForGender = (gender: ShirtGender | null) => {
    if (!gender) return []
    if (shirtSizesConfig && shirtSizesConfig[gender] && shirtSizesConfig[gender]!.length > 0) {
      return shirtSizesConfig[gender] as ShirtSize[]
    }
    return DEFAULT_SHIRT_SIZES_BY_GENDER[gender] || []
  }

  // Align selected genders with available options
  useEffect(() => {
    if (genderOptions.length === 0) {
      setSelectedGender(null)
      setSelectedSize('')
      setPartnerGender(null)
      setPartnerSize('')
      return
    }

    setSelectedGender((prev) => (prev && genderOptions.includes(prev) ? prev : genderOptions[0]))

    setPartnerGender((prev) => {
      if (registrationType !== 'dupla') return null
      return prev && genderOptions.includes(prev) ? prev : genderOptions[0]
    })
  }, [genderOptions, registrationType])

  // Get available sizes for selected gender(s)
  const availableSizes = getSizesForGender(selectedGender)
  const partnerAvailableSizes = getSizesForGender(partnerGender)

  // Set initial size when gender changes
  useEffect(() => {
    if (availableSizes && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0] as ShirtSize)
    } else {
      setSelectedSize('')
    }
  }, [selectedGender, availableSizes])

  useEffect(() => {
    if (partnerAvailableSizes && partnerAvailableSizes.length > 0 && registrationType === 'dupla') {
      setPartnerSize(partnerAvailableSizes[0] as ShirtSize)
    } else if (registrationType !== 'dupla') {
      setPartnerSize('')
    }
  }, [partnerAvailableSizes, registrationType])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }

    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !category) return null

  const hasShirtSizes = genderOptions.length > 0 && availableSizes && availableSizes.length > 0
  const allowsPairRegistration = event.allows_pair_registration
  const isFreeEvent = event.event_type === 'free' || event.event_type === 'solidarity'
  const requiresPartnerInfo = allowsPairRegistration && registrationType === 'dupla'
  const hasPartnerShirtSelection = requiresPartnerInfo && genderOptions.length > 0 && partnerAvailableSizes.length > 0

  const handleConfirm = () => {
    // Navigate to inscription review page with query params
    const params = new URLSearchParams({
      event: eventSlug,
      category: category.id,
      size: selectedSize,
      gender: selectedGender || '',
      registrationType,
    })

    if (requiresPartnerInfo && partnerName.trim()) {
      params.set('partner', partnerName.trim())
      if (hasPartnerShirtSelection && partnerSize) {
        params.set('partner_size', partnerSize)
        params.set('partner_gender', partnerGender || '')
      }
    }

    router.push(`/inscricao?${params.toString()}`)
  }

  return (
    <div
      className="fixed inset-0 z-[60] transition-opacity duration-300"
      style={{
        display: isOpen ? 'block' : 'none',
        opacity: isOpen ? 1 : 0
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* Wrapper */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center w-full sm:max-w-2xl sm:mx-auto px-4 sm:px-0">
        {/* Card */}
        <div
          className="w-full sm:w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xl transition-all duration-300 ease-out animate-fade-in-up"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-neutral-500 font-geist">Resumo da inscrição</p>
              <p className="mt-0.5 font-medium font-geist">{category.name}</p>
            </div>
            <button
              className="rounded-full p-2 border border-neutral-200 hover:bg-neutral-50"
              onClick={onClose}
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Body */}
          <div className="mt-4 space-y-3">
            {/* Price box */}
            {!isFreeEvent && (
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                <span className="text-sm text-neutral-500 font-geist">Valor da inscrição</span>
                <span className="text-lg font-semibold font-geist">{formatCurrency(category.price)}</span>
              </div>
            )}

            {/* Free/Solidarity event notice */}
            {isFreeEvent && (
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-900 font-geist">
                  {event.event_type === 'solidarity' ? '🤝 Evento Solidário' : '🎉 Evento Gratuito'}
                </p>
                {event.event_type === 'solidarity' && event.solidarity_message && (
                  <p className="mt-1 text-xs text-green-800 font-geist">
                    {event.solidarity_message}
                  </p>
                )}
              </div>
            )}

            {/* Registration type selector (individual / dupla) */}
            {allowsPairRegistration && (
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2 font-geist">
                  Tipo de inscrição
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['individual', 'dupla'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setRegistrationType(type)
                        if (type === 'individual') {
                          setPartnerName('')
                        }
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-medium font-geist transition-all',
                        registrationType === type
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      )}
                    >
                      {type === 'individual' ? 'Individual' : 'Dupla'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shirt Size Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2 font-geist">
                Tamanho da camiseta
              </label>
              {hasShirtSizes ? (
                <div className="space-y-3">
                  {/* Gender Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {genderOptions.map((gender) => (
                      <label
                        key={gender}
                        className={cn(
                          'cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-medium transition-all font-geist',
                          selectedGender === gender
                            ? 'border-orange-500 bg-orange-50 text-orange-900'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={gender}
                          checked={selectedGender === gender}
                          onChange={(e) => setSelectedGender(e.target.value as ShirtGender)}
                          className="sr-only"
                        />
                        {GENDER_LABELS[gender]}
                      </label>
                    ))}
                  </div>

                  {/* Size Grid */}
                  <div className="flex flex-wrap gap-2">
                    {availableSizes?.map((size) => (
                      <label
                        key={size}
                        className={cn(
                          'inline-flex items-center justify-center cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-all font-geist whitespace-nowrap',
                          selectedSize === size
                            ? 'border-orange-500 bg-orange-50 text-orange-900'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="shirt"
                          value={size}
                          checked={selectedSize === size}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="sr-only"
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-900 font-geist">
                    ⚠️ Nenhum tamanho de camiseta configurado para este evento
                  </p>
                  <p className="mt-1 text-xs text-red-800 font-geist">
                    Entre em contato com o organizador do evento.
                  </p>
                </div>
              )}
            </div>

            {/* Partner Name Input (conditional) */}
            {requiresPartnerInfo && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2 font-geist">
                    Nome do parceiro(a)
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Digite o nome completo do seu parceiro"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-geist text-sm"
                  />
                </div>

                {hasPartnerShirtSelection && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900 font-geist">Tamanho do parceiro(a)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {genderOptions.map((gender) => (
                        <label
                          key={gender}
                          className={cn(
                            'cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-medium transition-all font-geist',
                            partnerGender === gender
                              ? 'border-orange-500 bg-orange-50 text-orange-900'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="partner-gender"
                            value={gender}
                            checked={partnerGender === gender}
                            onChange={(e) => setPartnerGender(e.target.value as ShirtGender)}
                            className="sr-only"
                          />
                          {GENDER_LABELS[gender]}
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {partnerAvailableSizes?.map((size) => (
                        <label
                          key={size}
                          className={cn(
                            'inline-flex items-center justify-center cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-all font-geist whitespace-nowrap',
                            partnerSize === size
                              ? 'border-orange-500 bg-orange-50 text-orange-900'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="partner-shirt"
                            value={size}
                            checked={partnerSize === size}
                            onChange={(e) => setPartnerSize(e.target.value)}
                            className="sr-only"
                          />
                          {size}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between">
            <button
              className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-geist"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 text-white font-geist disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundImage: hasShirtSizes ? 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))' : 'linear-gradient(to right, rgb(163, 163, 163), rgb(115, 115, 115))' }}
              onClick={handleConfirm}
              disabled={
                !hasShirtSizes ||
                !selectedSize ||
                !selectedGender ||
                (requiresPartnerInfo && !partnerName.trim())
              }
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
