'use server'

import { revalidatePath } from 'next/cache'
import * as db from '@/lib/data/admin-event-details'
import type {
    KitItemFormData,
    CourseInfoFormData,
    FAQFormData,
    RegulationFormData,
} from '@/types'

// Kit Items
export async function createKitItemAction(eventId: string, data: KitItemFormData) {
    const result = await db.createKitItem({
        event_id: eventId,
        name: data.name,
        description: data.description,
        icon: data.icon,
        image_url: data.image_url,
        display_order: 999, // Will be reordered anyway
    })

    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`) // Revalidate public page too
}

export async function updateKitItemAction(id: string, data: KitItemFormData) {
    const result = await db.updateKitItem(id, data)
    if (result.error) throw new Error(result.error)
    // We don't know the eventId here easily, but we can rely on client refresh or just revalidate generic paths
    // Ideally we pass eventId to revalidate specific page
}

export async function deleteKitItemAction(id: string) {
    const result = await db.deleteKitItem(id)
    if (result.error) throw new Error(result.error)
}

export async function reorderKitItemsAction(items: { id: string; display_order: number }[]) {
    const result = await db.reorderKitItems(items)
    if (result.error) throw new Error(result.error)
}

export async function updateKitPickupInfoAction(eventId: string, data: any) {
    const result = await db.updateKitPickupInfo(eventId, data)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
}

// Course Info
export async function updateCourseInfoAction(eventId: string, data: CourseInfoFormData) {
    const result = await db.upsertCourseInfo({
        event_id: eventId,
        ...data,
    })
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
}

// FAQs
export async function createFAQAction(eventId: string, data: FAQFormData) {
    const result = await db.createFAQ({
        event_id: eventId,
        question: data.question,
        answer: data.answer,
        display_order: 999,
    })
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
}

export async function updateFAQAction(id: string, data: FAQFormData) {
    const result = await db.updateFAQ(id, data)
    if (result.error) throw new Error(result.error)
}

export async function deleteFAQAction(id: string) {
    const result = await db.deleteFAQ(id)
    if (result.error) throw new Error(result.error)
}

export async function reorderFAQsAction(items: { id: string; display_order: number }[]) {
    const result = await db.reorderFAQs(items)
    if (result.error) throw new Error(result.error)
}

// Regulations
export async function createRegulationAction(data: RegulationFormData & { event_id: string }) {
    try {
        // Assuming db.createRegulation now returns { data, error } directly
        // and not { error: string }
        const { data: result, error } = await db.createRegulation({
            ...data,
            display_order: 0, // Default order, will be updated by reorder
        })

        if (error) {
            console.error('Supabase error creating regulation:', error)
            throw new Error(error)
        }

        revalidatePath(`/admin/eventos/${data.event_id}/editar`)
        return result
    } catch (error) {
        console.error('Server action error creating regulation:', error)
        throw error
    }
}

export async function updateRegulationAction(id: string, data: RegulationFormData) {
    const result = await db.updateRegulation(id, data)
    if (result.error) throw new Error(result.error)
}

export async function deleteRegulationAction(id: string) {
    const result = await db.deleteRegulation(id)
    if (result.error) throw new Error(result.error)
}

export async function reorderRegulationsAction(items: { id: string; display_order: number }[]) {
    const result = await db.reorderRegulations(items)
    if (result.error) throw new Error(result.error)
}

export async function updateRegulationPdfAction(eventId: string, url: string) {
    const result = await db.updateRegulationPDF(eventId, url)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
}
