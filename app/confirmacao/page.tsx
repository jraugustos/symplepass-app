import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  ConfirmationSuccessCard,
  QRCodeDisplay,
  RegistrationSummary,
  ActionButtons,
  NextSteps,
  ExploreCTA,
} from '@/components/confirmacao'
import {
  getRegistrationByMpPreferenceWithDetails,
  getRegistrationByIdWithDetails,
} from '@/lib/data/registrations'
import { getCustomFieldsByEventId } from '@/lib/data/admin-custom-fields'
import {
  extractLocationString,
  formatDateTimeLong,
  formatEventDate,
  generateTicketCode,
} from '@/lib/utils'
import type { ConfirmationPageData } from '@/types'
import type { RegistrationWithDetails } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Inscrição confirmada - Symplepass',
  description: 'Veja os detalhes da sua inscrição e faça download do comprovante com QR Code.',
}

export const revalidate = 0

interface ConfirmationPageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  // Support both MP query params and direct registration access
  // MP auto_return sends: ?collection_id=...&preference_id=...&collection_status=approved&external_reference=...
  const preferenceId = typeof searchParams.preference_id === 'string' ? searchParams.preference_id : null
  const externalReference = typeof searchParams.external_reference === 'string' ? searchParams.external_reference : null
  const registrationId = typeof searchParams.registration === 'string' ? searchParams.registration : null

  // Legacy Stripe support (for existing confirmed registrations accessed via old links)
  const sessionId = typeof searchParams.session_id === 'string' ? searchParams.session_id : null

  // Must have at least one identifier
  if (!preferenceId && !externalReference && !registrationId && !sessionId) {
    redirect('/eventos')
  }

  // Get current user for ownership verification
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let registrationDetails: RegistrationWithDetails | null = null

  if (registrationId || externalReference) {
    // Free/solidarity event (registration param) or MP external_reference (which is the registration ID)
    const lookupId = registrationId || externalReference!
    const { data } = await getRegistrationByIdWithDetails(lookupId)
    registrationDetails = data

    if (!registrationDetails) {
      redirect('/eventos')
    }

    // SECURITY: Verify user owns this registration or is admin/organizer
    if (user) {
      const isOwner = registrationDetails.user_id === user.id

      let hasPrivilegedAccess = false
      if (!isOwner) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          hasPrivilegedAccess = true
        } else if (profile?.role === 'organizer') {
          const { data: event } = await supabase
            .from('events')
            .select('organizer_id')
            .eq('id', registrationDetails.event_id)
            .single()

          hasPrivilegedAccess = event?.organizer_id === user.id
        }
      }

      if (!isOwner && !hasPrivilegedAccess) {
        redirect('/conta')
      }
    }

    // For free events or direct access, verify status
    if (registrationDetails.status !== 'confirmed') {
      // If payment is pending (MP webhook hasn't fired yet), show a pending state
      // For now, redirect — webhook will confirm soon
      if (registrationDetails.payment_status !== 'paid') {
        redirect('/eventos')
      }
    }
  } else if (preferenceId) {
    // Paid event via MP preference_id
    const { data } = await getRegistrationByMpPreferenceWithDetails(preferenceId)
    registrationDetails = data

    if (!registrationDetails) {
      redirect('/eventos')
    }

    // SECURITY: For preference-based access, verify ownership if user is logged in
    if (user && registrationDetails.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin'
      let isEventOrganizer = false

      if (profile?.role === 'organizer') {
        const { data: event } = await supabase
          .from('events')
          .select('organizer_id')
          .eq('id', registrationDetails.event_id)
          .single()

        isEventOrganizer = event?.organizer_id === user.id
      }

      if (!isAdmin && !isEventOrganizer) {
        redirect('/conta')
      }
    }

    // If payment not yet confirmed (webhook may still be processing), allow access
    // The page will show the current state
  } else if (sessionId) {
    // Legacy: Stripe session_id for old registrations
    const { getRegistrationByStripeSessionWithDetails } = await import('@/lib/data/registrations')
    const { data } = await getRegistrationByStripeSessionWithDetails(sessionId)
    registrationDetails = data

    if (!registrationDetails) {
      redirect('/eventos')
    }
  }

  if (!registrationDetails) {
    redirect('/eventos')
  }

  const eventTitle = registrationDetails.event?.title || 'Evento'
  const eventStart = registrationDetails.event?.start_date || new Date().toISOString()
  const eventEnd = registrationDetails.event?.end_date || eventStart
  const pageData: ConfirmationPageData = {
    registration: registrationDetails,
    ticketCode: generateTicketCode(registrationDetails.id),
    qrCodeDataUrl: registrationDetails.qr_code,
    amountPaid: Number(registrationDetails.amount_paid) || 0,
    eventDateDisplay: formatDateTimeLong(eventStart),
    eventDateShort: formatEventDate(eventStart),
    eventLocation: extractLocationString(registrationDetails.event?.location),
    eventStart,
    eventEnd,
  }

  // Extract partner data from registration_data.partner or fallback to partner_name
  const partnerData = registrationDetails.registration_data?.partner
    ? {
      name: registrationDetails.registration_data.partner.name,
      email: registrationDetails.registration_data.partner.email,
      cpf: registrationDetails.registration_data.partner.cpf,
      phone: registrationDetails.registration_data.partner.phone,
      shirtSize: registrationDetails.registration_data.partner.shirtSize,
    }
    : registrationDetails.partner_name
      ? {
        name: registrationDetails.partner_name,
        email: 'N/D',
        cpf: 'N/D',
        phone: 'N/D',
        shirtSize: 'N/D',
      }
      : null

  const userEmail = registrationDetails.user?.email || ''
  const kitPickupInfo = registrationDetails.event?.kit_pickup_info
  const kitPickupDate =
    kitPickupInfo?.dates || kitPickupInfo?.hours
      ? `${kitPickupInfo?.dates || ''} ${kitPickupInfo?.hours || ''}`.trim()
      : 'Consulte o regulamento do evento.'

  // Determine if this is a free/solidarity event
  const isFreeEvent = registrationDetails.event?.event_type === 'free' || registrationDetails.event?.event_type === 'solidarity'
  const paymentStatusLabel = isFreeEvent ? 'Gratuito' : 'Pago'

  // Transaction ID: prefer MP payment ID, fallback to Stripe for legacy
  const transactionId = isFreeEvent
    ? null
    : (registrationDetails as any).mp_payment_id?.toString()
    || registrationDetails.stripe_payment_intent_id
    || null

  // Fetch custom fields for the event
  const { data: customFields } = await getCustomFieldsByEventId(registrationDetails.event_id)
  const customFieldValues = registrationDetails.registration_data?.custom_fields || {}

  return (
    <>
      <Header variant="gradient" sticky />
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 pb-32 pt-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mt-4 text-4xl font-bold leading-tight">Inscrição confirmada</h1>
          <p className="mt-3 mx-auto max-w-2xl text-base text-white/80">
            Obrigado por escolher a Symplepass. Guarde seu QR Code e apresente-o durante o credenciamento.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold tracking-wide text-white">
              {pageData.ticketCode}
            </span>
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm tracking-wide text-white/90">
              {eventTitle}
            </span>
          </div>
        </div>
      </div>
      <main className="-mt-24 bg-slate-50 pb-20">
        <div className="container mx-auto max-w-3xl space-y-6 px-4">
          <ConfirmationSuccessCard />
          <QRCodeDisplay
            qrCodeDataUrl={pageData.qrCodeDataUrl}
            ticketCode={pageData.ticketCode}
            registrationId={registrationDetails.id}
          />
          <RegistrationSummary
            eventTitle={eventTitle}
            eventDate={`${pageData.eventDateDisplay}`}
            eventLocation={pageData.eventLocation}
            categoryName={registrationDetails.category?.name || 'Categoria'}
            amountPaid={pageData.amountPaid}
            paymentStatus={paymentStatusLabel}
            transactionId={transactionId}
            partnerData={partnerData}
            customFields={customFields || []}
            customFieldValues={customFieldValues}
          />
          <ActionButtons
            eventTitle={eventTitle}
            eventDateDisplay={pageData.eventDateDisplay}
            eventLocation={pageData.eventLocation}
            ticketCode={pageData.ticketCode}
            eventStart={pageData.eventStart}
            eventEnd={pageData.eventEnd}
          />
          <NextSteps userEmail={userEmail || 'seu e-mail'} kitPickupDate={kitPickupDate} eventDate={pageData.eventDateShort} />
          <ExploreCTA />
        </div>
      </main>
      <Footer variant="light" />
    </>
  )
}
