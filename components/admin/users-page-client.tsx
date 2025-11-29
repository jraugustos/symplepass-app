'use client'

import { useRouter } from 'next/navigation'
import { UsersTable } from './users-table'
import { UserRole } from '@/types/database.types'

interface UsersPageClientProps {
  users: any[]
}

export function UsersPageClient({ users }: UsersPageClientProps) {
  const router = useRouter()

  const handleViewUser = (userId: string) => {
    router.push(`/admin/usuarios/${userId}`)
  }

  const handleFilterChange = (filters: { role?: UserRole; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (filters.role) queryParams.set('role', filters.role)
    if (filters.search) queryParams.set('search', filters.search)
    router.push(`/admin/usuarios?${queryParams.toString()}`)
  }

  return (
    <UsersTable
      users={users}
      onViewUser={handleViewUser}
      onFilterChange={handleFilterChange}
    />
  )
}
