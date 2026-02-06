import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canAccessAdminPanel } from '@/lib/auth/utils'
import type { UserRole, Profile, UserPreferences } from '@/types'

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
  '/mural-fotos',
  '/completar-perfil',
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
    // Preserve full path including query params for proper redirect after login
    const fullPath = pathname + request.nextUrl.search
    redirectUrl.searchParams.set('callbackUrl', fullPath)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copySessionCookies(response, redirectResponse)
    return redirectResponse
  }

  // User is authenticated from here on

  // Fetch profile and preferences to check completeness
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single<Profile>()

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .single<UserPreferences>()

  // Check if profile is complete (has phone and favorite sports)
  const hasBasicInfo = !!(profile?.full_name && profile?.phone)
  const hasSportsInterests = !!(
    preferences?.favorite_sports && preferences.favorite_sports.length > 0
  )
  const isProfileComplete = hasBasicInfo && hasSportsInterests

  // If profile is incomplete and not already on completar-perfil, redirect
  if (!isProfileComplete && !pathname.startsWith('/completar-perfil')) {
    const redirectUrl = new URL('/completar-perfil', request.url)
    const fullPath = pathname + request.nextUrl.search
    redirectUrl.searchParams.set('callbackUrl', fullPath)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copySessionCookies(response, redirectResponse)
    return redirectResponse
  }

  // Check admin access
  if (pathname.startsWith('/admin')) {
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
    '/((?!_next/static|_next/image|favicon.ico|models|api/webhooks|api/upload|api/photos|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|bin)$).*)',
  ],
}
