import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createCoupon, updateCoupon } from '@/lib/data/admin-coupons'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { coupon, error } = await createCoupon(data, result.profile.id)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'coupon_create',
      targetType: 'coupon',
      targetId: coupon?.id,
      details: { code: data.code, createdBy: result.profile.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    const { coupon, error } = await updateCoupon(id, data)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Audit log (fire and forget - doesn't block response)
    logAuditAction({
      action: 'coupon_update',
      targetType: 'coupon',
      targetId: id,
      details: { updatedBy: result.profile.id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}