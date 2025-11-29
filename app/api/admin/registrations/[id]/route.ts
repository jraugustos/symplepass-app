import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteRegistration } from '@/lib/data/admin-registrations'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

/**
 * DELETE /api/admin/registrations/[id]
 * Deletes a registration (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID da inscrição é obrigatório' },
        { status: 400 }
      )
    }

    // Verify admin permissions
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Check if user is admin or organizer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'organizer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem excluir inscrições.' },
        { status: 403 }
      )
    }

    // Delete the registration
    const result = await deleteRegistration(registrationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'registration_delete',
      targetType: 'registration',
      targetId: registrationId,
      details: { deletedBy: user.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/registrations/[id]:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação' },
      { status: 500 }
    )
  }
}
