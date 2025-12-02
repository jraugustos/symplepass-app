/**
 * Send Welcome Email
 * Sends a welcome email to new users after signup
 */

import { getResendClient } from './client'
import { generateWelcomeEmailHtml, type WelcomeEmailData } from './templates/welcome'

interface SendWelcomeEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<SendWelcomeEmailResult> {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  Resend client not available. Skipping welcome email.')
    return { success: false, error: 'Resend client not configured' }
  }

  try {
    const html = generateWelcomeEmailHtml(data)

    const response = await resend.emails.send({
      from: 'Symplepass <noreply@hello.symplepass.com.br>',
      to: data.userEmail,
      subject: `Bem-vindo ao Symplepass, ${data.userName}!`,
      html,
    })

    if (response.error) {
      console.error('Error sending welcome email:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log(`✅ Welcome email sent to ${data.userEmail}`)
    return {
      success: true,
      messageId: response.data?.id
    }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
