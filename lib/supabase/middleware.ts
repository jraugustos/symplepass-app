import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type MiddlewareSessionResult = {
  response: NextResponse
  supabase: SupabaseClient<Database> | null
  session: Session | null
}

export async function updateSession(request: NextRequest): Promise<MiddlewareSessionResult> {
  // Create a response that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Middleware] Supabase environment variables missing. Route protection is disabled.'
    )
    return { response, supabase: null, session: null }
  }

  // Create Supabase client with the same cookie handling as the rest of the app
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set the cookie on both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remove the cookie from both request and response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the session
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error) {
    console.error('[Middleware] Error getting session:', error)
  }

  // Refresh session if needed
  if (session) {
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
    if (!refreshError && refreshedSession) {
      // Session was refreshed successfully
      return { response, supabase, session: refreshedSession }
    }
  }

  return { response, supabase, session }
}

// Legacy function for backward compatibility
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for middleware client')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
}