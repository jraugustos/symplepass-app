import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'

/**
 * Maps Supabase Auth errors to user-friendly Portuguese messages
 */
export function getAuthErrorMessage(error: any): string {
  if (typeof error === 'string') {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Confirme seu email antes de fazer login',
      'User already registered': 'Este email já está cadastrado',
      'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de email inválido',
      'Signups not allowed for this instance': 'Cadastros não permitidos no momento',
      'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
      'For security purposes, you can only request this once every 60 seconds':
        'Por segurança, aguarde 60 segundos antes de tentar novamente',
      'Invalid Refresh Token': 'Sessão expirada. Faça login novamente.',
      'Auth session missing': 'Sessão não encontrada. Faça login novamente.',
    }

    return errorMap[error] || 'Erro ao processar sua solicitação. Tente novamente.'
  }

  if (error?.message) {
    return getAuthErrorMessage(error.message)
  }

  return 'Erro ao processar sua solicitação. Tente novamente.'
}

/**
 * Type guard to check if error is an auth error
 */
export function isAuthError(error: any): boolean {
  return error?.code?.startsWith('auth/') || error?.status === 401 || error?.status === 403
}

/**
 * Redirects to login page with optional callback URL
 */
export function redirectToLogin(callbackUrl?: string): never {
  const url = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/login'
  redirect(url)
}

/**
 * Redirects user after login based on their role
 */
export function redirectAfterLogin(role: UserRole = 'user'): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'organizer':
      return '/admin/eventos'
    default:
      return '/conta'
  }
}

/**
 * Checks if user can access admin panel
 */
export function canAccessAdminPanel(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'organizer'
}

/**
 * Checks if user can access a specific route
 */
export function canAccessRoute(pathname: string, role?: UserRole | null): boolean {
  // Public routes
  const publicRoutes = ['/login', '/cadastro', '/recuperar-senha', '/auth/callback', '/']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return true
  }

  // User area routes - requires authentication
  if (pathname.startsWith('/conta')) {
    return role !== null && role !== undefined
  }

  // Admin routes - requires admin or organizer role
  if (pathname.startsWith('/admin')) {
    return canAccessAdminPanel(role)
  }

  // Event pages and other public pages
  if (pathname.startsWith('/eventos') || pathname.startsWith('/sobre')) {
    return true
  }

  // Default: allow access
  return true
}

/**
 * Gets redirect URL from query parameters
 */
export function getCallbackUrl(searchParams: URLSearchParams): string {
  return searchParams.get('callbackUrl') || '/conta'
}

/**
 * Sanitize and validate redirect URLs to prevent open redirect vulnerabilities
 * Works in both server and client environments
 * @param url - URL to sanitize
 * @returns Safe redirect URL (defaults to /conta if URL is invalid)
 */
export function sanitizeRedirectUrl(url: string): string {
  try {
    // Only allow relative URLs or URLs from the same origin
    if (url.startsWith('/')) {
      return url
    }

    const parsedUrl = new URL(url)
    const currentOrigin = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || ''

    if (parsedUrl.origin === currentOrigin) {
      return url
    }

    // If URL is from different origin, redirect to conta (safe fallback)
    return '/conta'
  } catch {
    // If URL parsing fails, redirect to conta (safe fallback)
    return '/conta'
  }
}
