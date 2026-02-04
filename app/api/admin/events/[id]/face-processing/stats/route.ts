import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { getEventProcessingStats } from '@/lib/data/face-embeddings'
import { getEventByIdForAdmin } from '@/lib/data/admin-events'

/**
 * GET /api/admin/events/[id]/face-processing/stats
 * Get face processing statistics for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const result = await getCurrentUser()

    if (
      !result ||
      !result.profile ||
      (result.profile.role !== 'admin' && result.profile.role !== 'organizer')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Verify event exists and user has access
    const event = await getEventByIdForAdmin(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If organizer, verify ownership
    if (result.profile.role === 'organizer' && event.organizer_id !== result.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get processing stats
    const statsResult = await getEventProcessingStats(eventId)

    if (statsResult.error) {
      return NextResponse.json(
        { error: statsResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json(statsResult.data)
  } catch (error) {
    console.error('[API Face Processing Stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
