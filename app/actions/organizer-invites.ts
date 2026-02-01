'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/actions'
import {
    createInviteToken,
    getInviteTokens,
    revokeInviteToken,
    deleteInviteToken,
} from '@/lib/data/organizer-invites'

/**
 * Create a new invite token for organizer registration
 */
export async function createInviteAction(email?: string, expiresInDays?: number) {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { error: 'Você não tem permissão para criar convites' }
    }

    const inviteResult = await createInviteToken(result.profile.id, email, expiresInDays)

    if (inviteResult.error) {
        return { error: inviteResult.error }
    }

    revalidatePath('/admin/organizadores')

    // Generate the invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/cadastro/organizador/${inviteResult.data!.token}`

    return {
        success: true,
        token: inviteResult.data!.token,
        inviteUrl,
    }
}

/**
 * List all invite tokens
 */
export async function listInvitesAction() {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { data: [], error: 'Você não tem permissão para ver convites' }
    }

    return await getInviteTokens()
}

/**
 * Revoke an invite token
 */
export async function revokeInviteAction(tokenId: string) {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { error: 'Você não tem permissão para revogar convites' }
    }

    const revokeResult = await revokeInviteToken(tokenId)

    if (revokeResult.error) {
        return { error: revokeResult.error }
    }

    revalidatePath('/admin/organizadores')

    return { success: true }
}

/**
 * Delete an invite token permanently
 */
export async function deleteInviteAction(tokenId: string) {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { error: 'Você não tem permissão para excluir convites' }
    }

    const deleteResult = await deleteInviteToken(tokenId)

    if (deleteResult.error) {
        return { error: deleteResult.error }
    }

    revalidatePath('/admin/organizadores')

    return { success: true }
}

