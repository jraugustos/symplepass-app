'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import {
  deleteAccountSchema,
  loginSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '@/lib/auth/validation'
import { getAuthErrorMessage } from '@/lib/auth/utils'
import { getEnv } from '@/lib/env'
import { recordUserSession } from '@/lib/data/user-preferences'
import type { Database } from '@/types/database.types'

// Types for action responses
type ActionResponse<T = any> = {
  data?: T
  error?: string
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase, user: null, error: error?.message ?? 'Usuário não autenticado' }
  }

  return { supabase, user, error: null }
}

function getFirstValidationError(validationError: any) {
  const firstError = validationError.error?.errors?.[0]
  return firstError?.message ?? 'Dados inválidos'
}

async function verifyPassword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  password: string
) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Password verification failed:', error)
    return { ok: false, message: 'Senha atual incorreta' }
  }

  return { ok: true }
}

async function deleteAuthUser(userId: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Skipping auth user deletion.')
    return { ok: false, message: 'Chave de serviço não configurada' }
  }

  const env = getEnv()
  const adminClient = createSupabaseAdminClient<Database>(env.supabase.url, serviceRoleKey)
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting auth user:', error)
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

async function trackUserSession(userId: string) {
  try {
    const headerList = headers()
    const forwardedFor = headerList.get('x-forwarded-for')
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() ??
      headerList.get('x-real-ip') ??
      null
    const deviceName = headerList.get('sec-ch-ua-platform') || headerList.get('sec-ch-ua')
    const userAgent = headerList.get('user-agent')

    await recordUserSession(userId, {
      ipAddress,
      userAgent,
      deviceName,
    })
  } catch (error) {
    console.error('Error tracking user session:', error)
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<ActionResponse> {
  try {
    // Validate inputs
    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return { error: firstError.message }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      return { error: getAuthErrorMessage(error.message) }
    }

    await trackUserSession(data.user.id)

    // Get user profile to return role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    revalidatePath('/', 'layout')

    // Return only serializable data
    return {
      data: {
        profile: profile ? {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
        } : null
      }
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return { error: 'Erro ao fazer login. Tente novamente.' }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<ActionResponse> {
  try {
    // Validate inputs
    const validation = registerSchema.safeParse({
      email,
      password,
      confirmPassword: password, // Server doesn't need confirmation but schema requires it
      fullName
    })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return { error: firstError.message }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.error('Sign up error:', error)
      return { error: getAuthErrorMessage(error.message) }
    }

    revalidatePath('/', 'layout')

    // Return only serializable data
    return { data: { success: true } }
  } catch (error) {
    console.error('Sign up error:', error)
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }
}

/**
 * Sign out
 * Note: Navigation is handled by the client (AuthContext)
 */
export async function signOut(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return { error: 'Erro ao sair. Tente novamente.' }
    }

    revalidatePath('/', 'layout')
    return { data: { success: true } }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: 'Erro ao sair. Tente novamente.' }
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(
  email: string
): Promise<ActionResponse> {
  try {
    // Validate input
    const validation = resetPasswordSchema.safeParse({ email })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return { error: firstError.message }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/recuperar-senha/atualizar`,
    })

    if (error) {
      console.error('Reset password error:', error)
      return { error: getAuthErrorMessage(error.message) }
    }

    return { data: { success: true } }
  } catch (error) {
    console.error('Reset password error:', error)
    return { error: 'Erro ao enviar email de recuperação. Tente novamente.' }
  }
}

/**
 * Update password for authenticated user
 */
export async function updatePassword(
  newPassword: string
): Promise<ActionResponse> {
  try {
    // Validate input
    const validation = updatePasswordSchema.safeParse({
      newPassword,
      confirmNewPassword: newPassword // Server doesn't need confirmation but schema requires it
    })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return { error: firstError.message }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Update password error:', error)
      return { error: getAuthErrorMessage(error.message) }
    }

    revalidatePath('/', 'layout')

    return { data: { success: true } }
  } catch (error) {
    console.error('Update password error:', error)
    return { error: 'Erro ao atualizar senha. Tente novamente.' }
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    full_name?: string
    phone?: string
    date_of_birth?: string
    gender?: string
  }
): Promise<ActionResponse> {
  try {
    const validation = profileUpdateSchema.safeParse(data)
    if (!validation.success) {
      return { error: getFirstValidationError(validation) }
    }

    const { supabase, user, error } = await getAuthenticatedUser()
    if (error || !user || user.id !== userId) {
      return { error: 'Não autorizado' }
    }

    const payload: Record<string, string | null> = {}

    if (validation.data.full_name !== undefined) {
      payload.full_name = validation.data.full_name
    }
    if (validation.data.phone !== undefined) {
      payload.phone = validation.data.phone ?? null
    }
    if (validation.data.date_of_birth !== undefined) {
      payload.date_of_birth = validation.data.date_of_birth ?? null
    }
    if (validation.data.gender !== undefined) {
      payload.gender = validation.data.gender ?? null
    }

    if (Object.keys(payload).length === 0) {
      return { error: 'Nenhuma alteração informada' }
    }

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return { error: 'Não foi possível atualizar perfil' }
    }

    revalidatePath('/conta')

    return { data: profile }
  } catch (error) {
    console.error('Unexpected error updating profile:', error)
    return { error: 'Erro ao atualizar perfil. Tente novamente.' }
  }
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    const validation = passwordChangeSchema.safeParse({ currentPassword, newPassword })
    if (!validation.success) {
      return { error: getFirstValidationError(validation) }
    }

    const { supabase, user, error } = await getAuthenticatedUser()
    if (error || !user || !user.email) {
      return { error: 'Sessão inválida' }
    }

    const verifyResult = await verifyPassword(supabase, user.email, currentPassword)
    if (!verifyResult.ok) {
      return { error: verifyResult.message }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return { error: getAuthErrorMessage(updateError.message) }
    }

    revalidatePath('/conta')
    return { data: { success: true } }
  } catch (error) {
    console.error('Unexpected error updating user password:', error)
    return { error: 'Erro ao atualizar senha. Tente novamente.' }
  }
}

export async function deleteUserAccount(
  userId: string,
  password: string
): Promise<ActionResponse> {
  try {
    const validation = deleteAccountSchema.safeParse({ password })
    if (!validation.success) {
      return { error: getFirstValidationError(validation) }
    }

    const { supabase, user, error } = await getAuthenticatedUser()
    if (error || !user || !user.email || user.id !== userId) {
      return { error: 'Sessão inválida' }
    }

    const verifyResult = await verifyPassword(supabase, user.email, validation.data.password)
    if (!verifyResult.ok) {
      return { error: verifyResult.message }
    }

    await supabase.from('user_sessions').delete().eq('user_id', userId)
    await supabase.from('user_preferences').delete().eq('user_id', userId)

    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile record:', profileError)
      return { error: 'Não foi possível remover perfil' }
    }

    const authDeletion = await deleteAuthUser(userId)
    if (!authDeletion.ok) {
      console.warn('Completed profile deletion but failed auth deletion:', authDeletion.message)
    }

    await supabase.auth.signOut()
    revalidatePath('/', 'layout')

    return { data: { success: true } }
  } catch (error) {
    console.error('Unexpected error deleting user account:', error)
    return { error: 'Erro ao excluir conta. Tente novamente.' }
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<ActionResponse<{ url: string }>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Google OAuth error:', error)
      return { error: 'Erro ao fazer login com Google. Tente novamente.' }
    }

    return { data: { url: data.url } }
  } catch (error) {
    console.error('Google OAuth error:', error)
    return { error: 'Erro ao fazer login com Google. Tente novamente.' }
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Get session error:', error)
      return null
    }

    return data.session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * Get current user with profile
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Get profile error:', profileError)
      return { user, profile: null }
    }

    return { user, profile }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
