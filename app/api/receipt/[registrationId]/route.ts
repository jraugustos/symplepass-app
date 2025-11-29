import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTimeLong, extractLocationString, generateTicketCode } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    registrationId: string
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { registrationId } = params

  if (!registrationId) {
    return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 })
  }

  const supabase = createClient()

  // Get current user for authorization check
  const { data: { user } } = await supabase.auth.getUser()

  const { data: registration, error } = await supabase
    .from('registrations')
    .select(
      `
      *,
      event:events(*, organizer_id),
      category:event_categories(*)
    `
    )
    .eq('id', registrationId)
    .single()

  if (error || !registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  // SECURITY: Verify user has permission to access this receipt
  if (user) {
    const isOwner = registration.user_id === user.id

    if (!isOwner) {
      // Check if user is admin or organizer of this event
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin'
      const isEventOrganizer = profile?.role === 'organizer' &&
        registration.event?.organizer_id === user.id

      if (!isAdmin && !isEventOrganizer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }
  }
  // Note: For non-authenticated users accessing via direct link (e.g., email link),
  // we allow access as the registration ID is a UUID and not easily guessable.
  // This mirrors the behavior of /confirmacao page.

  if (registration.payment_status !== 'paid' || registration.status !== 'confirmed') {
    return NextResponse.json({ error: 'Receipt only available for confirmed registrations' }, { status: 403 })
  }

  const ticketCode = generateTicketCode(registration.id)
  const eventTitle = registration.event?.title || 'Evento'
  const eventDate = formatDateTimeLong(registration.event?.start_date || '')
  const location = extractLocationString(registration.event?.location)
  const categoryName = registration.category?.name || 'Categoria'
  const amountPaid = formatCurrency(Number(registration.amount_paid) || 0)
  const transactionId = registration.stripe_payment_intent_id || registration.stripe_session_id || 'N/D'

  const pdf = new jsPDF()
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text('Comprovante de Inscrição', 105, 20, { align: 'center' })

  pdf.setFontSize(12)
  pdf.setTextColor('#475569')
  pdf.text('Symplepass', 105, 30, { align: 'center' })

  pdf.setDrawColor('#0ea5e9')
  pdf.line(20, 36, 190, 36)

  pdf.setTextColor('#0f172a')
  pdf.setFontSize(14)
  pdf.text(eventTitle, 20, 50)

  pdf.setFontSize(11)
  pdf.text(`Categoria: ${categoryName}`, 20, 60)
  pdf.text(`Data: ${eventDate}`, 20, 68)
  pdf.text(`Local: ${location}`, 20, 76)

  pdf.text(`Valor pago: ${amountPaid}`, 20, 90)
  pdf.text(`Código do ingresso: ${ticketCode}`, 20, 98)
  pdf.text(`Transação: ${transactionId}`, 20, 106)

  if (registration.qr_code) {
    pdf.addImage(registration.qr_code, 'PNG', 140, 60, 40, 40)
  }

  pdf.setFontSize(10)
  pdf.setTextColor('#475569')
  pdf.text(
    'Apresente este comprovante com o QR Code durante o credenciamento.',
    105,
    130,
    { align: 'center' }
  )

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprovante-${ticketCode.replace('#', '')}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  })
}
