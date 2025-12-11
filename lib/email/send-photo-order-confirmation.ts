import { getResendClient } from '@/lib/email/client'
import { generatePhotoOrderConfirmationEmailHtml } from '@/lib/email/templates/photo-order-confirmation'
import type { EmailPhotoOrderConfirmationData } from '@/types'

/**
 * Sends a confirmation email to the user with photo order details and download link.
 */
export async function sendPhotoOrderConfirmationEmail(data: EmailPhotoOrderConfirmationData) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('Resend client unavailable. Skipping photo order confirmation email for', data.orderId)
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const html = generatePhotoOrderConfirmationEmailHtml(data)

    const response = await resend.emails.send({
      from: 'Symplepass <noreply@hello.symplepass.com.br>',
      to: data.userEmail,
      subject: `Fotos do ${data.eventTitle} - Download disponível`,
      html,
    })

    if (response.error) {
      console.error('Failed to send photo order confirmation email:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log('Photo order confirmation email sent successfully to', data.userEmail)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error sending photo order confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
