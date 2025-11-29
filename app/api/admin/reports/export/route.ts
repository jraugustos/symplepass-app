import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { exportFinancialReport } from '@/lib/data/admin-reports'
import { arrayToCSV } from '@/lib/utils'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: export operations (heavy DB operations)
    const rateLimitResult = checkRateLimit(
      `export-reports:${result.profile.id}`,
      RATE_LIMITS.export
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas exportações. Aguarde um minuto.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const { searchParams } = request.nextUrl
    const filters = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      event_id: searchParams.get('event_id') || undefined,
      sport_type: searchParams.get('sport_type') || undefined,
      payment_status: searchParams.get('payment_status') as any || undefined,
    }

    const exportData = await exportFinancialReport(filters)

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'export_reports',
      targetType: 'report',
      details: { filters, recordCount: exportData.length, exportedBy: result.profile.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    // Convert to CSV
    const csv = arrayToCSV(exportData)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `relatorio-financeiro-${timestamp}.csv`

    // Return CSV with proper headers
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting financial report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
