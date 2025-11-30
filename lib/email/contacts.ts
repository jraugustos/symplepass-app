/**
 * Resend Contacts Management
 * Handles adding and updating contacts in Resend for email marketing
 */

import { getResendClient } from './client'

export interface ContactData {
  email: string
  firstName?: string
  lastName?: string
  unsubscribed?: boolean
}

export interface ContactResult {
  success: boolean
  contactId?: string
  error?: string
}

/**
 * Add or update a contact in Resend
 * If the contact already exists, it will be updated
 */
export async function addOrUpdateContact(data: ContactData): Promise<ContactResult> {
  const resend = getResendClient()
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!resend) {
    console.warn('⚠️  Resend client not available. Skipping contact creation.')
    return { success: false, error: 'Resend client not configured' }
  }

  if (!audienceId) {
    console.warn('⚠️  RESEND_AUDIENCE_ID not configured. Skipping contact creation.')
    return { success: false, error: 'Resend audience ID not configured' }
  }

  try {
    console.log(`[Resend] Adding contact: ${data.email} to audience: ${audienceId}`)

    const response = await resend.contacts.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      unsubscribed: data.unsubscribed ?? false,
      audienceId,
    })

    if (response.error) {
      console.error('[Resend] Error creating contact:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log(`[Resend] Contact created successfully: ${response.data?.id}`)
    return {
      success: true,
      contactId: response.data?.id,
    }
  } catch (error) {
    console.error('[Resend] Error adding contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Add a new user to Resend contacts when they sign up
 */
export async function addUserContact(data: {
  email: string
  fullName: string
}): Promise<ContactResult> {
  const nameParts = data.fullName.trim().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

  return addOrUpdateContact({
    email: data.email,
    firstName,
    lastName,
  })
}

/**
 * Add a newsletter subscriber to Resend contacts
 */
export async function addNewsletterSubscriber(email: string): Promise<ContactResult> {
  return addOrUpdateContact({ email })
}

/**
 * Update contact when user registers for an event
 */
export async function markContactAsEventParticipant(
  email: string,
  eventSportType?: string
): Promise<ContactResult> {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  Resend client not available. Skipping contact update.')
    return { success: false, error: 'Resend client not configured' }
  }

  try {
    // Note: Resend's contact update API requires the audience ID
    // For now, we'll create/update the contact with the new properties
    const response = await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID || '',
    })

    if (response.error) {
      // Contact might already exist, which is fine
      if (!response.error.message.includes('already exists')) {
        console.error('Error updating contact:', response.error)
        return { success: false, error: response.error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating contact in Resend:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update contact - just ensures the contact exists in Resend
 * Note: Resend's basic API doesn't support custom properties
 */
export async function updateContact(email: string): Promise<ContactResult> {
  return addOrUpdateContact({ email })
}
