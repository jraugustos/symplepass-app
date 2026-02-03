// Supabase Edge Function: Process Photo ZIP
// Processes bulk photo uploads from ZIP files in background
// Handles watermarking, thumbnail generation, and storage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import JSZip from 'https://esm.sh/jszip@3.10.1'

// Comment 4: Import imagescript at module scope to avoid repeated dynamic imports
// deno-lint-ignore no-explicit-any
let ImageScriptModule: any = null

async function getImageScript() {
  if (!ImageScriptModule) {
    ImageScriptModule = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
  }
  return ImageScriptModule
}

// Constants
const BATCH_SIZE = 10 // Process 10 photos per batch (conservative for memory)
// Comment 2: Reduced to 300s with 45s buffer for cleanup/reinvoke (safe stop at 255s)
const MAX_EXECUTION_TIME_MS = 300_000
// Comment 2: Buffer time to stop processing before MAX_EXECUTION_TIME_MS
const TIME_BUFFER_MS = 45_000
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// Comment 1: Shared secret for internal function authentication
const FUNCTION_SECRET = Deno.env.get('PROCESS_PHOTO_ZIP_SECRET')

// ZIP validation limits
const MAX_FILES_IN_ZIP = 5000
// Comment 3: Maximum ZIP file size (5GB) - validated before loading
const MAX_ZIP_SIZE_BYTES = 5 * 1024 * 1024 * 1024
// Comment 3: Maximum individual photo size (50MB) - validated during processing
const MAX_PHOTO_SIZE_BYTES = 50 * 1024 * 1024

// Watermark configuration
const WATERMARK_CONFIG = {
  text: 'Symplepass',
  fontSize: 36,
  opacity: 0.3,
  angle: -45,
  horizontalSpacing: 300,
  verticalSpacing: 150,
}

// Image processing configuration
const IMAGE_CONFIG = {
  watermarked: {
    maxWidth: 1920,
    maxHeight: 1440,
    quality: 85,
  },
  thumbnail: {
    maxWidth: 400,
    maxHeight: 300,
    quality: 70,
  },
}

// Comment 2: MIME type mapping for consistent format handling
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

// Comment 2: Magic bytes for file type validation
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04] // PK\x03\x04
const JPEG_MAGIC = [0xff, 0xd8, 0xff] // FFD8FF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] // \x89PNG\r\n\x1a\n
const WEBP_MAGIC_RIFF = [0x52, 0x49, 0x46, 0x46] // RIFF
const WEBP_MAGIC_WEBP = [0x57, 0x45, 0x42, 0x50] // WEBP (at offset 8)

/**
 * Comment 1: Sanitize filename by removing control characters and enforcing safe charset
 */
