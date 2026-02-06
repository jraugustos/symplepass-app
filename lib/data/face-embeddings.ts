/**
 * Data access functions for face embeddings and face search
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'

// ============================================================
// Types
// ============================================================

export interface FaceEmbedding {
  id: string
  photo_id: string
  event_id: string
  embedding: number[]
  bounding_box: {
    x: number
    y: number
    width: number
    height: number
  } | null
  detection_confidence: number | null
  created_at: string
}

export interface PhotoFaceProcessingRecord {
  photo_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'no_faces'
  faces_found: number
  processed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface FaceSearchResult {
  photo_id: string
  similarity: number
  bounding_box: {
    x: number
    y: number
    width: number
    height: number
  } | null
}

export interface FaceProcessingStats {
  total_photos: number
  pending_photos: number
  processing_photos: number
  completed_photos: number
  failed_photos: number
  no_faces_photos: number
  total_faces_found: number
}

export interface SaveEmbeddingData {
  photo_id: string
  event_id: string
  embedding: number[]
  bounding_box?: {
    x: number
    y: number
    width: number
    height: number
  }
  detection_confidence?: number
}

// ============================================================
// Embedding CRUD operations
// ============================================================

/**
 * Save face embeddings for a photo
 * Uses admin client to bypass RLS (called from processing pipeline)
 */
export async function saveFaceEmbeddings(
  photoId: string,
  eventId: string,
  embeddings: Array<{
    embedding: number[]
    boundingBox?: { x: number; y: number; width: number; height: number }
    confidence?: number
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Prepare embedding records
    const records = embeddings.map((e) => ({
      photo_id: photoId,
      event_id: eventId,
      // Convert embedding array to pgvector format string
      embedding: `[${e.embedding.join(',')}]`,
      bounding_box: e.boundingBox || null,
      detection_confidence: e.confidence || null,
    }))

    // Insert embeddings (cast to any to bypass type checking for ungenerated table types)
    const { error: insertError } = await (supabase as any)
      .from('photo_face_embeddings')
      .insert(records)

    if (insertError) {
      console.error('[FaceEmbeddings] Error saving embeddings:', insertError)
      return { success: false, error: insertError.message }
    }

    // Update processing status (cast to any to bypass type checking for ungenerated table types)
    const { error: statusError } = await (supabase as any)
      .from('photo_face_processing')
      .upsert({
        photo_id: photoId,
        status: embeddings.length > 0 ? 'completed' : 'no_faces',
        faces_found: embeddings.length,
        processed_at: new Date().toISOString(),
        error_message: null,
      })

    if (statusError) {
      console.error('[FaceEmbeddings] Error updating status:', statusError)
      // Don't fail the whole operation if status update fails
    }

    return { success: true }
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update processing status for a photo
 */
export async function updateProcessingStatus(
  photoId: string,
  status: PhotoFaceProcessingRecord['status'],
  facesFound?: number,
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Cast to any to bypass type checking for ungenerated table types
    const { error } = await (supabase as any).from('photo_face_processing').upsert({
      photo_id: photoId,
      status,
      faces_found: facesFound ?? 0,
      processed_at: status === 'completed' || status === 'failed' || status === 'no_faces'
        ? new Date().toISOString()
        : null,
      error_message: errorMessage || null,
    })

    if (error) {
      console.error('[FaceEmbeddings] Error updating status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete face embeddings for a photo
 */
export async function deleteFaceEmbeddings(
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Delete embeddings (cast to any to bypass type checking for ungenerated table types)
    const { error: embeddingError } = await (supabase as any)
      .from('photo_face_embeddings')
      .delete()
      .eq('photo_id', photoId)

    if (embeddingError) {
      console.error('[FaceEmbeddings] Error deleting embeddings:', embeddingError)
      return { success: false, error: embeddingError.message }
    }

    // Delete processing status (cast to any to bypass type checking for ungenerated table types)
    const { error: statusError } = await (supabase as any)
      .from('photo_face_processing')
      .delete()
      .eq('photo_id', photoId)

    if (statusError) {
      console.error('[FaceEmbeddings] Error deleting status:', statusError)
      // Don't fail if status deletion fails
    }

    return { success: true }
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// Face search
// ============================================================

/**
 * Search for faces in an event by embedding similarity
 * Uses the pgvector cosine similarity search via RPC
 */
export async function searchFacesByEmbedding(
  eventId: string,
  embedding: number[],
  options?: {
    limit?: number
    threshold?: number
  }
): Promise<{ data: FaceSearchResult[] | null; error?: string }> {
  const supabase = createClient()

  const limit = options?.limit ?? 50
  const threshold = options?.threshold ?? 0.6

  try {
    // Call the RPC function for vector similarity search (cast to any for ungenerated RPC types)
    const { data, error } = await (supabase as any).rpc('search_faces_by_embedding', {
      p_event_id: eventId,
      p_embedding: `[${embedding.join(',')}]`,
      p_limit: limit,
      p_threshold: threshold,
    })

    if (error) {
      console.error('[FaceEmbeddings] Search error:', error)
      return { data: null, error: error.message }
    }

    return { data: data as FaceSearchResult[] }
  } catch (error) {
    console.error('[FaceEmbeddings] Search error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// Processing status queries
// ============================================================

/**
 * Get processing status for a photo
 */
export async function getProcessingStatus(
  photoId: string
): Promise<{ data: PhotoFaceProcessingRecord | null; error?: string }> {
  const supabase = createClient()

  try {
    // Cast to any to bypass type checking for ungenerated table types
    const { data, error } = await (supabase as any)
      .from('photo_face_processing')
      .select('*')
      .eq('photo_id', photoId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[FaceEmbeddings] Error getting status:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PhotoFaceProcessingRecord | null }
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get processing stats for an event
 */
export async function getEventProcessingStats(
  eventId: string
): Promise<{ data: FaceProcessingStats | null; error?: string }> {
  const supabase = createClient()

  try {
    // Cast to any to bypass type checking for ungenerated RPC types
    const { data, error } = await (supabase as any).rpc('get_event_face_processing_stats', {
      p_event_id: eventId,
    })

    if (error) {
      console.error('[FaceEmbeddings] Error getting stats:', error)
      return { data: null, error: error.message }
    }

    // RPC returns an array, get the first row
    const stats = Array.isArray(data) ? data[0] : data

    return { data: stats as FaceProcessingStats }
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get photos pending face processing for an event
 * Uses RPC function for efficient querying with large photo counts
 */
export async function getPendingPhotosForProcessing(
  eventId: string
): Promise<{ data: Array<{ id: string; thumbnail_path: string }> | null; error?: string }> {
  const supabase = createClient()

  try {
    // Use RPC function for efficient LEFT JOIN query
    const { data, error } = await (supabase as any).rpc('get_pending_photos_for_processing', {
      p_event_id: eventId,
    })

    if (error) {
      console.error('[FaceEmbeddings] Error getting pending photos:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Array<{ id: string; thumbnail_path: string }> }
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if an event has any processed photos (for showing search button)
 */
export async function eventHasProcessedFaces(eventId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Cast to any to bypass type checking for ungenerated table types
    const { count, error } = await (supabase as any)
      .from('photo_face_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (error) {
      console.error('[FaceEmbeddings] Error checking processed faces:', error)
      return false
    }

    return (count || 0) > 0
  } catch (error) {
    console.error('[FaceEmbeddings] Error:', error)
    return false
  }
}
