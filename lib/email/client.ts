import { Resend } from 'resend'

let resendClient: Resend | null = null

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  RESEND_API_KEY is not set. Confirmation emails will be skipped.')
  }
} else {
  resendClient = new Resend(apiKey)
}

export function getResendClient() {
  return resendClient
}
