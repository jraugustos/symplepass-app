/**
 * Send Contact Notification Email
 * Sends an email to admin when someone submits the contact form
 */

import { getResendClient } from './client'
import {
  generateContactNotificationEmailHtml,
  type ContactNotificationData,
} from './templates/contact-notification'

interface SendContactNotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

const ADMIN_EMAIL = process.env.ADMIN_CONTACT_EMAIL || 'contato@symplepass.com.br'

export async function sendContactNotification(
  data: Omit<ContactNotificationData, 'submittedAt'>
): Promise<SendContactNotificationResult> {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  Resend client not available. Skipping contact notification email.')
    return { success: false, error: 'Resend client not configured' }
  }

  try {
    const submittedAt = new Date().toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    const html = generateContactNotificationEmailHtml({
      ...data,
      submittedAt,
    })

    const subject = data.subject
      ? `[Contato] ${data.subject}`
      : `[Contato] Nova mensagem de ${data.name}`

    const response = await resend.emails.send({
      from: 'Symplepass <noreply@hello.symplepass.com.br>',
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject,
      html,
    })

    if (response.error) {
      console.error('Error sending contact notification email:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log(`✅ Contact notification sent to ${ADMIN_EMAIL}`)
    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('Error sending contact notification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
