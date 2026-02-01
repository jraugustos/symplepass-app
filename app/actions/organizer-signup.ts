'use server'

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Consume an invite token after successful registration
 * Marks the token as used and updates the profile role
 * This is a Server Action that can be called from client components
 */
export async function consumeInviteTokenAction(
    token: string,
    userId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        console.log('[consumeInviteTokenAction] Starting with token:', token.substring(0, 8) + '...', 'userId:', userId)
        const supabase = createAdminClient()

        // First, validate the token
        console.log('[consumeInviteTokenAction] Fetching token from database...')
        const { data: tokenData, error: fetchError } = await supabase
            .from('organizer_invite_tokens')
            .select('*')
            .eq('token', token)
            .single()

        if (fetchError) {
            console.error('[consumeInviteTokenAction] Fetch error:', fetchError)
            return { success: false, error: 'Token inválido' }
        }

        if (!tokenData) {
            console.error('[consumeInviteTokenAction] No token data found')
            return { success: false, error: 'Token inválido' }
        }

        const tokenRecord = tokenData as any
        console.log('[consumeInviteTokenAction] Token found, id:', tokenRecord.id)

        // Check if already used
        if (tokenRecord.used_at) {
            console.error('[consumeInviteTokenAction] Token already used')
            return { success: false, error: 'Este convite já foi utilizado' }
        }

        // Check if revoked
        if (tokenRecord.revoked_at) {
            console.error('[consumeInviteTokenAction] Token revoked')
            return { success: false, error: 'Este convite foi revogado' }
        }

        // Check if expired
        const expiresAt = new Date(tokenRecord.expires_at)
        if (expiresAt < new Date()) {
            console.error('[consumeInviteTokenAction] Token expired')
            return { success: false, error: 'Este convite expirou' }
        }

        // Wait for profile to be created by trigger (max 5 seconds)
        console.log('[consumeInviteTokenAction] Waiting for profile to be created...')
        let profileExists = false
        for (let i = 0; i < 10; i++) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single()

            if (profile) {
                profileExists = true
                console.log('[consumeInviteTokenAction] Profile found')
                break
            }
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        if (!profileExists) {
            console.error('[consumeInviteTokenAction] Profile not created after waiting')
            return { success: false, error: 'Erro ao criar perfil. Tente fazer login.' }
        }

        // Update user profile to organizer role first
        console.log('[consumeInviteTokenAction] Updating profile role to organizer...')
        const { error: updateProfileError } = await supabase
            .from('profiles')
            // @ts-expect-error - Type issue with Supabase generated types for profiles table
            .update({ role: 'organizer' })
            .eq('id', userId)

        if (updateProfileError) {
            console.error('[consumeInviteTokenAction] Error updating profile role:', updateProfileError)
            return { success: false, error: 'Erro ao atualizar perfil para organizador' }
        }

        // Now mark token as used (profile exists, FK constraint satisfied)
        console.log('[consumeInviteTokenAction] Marking token as used...')
        const { error: updateTokenError } = await supabase
            .from('organizer_invite_tokens')
            // @ts-expect-error - Type issue with Supabase generated types for organizer_invite_tokens table
            .update({
                used_at: new Date().toISOString(),
                used_by: userId,
            })
            .eq('id', tokenRecord.id)

        if (updateTokenError) {
            console.error('[consumeInviteTokenAction] Error updating token:', updateTokenError)
            return { success: false, error: 'Erro ao consumir convite' }
        }

        console.log('[consumeInviteTokenAction] Success!')
        return { success: true, error: null }
    } catch (error) {
        console.error('[consumeInviteTokenAction] Exception:', error)
        return { success: false, error: 'Erro ao processar convite' }
    }
}

/**
 * Sign up an organizer using admin client to skip email confirmation
 * Since the admin created the invite for this email, we trust it's valid
 */
export async function signUpOrganizerAction(data: {
    email: string
    password: string
    fullName: string
    phone?: string
}): Promise<{ userId?: string; error?: string }> {
    try {
        const supabase = createAdminClient()

        // Use admin API to create user with auto-confirmed email
        console.log('[signUpOrganizerAction] Creating user with admin API...')
        const { data: authData, error } = await supabase.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: data.fullName,
            },
        })

        if (error) {
            console.error('[signUpOrganizerAction] Sign up error:', error)
            // Handle common errors
            if (error.message.includes('already registered')) {
                return { error: 'Este email já está cadastrado' }
            }
            return { error: error.message }
        }

        if (!authData.user) {
            return { error: 'Erro ao criar usuário' }
        }

        console.log('[signUpOrganizerAction] User created:', authData.user.id)

        // Create profile manually since trigger doesn't fire for admin.createUser
        console.log('[signUpOrganizerAction] Creating profile manually...')
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: data.email,
                full_name: data.fullName,
                phone: data.phone || null,
                role: 'user', // Will be updated to 'organizer' by consumeInviteTokenAction
            } as any)

        if (profileError) {
            console.error('[signUpOrganizerAction] Profile creation error:', profileError)
            // If profile already exists (trigger did run), ignore the error
            if (!profileError.message.includes('duplicate key')) {
                return { error: 'Erro ao criar perfil' }
            }
            console.log('[signUpOrganizerAction] Profile already exists, continuing...')
        } else {
            console.log('[signUpOrganizerAction] Profile created successfully')
        }

        return { userId: authData.user.id }
    } catch (error) {
        console.error('[signUpOrganizerAction] Exception:', error)
        return { error: 'Erro ao criar conta. Tente novamente.' }
    }
}

