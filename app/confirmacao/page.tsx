import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe/client'
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
import { getRegistrationByStripeSessionWithDetails, getRegistrationByIdWithDetails } from '@/lib/data/registrations'
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
  const sessionId = typeof searchParams.session_id === 'string' ? searchParams.session_id : null
  const registrationId = typeof searchParams.registration === 'string' ? searchParams.registration : null

  // Must have either session_id (paid events) or registration (free/solidarity events)
  if (!sessionId && !registrationId) {
    redirect('/eventos')
  }

  // Get current user for ownership verification
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let registrationDetails: RegistrationWithDetails | null = null

  if (registrationId) {
    // Free/solidarity event - fetch by registration ID
    const { data } = await getRegistrationByIdWithDetails(registrationId)
    registrationDetails = data

    if (!registrationDetails) {
      redirect('/eventos')
    }

    // SECURITY: Verify user owns this registration or is admin/organizer
    // For free events accessed by registration ID, we require authentication
    if (user) {
      const isOwner = registrationDetails.user_id === user.id

      // Check if user is admin or organizer of this event
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
          // Check if organizer owns this event
          const { data: event } = await supabase
            .from('events')
            .select('organizer_id')
            .eq('id', registrationDetails.event_id)
            .single()

          hasPrivilegedAccess = event?.organizer_id === user.id
        }
      }

      if (!isOwner && !hasPrivilegedAccess) {
        // User is logged in but doesn't own this registration
        redirect('/conta')
      }
    }
    // Note: For non-authenticated users accessing via direct link (e.g., email link),
    // we allow access as this mimics the Stripe session_id flow behavior.
    // The registration ID is a UUID and not easily guessable.

    // For free events, verify it's confirmed
    if (registrationDetails.status !== 'confirmed') {
      redirect('/eventos')
    }
  } else if (sessionId) {
    // Paid event - fetch by Stripe session ID
    const { data } = await getRegistrationByStripeSessionWithDetails(sessionId)
    registrationDetails = data

    if (!registrationDetails) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (!session || session.payment_status !== 'paid') {
        redirect('/eventos')
      }
      redirect('/eventos')
    }

    // SECURITY: For session-based access, verify ownership if user is logged in
    if (user && registrationDetails.user_id !== user.id) {
      // Check for privileged access
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

    if (
      registrationDetails.payment_status !== 'paid' ||
      registrationDetails.status !== 'confirmed'
    ) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (!session || session.payment_status !== 'paid') {
        redirect('/eventos')
      }
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
            transactionId={
              isFreeEvent ? null : (registrationDetails.stripe_payment_intent_id || null)
            }
            partnerData={partnerData}
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
