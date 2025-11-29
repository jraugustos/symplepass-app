import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { exportRegistrationsToCSV } from '@/lib/data/admin-registrations'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: export operations (heavy DB operations)
    const rateLimitResult = checkRateLimit(
      `export-registrations:${result.profile.id}`,
      RATE_LIMITS.export
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas exportações. Aguarde um minuto.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const eventId = params.id
    const exportData = await exportRegistrationsToCSV(eventId)

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'export_registrations',
      targetType: 'registration',
      targetId: eventId,
      details: { eventId, exportedBy: result.profile.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Error exporting registrations:', error)
    return NextResponse.json(
      { error: 'Failed to export registrations' },
      { status: 500 }
    )
  }
}
