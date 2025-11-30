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

export async function updateKitItemAction(eventId: string, id: string, data: KitItemFormData) {
    const result = await db.updateKitItem(id, data)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function deleteKitItemAction(eventId: string, id: string) {
    const result = await db.deleteKitItem(id)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function reorderKitItemsAction(eventId: string, items: { id: string; display_order: number }[]) {
    const result = await db.reorderKitItems(items)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function updateKitPickupInfoAction(eventId: string, data: any) {
    const result = await db.updateKitPickupInfo(eventId, data)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    // Revalidate the public event page using the slug from the result
    if (result.data?.slug) {
        revalidatePath(`/eventos/${result.data.slug}`)
    }
}

// Course Info
export async function updateCourseInfoAction(eventId: string, data: CourseInfoFormData) {
    const result = await db.upsertCourseInfo({
        event_id: eventId,
        ...data,
    })
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
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
    revalidatePath(`/eventos/[slug]`)
}

export async function updateFAQAction(eventId: string, id: string, data: FAQFormData) {
    const result = await db.updateFAQ(id, data)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function deleteFAQAction(eventId: string, id: string) {
    const result = await db.deleteFAQ(id)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function reorderFAQsAction(eventId: string, items: { id: string; display_order: number }[]) {
    const result = await db.reorderFAQs(items)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

// Regulations
export async function createRegulationAction(eventId: string, data: RegulationFormData) {
    try {
        const { data: result, error } = await db.createRegulation({
            event_id: eventId,
            title: data.title,
            content: data.content,
            display_order: 0,
        })

        if (error) {
            console.error('Supabase error creating regulation:', error)
            throw new Error(error)
        }

        revalidatePath(`/admin/eventos/${eventId}/editar`)
        revalidatePath(`/eventos/[slug]`)
        return result
    } catch (error) {
        console.error('Server action error creating regulation:', error)
        throw error
    }
}

export async function updateRegulationAction(eventId: string, id: string, data: RegulationFormData) {
    const result = await db.updateRegulation(id, data)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function deleteRegulationAction(eventId: string, id: string) {
    const result = await db.deleteRegulation(id)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function reorderRegulationsAction(eventId: string, items: { id: string; display_order: number }[]) {
    const result = await db.reorderRegulations(items)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}

export async function updateRegulationPdfAction(eventId: string, url: string) {
    const result = await db.updateRegulationPDF(eventId, url)
    if (result.error) throw new Error(result.error)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath(`/eventos/[slug]`)
}
