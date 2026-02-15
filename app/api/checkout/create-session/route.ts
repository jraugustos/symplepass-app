import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calculateServiceFee, calculateTotal, validateEmail, validateCPF } from '@/lib/utils'
import { getEnv } from '@/lib/env'
import { createRegistration, updateRegistrationMpPreference } from '@/lib/data/registrations'
import { createEventRegistrationPreference } from '@/lib/mercadopago/checkout'
import { validateRegistration } from '@/lib/validations/registration-guards'
import { getClubMemberDiscount } from '@/lib/data/subscriptions'
import { validateCoupon, applyCoupon } from '@/lib/data/admin-coupons'
import type { CheckoutSessionRequest, ShirtSize, ShirtGender, ParticipantData } from '@/types'

export const runtime = 'nodejs'

const ALLOWED_SHIRT_SIZES: ShirtSize[] = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG']
const VALID_SHIRT_GENDERS: ShirtGender[] = ['masculino', 'feminino', 'infantil']
const PRICE_TOLERANCE = 0.01

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutSessionRequest

    const {
      eventId,
      categoryId,
      shirtSize,
      shirtGender,
      userName,
      userEmail,
      userData,
      partnerName,
      partnerData,
      teamMembers,
      subtotal,
      clubDiscount,
      couponCode,
      serviceFee,
      total,
      customFieldValues,
      selectedKitItems,
      kitItemsTotal,
    } = body || {}

    if (
      !eventId ||
      !categoryId ||
      !shirtSize ||
      !userName?.trim() ||
      !userEmail?.trim() ||
      !userData ||
      typeof subtotal !== 'number' ||
      typeof serviceFee !== 'number' ||
      typeof total !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Dados obrigatórios ausentes. Verifique o evento, categoria e seus dados.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_SHIRT_SIZES.includes(shirtSize)) {
      return NextResponse.json({ error: 'Tamanho de camiseta inválido.' }, { status: 400 })
    }

    // Validate main user data
    if (!userData.name || !userData.email || !userData.cpf || !userData.phone || !userData.shirtSize) {
      return NextResponse.json({ error: 'Dados do participante incompletos.' }, { status: 400 })
    }

    if (!validateCPF(userData.cpf)) {
      return NextResponse.json({ error: 'CPF do participante inválido.' }, { status: 400 })
    }

    const userPhoneDigits = userData.phone.replace(/\D/g, '')
    if (userPhoneDigits.length !== 10 && userPhoneDigits.length !== 11) {
      return NextResponse.json({ error: 'Telefone do participante inválido.' }, { status: 400 })
    }

    if (!ALLOWED_SHIRT_SIZES.includes(userData.shirtSize as ShirtSize)) {
      return NextResponse.json({ error: 'Tamanho de camiseta do participante inválido.' }, { status: 400 })
    }

    if (userData.shirtSize !== shirtSize) {
      return NextResponse.json({ error: 'O tamanho de camiseta do titular não confere.' }, { status: 400 })
    }

    if (userData.shirtGender && !isValidShirtGender(userData.shirtGender)) {
      return NextResponse.json({ error: 'Gênero da camiseta do participante inválido.' }, { status: 400 })
    }

    // Validate partner data if present
    if (partnerData) {
      if (!partnerData.name || !partnerData.email || !partnerData.cpf || !partnerData.phone || !partnerData.shirtSize) {
        return NextResponse.json({ error: 'Dados do parceiro incompletos.' }, { status: 400 })
      }

      if (!validateEmail(partnerData.email)) {
        return NextResponse.json({ error: 'Email do parceiro inválido.' }, { status: 400 })
      }

      if (!validateCPF(partnerData.cpf)) {
        return NextResponse.json({ error: 'CPF do parceiro inválido.' }, { status: 400 })
      }

      const phoneDigits = partnerData.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
        return NextResponse.json({ error: 'Telefone do parceiro inválido.' }, { status: 400 })
      }

      if (!ALLOWED_SHIRT_SIZES.includes(partnerData.shirtSize as ShirtSize)) {
        return NextResponse.json({ error: 'Tamanho de camiseta do parceiro inválido.' }, { status: 400 })
      }

      if (partnerData.shirtGender && !isValidShirtGender(partnerData.shirtGender)) {
        return NextResponse.json({ error: 'Gênero da camiseta do parceiro inválido.' }, { status: 400 })
      }
    }

    // Validate team members data if present
    if (teamMembers && teamMembers.length > 0) {
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i]
        if (!member.name || !member.email || !member.cpf || !member.phone || !member.shirtSize) {
          return NextResponse.json({ error: `Dados do membro ${i + 2} incompletos.` }, { status: 400 })
        }

        if (!validateEmail(member.email)) {
          return NextResponse.json({ error: `Email do membro ${i + 2} inválido.` }, { status: 400 })
        }

        if (!validateCPF(member.cpf)) {
          return NextResponse.json({ error: `CPF do membro ${i + 2} inválido.` }, { status: 400 })
        }

        const phoneDigits = member.phone.replace(/\D/g, '')
        if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
          return NextResponse.json({ error: `Telefone do membro ${i + 2} inválido.` }, { status: 400 })
        }

        if (!ALLOWED_SHIRT_SIZES.includes(member.shirtSize as ShirtSize)) {
          return NextResponse.json({ error: `Tamanho de camiseta do membro ${i + 2} inválido.` }, { status: 400 })
        }

        if (member.shirtGender && !isValidShirtGender(member.shirtGender)) {
          return NextResponse.json({ error: `Gênero da camiseta do membro ${i + 2} inválido.` }, { status: 400 })
        }
      }
    }

    const supabase = createClient()
    const adminSupabase = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const normalizedBodyEmail = userEmail.toLowerCase()
    // Authenticated users keep their contact email tied to the session to avoid divergence with Supabase auth.
    const normalizedEmail = (user?.email?.toLowerCase() || normalizedBodyEmail).trim()
    const normalizedName = (user?.user_metadata?.full_name || userName).trim()

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }

    if (!normalizedName) {
      return NextResponse.json({ error: 'Informe um nome válido.' }, { status: 400 })
    }

    // Validate event (use admin client to bypass RLS for server-side validation)
    const { data: eventData, error: eventError } = await adminSupabase
      .from('events')
      .select('id, title, slug')
      .eq('id', eventId)
      .eq('status', 'published')
      .single()

    const event = eventData as { id: string; title: string; slug: string } | null

    if (eventError || !event) {
      console.error('Evento não encontrado ou indisponível:', eventError)
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
    }

    // Validate category (use admin client to bypass RLS for server-side validation)
    const { data: categoryData, error: categoryError } = await adminSupabase
      .from('event_categories')
      .select('id, name, price, event_id')
      .eq('id', categoryId)
      .single()

    const category = categoryData as { id: string; name: string; price: number; event_id: string } | null

    if (categoryError || !category || category.event_id !== event.id) {
      console.error('Categoria inválida para o evento:', categoryError)
      return NextResponse.json({ error: 'Categoria inválida para este evento.' }, { status: 404 })
    }

    const categoryPrice = typeof category.price === 'number' ? category.price : Number(category.price)
    if (Number.isNaN(categoryPrice)) {
      return NextResponse.json({ error: 'Preço da categoria inválido.' }, { status: 400 })
    }

    // Identify user first for discount validation
    const targetUserId =
      user?.id ||
      (await getOrCreateCheckoutUser({
        supabase,
        email: normalizedEmail,
        fullName: normalizedName,
      }))

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário autenticado.' },
        { status: 401 }
      )
    }

    // Calculate server-side discounts (use admin client to bypass RLS on subscriptions table)
    const clubDiscountData = await getClubMemberDiscount(targetUserId, categoryPrice, adminSupabase)

    // Validate coupon if provided
    let couponDiscountData: { valid: boolean; discountAmount?: number; coupon?: any } = { valid: false }
    if (couponCode) {
      couponDiscountData = await validateCoupon(couponCode, event.id, targetUserId, categoryPrice)
    }

    // Apply the greater discount (non-cumulative)
    let appliedDiscount = 0
    let discountType: 'club' | 'coupon' | null = null

    if (clubDiscountData.isEligible && couponDiscountData.valid) {
      // Both available: apply the greater discount
      if (clubDiscountData.discountAmount >= (couponDiscountData.discountAmount || 0)) {
        appliedDiscount = clubDiscountData.discountAmount
        discountType = 'club'
      } else {
        appliedDiscount = couponDiscountData.discountAmount || 0
        discountType = 'coupon'
      }
    } else if (clubDiscountData.isEligible) {
      appliedDiscount = clubDiscountData.discountAmount
      discountType = 'club'
    } else if (couponDiscountData.valid) {
      appliedDiscount = couponDiscountData.discountAmount || 0
      discountType = 'coupon'
    }

    // Validate selected kit items if present
    let kitItemsPayload: Array<{ id: string; price: number; details: any }> = []
    let serverKitItemsTotal = 0

    if (selectedKitItems && selectedKitItems.length > 0) {
      const { data: kitItemsData, error: kitItemsError } = await adminSupabase
        .from('event_kit_items')
        .select('id, name, description, price, event_id')
        .in('id', selectedKitItems)

      if (kitItemsError || !kitItemsData) {
        console.error('Error fetching kit items:', kitItemsError)
        return NextResponse.json({ error: 'Erro ao validar itens do kit.' }, { status: 500 })
      }

      const typedKitItems = kitItemsData as Array<{
        id: string
        name: string
        description: string | null
        price: number
        event_id: string
      }>

      // Verify count matches (to ensure all IDs were found)
      if (typedKitItems.length !== selectedKitItems.length) {
        return NextResponse.json({ error: 'Um ou mais itens do kit não foram encontrados.' }, { status: 400 })
      }

      // Verify all items belong to this event
      const invalidItems = typedKitItems.filter(item => item.event_id !== eventId)
      if (invalidItems.length > 0) {
        return NextResponse.json({ error: 'Itens do kit inválidos para este evento.' }, { status: 400 })
      }

      serverKitItemsTotal = typedKitItems.reduce((acc, item) => acc + item.price, 0)

      kitItemsPayload = typedKitItems.map(item => ({
        id: item.id,
        price: item.price,
        details: { name: item.name, description: item.description }
      }))
    }

    // Recalculate values with discount and kit items
    // Subtotal here usually refers to (Registration Price - Discount)
    // But incoming `subtotal` might behave differently in frontend calculation.
    // Let's align with ReviewClient:
    // ReviewClient: subtotal = (categoryPrice - discount) + kitItemsTotal

    // Server calculation:
    const discountedCategoryPrice = Math.max(0, categoryPrice - appliedDiscount)
    const serverSubtotal = discountedCategoryPrice + serverKitItemsTotal
    const serverServiceFee = calculateServiceFee(serverSubtotal)
    const serverTotal = calculateTotal(serverSubtotal, serverServiceFee)

    if (
      isAmountDifferent(subtotal, serverSubtotal) ||
      isAmountDifferent(serviceFee, serverServiceFee) ||
      isAmountDifferent(total, serverTotal)
    ) {
      return NextResponse.json(
        { error: 'Os valores informados não conferem. Recarregue a página e tente novamente.' },
        { status: 400 }
      )
    }

    const normalizedUserData: ParticipantData = {
      name: normalizedName,
      email: normalizedEmail,
      cpf: userData.cpf.trim(),
      phone: userData.phone.trim(),
      shirtSize: userData.shirtSize as ShirtSize,
      shirtGender: isValidShirtGender(userData.shirtGender)
        ? userData.shirtGender
        : isValidShirtGender(shirtGender)
          ? shirtGender
          : undefined,
    }

    const normalizedPartnerName = partnerName?.trim() || null
    const normalizedPartnerData = partnerData
      ? {
        name: partnerData.name,
        email: partnerData.email.trim(),
        cpf: partnerData.cpf.trim(),
        phone: partnerData.phone.trim(),
        shirtSize: partnerData.shirtSize as ShirtSize,
        shirtGender: isValidShirtGender(partnerData.shirtGender) ? partnerData.shirtGender : undefined,
      }
      : null

    // Normalize team members data
    const normalizedTeamMembers = teamMembers && teamMembers.length > 0
      ? teamMembers.map((member) => ({
        name: member.name.trim(),
        email: member.email.trim(),
        cpf: member.cpf.trim(),
        phone: member.phone.trim(),
        shirtSize: member.shirtSize as ShirtSize,
        shirtGender: isValidShirtGender(member.shirtGender) ? member.shirtGender : undefined,
      }))
      : null

    // Validate registration constraints (capacity, window, pair/team registration)
    const isPairRegistration = !!normalizedPartnerData
    const isTeamRegistration = !!normalizedTeamMembers && normalizedTeamMembers.length > 0
    const teamSize = isTeamRegistration ? normalizedTeamMembers.length + 1 : undefined

    const validationResult = await validateRegistration(
      adminSupabase,
      event.id,
      category.id,
      targetUserId,
      isPairRegistration,
      isTeamRegistration,
      teamSize
    )

    if (!validationResult.valid) {
      const statusCode = validationResult.errorCode === 'ALREADY_REGISTERED' ? 409 : 400
      return NextResponse.json(
        { error: validationResult.error, code: validationResult.errorCode },
        { status: statusCode }
      )
    }

    await persistUserProfile({
      supabase,
      userId: targetUserId,
      fullName: normalizedName,
      cpf: normalizedUserData.cpf,
      phone: normalizedUserData.phone,
    })

    const registrationResult = await createRegistration(
      targetUserId,
      event.id,
      category.id,
      shirtSize,
      serverTotal,
      undefined,
      normalizedPartnerName,
      normalizedPartnerData,
      normalizedUserData,
      normalizedTeamMembers,
      customFieldValues,
      kitItemsPayload.length > 0 ? kitItemsPayload : undefined,
      supabase
    )

    if (!registrationResult.data || registrationResult.error) {
      console.error('Erro ao criar registro de inscrição:', {
        error: registrationResult.error,
        userId: targetUserId,
        eventId: event.id,
        categoryId: category.id,
        isPairRegistration
      })
      return NextResponse.json(
        { error: registrationResult.error || 'Não foi possível criar sua inscrição. Tente novamente.' },
        { status: 500 }
      )
    }

    const cancelUrlParams = new URLSearchParams({
      event: event.slug,
      category: category.id,
      size: shirtSize,
    })

    if (normalizedUserData.shirtGender) {
      cancelUrlParams.set('gender', normalizedUserData.shirtGender)
    }
    if (normalizedPartnerName) {
      cancelUrlParams.set('partner', normalizedPartnerName)
    }
    if (normalizedPartnerData?.shirtSize) {
      cancelUrlParams.set('partner_size', normalizedPartnerData.shirtSize)
    }
    if (normalizedPartnerData?.shirtGender) {
      cancelUrlParams.set('partner_gender', normalizedPartnerData.shirtGender)
    }

    const env = getEnv()

    // Create Mercado Pago Checkout Pro preference
    const mpPreference = await createEventRegistrationPreference({
      registrationId: registrationResult.data.id,
      eventTitle: event.title,
      categoryName: category.name,
      description: `Inscrição ${shirtSize}${serverKitItemsTotal > 0 ? ' + Kit' : ''} + taxa`,
      totalAmount: serverTotal, // BRL (reais), NOT centavos
      payerEmail: normalizedEmail,
      eventId: event.id,
      categoryId: category.id,
      userId: targetUserId,
      cancelUrlParams: cancelUrlParams.toString(),
    })

    if (!mpPreference.initPoint) {
      console.error('Mercado Pago preference criada sem URL retornada.')
      return NextResponse.json(
        { error: 'Não foi possível iniciar o pagamento. Tente novamente.' },
        { status: 500 }
      )
    }

    // Update registration with MP preference ID
    await updateRegistrationMpPreference(registrationResult.data.id, mpPreference.id, supabase)

    // Register coupon usage if coupon was applied
    if (discountType === 'coupon' && couponDiscountData.coupon) {
      await applyCoupon(
        couponDiscountData.coupon.id,
        targetUserId,
        registrationResult.data.id,
        appliedDiscount
      )
    }

    return NextResponse.json({
      preferenceId: mpPreference.id,
      url: mpPreference.initPoint,
      registrationId: registrationResult.data.id,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    const errorMessage = error instanceof Error
      ? error.message
      : JSON.stringify(error, null, 2)
    return NextResponse.json(
      {
        error: 'Não foi possível iniciar o checkout. Tente novamente.',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage }),
      },
      { status: 500 }
    )
  }
}

