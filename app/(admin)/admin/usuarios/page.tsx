import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllUsers } from '@/lib/data/admin-users'
import { getFilterOptions } from '@/lib/data/events'
import { UsersPageClient } from '@/components/admin/users-page-client'
import { UserRole } from '@/types/database.types'

export const metadata = {
  title: 'Usuários - Admin Symplepass',
}

interface SearchParams {
  role?: string
  search?: string
  page?: string
  city?: string
  preferred_sport?: string
  event_sport?: string
  is_benefits_club_member?: string
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || result.profile.role !== 'admin') {
    redirect('/login')
  }

  const filters = {
    role: searchParams.role as UserRole | undefined,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 50,
    city: searchParams.city,
    preferred_sport: searchParams.preferred_sport,
    event_sport: searchParams.event_sport,
    is_benefits_club_member: searchParams.is_benefits_club_member === 'true' ? true : searchParams.is_benefits_club_member === 'false' ? false : undefined,
  }

  const [{ users, total }, { cities }] = await Promise.all([
    getAllUsers(filters),
    getFilterOptions(),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Usuários</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Usuários</h1>
          <p className="text-neutral-600 mt-1">
            Gerencie usuários do sistema ({total} total)
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <UsersPageClient
          users={users}
          total={total}
          currentPage={filters.page as number}
          pageSize={filters.pageSize as number}
          filters={filters}
          availableCities={cities}
        />
      </div>
    </div>
  )
}
