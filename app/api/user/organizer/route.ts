import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { organizerProfileSchema } from '@/lib/auth/validation'

async function getUserContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  return { supabase, user, response: null }
}

export async function GET(request: NextRequest) {
  const { supabase, user, response } = await getUserContext()
  if (!user) return response

  // Check if user has organizer or admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 })
  }

  if (profile.role !== 'organizer' && profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Você não tem permissão para acessar perfis de organizador' },
      { status: 403 }
    )
  }

  const { data: organizer, error } = await supabase
    .from('event_organizers')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Perfil de organizador não encontrado' }, { status: 404 })
    }
    console.error('Erro ao buscar perfil de organizador:', error)
    return NextResponse.json({ error: 'Não foi possível carregar perfil de organizador' }, { status: 500 })
  }

  const download = request.nextUrl.searchParams.get('download')
  if (download) {
    return new NextResponse(JSON.stringify(organizer, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="symplepass-organizer-profile.json"',
      },
    })
  }

  return NextResponse.json({ data: organizer })
}

export async function POST(request: NextRequest) {
  const { supabase, user, response } = await getUserContext()
  if (!user) return response

  try {
    // Check if user has organizer or admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 })
    }

    if (profile.role !== 'organizer' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Você não tem permissão para criar um perfil de organizador' },
        { status: 403 }
      )
    }

    // Check if organizer profile already exists
    const { data: existing } = await supabase
      .from('event_organizers')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Você já possui um perfil de organizador. Use PATCH para atualizar.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = organizerProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const payload = {
      profile_id: user.id,
      ...parsed.data,
    }

    const { data, error } = await supabase
      .from('event_organizers')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar perfil de organizador:', error)
      return NextResponse.json({ error: 'Não foi possível criar perfil de organizador' }, { status: 400 })
    }

    revalidatePath('/admin/eventos')
    revalidatePath('/admin/perfil-organizador')

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar perfil de organizador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, response } = await getUserContext()
  if (!user) return response

  try {
    const body = await request.json()
    const parsed = organizerProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const payload = parsed.data

    const { data, error } = await supabase
      .from('event_organizers')
      .update(payload)
      .eq('profile_id', user.id)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Perfil de organizador não encontrado' }, { status: 404 })
      }
      console.error('Erro ao atualizar perfil de organizador:', error)
      return NextResponse.json({ error: 'Não foi possível atualizar perfil de organizador' }, { status: 400 })
    }

    revalidatePath('/admin/eventos')
    revalidatePath('/admin/perfil-organizador')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao atualizar perfil de organizador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, response } = await getUserContext()
  if (!user) return response

  try {
    const { error } = await supabase
      .from('event_organizers')
      .delete()
      .eq('profile_id', user.id)

    if (error) {
      console.error('Erro ao deletar perfil de organizador:', error)
      return NextResponse.json({ error: 'Não foi possível deletar perfil de organizador' }, { status: 400 })
    }

    revalidatePath('/admin/eventos')
    revalidatePath('/admin/perfil-organizador')

    return NextResponse.json({ message: 'Perfil de organizador deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar perfil de organizador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
