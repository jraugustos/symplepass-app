import { createBrowserClient } from '@supabase/ssr'
import { getEnv } from '@/lib/env'
import { Database } from '@/types/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Creates a Supabase browser client (singleton pattern with invalidation)
 * The @supabase/ssr library handles session management automatically
 * via cookies, so we use a singleton to maintain state.
 * Call invalidateClient() when auth state changes to ensure fresh tokens.
 */
export function createClient() {
  if (client) return client

  const env = getEnv()

  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  client = createBrowserClient<Database>(env.supabase.url, env.supabase.anonKey)
  return client
}

/**
 * Invalidates the cached client instance.
 * Call this when auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
 * to ensure the next operation uses a fresh client with valid tokens.
 */
export function invalidateClient() {
  client = null
}
