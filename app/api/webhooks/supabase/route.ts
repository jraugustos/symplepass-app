/**
 * Supabase Webhook Handler
 * Handles auth events from Supabase for custom email sending
 *
 * Note: To use this webhook, configure it in Supabase Dashboard:
 * 1. Go to Database > Webhooks
 * 2. Create a new webhook for auth.users table on UPDATE
 * 3. Set the URL to: https://your-domain.com/api/webhooks/supabase
 * 4. Add a header: x-supabase-webhook-secret with the secret value
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset'

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

// Supabase admin client for accessing auth data
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: {
    id: string
    email?: string
    raw_user_meta_data?: {
      full_name?: string
    }
    recovery_token?: string
    recovery_sent_at?: string
  }
  old_record?: {
    id: string
    recovery_token?: string
    recovery_sent_at?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-supabase-webhook-secret')

    if (WEBHOOK_SECRET && webhookSecret !== WEBHOOK_SECRET) {
      console.error('Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: SupabaseWebhookPayload = await request.json()

    // Only handle updates to auth.users table
    if (payload.table !== 'users' || payload.type !== 'UPDATE') {
      return NextResponse.json({ message: 'Ignored' }, { status: 200 })
    }

    const { record, old_record } = payload

    // Check if this is a password reset request
    // (recovery_token was just set or changed)
    const isPasswordResetRequest =
      record.recovery_token &&
      (!old_record?.recovery_token || old_record.recovery_token !== record.recovery_token)

    if (!isPasswordResetRequest) {
      return NextResponse.json({ message: 'Not a password reset event' }, { status: 200 })
    }

    // Get user email and name
    const userEmail = record.email
    const userName = record.raw_user_meta_data?.full_name || ''

    if (!userEmail) {
      console.error('User email not found in webhook payload')
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Construct the reset link
    // The token from Supabase is already encoded and ready to use
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
    const resetLink = `${siteUrl}/recuperar-senha/atualizar#access_token=${record.recovery_token}`

    // Send custom password reset email
    const result = await sendPasswordResetEmail({
      userName,
      userEmail,
      resetLink,
    })

    if (!result.success) {
      console.error('Failed to send password reset email:', result.error)
      // Don't return error to not block the webhook
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
      messageId: result.messageId
    })
  } catch (error) {
    console.error('Supabase webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', handler: 'supabase-webhook' })
}
