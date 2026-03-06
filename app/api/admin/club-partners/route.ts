import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPartner, getAllPartners } from '@/lib/data/club-partners'

export const runtime = 'nodejs'

export async function GET() {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { data, error } = await getAllPartners()

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({ partners: data })
    } catch (error) {
        console.error('Erro ao buscar parceiros:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const body = await request.json()
        const { name, description, link, logo_url, sort_order } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome do parceiro é obrigatório' }, { status: 400 })
        }

        const { data, error } = await createPartner({
            name: name.trim(),
            description: description?.trim() || null,
            link: link?.trim() || null,
            logo_url: logo_url || null,
            sort_order: sort_order ?? 0,
        })

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({ partner: data }, { status: 201 })
    } catch (error) {
        console.error('Erro ao criar parceiro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
