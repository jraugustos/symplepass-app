'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { completeProfile } from '@/lib/auth/actions'
import { SportInterestsSelector } from '@/components/forms/sport-interests-selector'

interface CompleteProfileFormProps {
  userId: string
  initialFullName: string
  initialPhone: string
  initialFavoriteSports: string[]
  /** Already sanitized by the server component - safe to use directly */
  callbackUrl: string
}

function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')

  // Apply mask based on length
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : ''
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }
}

export default function CompleteProfileForm({
  userId,
  initialFullName,
  initialPhone,
  initialFavoriteSports,
  callbackUrl,
}: CompleteProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone ? formatPhoneNumber(initialPhone) : '')
  const [favoriteSports, setFavoriteSports] = useState<string[]>(initialFavoriteSports)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!fullName.trim() || fullName.trim().length < 3) {
      errors.fullName = 'Nome deve ter no mínimo 3 caracteres'
    }

    const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
    if (!phone || !phoneRegex.test(phone)) {
      errors.phone = 'Telefone inválido. Use o formato (XX) XXXXX-XXXX'
    }

    if (favoriteSports.length === 0) {
      errors.favoriteSports = 'Selecione pelo menos 1 esporte de interesse'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    startTransition(async () => {
      const result = await completeProfile(userId, {
        full_name: fullName.trim(),
        phone,
        favorite_sports: favoriteSports,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Redirect to callback URL (already sanitized by server)
      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative pb-24">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-10">
        {/* Section: Personal Info */}
        <section className="space-y-6">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-lg font-semibold text-neutral-900">
              Dados Pessoais
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
                Nome completo
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: '' }))
                  }
                }}
                className={`w-full rounded-lg border px-4 py-2.5 text-neutral-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 ${fieldErrors.fullName ? 'border-red-500' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                placeholder="Seu nome completo"
                disabled={isPending}
              />
              {fieldErrors.fullName && (
                <p className="text-sm text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full rounded-lg border px-4 py-2.5 text-neutral-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 ${fieldErrors.phone ? 'border-red-500' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                placeholder="(XX) XXXXX-XXXX"
                disabled={isPending}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          </div>
        </section>

        {/* Section: Interests */}
        <section className="space-y-6">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-lg font-semibold text-neutral-900">
              Seus Interesses
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Selecione os esportes que você pratica ou acompanha para receber recomendações personalizadas.
            </p>
          </div>

          <div>
            <SportInterestsSelector
              value={favoriteSports}
              onChange={(value) => {
                setFavoriteSports(value)
                if (fieldErrors.favoriteSports) {
                  setFieldErrors((prev) => ({ ...prev, favoriteSports: '' }))
                }
              }}
              disabled={isPending}
              error={fieldErrors.favoriteSports}
            />
          </div>
        </section>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 right-0 z-20 w-full border-t border-neutral-200 bg-white p-4 lg:w-[58.333333%] xl:w-[66.666667%]">
        <div className="mx-auto flex max-w-2xl justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
