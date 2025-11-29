import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail, validateCPF } from '@/lib/utils'
import { createRegistration } from '@/lib/data/registrations'
import { updateRegistrationQRCode } from '@/lib/data/registrations'
import { sendConfirmationEmail } from '@/lib/email/send-confirmation'
import { validateRegistration } from '@/lib/validations/registration-guards'
import type { ShirtSize, PartnerData, ShirtGender, ParticipantData } from '@/types'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

const VALID_SHIRT_GENDERS: ShirtGender[] = ['masculino', 'feminino', 'infantil']

interface FreeRegistrationRequest {
    eventId: string
    categoryId: string
    shirtSize: ShirtSize
    shirtGender?: ShirtGender | null
    userName: string
    userEmail: string
    userData: ParticipantData
    partnerName?: string | null
    partnerData?: PartnerData | null
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as FreeRegistrationRequest
        const { eventId, categoryId, shirtSize, shirtGender, userName, userEmail, userData, partnerName, partnerData } = body || {}

        if (
            !eventId ||
            !categoryId ||
            !shirtSize ||
            !userName?.trim() ||
            !userEmail?.trim() ||
            !userData
        ) {
            return NextResponse.json(
                { error: 'Dados obrigatórios ausentes. Verifique o evento, categoria e seus dados.' },
                { status: 400 }
            )
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

            if (partnerData.shirtGender && !isValidShirtGender(partnerData.shirtGender)) {
                return NextResponse.json({ error: 'Gênero da camiseta do parceiro inválido.' }, { status: 400 })
            }
        }

        const supabase = createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const normalizedBodyEmail = userEmail.toLowerCase()
        const normalizedEmail = (user?.email?.toLowerCase() || normalizedBodyEmail).trim()
        const normalizedName = (user?.user_metadata?.full_name || userName).trim()

        if (!validateEmail(normalizedEmail)) {
            return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
        }

        if (!normalizedName) {
            return NextResponse.json({ error: 'Informe um nome válido.' }, { status: 400 })
        }

        // Validate event and check if it's free or solidarity
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, slug, event_type, solidarity_message, start_date, location')
            .eq('id', eventId)
            .eq('status', 'published')
            .single()

        if (eventError || !event) {
            console.error('Evento não encontrado ou indisponível:', eventError)
            return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
        }

        // Ensure event is free or solidarity
        if (event.event_type !== 'free' && event.event_type !== 'solidarity') {
            return NextResponse.json(
                { error: 'Este endpoint é apenas para eventos gratuitos ou solidários.' },
                { status: 400 }
            )
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

        // Verify category price is 0 for free/solidarity events
        const categoryPrice = typeof category.price === 'number' ? category.price : Number(category.price)
        if (categoryPrice !== 0) {
            return NextResponse.json(
                { error: 'Categoria deve ter preço zero para eventos gratuitos/solidários.' },
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

        // Create registration with confirmed status and paid payment_status
        const registrationResult = await createRegistration(
            targetUserId,
            event.id,
            category.id,
            shirtSize,
            0, // amount is 0 for free events
            undefined, // no stripe session
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

        // If registration is already confirmed (idempotent case), skip update and return success
        const isAlreadyConfirmed = registrationResult.data.status === 'confirmed' && registrationResult.data.payment_status === 'paid'

        if (!isAlreadyConfirmed) {
            // Update registration to confirmed status immediately
            const { error: updateError } = await supabase
                .from('registrations')
                .update({
                    status: 'confirmed',
                    payment_status: 'paid',
                })
                .eq('id', registrationResult.data.id)

            if (updateError) {
                console.error('Erro ao confirmar inscrição:', updateError)
                return NextResponse.json(
                    { error: 'Não foi possível confirmar sua inscrição. Tente novamente.' },
                    { status: 500 }
                )
            }
        }

        // Generate QR code
        const ticketCode = `${event.slug.toUpperCase()}-${registrationResult.data.id.slice(0, 8).toUpperCase()}`
        const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
        })

        // Save QR code to registration
        await updateRegistrationQRCode(registrationResult.data.id, qrCodeDataUrl, supabase)

        // Send confirmation email
        try {
            await sendConfirmationEmail({
                userEmail: normalizedEmail,
                userName: normalizedName,
                eventTitle: event.title,
                eventDate: new Date(event.start_date).toLocaleDateString('pt-BR'),
                eventLocation: event.location?.city || 'A definir',
                categoryName: category.name,
                qrCodeDataUrl,
                ticketCode,
                registrationId: registrationResult.data.id,
                partnerName: normalizedPartnerName || undefined,
                partnerData: normalizedPartnerData || undefined,
                eventType: event.event_type,
                solidarityMessage: event.solidarity_message || undefined,
            })
        } catch (emailError) {
            console.error('Erro ao enviar e-mail de confirmação:', emailError)
            // Don't fail the registration if email fails
        }

        return NextResponse.json({
            registrationId: registrationResult.data.id,
            success: true,
        })
    } catch (error) {
        console.error('Erro ao criar inscrição gratuita:', error)
        return NextResponse.json(
            { error: 'Não foi possível completar sua inscrição. Tente novamente.' },
            { status: 500 }
        )
    }
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

function generateTempPassword(): string {
    const random = Math.random().toString(36).slice(-8)
    return `Symp!e${random}${Date.now().toString().slice(-2)}`
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
