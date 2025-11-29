import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { PerfilOrganizadorClient } from './perfil-organizador-client'

export const metadata = {
  title: 'Perfil do Organizador - Admin Symplepass',
}

export default async function PerfilOrganizadorPage() {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Perfil do Organizador</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Perfil do Organizador</h1>
        <p className="text-neutral-600 mt-1">
          Gerencie as informações públicas da sua organização que serão exibidas nos eventos
        </p>
      </div>

      {/* Client Component */}
      <PerfilOrganizadorClient />
    </div>
  )
}
