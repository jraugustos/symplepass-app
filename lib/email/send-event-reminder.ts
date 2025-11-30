/**
 * Send Event Reminder Email
 * Sends a reminder email to users before their event
 */

import { getResendClient } from './client'
import {
  generateEventReminderEmailHtml,
  type EventReminderEmailData,
} from './templates/event-reminder'

interface SendEventReminderResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEventReminderEmail(
  data: EventReminderEmailData
): Promise<SendEventReminderResult> {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  Resend client not available. Skipping event reminder email.')
    return { success: false, error: 'Resend client not configured' }
  }

  try {
    const html = generateEventReminderEmailHtml(data)

    const urgencyText =
      data.daysUntilEvent === 0
        ? 'É hoje!'
        : data.daysUntilEvent === 1
          ? 'Amanhã!'
          : `${data.daysUntilEvent} dias`

    const response = await resend.emails.send({
      from: 'Symplepass <noreply@symplepass.com>',
      to: data.userEmail,
      subject: `⏰ ${urgencyText} - ${data.eventTitle}`,
      html,
    })

    if (response.error) {
      console.error('Error sending event reminder email:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log(`✅ Event reminder email sent to ${data.userEmail} for ${data.eventTitle}`)
    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('Error sending event reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
