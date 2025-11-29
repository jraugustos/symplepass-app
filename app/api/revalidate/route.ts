import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Secret token for revalidation - should be set in environment variables
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

export async function GET(request: NextRequest) {
  // Option 1: Check for secret token (for external webhooks/services)
  const secret = request.nextUrl.searchParams.get('secret')

  // Option 2: Check for admin user (for internal admin actions)
  let isAdmin = false
  if (!secret || secret !== REVALIDATE_SECRET) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      isAdmin = profile?.role === 'admin'
    }
  }

  const hasValidSecret = REVALIDATE_SECRET && secret === REVALIDATE_SECRET

  if (!hasValidSecret && !isAdmin) {
    console.warn(`[Revalidate] Unauthorized attempt from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const path = request.nextUrl.searchParams.get('path')

  if (!path) {
    return NextResponse.json(
      { error: 'Missing path parameter' },
      { status: 400 }
    )
  }

  // Validate path to prevent potential abuse
  // Only allow revalidation of known paths
  const allowedPathPrefixes = ['/eventos', '/evento/', '/admin', '/']
  const isAllowedPath = allowedPathPrefixes.some(prefix =>
    path === prefix || path.startsWith(prefix)
  )

  if (!isAllowedPath) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 400 }
    )
  }

  try {
    revalidatePath(path)
    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now(),
    })
  } catch (err) {
    console.error('[Revalidate] Error:', err)
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    )
  }
}