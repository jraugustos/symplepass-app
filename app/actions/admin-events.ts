'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/actions'
import { updateEvent } from '@/lib/data/admin-events'
import { createAdminClient } from '@/lib/supabase/server'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/lib/data/admin-categories'
import type { EventFormDataAdmin, CategoryFormData } from '@/types'

export async function updateEventAction(eventId: string, data: EventFormDataAdmin) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  const updateResult = await updateEvent(
    eventId,
    {
      title: data.title,
      description: data.description,
      location: data.location,
      start_date: data.start_date,
      sport_type: data.sport_type as any,
      event_type: data.event_type,
      event_format: data.event_format,
      banner_url: data.banner_url,
      end_date: data.end_date,
      max_participants: data.max_participants,
      registration_start: data.registration_start,
      registration_end: data.registration_end,
      solidarity_message: data.solidarity_message,
      status: data.status as any,
      is_featured: data.is_featured,
      has_organizer: data.has_organizer,
      allows_individual_registration: data.allows_individual_registration,
      allows_pair_registration: data.allows_pair_registration,
      shirt_sizes: data.shirt_sizes,
      shirt_sizes_config: data.shirt_sizes_config,
      show_course_info: data.show_course_info,
      show_championship_format: data.show_championship_format,
      allow_page_access: data.allow_page_access,
      has_kit: data.has_kit,
      has_kit_pickup_info: data.has_kit_pickup_info,
      service_fee: data.service_fee,
      service_fee_type: data.service_fee_type,
    },
    result.user.id,
    result.profile.role
  )

  if (updateResult.error) {
    throw new Error(updateResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/editar`)
  revalidatePath('/admin/eventos')
}

export async function createCategoryAction(eventId: string, data: CategoryFormData) {
  const result = await createCategory({
    event_id: eventId,
    name: data.name,
    price: data.price,
    description: data.description,
    max_participants: data.max_participants,
    shirt_genders: data.shirt_genders,
    kit_item_ids: data.kit_item_ids,
  })

  if (result.error) {
    throw new Error(result.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/editar`)
}

export async function updateCategoryAction(eventId: string, categoryId: string, data: CategoryFormData) {
  const result = await updateCategory(categoryId, data, eventId)

  if (result.error) {
    throw new Error(result.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/editar`)
}

export async function deleteCategoryAction(eventId: string, categoryId: string) {
  const result = await deleteCategory(categoryId)

  if (result.error) {
    throw new Error(result.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/editar`)
}

export async function reorderCategoriesAction(
  eventId: string,
  items: { id: string; display_order: number }[]
) {
  const result = await reorderCategories(items)

  if (result.error) {
    throw new Error(result.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/editar`)
}

export async function updateEventServiceFee(eventId: string, serviceFee: number) {
  try {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
      return { error: 'Apenas administradores podem alterar a taxa de serviço' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('events')
      // @ts-ignore
      .update({ service_fee: serviceFee })
      .eq('id', eventId)

    if (error) {
      console.error('Error updating service fee:', error)
      return { error: 'Erro ao atualizar taxa de serviço' }
    }

    revalidatePath(`/eventos`)
    revalidatePath(`/admin/eventos`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating service fee:', error)
    return { error: 'Erro inesperado ao atualizar taxa de serviço' }
  }
}
