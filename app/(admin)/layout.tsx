import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { AdminLayout as AdminPanelLayout } from '@/components/admin-panel/admin-layout'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userData = await getCurrentUser()

  if (!userData?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  const { user, profile } = userData

  if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
    redirect('/conta?error=unauthorized')
  }

  return (
    <AdminPanelLayout user={user} profile={profile}>
      {children}
    </AdminPanelLayout>
  )
}
