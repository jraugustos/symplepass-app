import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { getPendingPhotosForProcessing } from '@/lib/data/face-embeddings'
import { getEventByIdForAdmin } from '@/lib/data/admin-events'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/events/[id]/face-processing/pending
 * Get photos pending face processing for an event
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Verify event exists and user has access
    const event = await getEventByIdForAdmin(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If organizer, verify ownership
    if (result.profile.role === 'organizer' && event.organizer_id !== result.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get pending photos
    const pendingResult = await getPendingPhotosForProcessing(eventId, limit)

    if (pendingResult.error) {
      return NextResponse.json(
        { error: pendingResult.error },
        { status: 500 }
      )
    }

    // Build public URLs for thumbnails
    const supabase = createClient()
    const { data: { publicUrl: basePublicUrl } } = supabase.storage
      .from('event-photos-watermarked')
      .getPublicUrl('')

    const photosWithUrls = (pendingResult.data || []).map((photo) => ({
      id: photo.id,
      thumbnailUrl: photo.thumbnail_path
        ? `${basePublicUrl}${photo.thumbnail_path}`
        : null,
    }))

    return NextResponse.json({ photos: photosWithUrls })
  } catch (error) {
    console.error('[API Face Processing Pending] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
