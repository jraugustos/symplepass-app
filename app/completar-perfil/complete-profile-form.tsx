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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
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
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Seu nome completo"
          disabled={isPending}
        />
        {fieldErrors.fullName && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={handlePhoneChange}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="(XX) XXXXX-XXXX"
          disabled={isPending}
        />
        {fieldErrors.phone && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
        )}
      </div>

      {/* Favorite Sports */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quais esportes você pratica ou acompanha?
        </label>
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Salvando...
          </>
        ) : (
          'Continuar'
        )}
      </button>
    </form>
  )
}
