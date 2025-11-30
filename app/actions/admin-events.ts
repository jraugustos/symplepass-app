'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/actions'
import { updateEvent } from '@/lib/data/admin-events'
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
      allows_pair_registration: data.allows_pair_registration,
      shirt_sizes: data.shirt_sizes,
      shirt_sizes_config: data.shirt_sizes_config,
      show_course_info: data.show_course_info,
      show_championship_format: data.show_championship_format,
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
