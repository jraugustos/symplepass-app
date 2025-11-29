import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllUsers } from '@/lib/data/admin-users'
import { UsersPageClient } from '@/components/admin/users-page-client'
import { UserRole } from '@/types/database.types'

export const metadata = {
  title: 'Usuários - Admin Symplepass',
}

interface SearchParams {
  role?: UserRole
  search?: string
  page?: string
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
    role: searchParams.role,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 50,
  }

  const { users, total } = await getAllUsers(filters)

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
        <UsersPageClient users={users} />
      </div>
    </div>
  )
}
