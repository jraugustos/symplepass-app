import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/auth/validation'

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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json({ error: 'Não foi possível carregar perfil' }, { status: 500 })
  }

  const download = request.nextUrl.searchParams.get('download')
  if (download) {
    return new NextResponse(JSON.stringify(profile, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="symplepass-profile.json"',
      },
    })
  }

  return NextResponse.json({ data: profile })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, response } = await getUserContext()
  if (!user) return response

  try {
    const body = await request.json()
    const parsed = profileUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const payload = parsed.data

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return NextResponse.json({ error: 'Não foi possível atualizar perfil' }, { status: 400 })
    }

    revalidatePath('/conta')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
