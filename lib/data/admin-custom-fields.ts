import { createAdminClient } from '@/lib/supabase/server'
import type { EventCustomField } from '@/types/database.types'

type CustomFieldResult<T> = {
    data: T | null
    error: string | null
}

/**
 * Fetches all custom fields for an event, ordered by display_order.
 */
export async function getCustomFieldsByEventId(
    eventId: string
): Promise<CustomFieldResult<EventCustomField[]>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('event_custom_fields')
            .select('*')
            .eq('event_id', eventId)
            .order('display_order', { ascending: true })

        if (error) {
            console.error('Error fetching custom fields:', error)
            return { data: null, error: error.message }
        }

        return { data: (data as EventCustomField[]) || [], error: null }
    } catch (error) {
        console.error('Unexpected error fetching custom fields:', error)
        return { data: null, error: 'Unable to fetch custom fields' }
    }
}

/**
 * Creates a new custom field for an event.
 */
export async function createCustomField(
    eventId: string,
    fieldData: {
        name: string
        label: string
        field_type: string
        is_required: boolean
        options?: string[] | null
        placeholder?: string | null
        display_order?: number
    }
): Promise<CustomFieldResult<EventCustomField>> {
    try {
        const supabase = createAdminClient()

        // If no display_order provided, put it at the end
        if (fieldData.display_order === undefined) {
            const { data: existing } = await supabase
                .from('event_custom_fields')
                .select('display_order')
                .eq('event_id', eventId)
                .order('display_order', { ascending: false })
                .limit(1)

            fieldData.display_order = existing && existing.length > 0
                ? ((existing[0] as any).display_order + 1)
                : 0
        }

        const { data, error } = await (supabase
            .from('event_custom_fields') as any)
            .insert({
                event_id: eventId,
                name: fieldData.name,
                label: fieldData.label,
                field_type: fieldData.field_type,
                is_required: fieldData.is_required,
                options: fieldData.options || null,
                placeholder: fieldData.placeholder || null,
                display_order: fieldData.display_order,
            })
            .select('*')
            .single()

        if (error) {
            console.error('Error creating custom field:', error)
            return { data: null, error: error.message }
        }

        return { data: data as EventCustomField, error: null }
    } catch (error) {
        console.error('Unexpected error creating custom field:', error)
        return { data: null, error: 'Unable to create custom field' }
    }
}

/**
 * Updates an existing custom field.
 */
export async function updateCustomField(
    fieldId: string,
    fieldData: {
        name?: string
        label?: string
        field_type?: string
        is_required?: boolean
        options?: string[] | null
        placeholder?: string | null
        display_order?: number
    }
): Promise<CustomFieldResult<EventCustomField>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await (supabase
            .from('event_custom_fields') as any)
            .update(fieldData)
            .eq('id', fieldId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating custom field:', error)
            return { data: null, error: error.message }
        }

        return { data: data as EventCustomField, error: null }
    } catch (error) {
        console.error('Unexpected error updating custom field:', error)
        return { data: null, error: 'Unable to update custom field' }
    }
}

/**
 * Deletes a custom field.
 */
export async function deleteCustomField(
    fieldId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('event_custom_fields')
            .delete()
            .eq('id', fieldId)

        if (error) {
            console.error('Error deleting custom field:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Unexpected error deleting custom field:', error)
        return { success: false, error: 'Unable to delete custom field' }
    }
}
