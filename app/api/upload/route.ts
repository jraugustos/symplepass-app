import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { StorageBucket } from '@/lib/storage/upload-types'

// Buckets that require event ownership validation
const EVENT_BUCKETS = ['event-banners', 'event-media', 'event-documents', 'event-routes', 'kit-items']

// Bucket configurations for validation
const BUCKET_CONFIG: Record<string, { maxSize: number; allowedTypes: string[] }> = {
  'event-banners': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  },
  'event-media': {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  },
  'event-documents': {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf'],
  },
  'event-routes': {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['application/gpx+xml', 'application/xml', 'text/xml'],
  },
  'kit-items': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'user-avatars': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'organizer-assets': {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  },
}

export async function POST(request: NextRequest) {
  try {
    // Get user session using server client
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login novamente.' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as StorageBucket | null
    const folder = formData.get('folder') as string | null
    const fileName = formData.get('fileName') as string | null

    if (!file || !bucket) {
      return NextResponse.json(
        { error: 'Arquivo e bucket são obrigatórios.' },
        { status: 400 }
      )
    }

    // Validate bucket exists in config
    const config = BUCKET_CONFIG[bucket]
    if (!config) {
      return NextResponse.json(
        { error: `Bucket "${bucket}" não é válido.` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024)
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB.` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}` },
        { status: 400 }
      )
    }

    // Validate folder is provided for event-related buckets
    if (EVENT_BUCKETS.includes(bucket) && !folder) {
      return NextResponse.json(
        { error: 'Salve o evento primeiro para habilitar o upload.' },
        { status: 400 }
      )
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado.' },
        { status: 403 }
      )
    }

    // Validate permissions based on bucket type
    if (EVENT_BUCKETS.includes(bucket)) {
      // For event buckets, check if user is admin or owns the event
      if (profile.role !== 'admin') {
        // Check if user owns the event (folder should be event_id or slug)
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id, organizer_id')
          .or(`id.eq.${folder},slug.eq.${folder}`)
          .single()

        if (eventError || !event) {
          return NextResponse.json(
            { error: 'Evento não encontrado.' },
            { status: 404 }
          )
        }

        if (event.organizer_id !== user.id) {
          return NextResponse.json(
            { error: 'Você não tem permissão para fazer upload neste evento.' },
            { status: 403 }
          )
        }
      }
    } else if (bucket === 'user-avatars') {
      // User avatars: folder must be user's own ID
      if (folder !== user.id) {
        return NextResponse.json(
          { error: 'Você só pode fazer upload do seu próprio avatar.' },
          { status: 403 }
        )
      }
    } else if (bucket === 'organizer-assets') {
      // Organizer assets: must be admin or organizer uploading to own folder
      if (profile.role !== 'admin' && folder !== user.id) {
        return NextResponse.json(
          { error: 'Você só pode fazer upload na sua própria pasta.' },
          { status: 403 }
        )
      }
    }

    // Generate file path
    const sanitizedFileName = fileName
      ? sanitizeFilename(fileName)
      : generateUniqueFilename(file.name)

    const filePath = folder ? `${folder}/${sanitizedFileName}` : sanitizedFileName

    // Use admin client to bypass RLS and upload
    const adminClient = createAdminClient()
    const fileBuffer = await file.arrayBuffer()

    const { data, error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('[API Upload] Error:', uploadError)
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('[API Upload] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

// Helper functions
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || ''
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}.${ext}`
}
