import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getEnv } from '@/lib/env'

export function createClient() {
  const cookieStore = cookies()
  const env = getEnv()

  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // This client uses the anon key for user-scoped operations.
  // For server-only operations requiring elevated permissions,
  // use SUPABASE_SERVICE_ROLE_KEY in a separate client.
  return createServerClient<Database>(env.supabase.url, env.supabase.anonKey, {
    // Next.js already handles cookie serialization, so keep values raw.
    cookieEncoding: 'raw',
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `remove` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Creates a Supabase admin client with service role key
 * This bypasses RLS policies - use only for admin operations
 * IMPORTANT: Never expose this client to the browser
 */
export function createAdminClient() {
  const env = getEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!env.supabase.url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables (SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createSupabaseClient<Database>(env.supabase.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
