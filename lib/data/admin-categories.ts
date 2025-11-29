import { createClient } from '@/lib/supabase/server'
import { EventCategory } from '@/types/database.types'

/**
 * Get all categories for an event
 * @param eventId - The event ID
 * @returns Array of event categories ordered by price
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
      .order('price', { ascending: true })

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
}) {
  try {
    const supabase = await createClient()

    // Validate price
    if (categoryData.price < 0) {
      return { data: null, error: 'Price must be greater than or equal to 0' }
    }

    const { data, error } = await supabase
      .from('event_categories')
      .insert({
        ...categoryData,
        current_participants: 0,
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
