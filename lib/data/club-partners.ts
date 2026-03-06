import { createClient, createAdminClient } from '@/lib/supabase/server'

export type ClubPartner = {
    id: string
    name: string
    logo_url: string | null
    description: string | null
    link: string | null
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

type ClubPartnerResult<T> = {
    data: T | null
    error: string | null
}

/**
 * Gets all active partners (for public page).
 * Uses anon/public access so RLS filters to is_active = true.
 */
export async function getActivePartners(): Promise<ClubPartnerResult<ClubPartner[]>> {
    try {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('club_partners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching active partners:', error)
            return { data: null, error: error.message }
        }

        return { data: (data as ClubPartner[]) || [], error: null }
    } catch (error) {
        console.error('Unexpected error fetching active partners:', error)
        return { data: null, error: 'Unable to fetch partners' }
    }
}

/**
 * Gets all partners (for admin page, including inactive).
 * Uses admin client to bypass RLS.
 */
export async function getAllPartners(): Promise<ClubPartnerResult<ClubPartner[]>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('club_partners')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching all partners:', error)
            return { data: null, error: error.message }
        }

        return { data: (data as ClubPartner[]) || [], error: null }
    } catch (error) {
        console.error('Unexpected error fetching all partners:', error)
        return { data: null, error: 'Unable to fetch partners' }
    }
}

/**
 * Creates a new club partner.
 */
export async function createPartner(
    partner: Pick<ClubPartner, 'name' | 'description' | 'link' | 'logo_url'> & { sort_order?: number }
): Promise<ClubPartnerResult<ClubPartner>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await (supabase.from('club_partners') as any)
            .insert({
                name: partner.name,
                description: partner.description || null,
                link: partner.link || null,
                logo_url: partner.logo_url || null,
                sort_order: partner.sort_order ?? 0,
                is_active: true,
            })
            .select('*')
            .single()

        if (error) {
            console.error('Error creating partner:', error)
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error creating partner:', error)
        return { data: null, error: 'Unable to create partner' }
    }
}

/**
 * Updates an existing club partner.
 */
export async function updatePartner(
    id: string,
    updates: Partial<Pick<ClubPartner, 'name' | 'description' | 'link' | 'logo_url' | 'is_active' | 'sort_order'>>
): Promise<ClubPartnerResult<ClubPartner>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await (supabase.from('club_partners') as any)
            .update(updates)
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating partner:', error)
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error updating partner:', error)
        return { data: null, error: 'Unable to update partner' }
    }
}

/**
 * Deletes a club partner.
 */
export async function deletePartner(id: string): Promise<ClubPartnerResult<null>> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('club_partners')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting partner:', error)
            return { data: null, error: error.message }
        }

        return { data: null, error: null }
    } catch (error) {
        console.error('Unexpected error deleting partner:', error)
        return { data: null, error: 'Unable to delete partner' }
    }
}
