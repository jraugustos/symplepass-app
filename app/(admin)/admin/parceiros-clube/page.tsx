import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllPartners } from '@/lib/data/club-partners'
import { ClubPartnersPageClient } from '@/components/admin/club-partners-page-client'

export const metadata = {
    title: 'Parceiros do Clube - Admin Symplepass',
}

export const dynamic = 'force-dynamic'

export default async function ParceirosClubePage() {
    const result = await getCurrentUser()

    if (!result || !result.profile || result.profile.role !== 'admin') {
        redirect('/login')
    }

    const { data: partners } = await getAllPartners()

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-neutral-600">
                <Link href="/admin/dashboard" className="hover:text-neutral-900">
                    Admin
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-neutral-900 font-medium">Parceiros do Clube</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Parceiros do Clube de Benefícios</h1>
                <p className="text-neutral-600 mt-1">
                    Gerencie os parceiros exibidos na página do clube ({partners?.length || 0} total)
                </p>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <ClubPartnersPageClient partners={partners || []} />
            </div>
        </div>
    )
}
