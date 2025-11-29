'use client'

import { UserDetailCard as UserDetailCardComponent } from '@/components/admin/user-detail-card'
import { Profile, UserRole } from '@/types'
import { useRouter } from 'next/navigation'

interface UserDetailCardClientProps {
  user: Profile
  canEditRole: boolean
}

export function UserDetailCardClient({ user, canEditRole }: UserDetailCardClientProps) {
  const router = useRouter()

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })

    if (!response.ok) {
      throw new Error('Failed to update role')
    }

    router.refresh()
  }

  return (
    <UserDetailCardComponent
      user={user}
      onUpdateRole={handleUpdateRole}
      canEditRole={canEditRole}
    />
  )
}