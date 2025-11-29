# Auth Implementation - Fixes Applied

## ✅ Completed Fixes

### Comment 1: Consolidated validation and error mapping ✅
**Files Modified:**
- `lib/auth/actions.ts`

**Changes:**
- All server actions now validate inputs using Zod schemas (`loginSchema`, `registerSchema`, `resetPasswordSchema`, `updatePasswordSchema`)
- Removed duplicate `getAuthErrorMessage` function from `actions.ts`
- All actions now import and use `getAuthErrorMessage` from `lib/auth/utils.ts`
- Single canonical error translation implementation

### Comment 3: Use shared Profile type ✅
**Files Modified:**
- `contexts/auth-context.tsx`

**Changes:**
- Removed local `Profile` interface definition
- Now imports shared `Profile` type from `@/types`
- Ensures consistency with database types across the application

### Comment 4: Resolved signOut navigation ownership ✅
**Files Modified:**
- `lib/auth/actions.ts`

**Changes:**
- Removed `redirect('/login')` from server action
- Server action now only calls `supabase.auth.signOut()` and `revalidatePath()`
- Returns `{ data: { success: true } }` instead of redirecting
- Navigation is now fully handled by `AuthContext.signOut()` on the client
- Added comment documenting this decision

### Comment 6: Consolidated sanitizeRedirectUrl ✅
**Files Modified:**
- `lib/auth/utils.ts`
- `lib/utils.ts`

**Changes:**
- Updated `sanitizeRedirectUrl` in `lib/auth/utils.ts` to support both client and server environments
- Uses `typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL`
- Removed duplicate implementation from `lib/utils.ts`
- All imports should now use `import { sanitizeRedirectUrl } from '@/lib/auth/utils'`

---

## 🔄 Remaining Fixes (To Be Implemented)

### Comment 2: Wire Header and NavigationHeader with auth callbacks
**Files to Modify:**
- `components/layout/header.tsx`
- `components/molecules/navigation-header.tsx`

**Required Changes:**
1. In `header.tsx`:
   - Fetch user's profile role from `profiles` table
   - Define callbacks: `onLogin` → `/login`, `onLogout` → call `signOut()`, `onProfileClick` → `/conta` or `/admin/dashboard`
   - Pass `userRole` and callbacks to `NavigationHeader`

2. In `navigation-header.tsx`:
   - Add prop `userRole?: UserRole`
   - Conditionally render "Painel Admin" menu item for admin/organizer roles
   - Connect all user menu items to appropriate callbacks
   - Ensure existing call sites (e.g., `app/inscricao/review-client.tsx`) provide compatible props

### Comment 5: Implement user and admin layouts and placeholder pages
**Files to Create:**
- `app/(user)/layout.tsx`
- `app/(user)/conta/page.tsx`
- `app/(admin)/layout.tsx`
- `app/(admin)/admin/dashboard/page.tsx`

**Required Changes:**
1. `app/(user)/layout.tsx`:
   - Server component that checks auth with Supabase
   - Redirects unauthenticated users to `/login?callbackUrl={pathname}`
   - Renders Header + Footer around content
   - Basic sidebar/menu for user navigation

2. `app/(user)/conta/page.tsx`:
   - Welcome message with user's name
   - Placeholder cards for events summary and recent activity
   - Links to main user actions

3. `app/(admin)/layout.tsx`:
   - Server component that checks auth AND role
   - Redirects unauthorized users to `/conta?error=unauthorized`
   - Admin-styled layout with sidebar
   - Role indicator badge

4. `app/(admin)/admin/dashboard/page.tsx`:
   - Basic dashboard with mock metrics
   - Cards for total events, registrations, revenue
   - CTAs for common admin actions

### Comment 7: Use validateFormData helper in auth forms
**Files to Modify:**
- `app/login/login-form.tsx`
- `app/cadastro/register-form.tsx`
- `app/recuperar-senha/reset-password-form.tsx`
- `app/recuperar-senha/atualizar/update-password-form.tsx`

**Required Changes:**
- Replace manual `schema.safeParse()` calls with `validateFormData(schema, data)`
- Use the standardized `{ success, data, errors }` pattern
- Update local `error` and `fieldErrors` state from helper's return value
- Simplifies validation logic and ensures consistency

### Comment 8: Fix RLS policy conflicts in migration
**Files to Modify:**
- `supabase/migrations/006_auth_improvements.sql`
- Verify against: `002_rls_policies.sql`

**Required Changes:**
- Check if `FOR INSERT` policy already exists on `profiles`
- Add `DROP POLICY IF EXISTS` before creating new policy
- Use `CREATE POLICY IF NOT EXISTS` where appropriate
- Ensure migration is idempotent and can be re-run safely
- Verify final policy set is unambiguous (no conflicting policies)

