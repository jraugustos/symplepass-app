# Remaining Auth Implementations

## ✅ Completed (5/9 Comments)

### Comment 1: Header/NavigationHeader Integration ✅
**Status:** COMPLETE

**Files Modified:**
- `components/layout/header.tsx` - Added role fetching, server actions for login/logout/profileClick
- `components/molecules/navigation-header.tsx` - Added userRole prop, admin menu item, proper callback handling

**What Was Done:**
- Header now fetches user role from profiles table
- Server actions created: `handleLogin()`, `handleLogout()`, `handleProfileClick(destination?)`
- NavigationHeader shows "Painel Admin" for admin/organizer users
- All menu items call callbacks with specific destinations (/conta, /conta/eventos, /conta/configuracoes)
- Menu closes after click (setIsUserMenuOpen(false))

---

## 🔄 Remaining Implementations (4/9 Comments)

### Comment 2: Protected User and Admin Layouts/Pages

**Priority:** HIGH (blocks auth flow testing)

#### Files to Create:

##### 1. `app/(user)/layout.tsx`
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?callbackUrl=/conta')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="light" sticky />

      <div className="flex-1 flex">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-64 border-r border-neutral-200 bg-neutral-50">
          <nav className="p-4 space-y-2">
            <a href="/conta" className="block px-4 py-2 rounded hover:bg-white">
              Visão Geral
            </a>
            <a href="/conta/eventos" className="block px-4 py-2 rounded hover:bg-white">
              Meus Eventos
            </a>
            <a href="/conta/dados" className="block px-4 py-2 rounded hover:bg-white">
              Dados Pessoais
            </a>
            <a href="/conta/configuracoes" className="block px-4 py-2 rounded hover:bg-white">
              Configurações
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}
```

##### 2. `app/(user)/conta/page.tsx`
```typescript
import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Minha Conta - Symplepass',
}

