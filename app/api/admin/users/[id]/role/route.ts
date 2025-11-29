import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { updateUserRole } from '@/lib/data/admin-users'
import { UserRole } from '@/types/database.types'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile || result.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: strict for role changes (sensitive operation)
    const rateLimitResult = checkRateLimit(
      `role-change:${result.profile.id}`,
      RATE_LIMITS.strict
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['user', 'organizer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const userId = params.id
    const { success, error } = await updateUserRole(userId, role as UserRole)

    if (!success || error) {
      return NextResponse.json(
        { error: error || 'Failed to update role' },
        { status: 500 }
      )
    }

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'role_change',
      targetType: 'user',
      targetId: userId,
      details: { newRole: role, changedBy: result.profile.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
