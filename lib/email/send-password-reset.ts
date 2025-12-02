/**
 * Send Password Reset Email
 * Sends a custom password reset email via Resend
 */

import { getResendClient } from './client'
import {
  generatePasswordResetEmailHtml,
  type PasswordResetEmailData,
} from './templates/password-reset'

interface SendPasswordResetResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<SendPasswordResetResult> {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  Resend client not available. Skipping password reset email.')
    return { success: false, error: 'Resend client not configured' }
  }

  try {
    const html = generatePasswordResetEmailHtml(data)

    const response = await resend.emails.send({
      from: 'Symplepass <noreply@hello.symplepass.com.br>',
      to: data.userEmail,
      subject: 'Redefinir sua senha - Symplepass',
      html,
    })

    if (response.error) {
      console.error('Error sending password reset email:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log(`✅ Password reset email sent to ${data.userEmail}`)
    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
