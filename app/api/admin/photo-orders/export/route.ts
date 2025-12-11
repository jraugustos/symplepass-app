import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { exportPhotoOrdersToCSV, PhotoOrderFilters } from '@/lib/data/admin-photos'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { logAuditAction } from '@/lib/audit/audit-logger'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const result = await getCurrentUser()
    if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = result.user.id

    // Rate limiting - use export preset (heavy operation)
    const rateLimitKey = `all_photo_orders_export:${userId}`
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.export)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Parse filters from query params
    const searchParams = request.nextUrl.searchParams
    const filters: Omit<PhotoOrderFilters, 'page' | 'pageSize'> = {}

    const paymentStatus = searchParams.get('payment_status')
    if (paymentStatus && ['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      filters.payment_status = paymentStatus as PhotoOrderFilters['payment_status']
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    const startDate = searchParams.get('start_date')
    if (startDate) {
      filters.start_date = startDate
    }

    const endDate = searchParams.get('end_date')
    if (endDate) {
      filters.end_date = endDate
    }

    // Get export data (null eventId = all events)
    const exportData = await exportPhotoOrdersToCSV(null, filters)

    if (exportData.length === 0) {
      return NextResponse.json(
        { error: 'No orders to export' },
        { status: 404, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    // Build CSV content with event column
    const headers = [
      'Codigo do Pedido',
      'Evento',
      'Nome do Cliente',
      'Email do Cliente',
      'Pacote',
      'Quantidade de Fotos',
      'Valor Total',
      'Status do Pagamento',
      'Data do Pedido',
    ]

    const rows = exportData.map((order) => [
      order.codigo_pedido,
      order.evento,
      order.cliente_nome,
      order.cliente_email,
      order.pacote,
      order.quantidade_fotos.toString(),
      order.valor_total,
      order.status_pagamento,
      order.data_pedido,
    ])

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n')

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent

    // Log audit event
    await logAuditAction({
      action: 'export_photo_orders',
      targetType: 'photo_order',
      targetId: 'all',
      details: {
        scope: 'all_events',
        filters,
        export_count: exportData.length,
      },
    })

    // Return CSV file
    const filename = `pedidos_fotos_todos_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...rateLimitHeaders(rateLimitResult),
      },
    })
  } catch (error) {
    console.error('Error exporting all photo orders:', error)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
