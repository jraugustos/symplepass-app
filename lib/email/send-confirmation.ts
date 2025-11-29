import { getResendClient } from '@/lib/email/client'
import { generateConfirmationEmailHtml } from '@/lib/email/templates'
import type { EmailConfirmationData } from '@/types'

/**
 * Sends a confirmation email to the user with event details and QR code.
 * The partnerData field is optional and will be included in the email when present.
 * All data is passed through to the email template generator.
 */
export async function sendConfirmationEmail(data: EmailConfirmationData) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('Resend client unavailable. Skipping confirmation email for', data.registrationId)
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const html = generateConfirmationEmailHtml(data)

    const response = await resend.emails.send({
      from: 'Symplepass <noreply@symplepass.com>',
      to: data.userEmail,
      subject: `Inscrição confirmada - ${data.eventTitle}`,
      html,
    })

    if (response.error) {
      console.error('Failed to send confirmation email:', response.error)
      return { success: false, error: response.error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error sending confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
