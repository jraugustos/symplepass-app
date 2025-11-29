import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Registration, RegistrationWithDetails } from '@/types/database.types'
import type { PaymentStatus, RegistrationStatus, ShirtSize, PartnerData, ParticipantData } from '@/types'

type RegistrationResult<T> = {
  data: T | null
  error: string | null
}

type SupabaseServerClient = SupabaseClient<Database>

function getClient(providedClient?: SupabaseServerClient) {
  return providedClient ?? createClient()
}

/**
 * Creates a pending registration for a user and event/category selection.
 * @returns Created registration or error description
 */
export async function createRegistration(
  userId: string,
  eventId: string,
  categoryId: string,
  shirtSize: ShirtSize,
  amount: number,
  stripeSessionId?: string,
  partnerName?: string | null,
  partnerData?: PartnerData | null,
  userData?: ParticipantData | null,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<Registration>> {
  try {
    const supabase = getClient(supabaseClient)

    // Prepare registration_data payload with participant information
    // partner_name is maintained for backward compatibility, but registration_data.partner should be prioritized for complete data
    const registrationDataPayload: Record<string, any> = {}

    if (userData) {
      registrationDataPayload.user = {
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        shirtSize: userData.shirtSize,
        shirtGender: userData.shirtGender || null,
      }
    }

    if (partnerData) {
      registrationDataPayload.partner = {
        name: partnerData.name,
        email: partnerData.email,
        cpf: partnerData.cpf,
        phone: partnerData.phone,
        shirtSize: partnerData.shirtSize,
        shirtGender: partnerData.shirtGender || null,
      }
    }

    const registrationData = Object.keys(registrationDataPayload).length > 0 ? registrationDataPayload : null

    const { data: existingRegistration, error: existingError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing registration:', existingError)
      return { data: null, error: existingError.message }
    }

    if (existingRegistration) {
      // If registration is already confirmed, return it as-is (idempotent behavior)
      if (existingRegistration.status === 'confirmed') {
        return { data: existingRegistration, error: null }
      }

      // If registration is pending or failed, update it
      if (['pending', 'failed'].includes(existingRegistration.status)) {
        const { data, error } = await supabase
          .from('registrations')
          .update({
            amount_paid: amount,
            shirt_size: shirtSize,
            stripe_session_id: stripeSessionId ?? null,
            partner_name: partnerName ?? null,
            is_partner_registration: !!partnerName,
            registration_data: registrationData,
            status: 'pending',
            payment_status: 'pending',
          })
          .eq('id', existingRegistration.id)
          .select('*')
          .single()

        if (error) {
          console.error('Error updating existing registration:', error)
          return { data: null, error: error.message }
        }

        return { data, error: null }
      }

      // For any other status (cancelled, etc.), return error
      return { data: null, error: `Já existe uma inscrição com status "${existingRegistration.status}" para este evento e categoria.` }
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert({
        user_id: userId,
        event_id: eventId,
        category_id: categoryId,
        status: 'pending',
        payment_status: 'pending',
        amount_paid: amount,
        stripe_session_id: stripeSessionId || null,
        shirt_size: shirtSize,
        partner_name: partnerName ?? null,
        is_partner_registration: !!partnerName,
        registration_data: registrationData,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating registration:', error)
      return { data: null, error: error.message }
    }

    // Create or update partner profile if partner data is provided
    if (partnerData) {
      await createOrUpdatePartnerProfile(partnerData)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error creating registration:', error)
    return { data: null, error: 'Unable to create registration' }
  }
}

/**
 * Updates the Stripe session ID for an existing registration.
 * @returns Updated registration or error description
 */
export async function updateRegistrationStripeSession(
  registrationId: string,
  stripeSessionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<Registration>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .update({
        stripe_session_id: stripeSessionId,
      })
      .eq('id', registrationId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating registration Stripe session:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error updating registration Stripe session:', error)
    return { data: null, error: 'Unable to update registration' }
  }
}

/**
 * Retrieves a registration record by its Stripe session ID.
 * @returns Registration linked to session or null if not found
 */
export async function getRegistrationByStripeSession(
  stripeSessionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<Registration>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching registration by Stripe session:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching registration by Stripe session:', error)
    return { data: null, error: 'Unable to fetch registration' }
  }
}

export async function getRegistrationByPaymentIntent(
  paymentIntentId: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<Registration>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching registration by payment intent:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching registration by payment intent:', error)
    return { data: null, error: 'Unable to fetch registration' }
  }
}

/**
 * Updates registration payment and status fields (e.g. after webhook confirmation).
 * @returns Updated registration or error description
 */
export async function updateRegistrationPaymentStatus(
  registrationId: string,
  status: RegistrationStatus,
  paymentStatus: PaymentStatus,
  stripePaymentIntentId?: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<Registration>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .update({
        status,
        payment_status: paymentStatus,
        stripe_payment_intent_id: stripePaymentIntentId || null,
      })
      .eq('id', registrationId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating registration payment status:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error updating registration payment status:', error)
    return { data: null, error: 'Unable to update registration' }
  }
}

/**
 * Lists registrations for a user with event and category context.
 * @returns Array of registrations with related data or error description
 */
export async function getUserRegistrations(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<RegistrationWithDetails[]>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select(
        `
        *,
        event:events(*),
        category:event_categories(*),
        user:profiles(*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user registrations:', error)
      return { data: null, error: error.message }
    }

    return { data: (data as RegistrationWithDetails[]) || [], error: null }
  } catch (error) {
    console.error('Unexpected error fetching user registrations:', error)
    return { data: null, error: 'Unable to fetch registrations' }
  }
}

export async function getRegistrationByStripeSessionWithDetails(
  stripeSessionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<RegistrationWithDetails>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select(
        `
        *,
        event:events(*),
        category:event_categories(*),
        user:profiles(*)
      `
      )
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching registration with details:', error)
      return { data: null, error: error.message }
    }

    return { data: (data as RegistrationWithDetails) || null, error: null }
  } catch (error) {
    console.error('Unexpected error fetching registration with details:', error)
    return { data: null, error: 'Unable to fetch registration' }
  }
}

/**
 * Get registration by ID with all details (event, category, user)
 * Used for free/solidarity event confirmations
 */
export async function getRegistrationByIdWithDetails(
  registrationId: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<RegistrationWithDetails>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select(
        `
        *,
        event:events(*),
        category:event_categories(*),
        user:profiles(*)
      `
      )
      .eq('id', registrationId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching registration by ID with details:', error)
      return { data: null, error: error.message }
    }

    return { data: (data as RegistrationWithDetails) || null, error: null }
  } catch (error) {
    console.error('Unexpected error fetching registration by ID with details:', error)
    return { data: null, error: 'Unable to fetch registration' }
  }
}

export async function updateRegistrationQRCode(
  registrationId: string,
  qrCodeDataUrl: string,
  supabaseClient?: SupabaseServerClient
): Promise<RegistrationResult<Registration>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .update({
        qr_code: qrCodeDataUrl,
      })
      .eq('id', registrationId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating registration QR code:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error updating registration QR code:', error)
    return { data: null, error: 'Unable to update registration' }
  }
}

/**
 * Creates or updates the partner's profile when a pair registration is made.
 * If a profile with the partner's email already exists, it updates with new data.
 * If not, creates a new auth user (which triggers profile creation via database trigger).
 * Uses admin client to bypass RLS policies for profile updates.
 * @returns The partner's profile ID or null if creation failed
 */
export async function createOrUpdatePartnerProfile(
  partnerData: PartnerData
): Promise<string | null> {
  try {
    const adminClient = createAdminClient()
    const normalizedEmail = partnerData.email.toLowerCase().trim()

    // Check if profile already exists with this email (use admin client to bypass RLS)
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, cpf')
      .eq('email', normalizedEmail)
      .maybeSingle() as { data: { id: string; cpf: string | null } | null }

    if (existingProfile?.id) {
      // Update existing profile with partner data only if CPF is not set
      // This prevents overwriting data from a user who already has a complete profile
      if (!existingProfile.cpf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (adminClient.from('profiles') as any)
          .update({
            full_name: partnerData.name,
            cpf: partnerData.cpf,
            phone: partnerData.phone,
          })
          .eq('id', existingProfile.id)

        if (updateError) {
          console.error('Error updating partner profile:', updateError)
        }
      }

      return existingProfile.id
    }

    // Create new auth user for partner using admin client
    // This creates the user and triggers profile creation via database trigger
    const tempPassword = generateTempPassword()
    const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email so user can reset password immediately
      user_metadata: {
        full_name: partnerData.name,
      },
    })

    if (signUpError || !signUpData?.user) {
      console.error('Error creating partner auth user:', signUpError)
      return null
    }

    // Wait a moment for the database trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the profile with additional data (CPF, phone) using admin client
    // The profile is created by the database trigger with just id, email, and full_name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (adminClient.from('profiles') as any)
      .update({
        cpf: partnerData.cpf,
        phone: partnerData.phone,
      })
      .eq('id', signUpData.user.id)

    if (updateError) {
      console.error('Error updating partner profile with additional data:', updateError)
    }

    return signUpData.user.id
  } catch (error) {
    console.error('Unexpected error creating partner profile:', error)
    return null
  }
}

/**
 * Generates a temporary password for partner accounts
 */
function generateTempPassword(): string {
  const random = Math.random().toString(36).slice(-8)
  return `Symp!e${random}${Date.now().toString().slice(-2)}`
}
