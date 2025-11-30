import { createClient } from '@/lib/supabase/server'
import { EventCategory } from '@/types/database.types'

/**
 * Get all categories for an event
 * @param eventId - The event ID
 * @returns Array of event categories ordered by display_order
 */
export async function getCategoriesByEventId(
  eventId: string
): Promise<EventCategory[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCategoriesByEventId:', error)
    return []
  }
}

/**
 * Create a new event category
 * @param categoryData - Category data
 * @returns Created category or error
 */
export async function createCategory(categoryData: {
  event_id: string
  name: string
  price: number
  description?: string | null
  max_participants?: number | null
  shirt_genders?: ('masculino' | 'feminino' | 'infantil')[] | null
}) {
  try {
    const supabase = await createClient()

    // Validate price
    if (categoryData.price < 0) {
      return { data: null, error: 'Price must be greater than or equal to 0' }
    }

    // Get the next display_order for this event
    const { data: existingCategories } = await supabase
      .from('event_categories')
      .select('display_order')
      .eq('event_id', categoryData.event_id)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextDisplayOrder = existingCategories && existingCategories.length > 0
      ? (existingCategories[0].display_order || 0) + 1
      : 0

    const { data, error } = await supabase
      .from('event_categories')
      .insert({
        ...categoryData,
        current_participants: 0,
        display_order: nextDisplayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createCategory:', error)
    return { data: null, error: 'Failed to create category' }
  }
}

/**
 * Update an existing category
 * @param categoryId - Category ID
 * @param categoryData - Updated category data
 * @param eventId - Event ID to verify category belongs to event
 * @returns Updated category or error
 */
export async function updateCategory(
  categoryId: string,
  categoryData: Partial<EventCategory>,
  eventId: string
) {
  try {
    const supabase = await createClient()

    // Verify category belongs to event
    const { data: existing } = await supabase
      .from('event_categories')
      .select('event_id, current_participants')
      .eq('id', categoryId)
      .single()

    if (!existing || existing.event_id !== eventId) {
      return { data: null, error: 'Category not found or does not belong to this event' }
    }

    // Validate max_participants if updating
    if (
      categoryData.max_participants !== undefined &&
      categoryData.max_participants !== null
    ) {
      if (categoryData.max_participants < (existing.current_participants || 0)) {
        return {
          data: null,
          error: `Maximum participants cannot be less than current participants (${existing.current_participants})`,
        }
      }
    }

    // Validate price if updating
    if (categoryData.price !== undefined && categoryData.price < 0) {
      return { data: null, error: 'Price must be greater than or equal to 0' }
    }

    const { data, error } = await supabase
      .from('event_categories')
      .update(categoryData)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateCategory:', error)
    return { data: null, error: 'Failed to update category' }
  }
}

/**
 * Delete a category
 * @param categoryId - Category ID
 * @returns Success or error
 */
export async function deleteCategory(categoryId: string) {
  try {
    const supabase = await createClient()

    // Check if there are active registrations
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id')
      .eq('category_id', categoryId)
      .in('status', ['confirmed', 'pending'])
      .limit(1)

    if (regError) {
      console.error('Error checking registrations:', regError)
      return { data: null, error: 'Failed to check registrations' }
    }

    if (registrations && registrations.length > 0) {
      return {
        data: null,
        error: 'Cannot delete category with active registrations',
      }
    }

    const { error } = await supabase
      .from('event_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      return { data: null, error: error.message }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error in deleteCategory:', error)
    return { data: null, error: 'Failed to delete category' }
  }
}

/**
 * Update category participants count
 * @param categoryId - Category ID
 * @param increment - Number to increment (positive) or decrement (negative)
 * @returns Success or error
 */
export async function updateCategoryParticipants(
  categoryId: string,
  increment: number
) {
  try {
    const supabase = await createClient()

    // Get current count and max
    const { data: category, error: fetchError } = await supabase
      .from('event_categories')
      .select('current_participants, max_participants')
      .eq('id', categoryId)
      .single()

    if (fetchError || !category) {
      console.error('Error fetching category:', fetchError)
      return { data: null, error: 'Category not found' }
    }

    const newCount = (category.current_participants || 0) + increment

    // Validate new count
    if (newCount < 0) {
      return { data: null, error: 'Participants count cannot be negative' }
    }

    if (
      category.max_participants !== null &&
      newCount > category.max_participants
    ) {
      return { data: null, error: 'Category is full' }
    }

    const { data, error } = await supabase
      .from('event_categories')
      .update({ current_participants: newCount })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('Error updating category participants:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateCategoryParticipants:', error)
    return { data: null, error: 'Failed to update category participants' }
  }
}

/**
 * Reorder categories by updating their display_order
 * @param items - Array of category IDs with their new display_order
 * @returns Success or error
 */
export async function reorderCategories(
  items: { id: string; display_order: number }[]
) {
  try {
    const supabase = await createClient()

    // Update all items in parallel
    const updates = items.map((item) =>
      supabase
        .from('event_categories')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error?.message)

    if (errors.length > 0) {
      return { error: errors.join(', ') }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in reorderCategories:', error)
    return { error: 'Failed to reorder categories' }
  }
}
