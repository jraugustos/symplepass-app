import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { deleteCoupon } from '@/lib/data/admin-coupons'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const couponId = params.id
    const { success, error } = await deleteCoupon(couponId)

    if (!success || error) {
      return NextResponse.json(
        { error: error || 'Failed to delete coupon' },
        { status: 500 }
      )
    }

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'coupon_delete',
      targetType: 'coupon',
      targetId: couponId,
      details: { deletedBy: result.profile.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
