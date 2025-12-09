import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { deleteRegistration, updateRegistration, UpdateRegistrationData } from '@/lib/data/admin-registrations'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

const updateRegistrationSchema = z.object({
  category_id: z.string().uuid().optional(),
  partner_data: z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    shirtSize: z.string().optional(),
    // Transform empty string to undefined for shirtGender
    shirtGender: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.enum(['masculino', 'feminino', 'infantil']).optional()
    ),
  }).nullable().optional(),
})

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

/**
 * PUT /api/admin/registrations/[id]
 * Updates a registration (admin only)
 */
export async function PUT(
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
        { error: 'Acesso negado. Apenas administradores podem editar inscrições.' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = updateRegistrationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: UpdateRegistrationData = validationResult.data

    // Update the registration
    const result = await updateRegistration(registrationId, updateData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'registration_update',
      targetType: 'registration',
      targetId: registrationId,
      details: {
        updatedBy: user.id,
        changes: {
          category_id: updateData.category_id,
          partner_data: updateData.partner_data ? 'updated' : undefined,
        },
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/registrations/[id]:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação' },
      { status: 500 }
    )
  }
}
