import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/data/admin-users'
import { UserRole } from '@/types'
import { formatDate } from '@/lib/utils'
import { getSportLabel } from '@/lib/constants/sports'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const { searchParams } = new URL(request.url)

        const search = searchParams.get('search') || undefined
        const role = (searchParams.get('role') as UserRole) || undefined
        const city = searchParams.get('city') || undefined
        const preferred_sport = searchParams.get('preferred_sport') || undefined
        const event_sport = searchParams.get('event_sport') || undefined
        const is_benefits_club_member_str = searchParams.get('is_benefits_club_member')

        let is_benefits_club_member: boolean | undefined = undefined
        if (is_benefits_club_member_str === 'true') is_benefits_club_member = true
        if (is_benefits_club_member_str === 'false') is_benefits_club_member = false

        const { users } = await getAllUsers({
            search,
            role,
            city,
            preferred_sport,
            event_sport,
            is_benefits_club_member,
            page: 1,
            pageSize: 10000, // Large number to export all matching users
        })

        // Fetch participated sports for these users
        const userIds = users.map((u) => u.id)

        let userSportsMap = new Map<string, Set<string>>()
        if (userIds.length > 0) {
            const { data: regs } = await supabase
                .from('registrations')
                .select('user_id, events(sport_type)')
                .in('user_id', userIds)
                .in('status', ['confirmed', 'paid']) // Only confirmed/paid registrations

            regs?.forEach((reg: any) => {
                const sport = reg.events?.sport_type
                if (sport) {
                    if (!userSportsMap.has(reg.user_id)) {
                        userSportsMap.set(reg.user_id, new Set())
                    }
                    userSportsMap.get(reg.user_id)!.add(getSportLabel(sport) || sport)
                }
            })
        }

        // Create CSV header (Using Brazilian Portuguese headers with BOM for Excel)
        const BOM = '\uFEFF';
        const headers = ['Nome', 'Email', 'CPF', 'Perfil', 'Cadastrado em', 'Esportes Preferidos', 'Esportes Participados']

        // Create CSV rows
        const rows = users.map(u => {
            const participatedSports = Array.from(userSportsMap.get(u.id) || []).join(', ')
            const favoriteSports = (u.favorite_sports || []).map((s: string) => getSportLabel(s) || s).join(', ')

            return [
                `"${(u.full_name || '').replace(/"/g, '""')}"`,
                `"${u.email || ''}"`,
                `"${u.cpf || ''}"`,
                `"${u.role || ''}"`,
                `"${formatDate(u.created_at)}"`,
                `"${favoriteSports}"`,
                `"${participatedSports}"`
            ]
        })

        const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="usuarios-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        })
    } catch (error) {
        console.error('Error exporting users to CSV:', error)
        return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 })
    }
}
