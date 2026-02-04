import { NextRequest, NextResponse } from 'next/server'
import { searchFacesByEmbedding, eventHasProcessedFaces } from '@/lib/data/face-embeddings'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/photos/search/face
 * Search for photos in an event by face embedding similarity
 *
 * Body: {
 *   eventId: string,
 *   embedding: number[] (128 dimensions)
 *   threshold?: number (default: 0.6, range: 0.5-0.9)
 *   limit?: number (default: 50, max: 100)
 * }
 *
 * Response: {
 *   matches: Array<{
 *     photoId: string,
 *     similarity: number,
 *     thumbnailUrl: string,
 *     watermarkedUrl: string,
 *     boundingBox?: { x, y, width, height }
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { eventId, embedding, threshold, limit } = body

    // Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { error: 'embedding must be an array of 128 numbers' },
        { status: 400 }
      )
    }

    // Validate optional parameters
    const searchThreshold = Math.min(0.9, Math.max(0.5, threshold ?? 0.6))
    const searchLimit = Math.min(100, Math.max(1, limit ?? 50))

    // Search for matching faces
    const searchResult = await searchFacesByEmbedding(eventId, embedding, {
      threshold: searchThreshold,
      limit: searchLimit,
    })

    if (searchResult.error) {
      console.error('[API Face Search] Search error:', searchResult.error)
      return NextResponse.json(
        { error: 'Failed to search for faces' },
        { status: 500 }
      )
    }

    const matches = searchResult.data || []

    // If no matches found, return empty array
    if (matches.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Get photo details for the matches
    const supabase = createClient()
    const photoIds = matches.map((m) => m.photo_id)

    const { data: photos, error: photosError } = await supabase
      .from('event_photos')
      .select('id, thumbnail_path, watermarked_path')
      .in('id', photoIds)

    if (photosError) {
      console.error('[API Face Search] Error fetching photos:', photosError)
      return NextResponse.json(
        { error: 'Failed to fetch photo details' },
        { status: 500 }
      )
    }

    // Create a map of photo details
    const photoMap = new Map(
      (photos || []).map((p) => [p.id, p])
    )

    // Get public URLs for thumbnails and watermarked images
    const { data: { publicUrl: basePublicUrl } } = supabase.storage
      .from('event-photos-watermarked')
      .getPublicUrl('')

    // Build response with photo URLs
    const matchesWithUrls = matches
      .map((match) => {
        const photo = photoMap.get(match.photo_id)
        if (!photo) return null

        return {
          photoId: match.photo_id,
          similarity: match.similarity,
          thumbnailUrl: photo.thumbnail_path
            ? `${basePublicUrl}${photo.thumbnail_path}`
            : null,
          watermarkedUrl: photo.watermarked_path
            ? `${basePublicUrl}${photo.watermarked_path}`
            : null,
          boundingBox: match.bounding_box,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ matches: matchesWithUrls })
  } catch (error) {
    console.error('[API Face Search POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/photos/search/face?eventId=xxx
 * Check if an event has face search available (processed photos)
 *
 * Response: {
 *   available: boolean
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    const hasProcessedFaces = await eventHasProcessedFaces(eventId)

    return NextResponse.json({ available: hasProcessedFaces })
  } catch (error) {
    console.error('[API Face Search GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
