import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import {
  saveFaceEmbeddings,
  updateProcessingStatus,
  getProcessingStatus,
} from '@/lib/data/face-embeddings'

/**
 * POST /api/photos/embeddings
 * Save face embeddings for a photo
 *
 * Body: {
 *   photoId: string,
 *   eventId: string,
 *   embeddings: Array<{
 *     embedding: number[],
 *     boundingBox?: { x: number, y: number, width: number, height: number },
 *     confidence?: number
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { photoId, eventId, embeddings } = body

    // Validate required fields
    if (!photoId || !eventId) {
      return NextResponse.json(
        { error: 'photoId and eventId are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(embeddings)) {
      return NextResponse.json(
        { error: 'embeddings must be an array' },
        { status: 400 }
      )
    }

    // Validate embedding format
    for (const e of embeddings) {
      if (!Array.isArray(e.embedding) || e.embedding.length !== 128) {
        return NextResponse.json(
          { error: 'Each embedding must be an array of 128 numbers' },
          { status: 400 }
        )
      }
    }

    // Save embeddings
    const saveResult = await saveFaceEmbeddings(photoId, eventId, embeddings)

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || 'Failed to save embeddings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      facesFound: embeddings.length,
    })
  } catch (error) {
    console.error('[API Embeddings POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/photos/embeddings?photoId=xxx
 * Get processing status for a photo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      )
    }

    const result = await getProcessingStatus(photoId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Return pending status if no record exists
    if (!result.data) {
      return NextResponse.json({
        photo_id: photoId,
        status: 'pending',
        faces_found: 0,
        processed_at: null,
        error_message: null,
      })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[API Embeddings GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/photos/embeddings
 * Update processing status for a photo (e.g., mark as failed)
 *
 * Body: {
 *   photoId: string,
 *   status: 'pending' | 'processing' | 'completed' | 'failed' | 'no_faces',
 *   facesFound?: number,
 *   errorMessage?: string
 * }
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { photoId, status, facesFound, errorMessage } = body

    // Validate required fields
    if (!photoId || !status) {
      return NextResponse.json(
        { error: 'photoId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'no_faces']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update status
    const updateResult = await updateProcessingStatus(
      photoId,
      status,
      facesFound,
      errorMessage
    )

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error || 'Failed to update status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Embeddings PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
