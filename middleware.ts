import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canAccessAdminPanel } from '@/lib/auth/utils'
import type { UserRole } from '@/types'

const publicRoutes = [
  '/',
  '/eventos',
  '/modalidades',
  '/como-funciona',
  '/clube',
  '/suporte',
  '/sobre',
  '/termos',
  '/privacidade',
  '/contato',
  '/login',
  '/cadastro',
  '/recuperar-senha',
]

const exactPublicRoutes = ['/auth/callback']

function copySessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
}

export async function middleware(request: NextRequest) {
  const { response, supabase, session } = await updateSession(request)

  // Env vars missing — allow request but warn (logged inside updateSession)
  if (!supabase) {
    return response
  }

  const { pathname } = request.nextUrl
  const isPublicRoute =
    publicRoutes.some((route) => {
      if (route === '/') {
        return pathname === '/'
      }
      return pathname === route || pathname.startsWith(`${route}/`)
    }) || exactPublicRoutes.includes(pathname)

  if (isPublicRoute) {
    return response
  }

  // Check authentication for protected routes
  if (!session) {
    // Prevent redirect loop: if already on login page, don't redirect
    if (pathname.startsWith('/login')) {
      return response
    }

    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('callbackUrl', pathname)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copySessionCookies(response, redirectResponse)
    return redirectResponse
  }

  // User is authenticated from here on

  // Check admin access
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single<{ role: UserRole }>()

    const profileRole = profile?.role ?? 'user'

    if (!canAccessAdminPanel(profileRole as UserRole)) {
      // Redirect to home page instead of /conta to avoid loops
      const redirectResponse = NextResponse.redirect(
        new URL('/?error=unauthorized', request.url)
      )
      copySessionCookies(response, redirectResponse)
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