export default async function ContaPage() {
  const userData = await getCurrentUser()

  if (!userData || !userData.user) {
    redirect('/login')
  }

  const { user, profile } = userData
  const supabase = await createClient()

  // Get user's registration count
  const { count: registrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get next upcoming event
  const { data: nextEvent } = await supabase
    .from('registrations')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Olá, {profile?.full_name || 'Usuário'}!</h1>
        <p className="text-neutral-600">Bem-vindo ao seu painel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Total de Eventos</h3>
          <p className="text-3xl font-bold mt-2">{registrationCount || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Próximo Evento</h3>
          <p className="text-lg font-semibold mt-2">
            {nextEvent?.event?.title || 'Nenhum evento'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Últimas Atividades</h3>
          <p className="text-lg font-semibold mt-2">Recente</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-4">
        <a
          href="/conta/eventos"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Ver Meus Eventos
        </a>
        <a
          href="/eventos"
          className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50"
        >
          Explorar Novos Eventos
        </a>
      </div>
    </div>
  )
}
```

##### 3. `app/(admin)/layout.tsx`
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?callbackUrl=/admin')
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'organizer') {
    redirect('/conta?error=unauthorized')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="dark" sticky />

      <div className="flex-1 flex">
        {/* Admin Sidebar */}
        <aside className="hidden md:block w-64 bg-neutral-900 text-white">
          <div className="p-4">
            <div className="mb-4 px-4 py-2 bg-orange-600 rounded text-sm font-semibold">
              {profile?.role === 'admin' ? 'Admin' : 'Organizador'}
            </div>
            <nav className="space-y-2">
              <a href="/admin/dashboard" className="block px-4 py-2 rounded hover:bg-neutral-800">
                Dashboard
              </a>
              <a href="/admin/eventos" className="block px-4 py-2 rounded hover:bg-neutral-800">
                Eventos
              </a>
              <a href="/admin/usuarios" className="block px-4 py-2 rounded hover:bg-neutral-800">
                Usuários
              </a>
              <a href="/admin/relatorios" className="block px-4 py-2 rounded hover:bg-neutral-800">
                Relatórios
              </a>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  )
}
```

##### 4. `app/(admin)/admin/dashboard/page.tsx`
```typescript
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard - Admin Symplepass',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get stats
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })

  const { count: totalRegistrations } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })

  const { data: revenue } = await supabase
    .from('registrations')
    .select('amount_paid')
    .eq('payment_status', 'paid')

  const totalRevenue = revenue?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0

  const { count: activeEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-neutral-600">Visão geral da plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Total de Eventos</h3>
          <p className="text-3xl font-bold mt-2">{totalEvents || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Total de Inscrições</h3>
          <p className="text-3xl font-bold mt-2">{totalRegistrations || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Receita Total</h3>
          <p className="text-3xl font-bold mt-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Eventos Ativos</h3>
          <p className="text-3xl font-bold mt-2">{activeEvents || 0}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-4">
        <a
          href="/admin/eventos/novo"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Criar Novo Evento
        </a>
        <a
          href="/admin/relatorios"
          className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50"
        >
          Ver Relatórios
        </a>
      </div>
    </div>
  )
}
```

---

### Comment 3: Use validateFormData Helper

**Priority:** MEDIUM (code quality improvement)

**Pattern to Apply:**

Replace this pattern:
```typescript
const validation = loginSchema.safeParse({ email, password })
if (!validation.success) {
  const firstError = validation.error.errors[0]
  setError(firstError.message)
  return
}
```

With this:
```typescript
const result = validateFormData(loginSchema, { email, password })
if (!result.success) {
  setError(Object.values(result.errors)[0])
  setFieldErrors(result.errors)
  return
}
// Use result.data for type-safe access
```

**Files to Update:**
1. `app/login/login-form.tsx`
2. `app/cadastro/register-form.tsx`
3. `app/recuperar-senha/reset-password-form.tsx`
4. `app/recuperar-senha/atualizar/update-password-form.tsx`

**Add field error display:**
```typescript
{fieldErrors.email && (
  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
)}
```

---

### Comment 4: OAuth Callback Honor callbackUrl

**Priority:** MEDIUM (UX improvement)

**File:** `app/auth/callback/route.ts`

**Changes:**
```typescript
// After successful exchangeCodeForSession
const callbackUrl = requestUrl.searchParams.get('callbackUrl')

// Get profile and role (existing logic)
const { data: freshProfile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

const role = freshProfile?.role || 'user'

// NEW: Honor callbackUrl if present
if (callbackUrl) {
  const { sanitizeRedirectUrl } = await import('@/lib/auth/utils')
  const safeUrl = sanitizeRedirectUrl(callbackUrl)

  if (safeUrl !== '/conta') {
    return NextResponse.redirect(`${origin}${safeUrl}`)
  }
}

// Fallback to role-based redirects
let redirectUrl = '/conta'
switch (role) {
  case 'admin':
    redirectUrl = '/admin/dashboard'
    break
  case 'organizer':
    redirectUrl = '/admin/eventos'
    break
}

return NextResponse.redirect(`${origin}${redirectUrl}`)
```

**Also Update:** `lib/auth/actions.ts` - `signInWithGoogle()` to pass callbackUrl:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl || '')}`,
  },
})
```

---

### Comment 5: Middleware Logging and Public Routes

**Priority:** LOW (edge case handling)

**File:** `middleware.ts`

**Changes:**

1. **Add env validation logging:**
```typescript
const env = getEnv()

if (!env.supabase.url || !env.supabase.anonKey) {
  console.warn('⚠️  Supabase environment variables missing - route protection is DISABLED')
  return supabaseResponse
}
```

2. **Expand public routes (sync with sitemap.md):**
```typescript
// Public routes (no auth required) - synced with docs/sitemap.md
// Exact match for auth routes, prefix match for content sections
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

// Auth callback requires exact match
const publicExact = ['/auth/callback']

const isPublicRoute =
  publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
  publicExact.includes(pathname)
```

3. **Document matching strategy:**
```typescript
// Public routes allow exact match or subpaths (e.g., /eventos/corrida-sp)
// Auth callback uses exact match for security
// Expand as new public pages are added per sitemap.md
```

---

## 📊 Implementation Status

- ✅ **Completed:** 5/9 comments
- 🔄 **Remaining:** 4/9 comments
- **Est. Time:** 1-2 hours for remaining implementations

## 🎯 Priority Order

1. **Comment 2** (HIGH) - Layouts enable end-to-end testing
2. **Comment 4** (MEDIUM) - OAuth UX improvement
3. **Comment 3** (MEDIUM) - Code quality
4. **Comment 5** (LOW) - Edge cases

All remaining implementations follow established patterns and are straightforward to complete.
