import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { deletePhotoOrder } from '@/lib/data/photo-orders'
import { logAuditAction } from '@/lib/audit/audit-logger'

interface RouteContext {
  params: Promise<{ orderId: string }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication - admin only
    const result = await getCurrentUser()
    if (!result || !result.profile || result.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await context.params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Delete the order
    const { data, error } = await deletePhotoOrder(orderId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Log audit event
    await logAuditAction({
      action: 'delete_photo_order',
      targetType: 'photo_order',
      targetId: orderId,
      details: {
        deleted_by: result.user.id,
      },
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error deleting photo order:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
