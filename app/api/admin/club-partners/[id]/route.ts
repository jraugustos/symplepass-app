import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updatePartner, deletePartner } from '@/lib/data/club-partners'

export const runtime = 'nodejs'

async function checkAdmin() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return null

    return user
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await checkAdmin()
        if (!user) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const body = await request.json()
        const { name, description, link, logo_url, is_active, sort_order } = body

        const updates: Record<string, any> = {}
        if (name !== undefined) updates.name = name.trim()
        if (description !== undefined) updates.description = description?.trim() || null
        if (link !== undefined) updates.link = link?.trim() || null
        if (logo_url !== undefined) updates.logo_url = logo_url || null
        if (is_active !== undefined) updates.is_active = is_active
        if (sort_order !== undefined) updates.sort_order = sort_order

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
        }

        const { data, error } = await updatePartner(params.id, updates)

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({ partner: data })
    } catch (error) {
        console.error('Erro ao atualizar parceiro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await checkAdmin()
        if (!user) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { error } = await deletePartner(params.id)

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao deletar parceiro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
