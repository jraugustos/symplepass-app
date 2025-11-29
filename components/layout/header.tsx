import { NavigationHeader } from '@/components/molecules/navigation-header'
import { NavigationVariant, UserRole } from '@/types'
import { redirect } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth/actions'
import { redirectAfterLogin } from '@/lib/auth/utils'

export interface HeaderProps {
  variant?: NavigationVariant
  sticky?: boolean
  className?: string
}

export async function Header({ variant = 'dark', sticky = true, className }: HeaderProps) {
  const userData = await getCurrentUser()
  const user = userData?.user || null
  const profile = userData?.profile || null
  const userRole: UserRole = profile?.role || 'user'

  const userName = user?.user_metadata?.full_name || profile?.full_name || user?.email?.split('@')[0]
  const userEmail = user?.email || profile?.email

  // Server action for login
  async function handleLogin() {
    'use server'
    redirect('/login')
  }

  // Server action for logout
  async function handleLogout() {
    'use server'
    await signOut()
    // Note: signOut no longer redirects, but we'll redirect here for server component
    redirect('/login')
  }

  // Server action for profile navigation
  async function handleProfileClick(destination?: string) {
    'use server'
    redirect(destination || redirectAfterLogin(userRole))
  }

  return (
    <NavigationHeader
      variant={variant}
      sticky={sticky}
      isAuthenticated={!!user}
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onProfileClick={handleProfileClick}
      className={className}
    />
  )
}
