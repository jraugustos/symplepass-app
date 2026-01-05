import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  RegistrationWithDetails,
  PaymentStatus,
  RegistrationStatus,
} from '@/types/database.types'
import { ShirtGender } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Data for updating a registration (admin action)
 */
export interface UpdateRegistrationData {
  category_id?: string
  partner_data?: {
    name: string
    email?: string
    cpf?: string
    phone?: string
    shirtSize?: string
    shirtGender?: ShirtGender
  } | null
  team_members_data?: Array<{
    name: string
    email?: string
    cpf?: string
    phone?: string
    shirtSize?: string
    shirtGender?: ShirtGender
  }> | null
}

/**
 * Filters for registrations list
 */
export interface RegistrationFilters {
  payment_status?: PaymentStatus
  status?: RegistrationStatus
  category_id?: string
  search?: string
  page?: number
  pageSize?: number
}

/**
 * Get all registrations for an event with filters
 */
export async function getRegistrationsByEventId(
  eventId: string,
  filters: RegistrationFilters = {}
) {
  try {
    const supabase = await createClient()
    const {
      payment_status,
      status,
      category_id,
      search,
      page = 1,
      pageSize = 50,
    } = filters

    let query = supabase
      .from('registrations')
      .select(
        `
        *,
        profiles:user_id(id, full_name, email, cpf, phone),
        event_categories:category_id(id, name, price)
      `,
        { count: 'exact' }
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    if (search) {
      // Search by user name or email - we'll need to filter on client side
      // since we can't directly filter on joined table fields in Supabase
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching registrations:', error)
      return { registrations: [], total: 0, page, pageSize }
    }

    let registrations = data || []

    // Client-side search filter if needed
    if (search && registrations.length > 0) {
      const searchLower = search.toLowerCase()
      registrations = registrations.filter(
        (reg: any) =>
          reg.profiles?.full_name?.toLowerCase().includes(searchLower) ||
          reg.profiles?.email?.toLowerCase().includes(searchLower)
      )
    }

    return {
      registrations,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error in getRegistrationsByEventId:', error)
    return { registrations: [], total: 0, page: 1, pageSize: 50 }
  }
}

/**
 * Get registration statistics for an event
 */
export async function getRegistrationStats(eventId: string) {
  try {
    const supabase = await createClient()

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('status, payment_status, amount_paid')
      .eq('event_id', eventId)

    if (error) {
      console.error('Error fetching registration stats:', error)
      return null
    }

    const total = registrations?.length || 0
    const confirmed =
      registrations?.filter((r) => r.status === 'confirmed').length || 0
    const pending =
      registrations?.filter((r) => r.status === 'pending').length || 0
    const cancelled =
      registrations?.filter((r) => r.status === 'cancelled').length || 0

    const totalRevenue =
      registrations?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0
    const confirmedRevenue =
      registrations
        ?.filter((r) => r.payment_status === 'paid')
        .reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0

    return {
      totalRegistrations: total,
      confirmedRegistrations: confirmed,
      pendingRegistrations: pending,
      cancelledRegistrations: cancelled,
      totalRevenue,
      confirmedRevenue,
    }
  } catch (error) {
    console.error('Error in getRegistrationStats:', error)
    return null
  }
}

/**
 * Export registrations data for CSV
 */
export async function exportRegistrationsToCSV(eventId: string) {
  try {
    const supabase = await createClient()

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(
        `
        *,
        profiles:user_id(full_name, email, cpf, phone),
        event_categories:category_id(name, price)
      `
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching registrations for export:', error)
      return []
    }

    // Format data for CSV including partner data from registration_data
    const exportData = registrations?.map((reg: any) => {
      const partnerData = reg.registration_data?.partner
      const userData = reg.registration_data?.user

      return {
        codigo_inscricao: reg.ticket_code?.split('-').pop() || 'N/A',
        nome: reg.profiles?.full_name || 'N/A',
        email: reg.profiles?.email || 'N/A',
        cpf: reg.profiles?.cpf || 'N/A',
        telefone: reg.profiles?.phone || 'N/A',
        categoria: reg.event_categories?.name || 'N/A',
        status_pagamento: reg.payment_status || 'N/A',
        status_inscricao: reg.status || 'N/A',
        valor: formatCurrency(reg.amount_paid || 0),
        data_inscricao: formatDate(reg.created_at),
        tamanho_camisa: userData?.shirtSize || reg.shirt_size || 'N/A',
        genero_camisa: userData?.shirtGender || 'N/A',
        nome_parceiro: partnerData?.name || reg.partner_name || '',
        email_parceiro: partnerData?.email || '',
        cpf_parceiro: partnerData?.cpf || '',
        telefone_parceiro: partnerData?.phone || '',
        tamanho_camisa_parceiro: partnerData?.shirtSize || '',
        genero_camisa_parceiro: partnerData?.shirtGender || '',
      }
    })

    return exportData || []
  } catch (error) {
    console.error('Error in exportRegistrationsToCSV:', error)
    return []
  }
}

/**
 * Update registration status (admin action)
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registrationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating registration status:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateRegistrationStatus:', error)
    return { data: null, error: 'Failed to update registration status' }
  }
}

/**
 * Get registration by ID with all details
 */
export async function getRegistrationById(registrationId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('registrations')
      .select(
        `
        *,
        profiles:user_id(*),
        event_categories:category_id(*),
        events:event_id(id, title, slug)
      `
      )
      .eq('id', registrationId)
      .single()

    if (error) {
      console.error('Error fetching registration:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getRegistrationById:', error)
    return null
  }
}

/**
 * Delete a registration (admin action)
 * This permanently removes the registration from the database
 * Uses admin client to bypass RLS policies
 */
export async function deleteRegistration(registrationId: string) {
  try {
    // Use admin client to bypass RLS policies for deletion
    const supabase = createAdminClient()

    // Delete the registration
    // Note: The participant counter is automatically updated by the database trigger
    // (migration 026: update_category_participants handles DELETE operations)
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registrationId)

    if (deleteError) {
      console.error('Error deleting registration:', deleteError)
      return { success: false, error: deleteError.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteRegistration:', error)
    return { success: false, error: 'Falha ao excluir inscrição' }
  }
}

/**
 * Update a registration (admin action)
 * Allows updating category and partner data
 * Uses admin client to bypass RLS policies
 */
export async function updateRegistration(
  registrationId: string,
  data: UpdateRegistrationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // First, get the current registration to merge data
    const { data: fetchedRegistration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, event_id, category_id, registration_data')
      .eq('id', registrationId)
      .single()

    if (fetchError || !fetchedRegistration) {
      console.error('Error fetching registration:', fetchError)
      return { success: false, error: 'Inscrição não encontrada' }
    }

    // Type assertion for the fetched registration
    const currentRegistration = fetchedRegistration as {
      id: string
      event_id: string
      category_id: string
      registration_data: Record<string, unknown> | null
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Handle category change
    if (data.category_id && data.category_id !== currentRegistration.category_id) {
      // Verify category belongs to the same event
      const { data: fetchedCategory, error: categoryError } = await supabase
        .from('event_categories')
        .select('id, event_id')
        .eq('id', data.category_id)
        .single()

      if (categoryError || !fetchedCategory) {
        return { success: false, error: 'Categoria não encontrada' }
      }

      const category = fetchedCategory as { id: string; event_id: string }

      if (category.event_id !== currentRegistration.event_id) {
        return { success: false, error: 'Categoria não pertence a este evento' }
      }

      updateData.category_id = data.category_id
    }

    // Handle partner data change
    if (data.partner_data !== undefined) {
      const currentRegistrationData = currentRegistration.registration_data || {}

      if (data.partner_data === null) {
        // Remove partner data
        updateData.partner_name = null
        updateData.is_partner_registration = false
        updateData.registration_data = {
          ...currentRegistrationData,
          partner: null,
        }
      } else {
        // Update partner data
        updateData.partner_name = data.partner_data.name
        updateData.is_partner_registration = true
        updateData.registration_data = {
          ...currentRegistrationData,
          partner: {
            name: data.partner_data.name,
            email: data.partner_data.email || '',
            cpf: data.partner_data.cpf || '',
            phone: data.partner_data.phone || '',
            shirtSize: data.partner_data.shirtSize || '',
            shirtGender: data.partner_data.shirtGender || null,
          },
        }
      }
    }

    // Handle team members data change
    if (data.team_members_data !== undefined) {
      const currentRegistrationData = (updateData.registration_data as Record<string, unknown>) || currentRegistration.registration_data || {}

      if (data.team_members_data === null || data.team_members_data.length === 0) {
        // Remove team members data
        updateData.registration_data = {
          ...currentRegistrationData,
          team_members: null,
        }
      } else {
        // Update team members data
        updateData.registration_data = {
          ...currentRegistrationData,
          team_members: data.team_members_data.map((member) => ({
            name: member.name,
            email: member.email || '',
            cpf: member.cpf || '',
            phone: member.phone || '',
            shirtSize: member.shirtSize || '',
            shirtGender: member.shirtGender || null,
          })),
        }
      }
    }

    // Perform the update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase
      .from('registrations') as any)
      .update(updateData)
      .eq('id', registrationId)

    if (updateError) {
      console.error('Error updating registration:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateRegistration:', error)
    return { success: false, error: 'Falha ao atualizar inscrição' }
  }
}
