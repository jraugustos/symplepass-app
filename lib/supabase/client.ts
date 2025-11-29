import { createBrowserClient } from '@supabase/ssr'
import { getEnv } from '@/lib/env'
import { Database } from '@/types/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (client) return client

  const env = getEnv()

  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Use default configuration without custom cookie handling
  client = createBrowserClient<Database>(env.supabase.url, env.supabase.anonKey)

  return client
}
