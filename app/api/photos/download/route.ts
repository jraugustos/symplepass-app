import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPhotoOrderByIdWithDetails } from '@/lib/data/photo-orders'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { logAuditAction, getClientIP, getUserAgent } from '@/lib/audit/audit-logger'
import type { PhotoDownloadResponse } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const runtime = 'nodejs'

// Signed URL expiration time: 1 hour
const URL_EXPIRATION_SECONDS = 3600

// Storage bucket for original photos
const PHOTO_BUCKET = 'event-photos' as const

// Rate limit configuration for photo downloads: 30 requests per minute per user
const DOWNLOAD_RATE_LIMIT = { limit: 30, windowSeconds: 60 }

/**
 * Generates a signed URL for downloading a file from private storage.
 * Follows the same pattern as uploadService.getFileUrl but for server-side use.
 *
 * @param supabase - Server-side Supabase client
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - URL expiration time in seconds
 * @returns Signed URL or throws an error
 */
async function getSignedDownloadUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
  expiresIn: number = URL_EXPIRATION_SECONDS
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`)
  }

  return data.signedUrl
}

/**
 * GET /api/photos/download
 * Generates signed URLs for downloading original (unwatermarked) photos
 * Requires authentication and order ownership validation
 *
 * Query params:
 * - orderId: Required - the photo order ID
 * - photoId: Optional - single photo ID to download
 * - photoIds: Optional - comma-separated list of photo IDs for batch download
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const photoId = searchParams.get('photoId')
    const photoIds = searchParams.get('photoIds')

    // Validate required params
    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório.' }, { status: 400 })
    }

    if (!photoId && !photoIds) {
      return NextResponse.json(
        { error: 'ID da foto ou lista de fotos é obrigatório.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Validate authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para baixar fotos.' },
        { status: 401 }
      )
    }

    // Rate limiting - use user ID for authenticated users
    const rateLimitResult = checkRateLimit(`photo_download:${user.id}`, DOWNLOAD_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Fetch order with details
    const { data: orderData, error: orderError } = await getPhotoOrderByIdWithDetails(orderId)

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }

    // Validate payment status
    if (orderData.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'O pagamento deste pedido não foi confirmado.' },
        { status: 403 }
      )
    }

    // SECURITY: Validate ownership or privileged access
    const isOwner = orderData.user_id === user.id

    let hasPrivilegedAccess = false
    if (!isOwner) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        hasPrivilegedAccess = true
      } else if (profile?.role === 'organizer') {
        const { data: event } = await supabase
          .from('events')
          .select('organizer_id')
          .eq('id', orderData.event_id)
          .single()

        hasPrivilegedAccess = event?.organizer_id === user.id
      }
    }

    if (!isOwner && !hasPrivilegedAccess) {
      return NextResponse.json(
        { error: 'Você não tem permissão para baixar fotos deste pedido.' },
        { status: 403 }
      )
    }

    // Build list of photos to generate URLs for
    const orderPhotoIds = new Set(
      (orderData.items || []).filter((item) => item.photo).map((item) => item.photo_id)
    )

    // Parse requested photo IDs
    let requestedPhotoIds: string[] = []
    if (photoId) {
      requestedPhotoIds = [photoId]
    } else if (photoIds) {
      requestedPhotoIds = photoIds.split(',').filter(Boolean)
    }

    // Validate all requested photos are part of this order
    const invalidPhotos = requestedPhotoIds.filter((id) => !orderPhotoIds.has(id))
    if (invalidPhotos.length > 0) {
      return NextResponse.json(
        { error: 'Uma ou mais fotos solicitadas não pertencem a este pedido.' },
        { status: 400 }
      )
    }

    // Get photo details from order items
    const orderPhotos = (orderData.items || [])
      .filter((item) => item.photo && requestedPhotoIds.includes(item.photo_id))
      .map((item) => item.photo!)

    if (orderPhotos.length === 0) {
      return NextResponse.json({ error: 'Nenhuma foto válida encontrada.' }, { status: 404 })
    }

    // Generate signed URLs for each photo using the abstracted helper
    const photosWithUrls: Array<{ id: string; url: string; fileName: string }> = []

    for (const photo of orderPhotos) {
      try {
        const signedUrl = await getSignedDownloadUrl(
          supabase,
          PHOTO_BUCKET,
          photo.original_path,
          URL_EXPIRATION_SECONDS
        )

        photosWithUrls.push({
          id: photo.id,
          url: signedUrl,
          fileName: photo.file_name,
        })
      } catch (urlError) {
        console.error('Failed to generate signed URL for photo:', photo.id, urlError)
        continue
      }
    }

    if (photosWithUrls.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível gerar URLs de download.' },
        { status: 500 }
      )
    }

    // Return single photo URL or batch
    const response: PhotoDownloadResponse =
      requestedPhotoIds.length === 1
        ? {
            url: photosWithUrls[0].url,
            fileName: photosWithUrls[0].fileName,
          }
        : {
            photos: photosWithUrls,
          }

    // Audit logging (non-blocking - errors are logged but don't fail the request)
    logAuditAction({
      action: 'photo_download',
      targetType: 'photo_order',
      targetId: orderId,
      details: {
        userId: user.id,
        requestedPhotoIds,
        generatedUrlCount: photosWithUrls.length,
        isBatchDownload: requestedPhotoIds.length > 1,
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    }).catch((err) => {
      console.error('Failed to log audit action for photo download:', err)
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating download URLs:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar links de download. Tente novamente.' },
      { status: 500 }
    )
  }
}