function generateTempPassword(): string {
  const random = Math.random().toString(36).slice(-8)
  return `Symp!e${random}${Date.now().toString().slice(-2)}`
}

function isAmountDifferent(clientAmount: number, serverAmount: number): boolean {
  return Math.abs(clientAmount - serverAmount) > PRICE_TOLERANCE
}

function isValidShirtGender(gender?: string | null): gender is ShirtGender {
  return !!gender && VALID_SHIRT_GENDERS.includes(gender as ShirtGender)
}

async function persistUserProfile({
  supabase,
  userId,
  fullName,
  cpf,
  phone,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  fullName: string
  cpf: string
  phone: string
}) {
  const payload: Partial<{ full_name: string; cpf: string; phone: string }> = {}

  if (fullName) payload.full_name = fullName
  if (cpf) payload.cpf = cpf
  if (phone) payload.phone = phone

  if (Object.keys(payload).length === 0) return

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)

  if (error) {
    console.error('Erro ao atualizar perfil do usuário:', error)
  }
}

async function getOrCreateCheckoutUser({
  supabase,
  email,
  fullName,
}: {
  supabase: ReturnType<typeof createClient>
  email: string
  fullName: string
}): Promise<string | null> {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile?.id) {
    return existingProfile.id
  }

  // Temporary approach until passwordless / magic-link authentication is available for checkout signups.
  const tempPassword = generateTempPassword()
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (signUpError || !signUpData?.user) {
    console.error('Erro ao criar usuário temporário:', signUpError)
    return null
  }

  return signUpData.user.id
}
