import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Event, EventCategory } from '@/types/database.types'

type SupabaseServerClient = SupabaseClient<Database>

export interface RegistrationValidationResult {
  valid: boolean
  error?: string
  errorCode?: 'EVENT_NOT_FOUND' | 'CATEGORY_NOT_FOUND' | 'REGISTRATION_CLOSED' | 'REGISTRATION_NOT_STARTED' | 'REGISTRATION_NOT_ALLOWED' | 'EVENT_FULL' | 'CATEGORY_FULL' | 'PAIR_NOT_ALLOWED' | 'ALREADY_REGISTERED'
}

export interface EventValidationData {
  id: string
  title: string
  slug: string
  max_participants: number | null
  registration_start: string | null
  registration_end: string | null
  allows_pair_registration: boolean
  status: string
}

export interface CategoryValidationData {
  id: string
  name: string
  event_id: string
  max_participants: number | null
  current_participants: number
}

/**
 * Validates if a registration can be created for an event/category combination.
 * Checks:
 * - Event exists and is published (or published_no_registration - but registration not allowed)
 * - Category exists and belongs to event
 * - Registration window is open (registration_start <= now <= registration_end)
 * - Event has not reached max_participants
 * - Category has not reached max_participants
 * - If pair registration, event allows it
 * - User has not already registered for this event/category
 */
export async function validateRegistration(
  supabase: SupabaseServerClient,
  eventId: string,
  categoryId: string,
  userId: string,
  isPairRegistration: boolean = false
): Promise<RegistrationValidationResult> {
  const now = new Date().toISOString()

  // 1. Fetch event with validation fields
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, title, slug, max_participants, registration_start, registration_end, allows_pair_registration, status')
    .eq('id', eventId)
    .in('status', ['published', 'published_no_registration'])
    .single()

  if (eventError || !eventData) {
    return {
      valid: false,
      error: 'Evento não encontrado ou não está disponível para inscrições.',
      errorCode: 'EVENT_NOT_FOUND'
    }
  }

  const event = eventData as Pick<Event, 'id' | 'title' | 'slug' | 'max_participants' | 'registration_start' | 'registration_end' | 'allows_pair_registration' | 'status'>

  // 1.5. Check if event allows registrations
  if (event.status === 'published_no_registration') {
    return {
      valid: false,
      error: 'Este evento está visível mas as inscrições ainda não foram abertas.',
      errorCode: 'REGISTRATION_NOT_ALLOWED'
    }
  }

  // 2. Check registration window
  if (event.registration_start && now < event.registration_start) {
    const startDate = new Date(event.registration_start).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return {
      valid: false,
      error: `As inscrições para este evento ainda não começaram. Início: ${startDate}.`,
      errorCode: 'REGISTRATION_NOT_STARTED'
    }
  }

  if (event.registration_end && now > event.registration_end) {
    return {
      valid: false,
      error: 'O período de inscrições para este evento já encerrou.',
      errorCode: 'REGISTRATION_CLOSED'
    }
  }

  // 3. Fetch category
  const { data: categoryData, error: categoryError } = await supabase
    .from('event_categories')
    .select('id, name, event_id, max_participants, current_participants')
    .eq('id', categoryId)
    .single()

  const category = categoryData as Pick<EventCategory, 'id' | 'name' | 'event_id' | 'max_participants' | 'current_participants'> | null

  if (categoryError || !category || category.event_id !== eventId) {
    return {
      valid: false,
      error: 'Categoria não encontrada ou não pertence a este evento.',
      errorCode: 'CATEGORY_NOT_FOUND'
    }
  }

  // 4. Check event capacity (count confirmed registrations)
  if (event.max_participants !== null) {
    const { count: eventRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'pending'])

    if (eventRegistrations !== null && eventRegistrations >= event.max_participants) {
      return {
        valid: false,
        error: 'Este evento atingiu o número máximo de participantes.',
        errorCode: 'EVENT_FULL'
      }
    }
  }

  // 5. Check category capacity
  if (category.max_participants !== null) {
    const { count: categoryRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .in('status', ['confirmed', 'pending'])

    if (categoryRegistrations !== null && categoryRegistrations >= category.max_participants) {
      return {
        valid: false,
        error: `A categoria "${category.name}" atingiu o número máximo de participantes.`,
        errorCode: 'CATEGORY_FULL'
      }
    }
  }

  // 6. Check pair registration allowance
  if (isPairRegistration && !event.allows_pair_registration) {
    return {
      valid: false,
      error: 'Este evento não permite inscrição em dupla.',
      errorCode: 'PAIR_NOT_ALLOWED'
    }
  }

  // 7. Check for existing registration (same user, event, category with active status)
  const { data: existingRegistration } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('category_id', categoryId)
    .in('status', ['confirmed', 'pending'])
    .maybeSingle()

  if (existingRegistration) {
    return {
      valid: false,
      error: 'Você já possui uma inscrição ativa para esta categoria.',
      errorCode: 'ALREADY_REGISTERED'
    }
  }

  return { valid: true }
}

/**
 * Quick check if event registration window is open (without full validation)
 */
export async function isRegistrationWindowOpen(
  supabase: SupabaseServerClient,
  eventId: string
): Promise<{ open: boolean; message?: string }> {
  const now = new Date().toISOString()

  const { data: eventData } = await supabase
    .from('events')
    .select('registration_start, registration_end, status')
    .eq('id', eventId)
    .single()

  if (!eventData) {
    return { open: false, message: 'Evento não disponível.' }
  }

  const event = eventData as Pick<Event, 'registration_start' | 'registration_end' | 'status'>

  if (event.status === 'published_no_registration') {
    return { open: false, message: 'Inscrições ainda não abertas.' }
  }

  if (event.status !== 'published') {
    return { open: false, message: 'Evento não disponível.' }
  }

  if (event.registration_start && now < event.registration_start) {
    return { open: false, message: 'Inscrições ainda não abertas.' }
  }

  if (event.registration_end && now > event.registration_end) {
    return { open: false, message: 'Inscrições encerradas.' }
  }

  return { open: true }
}

/**
 * Check available spots for event and category
 */
export async function getAvailableSpots(
  supabase: SupabaseServerClient,
  eventId: string,
  categoryId: string
): Promise<{ eventSpots: number | null; categorySpots: number | null }> {
  const { data: eventData } = await supabase
    .from('events')
    .select('max_participants')
    .eq('id', eventId)
    .single()

  const { data: categoryData } = await supabase
    .from('event_categories')
    .select('max_participants, current_participants')
    .eq('id', categoryId)
    .single()

  const event = eventData as Pick<Event, 'max_participants'> | null
  const category = categoryData as Pick<EventCategory, 'max_participants' | 'current_participants'> | null

  let eventSpots: number | null = null
  let categorySpots: number | null = null

  if (event && event.max_participants !== null) {
    const { count: eventRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'pending'])

    eventSpots = event.max_participants - (eventRegistrations || 0)
  }

  if (category && category.max_participants !== null) {
    const { count: categoryRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .in('status', ['confirmed', 'pending'])

    categorySpots = category.max_participants - (categoryRegistrations || 0)
  }

  return { eventSpots, categorySpots }
}