function sanitizeFilename(filename: string, maxLength = 200): string | null {
  // Remove control characters (0x00-0x1F, 0x7F-0x9F)
  let sanitized = filename.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

  // Remove HTML-unsafe characters
  sanitized = sanitized.replace(/[<>:"\/\\|?*]/g, '')

  // Replace multiple spaces/dots with single
  sanitized = sanitized.replace(/\s+/g, ' ').replace(/\.+/g, '.')

  // Trim whitespace and dots from start/end
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '')

  // Truncate to max length while preserving extension
  if (sanitized.length > maxLength) {
    const lastDot = sanitized.lastIndexOf('.')
    if (lastDot > 0) {
      const ext = sanitized.substring(lastDot)
      const nameWithoutExt = sanitized.substring(0, lastDot)
      const maxNameLength = maxLength - ext.length
      sanitized = nameWithoutExt.substring(0, maxNameLength) + ext
    } else {
      sanitized = sanitized.substring(0, maxLength)
    }
  }

  return sanitized.length > 0 ? sanitized : null
}

/**
 * Comment 2: Validate ZIP file magic bytes
 */
function validateZipMagic(data: Uint8Array): boolean {
  if (data.length < 4) return false
  return (
    data[0] === ZIP_MAGIC[0] &&
    data[1] === ZIP_MAGIC[1] &&
    data[2] === ZIP_MAGIC[2] &&
    data[3] === ZIP_MAGIC[3]
  )
}

/**
 * Comment 2: Validate image magic bytes (JPEG, PNG, WebP)
 */
function validateImageMagic(data: Uint8Array): { valid: boolean; type: string | null } {
  if (data.length < 12) return { valid: false, type: null }

  // Check JPEG (FFD8FF)
  if (data[0] === JPEG_MAGIC[0] && data[1] === JPEG_MAGIC[1] && data[2] === JPEG_MAGIC[2]) {
    return { valid: true, type: 'jpeg' }
  }

  // Check PNG (\x89PNG\r\n\x1a\n)
  if (
    data[0] === PNG_MAGIC[0] &&
    data[1] === PNG_MAGIC[1] &&
    data[2] === PNG_MAGIC[2] &&
    data[3] === PNG_MAGIC[3] &&
    data[4] === PNG_MAGIC[4] &&
    data[5] === PNG_MAGIC[5] &&
    data[6] === PNG_MAGIC[6] &&
    data[7] === PNG_MAGIC[7]
  ) {
    return { valid: true, type: 'png' }
  }

  // Check WebP (RIFF....WEBP)
  if (
    data[0] === WEBP_MAGIC_RIFF[0] &&
    data[1] === WEBP_MAGIC_RIFF[1] &&
    data[2] === WEBP_MAGIC_RIFF[2] &&
    data[3] === WEBP_MAGIC_RIFF[3] &&
    data[8] === WEBP_MAGIC_WEBP[0] &&
    data[9] === WEBP_MAGIC_WEBP[1] &&
    data[10] === WEBP_MAGIC_WEBP[2] &&
    data[11] === WEBP_MAGIC_WEBP[3]
  ) {
    return { valid: true, type: 'webp' }
  }

  return { valid: false, type: null }
}

interface PhotoUploadJob {
  id: string
  event_id: string
  user_id: string
  status: string
  zip_path: string | null
  zip_file_name: string | null
  total_photos: number
  processed_photos: number
  failed_photos: number
  file_list: string[] | null
  errors: Array<{ fileName: string; error: string }>
}

interface ProcessingResult {
  success: boolean
  shouldContinue: boolean
  message: string
  httpStatus: number
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-secret',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Comment 1: Verify authorization before processing
    // Check for function secret in header (for internal reinvokes)
    // or valid JWT bound to job owner (for initial calls from frontend)
    const authHeader = req.headers.get('authorization')
    const functionSecretHeader = req.headers.get('x-function-secret')

    // For internal reinvokes, verify the function secret
    if (functionSecretHeader) {
      if (!FUNCTION_SECRET || functionSecretHeader !== FUNCTION_SECRET) {
        console.error('[ProcessPhotoZip] Invalid function secret')
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid function secret' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (!authHeader) {
      // No auth header and no function secret - reject
      console.error('[ProcessPhotoZip] Missing authorization')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { jobId } = await req.json()

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('photo_upload_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('Job not found:', jobError)
      return new Response(
        JSON.stringify({ error: 'Job not found', details: jobError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Comment 1: If using JWT auth (not function secret), verify the caller owns this job
    if (authHeader && !functionSecretHeader) {
      // Extract user from JWT
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)

      if (userError || !user) {
        console.error('[ProcessPhotoZip] Invalid JWT:', userError)
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify user owns the job or is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (job.user_id !== user.id && profile?.role !== 'admin') {
        console.error('[ProcessPhotoZip] User does not own this job')
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not own this job' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(`[ProcessPhotoZip] Starting job ${jobId}, status: ${job.status}`)

    // Process based on current status
    let result: ProcessingResult

    switch (job.status) {
      case 'extracting':
        result = await handleExtracting(supabase, job, startTime)
        break
      case 'processing':
        result = await handleProcessing(supabase, job, startTime)
        break
      default:
        result = {
          success: false,
          shouldContinue: false,
          message: `Invalid job status for processing: ${job.status}`,
          httpStatus: 400,
        }
    }

    // If we should continue processing, re-invoke this function
    if (result.shouldContinue) {
      console.log('[ProcessPhotoZip] Re-invoking for next batch...')
      await reinvokeFunction(supabaseUrl, jobId)
    }

    return new Response(
      JSON.stringify(result),
      { status: result.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[ProcessPhotoZip] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Comment 3: Helper to clean up temporary ZIP file
 */
async function cleanupTempZip(supabase: SupabaseClient, zipPath: string | null): Promise<void> {
  if (zipPath) {
    try {
      await supabase.storage.from('photo-uploads-temp').remove([zipPath])
      console.log(`[ProcessPhotoZip] Cleaned up temp ZIP: ${zipPath}`)
    } catch (error) {
      console.error(`[ProcessPhotoZip] Failed to cleanup temp ZIP: ${error}`)
    }
  }
}

/**
 * Handle 'extracting' status: Download ZIP, list files, update job to 'processing'
 */
async function handleExtracting(
  supabase: SupabaseClient,
  job: PhotoUploadJob,
  startTime: number
): Promise<ProcessingResult> {
  console.log('[ProcessPhotoZip] Extracting ZIP file...')

  try {
    if (!job.zip_path) {
      // Comment 3: No ZIP to cleanup if path is missing
      await updateJobStatus(supabase, job.id, 'failed', { error_message: 'ZIP path is missing' })
      return { success: false, shouldContinue: false, message: 'ZIP path is missing', httpStatus: 400 }
    }

    // Comment 3: Validate ZIP size before downloading using storage metadata
    const { data: zipMetadata, error: metadataError } = await supabase.storage
      .from('photo-uploads-temp')
      .list(job.zip_path.substring(0, job.zip_path.lastIndexOf('/')), {
        search: job.zip_path.substring(job.zip_path.lastIndexOf('/') + 1),
      })

    if (!metadataError && zipMetadata && zipMetadata.length > 0) {
      const zipFileInfo = zipMetadata[0]
      if (zipFileInfo.metadata?.size && zipFileInfo.metadata.size > MAX_ZIP_SIZE_BYTES) {
        const sizeMB = Math.round(zipFileInfo.metadata.size / (1024 * 1024))
        const maxMB = Math.round(MAX_ZIP_SIZE_BYTES / (1024 * 1024))
        console.error(`[ProcessPhotoZip] ZIP too large: ${sizeMB}MB > ${maxMB}MB`)
        await cleanupTempZip(supabase, job.zip_path)
        await updateJobStatus(supabase, job.id, 'failed', {
          error_message: `Arquivo ZIP muito grande (${sizeMB}MB). Máximo permitido: ${maxMB}MB`,
        })
        return {
          success: false,
          shouldContinue: false,
          message: `ZIP file too large: ${sizeMB}MB > ${maxMB}MB`,
          httpStatus: 400,
        }
      }
    }

    // Download ZIP from storage
    const { data: zipData, error: downloadError } = await supabase.storage
      .from('photo-uploads-temp')
      .download(job.zip_path)

    if (downloadError || !zipData) {
      console.error('Failed to download ZIP:', downloadError)
      // Comment 3: Cleanup ZIP on failure
      await cleanupTempZip(supabase, job.zip_path)
      await updateJobStatus(supabase, job.id, 'failed', {
        error_message: `Failed to download ZIP: ${downloadError?.message || 'Unknown error'}`,
      })
      return { success: false, shouldContinue: false, message: 'Failed to download ZIP', httpStatus: 400 }
    }

    // Comment 2: Validate ZIP magic bytes before loading
    const zipBytes = new Uint8Array(await zipData.arrayBuffer())
    if (!validateZipMagic(zipBytes)) {
      console.error('[ProcessPhotoZip] Invalid ZIP signature')
      await cleanupTempZip(supabase, job.zip_path)
      await updateJobStatus(supabase, job.id, 'failed', {
        error_message: 'Arquivo não é um ZIP válido (assinatura inválida)',
      })
      return { success: false, shouldContinue: false, message: 'Invalid ZIP signature', httpStatus: 400 }
    }

    // Load ZIP and count valid images
    const zip = await JSZip.loadAsync(zipBytes)

    // Safety check: if download + parse consumed too much time, fail gracefully
    // instead of letting the runtime kill the function and leaving the job stuck
    const elapsedAfterLoad = Date.now() - startTime
    if (elapsedAfterLoad > MAX_EXECUTION_TIME_MS - TIME_BUFFER_MS) {
      console.error(`[ProcessPhotoZip] ZIP load took too long (${Math.round(elapsedAfterLoad / 1000)}s), failing job`)
      await cleanupTempZip(supabase, job.zip_path)
      await updateJobStatus(supabase, job.id, 'failed', {
        error_message: 'Tempo limite atingido durante a extração do ZIP. Tente com um arquivo menor ou divida em múltiplos ZIPs.',
      })
      return { success: false, shouldContinue: false, message: 'Timeout during ZIP load', httpStatus: 408 }
    }

    const allFiles = Object.keys(zip.files)
    const imageFiles = allFiles.filter((name) => {
      const file = zip.files[name]
      if (file.dir) return false
      // Skip macOS metadata files and hidden files
      if (name.includes('__MACOSX') || name.includes('/.') || name.startsWith('.')) return false
      // Skip Thumbs.db and other system files
      const baseName = name.split('/').pop() || ''
      if (baseName.startsWith('.') || baseName === 'Thumbs.db' || baseName === 'desktop.ini') return false
      const ext = name.toLowerCase().substring(name.lastIndexOf('.'))
      return VALID_IMAGE_EXTENSIONS.includes(ext)
    }).sort()

    console.log(`[ProcessPhotoZip] Found ${imageFiles.length} valid image files in ZIP`)

    // Validate ZIP limits
    if (imageFiles.length > MAX_FILES_IN_ZIP) {
      // Comment 3: Cleanup ZIP on validation failure
      await cleanupTempZip(supabase, job.zip_path)
      await updateJobStatus(supabase, job.id, 'failed', {
        error_message: `ZIP contém ${imageFiles.length} imagens, máximo permitido: ${MAX_FILES_IN_ZIP}`,
      })
      return {
        success: false,
        shouldContinue: false,
        message: `Too many files in ZIP: ${imageFiles.length} > ${MAX_FILES_IN_ZIP}`,
        httpStatus: 400,
      }
    }

    if (imageFiles.length === 0) {
      // Comment 3: Cleanup ZIP on validation failure
      await cleanupTempZip(supabase, job.zip_path)
      await updateJobStatus(supabase, job.id, 'failed', {
        error_message: 'No valid image files found in ZIP (supported: JPG, PNG, WebP)',
      })
      return { success: false, shouldContinue: false, message: 'No valid images in ZIP', httpStatus: 400 }
    }

    // Update job with total count, file_list, and switch to processing
    await supabase
      .from('photo_upload_jobs')
      .update({
        status: 'processing',
        total_photos: imageFiles.length,
        file_list: imageFiles,
        started_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    // Comment 4: Check if we have enough time buffer to start processing
    const elapsed = Date.now() - startTime
    if (elapsed < MAX_EXECUTION_TIME_MS - 60000) {
      const updatedJob = {
        ...job,
        status: 'processing',
        total_photos: imageFiles.length,
        file_list: imageFiles,
      }
      return handleProcessing(supabase, updatedJob, startTime)
    }

    return { success: true, shouldContinue: true, message: 'Extraction complete, continuing in next invocation', httpStatus: 200 }
  } catch (error) {
    console.error('[ProcessPhotoZip] Error during extraction:', error)
    // Comment 3: Cleanup ZIP on error
    await cleanupTempZip(supabase, job.zip_path)
    await updateJobStatus(supabase, job.id, 'failed', {
      error_message: `Extraction error: ${String(error)}`,
    })
    return { success: false, shouldContinue: false, message: String(error), httpStatus: 500 }
  }
}

/**
 * Handle 'processing' status: Process photos in batches
 * Comment 1: Now processes multiple batches per invocation, reusing the loaded ZIP
 * Comment 2: Uses TIME_BUFFER_MS to stop safely before timeout
 */
async function handleProcessing(
  supabase: SupabaseClient,
  job: PhotoUploadJob,
  startTime: number
): Promise<ProcessingResult> {
  let currentProcessed = job.processed_photos
  let currentFailed = job.failed_photos
  console.log(`[ProcessPhotoZip] Processing photos, progress: ${currentProcessed + currentFailed}/${job.total_photos}`)

  try {
    if (!job.zip_path) {
      await updateJobStatus(supabase, job.id, 'failed', { error_message: 'ZIP path is missing' })
      return { success: false, shouldContinue: false, message: 'ZIP path is missing', httpStatus: 400 }
    }

    // Use persisted file_list if available
    let imageFiles: string[]

    if (job.file_list && job.file_list.length > 0) {
      imageFiles = job.file_list
      console.log(`[ProcessPhotoZip] Using persisted file_list with ${imageFiles.length} files`)
    } else {
      console.log('[ProcessPhotoZip] file_list not found, downloading ZIP...')
      const { data: zipData, error: downloadError } = await supabase.storage
        .from('photo-uploads-temp')
        .download(job.zip_path)

      if (downloadError || !zipData) {
        // Comment 3: Cleanup ZIP on failure
        await cleanupTempZip(supabase, job.zip_path)
        await updateJobStatus(supabase, job.id, 'failed', {
          error_message: `Failed to download ZIP: ${downloadError?.message}`,
        })
        return { success: false, shouldContinue: false, message: 'Failed to download ZIP', httpStatus: 400 }
      }

      const zip = await JSZip.loadAsync(await zipData.arrayBuffer())
      imageFiles = Object.keys(zip.files)
        .filter((name) => {
          const file = zip.files[name]
          if (file.dir) return false
          // Skip macOS metadata files and hidden files
          if (name.includes('__MACOSX') || name.includes('/.') || name.startsWith('.')) return false
          // Skip Thumbs.db and other system files
          const baseName = name.split('/').pop() || ''
          if (baseName.startsWith('.') || baseName === 'Thumbs.db' || baseName === 'desktop.ini') return false
          const ext = name.toLowerCase().substring(name.lastIndexOf('.'))
          return VALID_IMAGE_EXTENSIONS.includes(ext)
        })
        .sort()

      await supabase
        .from('photo_upload_jobs')
        .update({ file_list: imageFiles })
        .eq('id', job.id)
    }

    // Comment 1: Download ZIP once and reuse for all batches in this invocation
    console.log('[ProcessPhotoZip] Downloading ZIP for processing...')
    const { data: zipData, error: downloadError } = await supabase.storage
      .from('photo-uploads-temp')
      .download(job.zip_path)

    if (downloadError || !zipData) {
      // Comment 3: Cleanup ZIP on failure
      await cleanupTempZip(supabase, job.zip_path)
      await updateJobStatus(supabase, job.id, 'failed', {
        error_message: `Failed to download ZIP: ${downloadError?.message}`,
      })
      return { success: false, shouldContinue: false, message: 'Failed to download ZIP', httpStatus: 400 }
    }

    const zip = await JSZip.loadAsync(await zipData.arrayBuffer())
    console.log('[ProcessPhotoZip] ZIP loaded, starting batch processing loop...')

    // Comment 4: Pre-load imagescript module before processing loop
    await getImageScript()

    // Query max existing display_order so new photos are appended after all existing ones,
    // including photos from previous jobs or previous invocations of this same job.
    const { data: maxOrderResult } = await supabase
      .from('event_photos')
      .select('display_order')
      .eq('event_id', job.event_id)
      .order('display_order', { ascending: false })
      .limit(1)
    const baseDisplayOrder = (maxOrderResult?.[0]?.display_order ?? -1) + 1
    let photosInsertedThisInvocation = 0

    const errors: Array<{ fileName: string; error: string }> = [...(job.errors || [])]
    let totalProcessedThisInvocation = 0
    let totalFailedThisInvocation = 0

    // Comment 1: Process multiple batches in a loop while time permits
    while (true) {
      // Comment 2: Check remaining time BEFORE starting a new batch
      const elapsed = Date.now() - startTime
      const remainingTime = MAX_EXECUTION_TIME_MS - elapsed
      if (remainingTime <= TIME_BUFFER_MS) {
        console.log(`[ProcessPhotoZip] Time limit approaching (${Math.round(remainingTime / 1000)}s remaining), saving checkpoint...`)
        break
      }

      // Calculate current batch based on total progress
      const alreadyProcessed = currentProcessed + currentFailed
      if (alreadyProcessed >= imageFiles.length) {
        // All done
        break
      }

      const startIndex = alreadyProcessed
      const endIndex = Math.min(startIndex + BATCH_SIZE, imageFiles.length)
      const batchFiles = imageFiles.slice(startIndex, endIndex)

      console.log(`[ProcessPhotoZip] Processing batch: files ${startIndex} to ${endIndex - 1} (${Math.round(remainingTime / 1000)}s remaining)`)

      let batchProcessed = 0
      let batchFailed = 0

      // Process each photo in the batch
      for (let i = 0; i < batchFiles.length; i++) {
        // Comment 2: Check time BEFORE processing each photo
        const photoElapsed = Date.now() - startTime
        const photoRemainingTime = MAX_EXECUTION_TIME_MS - photoElapsed
        if (photoRemainingTime <= TIME_BUFFER_MS) {
          console.log(`[ProcessPhotoZip] Time limit approaching mid-batch (${Math.round(photoRemainingTime / 1000)}s remaining), saving checkpoint...`)
          break
        }

        const fileName = batchFiles[i]

        try {
          // Comment 3: Validate individual photo size before processing
          const file = zip.files[fileName]
          const photoData = await file.async('uint8array')

          if (photoData.length > MAX_PHOTO_SIZE_BYTES) {
            const sizeMB = Math.round(photoData.length / (1024 * 1024))
            const maxMB = Math.round(MAX_PHOTO_SIZE_BYTES / (1024 * 1024))
            throw new Error(`Foto muito grande (${sizeMB}MB). Máximo permitido: ${maxMB}MB`)
          }

          const displayOrder = baseDisplayOrder + photosInsertedThisInvocation
          await processPhotoWithData(supabase, photoData, fileName, job.event_id, displayOrder)
          photosInsertedThisInvocation++
          batchProcessed++
        } catch (error) {
          console.error(`[ProcessPhotoZip] Failed to process ${fileName}:`, error)
          batchFailed++
          // Comment 1: Sanitize filename before adding to errors array
          const sanitizedErrorFileName = sanitizeFilename(fileName) || 'unknown'
          errors.push({ fileName: sanitizedErrorFileName, error: String(error) })
        }
      }

      // Update running totals
      currentProcessed += batchProcessed
      currentFailed += batchFailed
      totalProcessedThisInvocation += batchProcessed
      totalFailedThisInvocation += batchFailed

      // Update progress after each batch
      await supabase
        .from('photo_upload_jobs')
        .update({
          processed_photos: currentProcessed,
          failed_photos: currentFailed,
          errors,
        })
        .eq('id', job.id)

      console.log(`[ProcessPhotoZip] Batch complete: ${batchProcessed} processed, ${batchFailed} failed. Total: ${currentProcessed + currentFailed}/${imageFiles.length}`)
    }

    // Check if all photos are processed
    const totalProcessed = currentProcessed + currentFailed
    const allDone = totalProcessed >= imageFiles.length

    if (allDone) {
      console.log('[ProcessPhotoZip] All photos processed, cleaning up...')

      // Delete temporary ZIP (success case)
      await cleanupTempZip(supabase, job.zip_path)

      // Update job as completed
      await supabase
        .from('photo_upload_jobs')
        .update({
          status: 'completed',
          processed_photos: currentProcessed,
          failed_photos: currentFailed,
          errors,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      return {
        success: true,
        shouldContinue: false,
        message: `Completed: ${currentProcessed} processed, ${currentFailed} failed`,
        httpStatus: 200,
      }
    }

    // More photos to process - need to reinvoke
    console.log(`[ProcessPhotoZip] Processed ${totalProcessedThisInvocation + totalFailedThisInvocation} photos this invocation, ${imageFiles.length - totalProcessed} remaining`)
    return {
      success: true,
      shouldContinue: true,
      message: `Invocation complete: ${totalProcessedThisInvocation} processed, ${totalFailedThisInvocation} failed. Continuing...`,
      httpStatus: 200,
    }
  } catch (error) {
    console.error('[ProcessPhotoZip] Error during processing:', error)
    // Comment 3: Cleanup ZIP on error
    await cleanupTempZip(supabase, job.zip_path)
    await updateJobStatus(supabase, job.id, 'failed', {
      error_message: `Processing error: ${String(error)}`,
    })
    return { success: false, shouldContinue: false, message: String(error), httpStatus: 500 }
  }
}

/**
 * Process a single photo with pre-extracted data: resize, watermark, upload
 * Comment 2: Preserves original format with correct extension and MIME type
 * Comment 3: Now receives pre-extracted imageData to allow size validation before calling
 * Comment 1: Sanitizes filename before persisting
 * Comment 2: Validates image magic bytes before processing
 */
async function processPhotoWithData(
  supabase: SupabaseClient,
  imageData: Uint8Array,
  fileName: string,
  eventId: string,
  displayOrder: number
): Promise<void> {
  console.log(`[ProcessPhotoZip] Processing photo: ${fileName} (order: ${displayOrder})`)

  // Comment 2: Validate image magic bytes before processing
  const magicCheck = validateImageMagic(imageData)
  if (!magicCheck.valid) {
    throw new Error(`Arquivo não é uma imagem válida (assinatura inválida): ${fileName}`)
  }

  // Generate unique ID for this photo
  const photoId = crypto.randomUUID()
  const rawBaseName = fileName.split('/').pop() || fileName

  // Comment 1: Sanitize filename before persisting
  const baseName = sanitizeFilename(rawBaseName)
  if (!baseName) {
    throw new Error(`Nome de arquivo inválido após sanitização: ${fileName}`)
  }

  // Comment 2: Get original extension and MIME type
  const originalExt = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  const originalMimeType = MIME_TYPES[originalExt] || 'application/octet-stream'

  // Comment 2: Define paths - original keeps source format, processed are JPEG
  const originalPath = `${eventId}/photo-${photoId}${originalExt}`
  const watermarkedPath = `${eventId}/watermarked/photo-${photoId}.jpg`
  const thumbnailPath = `${eventId}/thumbnails/photo-${photoId}.jpg`

  // Process images using imagescript (now cached at module level)
  const { watermarkedData, thumbnailData, dimensions } = await processImageData(imageData)

  // Comment 2: Upload original with matching extension and MIME type
  const { error: originalError } = await supabase.storage
    .from('event-photos')
    .upload(originalPath, imageData, {
      contentType: originalMimeType,
      cacheControl: '31536000', // 1 year
    })

  if (originalError) {
    throw new Error(`Failed to upload original: ${originalError.message}`)
  }

  // Upload watermarked version (always JPEG)
  const { error: watermarkedError } = await supabase.storage
    .from('event-photos-watermarked')
    .upload(watermarkedPath, watermarkedData, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    })

  if (watermarkedError) {
    await supabase.storage.from('event-photos').remove([originalPath])
    throw new Error(`Failed to upload watermarked: ${watermarkedError.message}`)
  }

  // Upload thumbnail (always JPEG)
  const { error: thumbnailError } = await supabase.storage
    .from('event-photos-watermarked')
    .upload(thumbnailPath, thumbnailData, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    })

  if (thumbnailError) {
    await supabase.storage.from('event-photos').remove([originalPath])
    await supabase.storage.from('event-photos-watermarked').remove([watermarkedPath])
    throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`)
  }

  // Insert photo record
  const { error: insertError } = await supabase.from('event_photos').insert({
    event_id: eventId,
    original_path: originalPath,
    watermarked_path: watermarkedPath,
    thumbnail_path: thumbnailPath,
    file_name: baseName,
    file_size: imageData.length,
    width: dimensions.width,
    height: dimensions.height,
    display_order: displayOrder,
  })

  if (insertError) {
    await supabase.storage.from('event-photos').remove([originalPath])
    await supabase.storage.from('event-photos-watermarked').remove([watermarkedPath, thumbnailPath])
    throw new Error(`Failed to insert photo record: ${insertError.message}`)
  }

  console.log(`[ProcessPhotoZip] Successfully processed: ${fileName}`)
}

/**
 * Process image data: resize and add watermark
 * Comment 4: Uses cached imagescript module
 */
async function processImageData(imageData: Uint8Array): Promise<{
  watermarkedData: Uint8Array
  thumbnailData: Uint8Array
  dimensions: { width: number; height: number }
}> {
  // Comment 4: Use cached module instead of dynamic import per photo
  const { Image } = await getImageScript()

  // Decode the image
  const image = await Image.decode(imageData)
  const dimensions = { width: image.width, height: image.height }

  // Create watermarked version
  const watermarked = image.clone()
  resizeImage(watermarked, IMAGE_CONFIG.watermarked.maxWidth, IMAGE_CONFIG.watermarked.maxHeight)
  await applyWatermarkToImage(watermarked)
  const watermarkedData = await watermarked.encodeJPEG(IMAGE_CONFIG.watermarked.quality)

  // Create thumbnail version
  const thumbnail = image.clone()
  resizeImage(thumbnail, IMAGE_CONFIG.thumbnail.maxWidth, IMAGE_CONFIG.thumbnail.maxHeight)
  await applyWatermarkToImage(thumbnail)
  const thumbnailData = await thumbnail.encodeJPEG(IMAGE_CONFIG.thumbnail.quality)

  return {
    watermarkedData: new Uint8Array(watermarkedData),
    thumbnailData: new Uint8Array(thumbnailData),
    dimensions,
  }
}

/**
 * Resize image maintaining aspect ratio
 */
// deno-lint-ignore no-explicit-any
function resizeImage(image: any, maxWidth: number, maxHeight: number): void {
  const { width, height } = image

  if (width <= maxWidth && height <= maxHeight) {
    return
  }

  const aspectRatio = width / height
  let newWidth = maxWidth
  let newHeight = maxHeight

  if (width > height) {
    newHeight = Math.round(newWidth / aspectRatio)
    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = Math.round(newHeight * aspectRatio)
    }
  } else {
    newWidth = Math.round(newHeight * aspectRatio)
    if (newWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = Math.round(newWidth / aspectRatio)
    }
  }

  image.resize(newWidth, newHeight)
}

/**
 * Apply diagonal watermark pattern to image
 * Comment 4: Uses cached imagescript module
 */
// deno-lint-ignore no-explicit-any
async function applyWatermarkToImage(image: any): Promise<void> {
  // Comment 4: Use cached module
  const { Image } = await getImageScript()

  const { opacity, horizontalSpacing, verticalSpacing } = WATERMARK_CONFIG
  const color = Image.rgbaToColor(255, 255, 255, Math.round(opacity * 255))

  const diagonal = Math.sqrt(image.width ** 2 + image.height ** 2)

  for (let y = -diagonal / 2; y < diagonal + diagonal / 2; y += verticalSpacing) {
    for (let x = -diagonal / 2; x < diagonal + diagonal / 2; x += horizontalSpacing) {
      const angle = -Math.PI / 4
      const centerX = image.width / 2
      const centerY = image.height / 2

      const rotatedX = Math.cos(angle) * (x - centerX) - Math.sin(angle) * (y - centerY) + centerX
      const rotatedY = Math.sin(angle) * (x - centerX) + Math.cos(angle) * (y - centerY) + centerY

      if (rotatedX >= 0 && rotatedX < image.width && rotatedY >= 0 && rotatedY < image.height) {
        for (let dy = 0; dy < 10; dy++) {
          for (let dx = 0; dx < 80; dx++) {
            const px = Math.round(rotatedX + dx)
            const py = Math.round(rotatedY + dy)
            if (px >= 0 && px < image.width && py >= 0 && py < image.height) {
              const existing = image.getPixelAt(px + 1, py + 1)
              const blended = blendColors(existing, color, opacity)
              image.setPixelAt(px + 1, py + 1, blended)
            }
          }
        }
      }
    }
  }
}

/**
 * Blend two colors with opacity
 */
function blendColors(base: number, overlay: number, opacity: number): number {
  const baseR = (base >> 24) & 0xff
  const baseG = (base >> 16) & 0xff
  const baseB = (base >> 8) & 0xff
  const baseA = base & 0xff

  const overlayR = (overlay >> 24) & 0xff
  const overlayG = (overlay >> 16) & 0xff
  const overlayB = (overlay >> 8) & 0xff

  const r = Math.round(baseR * (1 - opacity) + overlayR * opacity)
  const g = Math.round(baseG * (1 - opacity) + overlayG * opacity)
  const b = Math.round(baseB * (1 - opacity) + overlayB * opacity)

  return (r << 24) | (g << 16) | (b << 8) | baseA
}

/**
 * Update job status with optional additional fields
 */
async function updateJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  status: string,
  additionalFields: Record<string, unknown> = {}
): Promise<void> {
  await supabase
    .from('photo_upload_jobs')
    .update({
      status,
      ...additionalFields,
      ...(status === 'failed' || status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', jobId)
}

/**
 * Re-invoke this function to continue processing
 * Comment 1: Uses function secret for internal authentication
 */
async function reinvokeFunction(
  supabaseUrl: string,
  jobId: string
): Promise<void> {
  const functionUrl = `${supabaseUrl}/functions/v1/process-photo-zip`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Comment 1: Include function secret for internal reinvokes
    if (FUNCTION_SECRET) {
      headers['x-function-secret'] = FUNCTION_SECRET
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId }),
    })

    if (!response.ok) {
      console.error('[ProcessPhotoZip] Failed to re-invoke:', await response.text())
    } else {
      console.log('[ProcessPhotoZip] Successfully re-invoked for next batch')
    }
  } catch (error) {
    console.error('[ProcessPhotoZip] Error re-invoking:', error)
  }
}
