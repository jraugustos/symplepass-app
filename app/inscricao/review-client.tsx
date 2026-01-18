'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, ArrowRight, Users, Crown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NavigationHeader } from '@/components/molecules/navigation-header'
import { EventSummaryCard, PriceBreakdown as PriceBreakdownCard } from '@/components/inscricao'
import type { CheckoutSessionResponse, PriceBreakdown as PriceBreakdownData, ReviewPageData, ShirtGender, ShirtSizesByGender, ParticipantData, ShirtSize } from '@/types'
import { formatCurrency, validateEmail, formatCPF, formatPhone, validateCPF, cn, calculateServiceFee, calculateTotal } from '@/lib/utils'
import { DEFAULT_SHIRT_SIZES_BY_GENDER, GENDER_LABELS } from '@/lib/constants/shirt-sizes'
import { CLUB_DISCOUNT_PERCENTAGE } from '@/lib/constants/club'

interface ReviewClientProps extends ReviewPageData {
  priceBreakdown: PriceBreakdownData
  isClubMember?: boolean
}

export function ReviewClient({
  event,
  category,
  shirtSize,
  shirtGender: initialShirtGender,
  partnerName,
  partnerShirtGender: initialPartnerShirtGender,
  partnerShirtSize: initialPartnerShirtSize,
  teamMembers: initialTeamMembers,
  user,
  isAuthenticated,
  priceBreakdown,
  isClubMember = false,
}: ReviewClientProps) {
  const [name, setName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [userCpf, setUserCpf] = useState(user?.cpf ?? '')
  const [userPhone, setUserPhone] = useState(user?.phone ?? '')
  const [userShirtGender, setUserShirtGender] = useState<ShirtGender>(() => {
    if (initialShirtGender) return initialShirtGender
    if (user?.shirt_gender === 'masculino' || user?.shirt_gender === 'feminino' || user?.shirt_gender === 'infantil') {
      return user.shirt_gender
    }
    if (user?.gender === 'masculino' || user?.gender === 'feminino' || user?.gender === 'infantil') {
      return user.gender as ShirtGender
    }
    return 'masculino'
  })
  const [userShirtSize, setUserShirtSize] = useState(shirtSize)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)

  // Partner data states
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerCpf, setPartnerCpf] = useState('')
  const [partnerPhone, setPartnerPhone] = useState('')
  const [partnerShirtGender, setPartnerShirtGender] = useState<ShirtGender>(() => {
    if (initialPartnerShirtGender) return initialPartnerShirtGender
    return 'masculino'
  })
  const [partnerShirtSize, setPartnerShirtSize] = useState(initialPartnerShirtSize ?? '')

  // Team members state
  const [teamMembersData, setTeamMembersData] = useState<Array<{
    name: string
    email: string
    cpf: string
    phone: string
    shirtSize: ShirtSize
    shirtGender: ShirtGender
  }>>(() => {
    if (!initialTeamMembers || initialTeamMembers.length === 0) return []
    return initialTeamMembers.map((member) => ({
      name: member.name || '',
      email: member.email || '',
      cpf: member.cpf || '',
      phone: member.phone || '',
      shirtSize: (member.shirtSize || '') as ShirtSize,
      shirtGender: (member.shirtGender || 'masculino') as ShirtGender,
    }))
  })

  const isTeamRegistration = teamMembersData.length > 0

  // Calculate club member discount
  const categoryPrice = category.price || 0
  const clubDiscount = useMemo(() => {
    if (!isClubMember || categoryPrice <= 0) return 0
    return (categoryPrice * CLUB_DISCOUNT_PERCENTAGE) / 100
  }, [isClubMember, categoryPrice])

  // Calculate applied discount (non-cumulative: apply the greater of club or coupon)
  const appliedDiscount = useMemo(() => {
    if (clubDiscount > 0 && couponDiscount > 0) {
      // Non-cumulative: use the greater discount
      return clubDiscount >= couponDiscount
        ? { type: 'club' as const, amount: clubDiscount }
        : { type: 'coupon' as const, amount: couponDiscount }
    } else if (clubDiscount > 0) {
      return { type: 'club' as const, amount: clubDiscount }
    } else if (couponDiscount > 0) {
      return { type: 'coupon' as const, amount: couponDiscount }
    }
    return { type: null, amount: 0 }
  }, [clubDiscount, couponDiscount])

  // Calculate prices with the applied discount
  const adjustedPriceBreakdown = useMemo(() => {
    if (appliedDiscount.amount <= 0) return priceBreakdown

    const subtotal = categoryPrice - appliedDiscount.amount
    const serviceFee = calculateServiceFee(subtotal)
    const total = calculateTotal(subtotal, serviceFee)

    return {
      subtotal,
      clubDiscount: appliedDiscount.type === 'club' ? appliedDiscount.amount : undefined,
      couponDiscount: appliedDiscount.type === 'coupon' ? appliedDiscount.amount : undefined,
      serviceFee,
      total,
    }
  }, [priceBreakdown, appliedDiscount, categoryPrice])

  // Parse shirt sizes config from event
  const shirtSizesConfig: ShirtSizesByGender | null = event.shirt_sizes_config || null

  const userAvailableSizes = shirtSizesConfig?.[userShirtGender]?.length
    ? shirtSizesConfig[userShirtGender]
    : DEFAULT_SHIRT_SIZES_BY_GENDER[userShirtGender]

  const partnerAvailableSizes = shirtSizesConfig?.[partnerShirtGender]?.length
    ? shirtSizesConfig[partnerShirtGender]
    : DEFAULT_SHIRT_SIZES_BY_GENDER[partnerShirtGender]

  useEffect(() => {
    if (userAvailableSizes && userAvailableSizes.length > 0 && !userAvailableSizes.includes(userShirtSize)) {
      setUserShirtSize(userAvailableSizes[0])
    }
  }, [userAvailableSizes, userShirtSize])

  // Set initial partner shirt size when gender changes or when size is empty
  useEffect(() => {
    if (
      partnerName &&
      partnerAvailableSizes &&
      partnerAvailableSizes.length > 0 &&
      (!partnerShirtSize || !partnerAvailableSizes.includes(partnerShirtSize))
    ) {
      setPartnerShirtSize(partnerAvailableSizes[0])
    }
  }, [partnerAvailableSizes, partnerName, partnerShirtSize])

  const isNameValid = name.trim().length >= 3
  const isEmailValid = useMemo(() => validateEmail(email), [email])
  const isUserCpfValid = useMemo(() => validateCPF(userCpf), [userCpf])
  const isUserPhoneValid = useMemo(() => {
    const digits = userPhone.replace(/\D/g, '')
    return digits.length === 10 || digits.length === 11
  }, [userPhone])
  const isUserShirtSizeValid = userShirtSize.length > 0
  const isUserDataValid = isNameValid &&
    isEmailValid &&
    userCpf.length > 0 &&
    isUserCpfValid &&
    userPhone.length > 0 &&
    isUserPhoneValid &&
    isUserShirtSizeValid

  // Partner data validation
  const isPartnerEmailValid = useMemo(() => !partnerName || validateEmail(partnerEmail), [partnerName, partnerEmail])
  const isPartnerCpfValid = useMemo(() => !partnerName || validateCPF(partnerCpf), [partnerName, partnerCpf])
  const isPartnerPhoneValid = useMemo(() => {
    if (!partnerName) return true
    const digits = partnerPhone.replace(/\D/g, '')
    return digits.length === 10 || digits.length === 11
  }, [partnerName, partnerPhone])
  const isPartnerShirtSizeValid = !partnerName || partnerShirtSize.length > 0
  const isPartnerDataValid = !partnerName || (
    partnerEmail.length > 0 && isPartnerEmailValid &&
    partnerCpf.length > 0 && isPartnerCpfValid &&
    partnerPhone.length > 0 && isPartnerPhoneValid &&
    isPartnerShirtSizeValid
  )

  // Team member validation
  const isTeamDataValid = useMemo(() => {
    if (!isTeamRegistration) return true
    return teamMembersData.every((member) => {
      const isNameValid = member.name.trim().length >= 3
      const isEmailValid = validateEmail(member.email)
      const isCpfValid = validateCPF(member.cpf)
      const phoneDigits = member.phone.replace(/\D/g, '')
      const isPhoneValid = phoneDigits.length === 10 || phoneDigits.length === 11
      const isSizeValid = member.shirtSize.length > 0
      return isNameValid && isEmailValid && isCpfValid && isPhoneValid && isSizeValid
    })
  }, [isTeamRegistration, teamMembersData])

  const isFormValid = isUserDataValid && termsAccepted && isPartnerDataValid && isTeamDataValid

  // Get current search params for login redirect
  const searchParams = useSearchParams()

  // Handle login redirect with current URL preserved
  const handleLogin = useCallback(() => {
    const currentUrl = `/inscricao?${searchParams.toString()}`
    window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
  }, [searchParams])

  const isFreeEvent = event.event_type === 'free' || event.event_type === 'solidarity'
  const buttonLabel = isSubmitting
    ? 'Processando...'
    : isFreeEvent
      ? 'Confirmar Inscrição'
      : 'Prosseguir para Pagamento'

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()

    if (!isFormValid || isSubmitting) {
      setError('Verifique os campos obrigatórios antes de continuar.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare partner data if partnerName exists
      const partnerData = partnerName ? {
        name: partnerName,
        email: partnerEmail.trim(),
        cpf: partnerCpf,
        phone: partnerPhone,
        shirtSize: partnerShirtSize,
        shirtGender: partnerShirtGender,
      } : null
      const userData = {
        name: name.trim(),
        email: email.trim(),
        cpf: userCpf,
        phone: userPhone,
        shirtSize: userShirtSize,
        shirtGender: userShirtGender,
      }
      // Prepare team members data if team registration
      const teamMembersPayload: ParticipantData[] | null = isTeamRegistration
        ? teamMembersData.map((member) => ({
            name: member.name.trim(),
            email: member.email.trim(),
            cpf: member.cpf,
            phone: member.phone,
            shirtSize: member.shirtSize,
            shirtGender: member.shirtGender,
          }))
        : null

      if (isFreeEvent) {
        // Free or solidarity event - direct registration
        const response = await fetch('/api/registration/create-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: event.id,
            categoryId: category.id,
            shirtSize: userShirtSize,
            shirtGender: userShirtGender,
            userName: name.trim(),
            userEmail: email.trim(),
            userData,
            partnerName: partnerName || null,
            partnerData,
            teamMembers: teamMembersPayload,
          }),
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}))
          // Handle specific error codes from backend validation
          const errorMessage = errorPayload?.error || 'Não foi possível completar a inscrição.'
          const errorCode = errorPayload?.code

          if (errorCode === 'EVENT_FULL' || errorCode === 'CATEGORY_FULL') {
            throw new Error(`${errorMessage} Tente outra categoria.`)
          } else if (errorCode === 'REGISTRATION_CLOSED' || errorCode === 'REGISTRATION_NOT_STARTED') {
            throw new Error(errorMessage)
          } else if (errorCode === 'ALREADY_REGISTERED') {
            throw new Error('Você já está inscrito nesta categoria. Verifique em "Minha Conta".')
          }

          throw new Error(errorMessage)
        }

        const data = await response.json()

        if (data?.success) {
          window.location.href = `/confirmacao?registration=${data.registrationId}`
        } else {
          throw new Error('Resposta inválida do servidor.')
        }
      } else {
        // Paid event - Stripe checkout
        const response = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: event.id,
            categoryId: category.id,
            shirtSize: userShirtSize,
            shirtGender: userShirtGender,
            userName: name.trim(),
            userEmail: email.trim(),
            userData,
            partnerName: partnerName || null,
            partnerData,
            teamMembers: teamMembersPayload,
            subtotal: adjustedPriceBreakdown.subtotal,
            clubDiscount: appliedDiscount.type === 'club' ? appliedDiscount.amount : undefined,
            couponCode: appliedDiscount.type === 'coupon' ? couponCode : null,
            couponDiscount: appliedDiscount.type === 'coupon' ? appliedDiscount.amount : undefined,
            serviceFee: adjustedPriceBreakdown.serviceFee,
            total: adjustedPriceBreakdown.total,
          }),
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}))
          // Handle specific error codes from backend validation
          const errorMessage = errorPayload?.error || 'Não foi possível iniciar o pagamento.'
          const errorCode = errorPayload?.code

          if (errorCode === 'EVENT_FULL' || errorCode === 'CATEGORY_FULL') {
            throw new Error(`${errorMessage} Tente outra categoria.`)
          } else if (errorCode === 'REGISTRATION_CLOSED' || errorCode === 'REGISTRATION_NOT_STARTED') {
            throw new Error(errorMessage)
          } else if (errorCode === 'ALREADY_REGISTERED') {
            throw new Error('Você já está inscrito nesta categoria. Verifique em "Minha Conta".')
          }

          throw new Error(errorMessage)
        }

        const data = (await response.json()) as CheckoutSessionResponse

        if (data?.url) {
          window.location.href = data.url
        } else {
          throw new Error('Resposta inválida do servidor.')
        }
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Erro inesperado. Tente novamente.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 pb-28">
      {/* Header + Hero with gradient background */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600">
        <NavigationHeader
          variant="transparent"
          sticky={false}
          isAuthenticated={isAuthenticated}
          userName={user?.full_name || ''}
          userEmail={user?.email ?? undefined}
          onLogin={handleLogin}
        />
        <div className="border-b border-white/20" />
        <div className="container relative z-10 mx-auto px-5 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-white font-geist">
            Revise suas informações
          </h1>
        </div>
      </div>

      <form
        id="review-form"
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col"
      >
        <div className="container mx-auto flex-1 px-5 sm:px-6 lg:px-8 pt-16">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Seus dados section */}
            <section>
              <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
                Seus dados
              </h2>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 font-geist">Nome completo</label>
                  <input
                    data-testid="name-input"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !!name && !isNameValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                    )}
                  />
                  {!isNameValid && name && (
                    <p className="text-sm text-rose-500">Informe seu nome completo.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 font-geist">E-mail</label>
                  <input
                    data-testid="email-input"
                    type="email"
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !!email && !isEmailValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                    )}
                  />
                  {!isEmailValid && email && (
                    <p className="text-sm text-rose-500">Informe um e-mail válido.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 font-geist">CPF</label>
                  <input
                    data-testid="cpf-input"
                    type="text"
                    placeholder="000.000.000-00"
                    value={userCpf}
                    onChange={(event) => setUserCpf(formatCPF(event.target.value))}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !!userCpf && !isUserCpfValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                    )}
                  />
                  {!isUserCpfValid && userCpf && (
                    <p className="text-sm text-rose-500">CPF inválido.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 font-geist">Telefone</label>
                  <input
                    data-testid="phone-input"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={userPhone}
                    onChange={(event) => setUserPhone(formatPhone(event.target.value))}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !!userPhone && !isUserPhoneValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                    )}
                  />
                  {!isUserPhoneValid && userPhone && (
                    <p className="text-sm text-rose-500">Telefone inválido.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-700 font-geist">
                    Tamanho da camiseta
                  </label>

                  <div>
                    <p className="text-xs text-neutral-500 font-geist mb-2">Gênero</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(GENDER_LABELS) as ShirtGender[])
                        .filter(gender => {
                          if (!shirtSizesConfig) return true
                          return shirtSizesConfig[gender] && shirtSizesConfig[gender].length > 0
                        })
                        .map((gender) => (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => {
                              setUserShirtGender(gender)
                              const newSizes = shirtSizesConfig
                                ? shirtSizesConfig[gender]
                                : DEFAULT_SHIRT_SIZES_BY_GENDER[gender]
                              if (newSizes && newSizes.length > 0) {
                                setUserShirtSize(newSizes[0])
                              }
                            }}
                            className={cn(
                              'h-10 rounded-xl border-2 font-semibold text-xs transition-all',
                              userShirtGender === gender
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                            )}
                          >
                            {GENDER_LABELS[gender]}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500 font-geist mb-2">Tamanho</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {userAvailableSizes?.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setUserShirtSize(size)}
                          className={cn(
                            'h-12 rounded-xl border-2 font-semibold text-sm transition-all',
                            userShirtSize === size
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-500 font-inter">
                  Sua conta será criada automaticamente com estes dados.
                </p>
              </div>
            </section>

            {/* Partner data section */}
            {partnerName && (
              <section>
                <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-orange-600" />
                  Dados do Parceiro(a)
                </h2>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 font-geist">Nome completo</label>
                    <Input
                      type="text"
                      value={partnerName}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 font-geist">E-mail</label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={partnerEmail}
                      onChange={(event) => setPartnerEmail(event.target.value)}
                      error={!!partnerEmail && !isPartnerEmailValid}
                    />
                    {!isPartnerEmailValid && partnerEmail && (
                      <p className="text-sm text-rose-500">Informe um e-mail válido.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 font-geist">CPF</label>
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={partnerCpf}
                      onChange={(event) => setPartnerCpf(formatCPF(event.target.value))}
                      error={!!partnerCpf && !isPartnerCpfValid}
                    />
                    {!isPartnerCpfValid && partnerCpf && (
                      <p className="text-sm text-rose-500">CPF inválido.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 font-geist">Telefone</label>
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={partnerPhone}
                      onChange={(event) => setPartnerPhone(formatPhone(event.target.value))}
                      error={!!partnerPhone && !isPartnerPhoneValid}
                    />
                    {!isPartnerPhoneValid && partnerPhone && (
                      <p className="text-sm text-rose-500">Telefone inválido.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-700 font-geist">
                      Tamanho da camiseta
                    </label>

                    {/* Gender Selector */}
                    <div>
                      <p className="text-xs text-neutral-500 font-geist mb-2">Gênero</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(GENDER_LABELS) as ShirtGender[])
                          .filter(gender => {
                            if (!shirtSizesConfig) return true
                            return shirtSizesConfig[gender] && shirtSizesConfig[gender].length > 0
                          })
                          .map((gender) => (
                            <button
                              key={gender}
                              type="button"
                              onClick={() => {
                                setPartnerShirtGender(gender)
                                // Reset shirt size when gender changes
                                const newSizes = shirtSizesConfig
                                  ? shirtSizesConfig[gender]
                                  : DEFAULT_SHIRT_SIZES_BY_GENDER[gender]
                                if (newSizes && newSizes.length > 0) {
                                  setPartnerShirtSize(newSizes[0])
                                }
                              }}
                              className={cn(
                                'h-10 rounded-xl border-2 font-semibold text-xs transition-all',
                                partnerShirtGender === gender
                                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                              )}
                            >
                              {GENDER_LABELS[gender]}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Size Grid */}
                    <div>
                      <p className="text-xs text-neutral-500 font-geist mb-2">Tamanho</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {partnerAvailableSizes?.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setPartnerShirtSize(size)}
                            className={cn(
                              'h-12 rounded-xl border-2 font-semibold text-sm transition-all',
                              partnerShirtSize === size
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 font-inter">
                    Informe os dados completos do seu parceiro(a) de dupla.
                  </p>
                </div>
              </section>
            )}

            {/* Team members data section */}
            {isTeamRegistration && (
              <section>
                <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-600" />
                  Dados da Equipe ({teamMembersData.length + 1} pessoas)
                </h2>
                <div className="space-y-4">
                  {teamMembersData.map((member, index) => {
                    const memberAvailableSizes = shirtSizesConfig?.[member.shirtGender]?.length
                      ? shirtSizesConfig[member.shirtGender]
                      : DEFAULT_SHIRT_SIZES_BY_GENDER[member.shirtGender]

                    const isMemberNameValid = member.name.trim().length >= 3
                    const isMemberEmailValid = validateEmail(member.email)
                    const isMemberCpfValid = validateCPF(member.cpf)
                    const memberPhoneDigits = member.phone.replace(/\D/g, '')
                    const isMemberPhoneValid = memberPhoneDigits.length === 10 || memberPhoneDigits.length === 11

                    return (
                      <div key={index} className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 sm:p-5 space-y-4">
                        <h3 className="text-lg font-semibold text-purple-900 font-geist">
                          Membro {index + 2}
                        </h3>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-neutral-700 font-geist">Nome completo</label>
                          <input
                            type="text"
                            placeholder="Nome completo"
                            value={member.name}
                            onChange={(e) => {
                              const updated = [...teamMembersData]
                              updated[index].name = e.target.value
                              setTeamMembersData(updated)
                            }}
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              !!member.name && !isMemberNameValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                            )}
                          />
                          {!isMemberNameValid && member.name && (
                            <p className="text-sm text-rose-500">Informe o nome completo.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-neutral-700 font-geist">E-mail</label>
                          <input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={member.email}
                            onChange={(e) => {
                              const updated = [...teamMembersData]
                              updated[index].email = e.target.value
                              setTeamMembersData(updated)
                            }}
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              !!member.email && !isMemberEmailValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                            )}
                          />
                          {!isMemberEmailValid && member.email && (
                            <p className="text-sm text-rose-500">Informe um e-mail válido.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-neutral-700 font-geist">CPF</label>
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={member.cpf}
                            onChange={(e) => {
                              const updated = [...teamMembersData]
                              updated[index].cpf = formatCPF(e.target.value)
                              setTeamMembersData(updated)
                            }}
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              !!member.cpf && !isMemberCpfValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                            )}
                          />
                          {!isMemberCpfValid && member.cpf && (
                            <p className="text-sm text-rose-500">CPF inválido.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-neutral-700 font-geist">Telefone</label>
                          <input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={member.phone}
                            onChange={(e) => {
                              const updated = [...teamMembersData]
                              updated[index].phone = formatPhone(e.target.value)
                              setTeamMembersData(updated)
                            }}
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              !!member.phone && !isMemberPhoneValid ? "border-rose-500 focus-visible:ring-rose-500" : ""
                            )}
                          />
                          {!isMemberPhoneValid && member.phone && (
                            <p className="text-sm text-rose-500">Telefone inválido.</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-neutral-700 font-geist">
                            Tamanho da camiseta
                          </label>

                          <div>
                            <p className="text-xs text-neutral-500 font-geist mb-2">Gênero</p>
                            <div className="grid grid-cols-3 gap-2">
                              {(Object.keys(GENDER_LABELS) as ShirtGender[])
                                .filter(gender => {
                                  if (!shirtSizesConfig) return true
                                  return shirtSizesConfig[gender] && shirtSizesConfig[gender].length > 0
                                })
                                .map((gender) => (
                                  <button
                                    key={gender}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...teamMembersData]
                                      updated[index].shirtGender = gender
                                      const newSizes = shirtSizesConfig
                                        ? shirtSizesConfig[gender]
                                        : DEFAULT_SHIRT_SIZES_BY_GENDER[gender]
                                      if (newSizes && newSizes.length > 0) {
                                        updated[index].shirtSize = newSizes[0] as ShirtSize
                                      }
                                      setTeamMembersData(updated)
                                    }}
                                    className={cn(
                                      'h-10 rounded-xl border-2 font-semibold text-xs transition-all',
                                      member.shirtGender === gender
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                                    )}
                                  >
                                    {GENDER_LABELS[gender]}
                                  </button>
                                ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-500 font-geist mb-2">Tamanho</p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {memberAvailableSizes?.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...teamMembersData]
                                    updated[index].shirtSize = size as ShirtSize
                                    setTeamMembersData(updated)
                                  }}
                                  className={cn(
                                    'h-12 rounded-xl border-2 font-semibold text-sm transition-all',
                                    member.shirtSize === size
                                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                                  )}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Solidarity message */}
            {event.event_type === 'solidarity' && event.solidarity_message && (
              <section>
                <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-orange-900 mb-1">Evento Solidário</h3>
                      <p className="text-sm text-orange-800">{event.solidarity_message}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Detalhes do evento section */}
            <section>
              <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
                Detalhes do evento
              </h2>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                <EventSummaryCard event={event} category={category} />
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500 font-geist">Tamanho escolhido</p>
                  <p className="text-base font-semibold text-neutral-900 font-geist">Camiseta {userShirtSize}</p>
                </div>
                {partnerName && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500 font-geist">Parceiro(a) da dupla</p>
                    <p className="text-base font-semibold text-neutral-900 font-geist">{partnerName}</p>
                    {partnerShirtSize && (
                      <p className="text-sm text-neutral-600 font-geist mt-1">Camiseta {partnerShirtSize}</p>
                    )}
                  </div>
                )}
                {isTeamRegistration && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500 font-geist">Equipe ({teamMembersData.length + 1} pessoas)</p>
                    <ul className="mt-2 space-y-1">
                      {teamMembersData.map((member, index) => (
                        <li key={index} className="text-sm text-neutral-700 font-geist">
                          {member.name || `Membro ${index + 2}`} {member.shirtSize && `- Camiseta ${member.shirtSize}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Club member discount banner - only show when club discount is the applied discount */}
            {isClubMember && appliedDiscount.type === 'club' && !isFreeEvent && (
              <section>
                <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-900">Desconto de Membro do Clube</p>
                      <p className="text-xs text-orange-700">10% de desconto aplicado automaticamente</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      -{formatCurrency(appliedDiscount.amount)}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Resumo de valores section */}
            {!isFreeEvent && (
              <section>
                <h2 className="text-xl sm:text-2xl tracking-tight font-geist font-semibold text-neutral-900 mb-4">
                  Resumo de valores
                </h2>
                <PriceBreakdownCard
                  subtotal={categoryPrice}
                  clubDiscount={appliedDiscount.type === 'club' ? appliedDiscount.amount : undefined}
                  couponDiscount={appliedDiscount.type === 'coupon' ? appliedDiscount.amount : undefined}
                  serviceFee={adjustedPriceBreakdown.serviceFee}
                  total={adjustedPriceBreakdown.total}
                />
              </section>
            )}

            {/* Terms checkbox section */}
            <section className="mt-8">
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  className="peer sr-only"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <label
                  htmlFor="terms"
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-neutral-300 bg-white transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500 shrink-0"
                >
                  <svg
                    className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </label>
                <label htmlFor="terms" className="text-sm text-neutral-600 font-inter cursor-pointer">
                  Li e concordo com o{' '}
                  <a
                    href="/uso-de-imagem"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline underline-offset-2 hover:text-orange-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Uso de imagem
                  </a>
                  {' '}do evento e{' '}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline underline-offset-2 hover:text-orange-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Termos de uso
                  </a>
                  {' '}da plataforma.
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
      </form>

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
              onClick={(e) => {
                e.preventDefault()
                const form = document.getElementById('review-form') as HTMLFormElement
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
                  form.dispatchEvent(submitEvent)
                }
              }}
            >
              {buttonLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
