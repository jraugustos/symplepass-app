import { createClient, createAdminClient } from '@/lib/supabase/server'
import { OrganizerInviteToken, OrganizerInviteTokenWithDetails } from '@/types/database.types'
import { randomBytes } from 'crypto'

/**
 * Generate a unique invite token
 */
function generateToken(): string {
    return randomBytes(32).toString('hex')
}

/**
 * Create a new invite token for organizer registration
 * Only admins can create invite tokens
 */
export async function createInviteToken(
    adminId: string,
    email?: string,
    expiresInDays: number = 7
): Promise<{ data: OrganizerInviteToken | null; error: string | null }> {
    try {
        const supabase = createAdminClient()

        const token = generateToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        const { data, error } = await supabase
            .from('organizer_invite_tokens')
            .insert({
                token,
                email: email || null,
                created_by: adminId,
                expires_at: expiresAt.toISOString(),
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Error creating invite token:', error)
            return { data: null, error: error.message }
        }

        return { data: data as OrganizerInviteToken, error: null }
    } catch (error) {
        console.error('Error in createInviteToken:', error)
        return { data: null, error: 'Failed to create invite token' }
    }
}

/**
 * Validate an invite token
 * Returns the token data if valid, null otherwise
 */
export async function validateInviteToken(
    token: string
): Promise<{ valid: boolean; data: OrganizerInviteToken | null; error: string | null }> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('organizer_invite_tokens')
            .select('*')
            .eq('token', token)
            .single()

        if (error || !data) {
            return { valid: false, data: null, error: 'Token inválido' }
        }

        const tokenData = data as unknown as OrganizerInviteToken

        // Check if already used
        if (tokenData.used_at) {
            return { valid: false, data: null, error: 'Este convite já foi utilizado' }
        }

        // Check if revoked
        if (tokenData.revoked_at) {
            return { valid: false, data: null, error: 'Este convite foi revogado' }
        }

        // Check if expired
        const expiresAt = new Date(tokenData.expires_at)
        if (expiresAt < new Date()) {
            return { valid: false, data: null, error: 'Este convite expirou' }
        }

        return { valid: true, data: tokenData, error: null }
    } catch (error) {
        console.error('Error in validateInviteToken:', error)
        return { valid: false, data: null, error: 'Erro ao validar convite' }
    }
}

/**
 * Consume an invite token after successful registration
 * Marks the token as used and updates the profile role
 */
export async function consumeInviteToken(
    token: string,
    profileId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = createAdminClient()

        // Validate token first
        const validation = await validateInviteToken(token)
        if (!validation.valid) {
            return { success: false, error: validation.error }
        }

        // Mark token as used
        const { error: tokenError } = await supabase
            .from('organizer_invite_tokens')
            // @ts-ignore - Type mismatch between Supabase client and local types
            .update({
                used_by: profileId,
                used_at: new Date().toISOString(),
            })
            .eq('token', token)

        if (tokenError) {
            console.error('Error marking token as used:', tokenError)
            return { success: false, error: 'Erro ao consumir convite' }
        }

        // Update profile role to organizer
        const { error: profileError } = await supabase
            .from('profiles')
            // @ts-ignore - Type mismatch between Supabase client and local types
            .update({ role: 'organizer' })
            .eq('id', profileId)

        if (profileError) {
            console.error('Error updating profile role:', profileError)
            return { success: false, error: 'Erro ao atualizar perfil' }
        }

        return { success: true, error: null }
    } catch (error) {
        console.error('Error in consumeInviteToken:', error)
        return { success: false, error: 'Erro ao processar convite' }
    }
}

/**
 * Get all invite tokens created by an admin
 */
export async function getInviteTokens(
    adminId?: string
): Promise<{ data: OrganizerInviteTokenWithDetails[]; error: string | null }> {
    try {
        const supabase = createAdminClient()

        let query = supabase
            .from('organizer_invite_tokens')
            .select(`
        *,
        creator:created_by(id, full_name, email),
        usedByUser:used_by(id, full_name, email)
      `)
            .order('created_at', { ascending: false })

        if (adminId) {
            query = query.eq('created_by', adminId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching invite tokens:', error)
            return { data: [], error: error.message }
        }

        return { data: data as OrganizerInviteTokenWithDetails[], error: null }
    } catch (error) {
        console.error('Error in getInviteTokens:', error)
        return { data: [], error: 'Failed to fetch invite tokens' }
    }
}

/**
 * Revoke an invite token
 */
export async function revokeInviteToken(
    tokenId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('organizer_invite_tokens')
            // @ts-ignore - Type mismatch between Supabase client and local types
            .update({ revoked_at: new Date().toISOString() })
            .eq('id', tokenId)
            .is('used_at', null) // Only revoke unused tokens

        if (error) {
            console.error('Error revoking invite token:', error)
            return { success: false, error: error.message }
        }

        return { success: true, error: null }
    } catch (error) {
        console.error('Error in revokeInviteToken:', error)
        return { success: false, error: 'Failed to revoke invite token' }
    }
}

/**
 * Get pending (unused, not expired, not revoked) invite count
 */
export async function getPendingInviteCount(): Promise<number> {
    try {
        const supabase = createAdminClient()

        const { count, error } = await supabase
            .from('organizer_invite_tokens')
            .select('*', { count: 'exact', head: true })
            .is('used_at', null)
            .is('revoked_at', null)
            .gte('expires_at', new Date().toISOString())

        if (error) {
            console.error('Error getting pending invite count:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('Error in getPendingInviteCount:', error)
        return 0
    }
}

/**
 * Delete an invite token permanently
 * Only allows deleting tokens that are revoked or expired (not pending or used)
 */
export async function deleteInviteToken(
    tokenId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = createAdminClient()

        // First check if the token can be deleted (revoked or expired, not used)
        const { data: tokenData, error: fetchError } = await supabase
            .from('organizer_invite_tokens')
            .select('*')
            .eq('id', tokenId)
            .single()

        if (fetchError || !tokenData) {
            return { success: false, error: 'Token não encontrado' }
        }

        const token = tokenData as any

        // Cannot delete used tokens - they are part of audit history
        if (token.used_at) {
            return { success: false, error: 'Não é possível excluir convites já utilizados' }
        }

        // Delete the token
        const { error } = await supabase
            .from('organizer_invite_tokens')
            .delete()
            .eq('id', tokenId)

        if (error) {
            console.error('Error deleting invite token:', error)
            return { success: false, error: error.message }
        }

        return { success: true, error: null }
    } catch (error) {
        console.error('Error in deleteInviteToken:', error)
        return { success: false, error: 'Falha ao excluir convite' }
    }
}

