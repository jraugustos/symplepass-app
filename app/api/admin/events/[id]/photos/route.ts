import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import {
  getPhotosByEventId,
  getPhotoPackagesByEventId,
  getPhotoOrdersByEventId,
  getPhotoOrderStats,
  createPhoto,
  deletePhoto,
  type CreatePhotoData,
} from '@/lib/data/admin-photos'
import { getEventByIdForAdmin } from '@/lib/data/admin-events'
import { photoUploadService } from '@/lib/photos/upload-service'

/**
 * GET /api/admin/events/[id]/photos
 * Get all photos, packages, orders, and stats for an event
 * Optional query param: ?include=orders,stats to include orders and stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile ||
      (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const includeParam = searchParams.get('include') || ''
    const includeOptions = includeParam.split(',').map(s => s.trim())

    // Verify event exists and user has access
    const event = await getEventByIdForAdmin(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If organizer, verify ownership
    if (result.profile.role === 'organizer' && event.organizer_id !== result.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build array of promises based on what's requested
    const promises: Promise<any>[] = [
      getPhotosByEventId(eventId),
      getPhotoPackagesByEventId(eventId),
    ]

    const includeOrders = includeOptions.includes('orders')
    const includeStats = includeOptions.includes('stats')

    if (includeOrders) {
      promises.push(getPhotoOrdersByEventId(eventId))
    }
    if (includeStats) {
      promises.push(getPhotoOrderStats(eventId))
    }

    const results = await Promise.all(promises)

    const response: {
      photos: any
      packages: any
      orders?: any
      stats?: any
    } = {
      photos: results[0],
      packages: results[1],
    }

    if (includeOrders) {
      response.orders = results[2]
    }
    if (includeStats) {
      response.stats = results[includeOrders ? 3 : 2]
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API Photos GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/events/[id]/photos
 * Create a new photo record (after upload)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile ||
      (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
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

    const body = await request.json() as Omit<CreatePhotoData, 'event_id'>

    // Validate required fields
    if (!body.original_path || !body.watermarked_path || !body.thumbnail_path || !body.file_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const createResult = await createPhoto({
      event_id: eventId,
      ...body,
    })

    if (createResult.error) {
      return NextResponse.json(
        { error: createResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json(createResult.data, { status: 201 })
  } catch (error) {
    console.error('[API Photos POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/events/[id]/photos?photoId=xxx
 * Delete a photo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCurrentUser()

    if (!result || !result.profile ||
      (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      )
    }

    // Verify event exists and user has access
    const event = await getEventByIdForAdmin(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If organizer, verify ownership
    if (result.profile.role === 'organizer' && event.organizer_id !== result.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete from database first (this will check for paid orders)
    const deleteResult = await deletePhoto(photoId)

    if (deleteResult.error) {
      return NextResponse.json(
        { error: deleteResult.error },
        { status: 400 }
      )
    }

    // Delete from storage using the original_path from database
    // This extracts the UUID from the path to delete all versions
    if (deleteResult.data?.original_path) {
      try {
        await photoUploadService.deleteEventPhotoByPath(deleteResult.data.original_path)
      } catch (storageError) {
        console.error('[API Photos DELETE] Storage deletion error:', storageError)
        // Continue even if storage deletion fails - the DB record is already deleted
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Photos DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
