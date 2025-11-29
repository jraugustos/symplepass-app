import { createClient } from '@/lib/supabase/server'
import type {
    EventKitItem,
    EventCourseInfo,
    EventFAQ,
    EventRegulation,
} from '@/types/database.types'

// Kit Items
export async function getKitItemsByEventId(eventId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('event_kit_items')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    return { data, error: error?.message }
}

export async function createKitItem(data: {
    event_id: string
    name: string
    description: string
    icon: string
    image_url?: string | null
    display_order: number
}) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_kit_items')
        .insert(data)
        .select()
        .single()

    return { data: result, error: error?.message }
}

export async function updateKitItem(
    id: string,
    data: {
        name?: string
        description?: string
        icon?: string
        image_url?: string | null
        display_order?: number
    }
) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_kit_items')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    return { data: result, error: error?.message }
}

export async function deleteKitItem(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('event_kit_items').delete().eq('id', id)

    return { error: error?.message }
}

export async function reorderKitItems(items: { id: string; display_order: number }[]) {
    const supabase = createClient()

    // Update all items in a transaction-like manner
    const updates = items.map((item) =>
        supabase
            .from('event_kit_items')
            .update({ display_order: item.display_order })
            .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error?.message)

    return { error: errors.length > 0 ? errors.join(', ') : null }
}

// Course Info
export async function getCourseInfoByEventId(eventId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('event_course_info')
        .select('*')
        .eq('event_id', eventId)
        .single()

    return { data, error: error?.message }
}

export async function upsertCourseInfo(data: {
    event_id: string
    map_image_url?: string | null
    google_maps_url?: string | null
    gpx_file_url?: string | null
    start_finish_location?: string | null
    elevation_gain?: number | null
    elevation_loss?: number | null
    max_elevation?: number | null
    support_points?: string[]
    course_notes?: string | null
}) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_course_info')
        .upsert(data, { onConflict: 'event_id' })
        .select()
        .single()

    return { data: result, error: error?.message }
}

// FAQs
export async function getFAQsByEventId(eventId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('event_faqs')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    return { data, error: error?.message }
}

export async function createFAQ(data: {
    event_id: string
    question: string
    answer: string | null
    display_order: number
}) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_faqs')
        .insert(data)
        .select()
        .single()

    return { data: result, error: error?.message }
}

export async function updateFAQ(
    id: string,
    data: {
        question?: string
        answer?: string | null
        display_order?: number
    }
) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_faqs')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    return { data: result, error: error?.message }
}

export async function deleteFAQ(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('event_faqs').delete().eq('id', id)

    return { error: error?.message }
}

export async function reorderFAQs(items: { id: string; display_order: number }[]) {
    const supabase = createClient()

    const updates = items.map((item) =>
        supabase
            .from('event_faqs')
            .update({ display_order: item.display_order })
            .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error?.message)

    return { error: errors.length > 0 ? errors.join(', ') : null }
}

// Regulations
export async function getRegulationsByEventId(eventId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('event_regulations')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    return { data, error: error?.message }
}

export async function createRegulation(data: {
    event_id: string
    title: string
    content: string
    display_order: number
}) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_regulations')
        .insert(data)
        .select()
        .single()

    return { data: result, error: error?.message }
}

export async function updateRegulation(
    id: string,
    data: {
        title?: string
        content?: string
        display_order?: number
    }
) {
    const supabase = createClient()
    const { data: result, error } = await supabase
        .from('event_regulations')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    return { data: result, error: error?.message }
}

export async function deleteRegulation(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('event_regulations').delete().eq('id', id)

    return { error: error?.message }
}

export async function reorderRegulations(items: { id: string; display_order: number }[]) {
    const supabase = createClient()

    const updates = items.map((item) =>
        supabase
            .from('event_regulations')
            .update({ display_order: item.display_order })
            .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error?.message)

    return { error: errors.length > 0 ? errors.join(', ') : null }
}

// Kit Pickup Info (stored in events table)
export async function updateKitPickupInfo(eventId: string, pickupInfo: any) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('events')
        .update({ kit_pickup_info: pickupInfo })
        .eq('id', eventId)
        .select()
        .single()

    return { data, error: error?.message }
}

// Regulation PDF
export async function updateRegulationPDF(eventId: string, pdfUrl: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('events')
        .update({
            regulation_pdf_url: pdfUrl,
            regulation_updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single()

    return { data, error: error?.message }
}
