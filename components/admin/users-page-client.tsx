'use client'

import { useRouter } from 'next/navigation'
import { UsersTable } from './users-table'
import { UserRole } from '@/types/database.types'

interface UsersPageClientProps {
  users: any[]
  total: number
  currentPage: number
  pageSize: number
  filters: any
  availableCities?: { value: string; label: string; count?: number }[];
}

export function UsersPageClient({ users, total, currentPage, pageSize, filters: initialFilters, availableCities = [] }: UsersPageClientProps) {
  const router = useRouter()

  const handleViewUser = (userId: string) => {
    router.push(`/admin/usuarios/${userId}`)
  }

  const handleFilterChange = (newFilters: {
    role?: UserRole | '';
    search?: string;
    city?: string;
    preferred_sport?: string;
    event_sport?: string;
    is_benefits_club_member?: boolean;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams()
    if (newFilters.role) queryParams.set('role', newFilters.role)
    if (newFilters.search) queryParams.set('search', newFilters.search)
    if (newFilters.city) queryParams.set('city', newFilters.city)
    if (newFilters.preferred_sport) queryParams.set('preferred_sport', newFilters.preferred_sport)
    if (newFilters.event_sport) queryParams.set('event_sport', newFilters.event_sport)
    if (newFilters.is_benefits_club_member !== undefined) queryParams.set('is_benefits_club_member', newFilters.is_benefits_club_member.toString())
    if (newFilters.page && newFilters.page > 1) queryParams.set('page', newFilters.page.toString())

    router.push(`/admin/usuarios?${queryParams.toString()}`)
  }

  return (
    <UsersTable
      users={users}
      total={total}
      currentPage={currentPage}
      pageSize={pageSize}
      initialFilters={initialFilters}
      availableCities={availableCities}
      onViewUser={handleViewUser}
      onFilterChange={handleFilterChange}
    />
  )
}
