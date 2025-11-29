import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { calculateServiceFee, calculateTotal, validateEmail, validateCPF } from '@/lib/utils'
import { getEnv } from '@/lib/env'
import { createRegistration, updateRegistrationStripeSession } from '@/lib/data/registrations'
import { validateRegistration } from '@/lib/validations/registration-guards'
import type { CheckoutSessionRequest, ShirtSize, PartnerData, ShirtGender, ParticipantData } from '@/types'

export const runtime = 'nodejs'

const ALLOWED_SHIRT_SIZES: ShirtSize[] = ['P', 'M', 'G', 'GG', 'XG']
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
      subtotal,
      serviceFee,
      total,
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

    const supabase = createClient()
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

    // Validate event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', eventId)
      .eq('status', 'published')
      .single()

    if (eventError || !event) {
      console.error('Evento não encontrado ou indisponível:', eventError)
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
    }

    // Validate category
    const { data: category, error: categoryError } = await supabase
      .from('event_categories')
      .select('id, name, price, event_id')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category || category.event_id !== event.id) {
      console.error('Categoria inválida para o evento:', categoryError)
      return NextResponse.json({ error: 'Categoria inválida para este evento.' }, { status: 404 })
    }

    const categoryPrice = typeof category.price === 'number' ? category.price : Number(category.price)
    if (Number.isNaN(categoryPrice)) {
      return NextResponse.json({ error: 'Preço da categoria inválido.' }, { status: 400 })
    }

    const serverSubtotal = categoryPrice
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

    // Validate registration constraints (capacity, window, pair registration)
    const isPairRegistration = !!normalizedPartnerData
    const validationResult = await validateRegistration(
      supabase,
      event.id,
      category.id,
      targetUserId,
      isPairRegistration
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
      supabase
    )

    if (!registrationResult.data || registrationResult.error) {
      console.error('Erro ao criar registro de inscrição:', registrationResult.error)
      return NextResponse.json(
        { error: 'Não foi possível criar sua inscrição. Tente novamente.' },
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
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: normalizedEmail,
      payment_intent_data: {
        metadata: {
          registrationId: registrationResult.data.id,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(serverTotal * 100),
            product_data: {
              name: `${event.title} - ${category.name}`,
              description: `Inscrição + taxa de serviço (${shirtSize})`,
            },
          },
        },
      ],
      metadata: {
        registrationId: registrationResult.data.id,
        eventId: event.id,
        categoryId: category.id,
        userId: targetUserId,
        shirtSize,
        partnerData: normalizedPartnerData ? JSON.stringify(normalizedPartnerData) : '',
      },
      success_url: `${env.app.baseUrl}/confirmacao?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.app.baseUrl}/inscricao?${cancelUrlParams.toString()}`,
    })

    if (!session.url) {
      console.error('Stripe session criada sem URL retornada.')
      return NextResponse.json(
        { error: 'Não foi possível iniciar o pagamento. Tente novamente.' },
        { status: 500 }
      )
    }

    await updateRegistrationStripeSession(registrationResult.data.id, session.id, supabase)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      registrationId: registrationResult.data.id,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Não foi possível iniciar o checkout. Tente novamente.' },
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
