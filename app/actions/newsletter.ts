'use server'

import { createClient } from '@/lib/supabase/server'
import { newsletterSchema, type NewsletterFormData } from '@/lib/validations/newsletter'
import { addNewsletterSubscriber } from '@/lib/email/contacts'

interface NewsletterResult {
  success: boolean
  error?: string
}

export async function subscribeToNewsletter(data: NewsletterFormData): Promise<NewsletterResult> {
  try {
    // Validate input
    const validation = newsletterSchema.safeParse(data)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return { success: false, error: firstError.message }
    }

    const { email, source } = validation.data
    const supabase = await createClient()

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return { success: false, error: 'Este email já está inscrito na newsletter' }
      }

      // Reactivate subscription
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'active',
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error reactivating newsletter subscription:', updateError)
        return { success: false, error: 'Erro ao processar inscrição. Tente novamente.' }
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email,
          source,
          status: 'active',
          subscribed_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error creating newsletter subscription:', insertError)

        // Check for unique constraint violation
        if (insertError.code === '23505') {
          return { success: false, error: 'Este email já está inscrito na newsletter' }
        }

        return { success: false, error: 'Erro ao processar inscrição. Tente novamente.' }
      }
    }

    // Add to Resend contacts (non-blocking)
    addNewsletterSubscriber(email).catch((err) => {
      console.error('Failed to add newsletter subscriber to Resend:', err)
    })

    return { success: true }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return { success: false, error: 'Erro ao processar inscrição. Tente novamente.' }
  }
}