**Suggested Fix:**
```sql
-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new INSERT policy
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Comment 9: Honor callbackUrl in OAuth callback
**Files to Modify:**
- `app/auth/callback/route.ts`

**Required Changes:**
- Read `callbackUrl` from request query parameters
- Pass through `sanitizeRedirectUrl(callbackUrl)` for safety
- Prefer redirecting to sanitized callback URL if present and valid
- Fall back to role-based redirects (`/admin/dashboard`, `/conta`) when no callback
- Maintain existing error handling for OAuth failures
- Keep redirect to `/login?error=oauth_failed` on errors

**Example:**
```typescript
const callbackUrl = requestUrl.searchParams.get('callbackUrl')
const safeUrl = callbackUrl ? sanitizeRedirectUrl(callbackUrl) : null

// After successful auth and role determination:
if (safeUrl && safeUrl !== '/conta') {
  return NextResponse.redirect(`${origin}${safeUrl}`)
}
// else: use role-based redirects as current implementation
```

### Comment 10: Improve middleware edge cases and logging
**Files to Modify:**
- `middleware.ts`

**Required Changes:**
1. **Add logging when env vars are missing:**
   ```typescript
   if (!env.supabase.url || !env.supabase.anonKey) {
     console.warn('⚠️  Supabase credentials missing - route protection disabled')
     return supabaseResponse
   }
   ```

2. **Review publicRoutes against sitemap:**
   - Ensure all public pages are included (check `/modalidades`, marketing pages, etc.)
   - Document in comments which routes are public and why

3. **Refine isPublicRoute logic:**
   - Consider exact matches vs. prefix matches
   - Add comments explaining the matching strategy
   - Example:
   ```typescript
   // Public routes that allow exact match or subpaths
   const publicRoutes = ['/login', '/cadastro', '/recuperar-senha', '/auth/callback', '/', '/eventos', '/sobre']

   // Events route allows subpaths (e.g., /eventos/corrida-sao-paulo)
   const publicPrefixes = ['/eventos/']

   const isPublicRoute = publicRoutes.includes(pathname) ||
                         publicPrefixes.some(prefix => pathname.startsWith(prefix))
   ```

4. **Document security decisions:**
   - Add comments explaining why certain routes are public
   - Note any special handling for sensitive routes

---

## 📋 Testing Checklist

After implementing remaining fixes:

- [ ] Test login with email/password
- [ ] Test registration with validation errors
- [ ] Test Google OAuth login
- [ ] Test logout (verify client navigation works)
- [ ] Test password recovery flow
- [ ] Test `/conta` access when not authenticated (should redirect)
- [ ] Test `/admin` access as regular user (should redirect to `/conta`)
- [ ] Test `/admin` access as organizer/admin (should allow)
- [ ] Test OAuth callback with `callbackUrl` parameter
- [ ] Verify middleware logs warning when Supabase env vars are missing
- [ ] Test RLS migration can be re-run without errors
- [ ] Verify all form validations use `validateFormData` helper

---

## 🔒 Security Considerations

1. **Server Actions:** All auth operations go through server actions (secure)
2. **Input Validation:** All inputs validated with Zod before hitting Supabase
3. **Redirect Sanitization:** `sanitizeRedirectUrl` prevents open redirects
4. **RLS Policies:** Row Level Security enforced at database level
5. **Middleware Protection:** Routes protected at Next.js middleware layer
6. **Role-Based Access:** Admin panel requires specific roles
7. **Session Management:** Handled by Supabase Auth with secure cookies

---

## 📝 Migration Guide

### For Developers:

1. **Applying the migration:**
   ```bash
   # In Supabase Dashboard → SQL Editor
   # Execute: supabase/migrations/006_auth_improvements.sql
   ```

2. **Update environment variables:**
   ```bash
   # Ensure .env.local has:
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Test authentication flows:**
   - Create new account at `/cadastro`
   - Login at `/login`
   - Try accessing `/conta` and `/admin`

4. **Configure Google OAuth (optional):**
   - Follow instructions in `SETUP.md` section 3.3

---

## 🎯 Next Steps

1. **Implement Comment 8** (RLS policy fix) - **Priority: High** (blocks migration)
2. **Implement Comment 5** (layouts/pages) - **Priority: High** (completes auth flow)
3. **Implement Comment 2** (Header integration) - **Priority: Medium** (improves UX)
4. **Implement Comment 7** (form validation) - **Priority: Low** (code quality)
5. **Implement Comments 9 & 10** (OAuth + middleware) - **Priority: Low** (edge cases)

All remaining fixes are straightforward implementations following the patterns established in the completed work.
