import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { SportType } from '@/types'
import {
  getUserPreferences,
  updateUserPreferences,
  getUserSessions,
  deleteUserSession,
} from '@/lib/data/user-preferences'

const preferencesSchema = z.object({
  favorite_sports: z.array(z.string()).optional(),
  notification_events: z.boolean().optional(),
  notification_promotions: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
})

const deleteSessionSchema = z.object({
  sessionId: z.string().uuid(),
})

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  return { user, response: null }
}

export async function GET() {
  const { user, response } = await getAuthenticatedUser()
  if (!user) return response

  const [preferencesResult, sessionsResult] = await Promise.all([
    getUserPreferences(user.id),
    getUserSessions(user.id),
  ])

  if (preferencesResult.error) {
    return NextResponse.json({ error: preferencesResult.error }, { status: 500 })
  }

  return NextResponse.json({
    data: preferencesResult.data,
    sessions: sessionsResult.data ?? [],
  })
}

export async function PATCH(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser()
  if (!user) return response

  try {
    const body = await request.json()
    const parsed = preferencesSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const payload: Partial<Record<string, any>> = { ...parsed.data }
    if (parsed.data.favorite_sports) {
      payload.favorite_sports = parsed.data.favorite_sports as SportType[]
    }

    const result = await updateUserPreferences(user.id, payload)

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Não foi possível atualizar preferências' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser()
  if (!user) return response

  try {
    const body = await request.json()
    const parsed = deleteSessionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Sessão inválida' },
        { status: 400 }
      )
    }

    const result = await deleteUserSession(parsed.data.sessionId, user.id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao encerrar sessão:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
