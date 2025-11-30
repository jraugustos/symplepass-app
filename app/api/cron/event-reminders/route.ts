/**
 * Cron Job: Event Reminders
 * Sends reminder emails to users 3 days before their event
 *
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
 * Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEventReminderEmail } from '@/lib/email/send-event-reminder'
import { formatEventDate } from '@/lib/utils'

const DAYS_BEFORE_EVENT = 3
const CRON_SECRET = process.env.CRON_SECRET

interface ReminderRegistration {
  id: string
  qr_code: string | null
  user: {
    id: string
    email: string
    full_name: string | null
  }
  event: {
    id: string
    title: string
    slug: string
    start_date: string
    location: {
      city: string
      state: string
      venue?: string
    }
  }
  category: {
    name: string
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Calculate the target date (3 days from now)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + DAYS_BEFORE_EVENT)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // Also get events happening exactly 3 days from now
    // We need to match events where start_date falls on the target date
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = nextDay.toISOString().split('T')[0]

    console.log(`[Event Reminders] Looking for events on ${targetDateStr}`)

    // Get all confirmed registrations for events happening in 3 days
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        id,
        qr_code,
        reminder_sent_at,
        user:profiles!registrations_user_id_fkey (
          id,
          email,
          full_name
        ),
        event:events!registrations_event_id_fkey (
          id,
          title,
          slug,
          start_date,
          location
        ),
        category:event_categories!registrations_category_id_fkey (
          name
        )
      `)
      .eq('status', 'confirmed')
      .gte('event.start_date', targetDateStr)
      .lt('event.start_date', nextDayStr)
      .is('reminder_sent_at', null)

    if (error) {
      console.error('[Event Reminders] Error fetching registrations:', error)
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
    }

    if (!registrations || registrations.length === 0) {
      console.log('[Event Reminders] No reminders to send')
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        sent: 0,
      })
    }

    console.log(`[Event Reminders] Found ${registrations.length} registrations to remind`)

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const registration of registrations as unknown as ReminderRegistration[]) {
      // Skip if missing required data
      if (!registration.user?.email || !registration.event?.title) {
        console.warn(`[Event Reminders] Skipping registration ${registration.id} - missing data`)
        continue
      }

      const eventLocation = registration.event.location
        ? `${registration.event.location.venue ? registration.event.location.venue + ', ' : ''}${registration.event.location.city}, ${registration.event.location.state}`
        : 'Local a confirmar'

      const eventDate = formatEventDate(registration.event.start_date)

      try {
        const result = await sendEventReminderEmail({
          userName: registration.user.full_name || 'Atleta',
          userEmail: registration.user.email,
          eventTitle: registration.event.title,
          eventDate,
          eventLocation,
          categoryName: registration.category?.name || 'Categoria',
          ticketCode: registration.id.slice(0, 8).toUpperCase(),
          qrCodeDataUrl: registration.qr_code || undefined,
          daysUntilEvent: DAYS_BEFORE_EVENT,
          eventSlug: registration.event.slug,
        })

        if (result.success) {
          // Mark reminder as sent
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('registrations') as any)
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', registration.id)

          sent++
          console.log(`[Event Reminders] Sent reminder to ${registration.user.email}`)
        } else {
          failed++
          errors.push(`${registration.user.email}: ${result.error}`)
          console.error(`[Event Reminders] Failed to send to ${registration.user.email}:`, result.error)
        }
      } catch (err) {
        failed++
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${registration.user.email}: ${errorMsg}`)
        console.error(`[Event Reminders] Error sending to ${registration.user.email}:`, err)
      }
    }

    console.log(`[Event Reminders] Completed: ${sent} sent, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Event reminders processed`,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Event Reminders] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
