import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import ApprovacoesPageClient from './aprovacoes-client'

export const metadata = {
    title: 'Aprovações - Admin Symplepass',
}

export default async function AprovacoesPage() {
    const result = await getCurrentUser()

    if (!result || !result.profile || result.profile.role !== 'admin') {
        redirect('/login')
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-neutral-600">
                <Link href="/admin/dashboard" className="hover:text-neutral-900">
                    Admin
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-neutral-900 font-medium">Aprovações</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Aprovação de Eventos</h1>
                    <p className="text-neutral-600 mt-1">
                        Revise e aprove eventos criados por organizadores
                    </p>
                </div>
            </div>

            {/* Client Component */}
            <ApprovacoesPageClient />
        </div>
    )
}
