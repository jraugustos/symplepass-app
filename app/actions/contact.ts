'use server'

import { createClient } from '@/lib/supabase/server'
import { contactSchema, type ContactFormData } from '@/lib/validations/contact'
import { sendContactNotification } from '@/lib/email/send-contact-notification'

interface ContactResult {
  success: boolean
  error?: string
}

export async function submitContactForm(data: ContactFormData): Promise<ContactResult> {
  try {
    // Validate input
    const validation = contactSchema.safeParse(data)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return { success: false, error: firstError.message }
    }

    const { name, email, phone, subject, message } = validation.data
    const supabase = await createClient()

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Save contact submission to database
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        status: 'pending',
        user_id: user?.id || null,
      })

    if (insertError) {
      console.error('Error saving contact submission:', insertError)
      return { success: false, error: 'Erro ao enviar mensagem. Tente novamente.' }
    }

    // Send notification email to admin (non-blocking)
    sendContactNotification({
      name,
      email,
      phone,
      subject,
      message,
    }).catch((err) => {
      console.error('Failed to send contact notification email:', err)
    })

    return { success: true }
  } catch (error) {
    console.error('Contact form submission error:', error)
    return { success: false, error: 'Erro ao enviar mensagem. Tente novamente.' }
  }
}
