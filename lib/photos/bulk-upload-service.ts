/**
 * Bulk Upload Service
 * Handles ZIP file uploads for bulk photo processing
 * Extracts ZIP in the browser and uploads photos individually
 */

import { createClient } from '@/lib/supabase/client'
import { processEventPhoto, type ProcessedPhotoVersions } from './image-processor'
import { uploadService } from '@/lib/storage/upload-service'
import type JSZipType from 'jszip'

// Dynamic import to avoid SSR issues
async function loadJSZip(): Promise<typeof JSZipType> {
  const module = await import('jszip')
  return module.default
}

// Types
export interface PhotoUploadJob {
  id: string
  event_id: string
  user_id: string
  status: 'pending' | 'uploading' | 'extracting' | 'processing' | 'completed' | 'failed' | 'cancelled'
  zip_path: string | null
  zip_file_name: string | null
  zip_size_bytes: number | null
  total_photos: number
  processed_photos: number
  failed_photos: number
  file_list: string[] | null
  error_message: string | null
  errors: Array<{ fileName: string; error: string }>
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface UploadProgress {
  bytesUploaded: number
  bytesTotal: number
  percentage: number
}

export interface BulkUploadCallbacks {
  onUploadProgress?: (progress: UploadProgress) => void
  onUploadComplete?: () => void
  onUploadError?: (error: Error) => void
  onProcessingStart?: () => void
  onJobCreated?: (job: PhotoUploadJob) => void
  onPhotoProcessed?: (processed: number, total: number, fileName: string) => void
}

const MAX_ZIP_SIZE = 300 * 1024 * 1024 // 300MB - larger files should use direct photo upload
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// ZIP magic bytes signature (PK\x03\x04)
const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]

// Storage bucket names
const PHOTO_BUCKETS = {
  ORIGINAL: 'event-photos' as const,
  WATERMARKED: 'event-photos-watermarked' as const,
}

/**
 * Sanitize filename by removing control characters and enforcing safe charset
 */
function sanitizeFilename(filename: string, maxLength = 200): string | null {
  let sanitized = filename.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  sanitized = sanitized.replace(/[<>:"\/\\|?*]/g, '')
  sanitized = sanitized.replace(/\s+/g, ' ').replace(/\.+/g, '.')
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '')

  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    const maxNameLength = maxLength - ext.length
    sanitized = nameWithoutExt.substring(0, maxNameLength) + ext
  }

  return sanitized.length > 0 ? sanitized : null
}

/**
 * Validate ZIP file magic bytes
 */
async function validateZipMagic(file: File): Promise<boolean> {
  const headerBytes = await file.slice(0, 4).arrayBuffer()
  const header = new Uint8Array(headerBytes)

  return (
    header[0] === ZIP_MAGIC_BYTES[0] &&
    header[1] === ZIP_MAGIC_BYTES[1] &&
    header[2] === ZIP_MAGIC_BYTES[2] &&
    header[3] === ZIP_MAGIC_BYTES[3]
  )
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const ext = fileName.substring(fileName.lastIndexOf('.'))
  return ext || '.jpg'
}

/**
 * Bulk Upload Service class
 * Manages ZIP extraction and individual photo uploads
 */
class BulkUploadServiceClass {
  private supabase = createClient()
  private cancelledJobs: Set<string> = new Set()
  private lastTokenRefresh: number = 0
  private readonly TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000 // 4 minutes

  /**
   * Refresh the auth token if needed during long upload sessions
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    const now = Date.now()
    if (this.lastTokenRefresh > 0 && (now - this.lastTokenRefresh) < this.TOKEN_REFRESH_INTERVAL) {
      return
    }

    this.lastTokenRefresh = now

    try {
      const { error } = await this.supabase.auth.refreshSession()
      if (error) {
        console.warn('[BulkUploadService] Token refresh failed:', error.message)
      } else {
        console.log('[BulkUploadService] Token refreshed successfully')
      }
    } catch (err) {
      console.warn('[BulkUploadService] Token refresh error:', err)
    }
  }

  /**
   * Upload a ZIP file for bulk photo processing
   * Extracts in the browser and uploads photos individually
   */
  async uploadZip(
    file: File,
    eventId: string,
    callbacks?: BulkUploadCallbacks
  ): Promise<string> {
    console.log('[BulkUploadService] uploadZip called for event:', eventId, 'file:', file.name, 'size:', file.size)

    // Validate file
    console.log('[BulkUploadService] Validating ZIP file...')
    await this.validateZipFile(file)
    console.log('[BulkUploadService] ZIP file validated')

    const sanitizedFileName = sanitizeFilename(file.name)
    if (!sanitizedFileName) {
      throw new Error('Nome do arquivo inválido')
    }

    // Get current user
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
    if (sessionError || !session?.user) {
      throw new Error('Usuário não autenticado')
    }
    const user = session.user

    // Create job record with status 'extracting'
    const { data: job, error: jobError } = await this.supabase
      .from('photo_upload_jobs')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'extracting',
        zip_file_name: sanitizedFileName,
        zip_size_bytes: file.size,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('[BulkUploadService] Failed to create job:', jobError)
      throw new Error('Falha ao criar job de upload')
    }

    console.log('[BulkUploadService] Job created:', job.id)
    callbacks?.onJobCreated?.(job as PhotoUploadJob)

    // Initialize token refresh timer
    if (this.lastTokenRefresh === 0) {
      this.lastTokenRefresh = Date.now()
    }

    try {
      // Load and extract ZIP
      console.log('[BulkUploadService] Loading JSZip library...')
      const JSZip = await loadJSZip()
      console.log('[BulkUploadService] JSZip loaded, parsing ZIP file...')
      const zip = await JSZip.loadAsync(file)
      console.log('[BulkUploadService] ZIP file parsed successfully')

      // Filter valid image files
      const imageFiles = this.filterValidImages(zip)
      console.log('[BulkUploadService] Found', imageFiles.length, 'valid images')

      if (imageFiles.length === 0) {
        throw new Error('Nenhuma imagem válida encontrada no ZIP (formatos suportados: JPG, PNG, WebP)')
      }

      // Update job with total count and switch to processing
      await this.supabase
        .from('photo_upload_jobs')
        .update({
          status: 'processing',
          total_photos: imageFiles.length,
          file_list: imageFiles,
          started_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      callbacks?.onProcessingStart?.()

      // Get max display order for this event
      const { data: maxOrderResult } = await this.supabase
        .from('event_photos')
        .select('display_order')
        .eq('event_id', eventId)
        .order('display_order', { ascending: false })
        .limit(1)

      let displayOrder = (maxOrderResult?.[0]?.display_order ?? -1) + 1

      // Process photos sequentially
      let processedCount = 0
      let failedCount = 0
      const errors: Array<{ fileName: string; error: string }> = []

      for (const fileName of imageFiles) {
        // Check if cancelled
        if (this.cancelledJobs.has(job.id)) {
          console.log('[BulkUploadService] Job cancelled, stopping processing')
          break
        }

        // Refresh token periodically
        await this.refreshTokenIfNeeded()

        try {
          await this.processAndUploadPhoto(zip, fileName, eventId, displayOrder)
          processedCount++
          displayOrder++

          // Update progress
          callbacks?.onPhotoProcessed?.(processedCount, imageFiles.length, fileName)
          callbacks?.onUploadProgress?.({
            bytesUploaded: processedCount,
            bytesTotal: imageFiles.length,
            percentage: Math.round((processedCount / imageFiles.length) * 100),
          })

          // Update job progress in database
          await this.supabase
            .from('photo_upload_jobs')
            .update({
              processed_photos: processedCount,
              failed_photos: failedCount,
            })
            .eq('id', job.id)

        } catch (error) {
          console.error(`[BulkUploadService] Failed to process ${fileName}:`, error)
          failedCount++
          const sanitizedErrorFileName = sanitizeFilename(fileName) || 'unknown'
          errors.push({
            fileName: sanitizedErrorFileName,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          })

          // Update job with error
          await this.supabase
            .from('photo_upload_jobs')
            .update({
              processed_photos: processedCount,
              failed_photos: failedCount,
              errors,
            })
            .eq('id', job.id)
        }
      }

      // Check if job was cancelled
      if (this.cancelledJobs.has(job.id)) {
        this.cancelledJobs.delete(job.id)
        return job.id
      }

      // Finalize job
      const finalStatus = failedCount === imageFiles.length ? 'failed' : 'completed'
      await this.supabase
        .from('photo_upload_jobs')
        .update({
          status: finalStatus,
          processed_photos: processedCount,
          failed_photos: failedCount,
          errors,
          completed_at: new Date().toISOString(),
          error_message: failedCount > 0 ? `${failedCount} fotos falharam` : null,
        })
        .eq('id', job.id)

      callbacks?.onUploadComplete?.()
      console.log('[BulkUploadService] Job completed:', processedCount, 'processed,', failedCount, 'failed')

      return job.id

    } catch (error) {
      console.error('[BulkUploadService] Error during processing:', error)

      // Check if already cancelled
      const currentJob = await this.getJobStatus(job.id)
      if (currentJob?.status === 'cancelled') {
        return job.id
      }

      // Update job as failed
      await this.supabase
        .from('photo_upload_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Erro durante processamento',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      callbacks?.onUploadError?.(error instanceof Error ? error : new Error('Erro durante processamento'))
      throw error
    }
  }

  /**
   * Filter valid image files from ZIP
   */
  private filterValidImages(zip: JSZipType): string[] {
    return Object.keys(zip.files)
      .filter((name) => {
        const file = zip.files[name]
        if (file.dir) return false

        // Skip macOS metadata and hidden files
        if (name.includes('__MACOSX') || name.includes('/.') || name.startsWith('.')) return false

        // Skip system files
        const baseName = name.split('/').pop() || ''
        if (baseName.startsWith('.') || baseName === 'Thumbs.db' || baseName === 'desktop.ini') return false

        // Check extension
        const ext = name.toLowerCase().substring(name.lastIndexOf('.'))
        return VALID_IMAGE_EXTENSIONS.includes(ext)
      })
      .sort()
  }

  /**
   * Process and upload a single photo from ZIP
   */
  private async processAndUploadPhoto(
    zip: JSZipType,
    fileName: string,
    eventId: string,
    displayOrder: number
  ): Promise<void> {
    console.log('[BulkUploadService] Processing:', fileName)

    // Extract photo data from ZIP
    const zipFile = zip.file(fileName)
    if (!zipFile) {
      throw new Error('Arquivo não encontrado no ZIP')
    }

    const photoData = await zipFile.async('blob')
    if (!photoData || photoData.size === 0) {
      throw new Error('Arquivo vazio')
    }

    // Validate file size (max 50MB per photo)
    if (photoData.size > 50 * 1024 * 1024) {
      throw new Error('Foto muito grande (máximo 50MB)')
    }

    // Convert to File object
    const baseName = fileName.split('/').pop() || fileName
    const sanitizedName = sanitizeFilename(baseName) || 'photo.jpg'
    const mimeType = getMimeType(fileName)
    const file = new File([photoData], sanitizedName, { type: mimeType })

    // Process image (watermark + thumbnail)
    const processed = await processEventPhoto(file)

    // Generate unique photo ID
    const photoId = crypto.randomUUID()
    const extension = getFileExtension(sanitizedName)

    // Define paths
    const paths = {
      original: `${eventId}/photo-${photoId}${extension}`,
      watermarked: `${eventId}/watermarked/photo-${photoId}.jpg`,
      thumbnail: `${eventId}/thumbnails/photo-${photoId}.jpg`,
    }

    // Upload all three versions
    const uploadedFiles: { bucket: string; path: string }[] = []

    try {
      // Upload original
      await uploadService.uploadFile(processed.original, {
        bucket: PHOTO_BUCKETS.ORIGINAL,
        folder: eventId,
        fileName: `photo-${photoId}${extension}`,
      })
      uploadedFiles.push({ bucket: PHOTO_BUCKETS.ORIGINAL, path: paths.original })

      // Upload watermarked
      await uploadService.uploadFile(processed.watermarked, {
        bucket: PHOTO_BUCKETS.WATERMARKED,
        folder: eventId,
        fileName: `watermarked/photo-${photoId}.jpg`,
      })
      uploadedFiles.push({ bucket: PHOTO_BUCKETS.WATERMARKED, path: paths.watermarked })

      // Upload thumbnail
      await uploadService.uploadFile(processed.thumbnail, {
        bucket: PHOTO_BUCKETS.WATERMARKED,
        folder: eventId,
        fileName: `thumbnails/photo-${photoId}.jpg`,
      })
      uploadedFiles.push({ bucket: PHOTO_BUCKETS.WATERMARKED, path: paths.thumbnail })

      // Insert photo record in database
      const { error: insertError } = await this.supabase
        .from('event_photos')
        .insert({
          event_id: eventId,
          original_path: paths.original,
          watermarked_path: paths.watermarked,
          thumbnail_path: paths.thumbnail,
          file_name: sanitizedName,
          file_size: file.size,
          width: processed.dimensions.width,
          height: processed.dimensions.height,
          display_order: displayOrder,
        })

      if (insertError) {
        throw new Error(`Falha ao salvar registro: ${insertError.message}`)
      }

      console.log('[BulkUploadService] Successfully processed:', fileName)

    } catch (error) {
      // Rollback uploaded files on error
      for (const uploaded of uploadedFiles) {
        try {
          await uploadService.deleteFile(uploaded.bucket as 'event-photos' | 'event-photos-watermarked', uploaded.path)
        } catch {
          // Ignore rollback errors
        }
      }
      throw error
    }
  }

  /**
   * Validate ZIP file before processing
   */
  private async validateZipFile(file: File): Promise<void> {
    const isZipByExtension = file.name.toLowerCase().endsWith('.zip')
    if (!isZipByExtension) {
      throw new Error('Arquivo deve ser um ZIP')
    }

    if (file.size > MAX_ZIP_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024))
      const maxMB = Math.round(MAX_ZIP_SIZE / (1024 * 1024))
      throw new Error(`ZIP muito grande (${sizeMB}MB). Para arquivos maiores que ${maxMB}MB, use o "Upload Individual" que permite selecionar múltiplas fotos diretamente.`)
    }

    if (file.size === 0) {
      throw new Error('Arquivo ZIP está vazio')
    }

    const isValidZip = await validateZipMagic(file)
    if (!isValidZip) {
      throw new Error('Arquivo não é um ZIP válido (assinatura inválida)')
    }
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<PhotoUploadJob | null> {
    const { data, error } = await this.supabase
      .from('photo_upload_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      console.error('Failed to get job status:', error)
      return null
    }

    return data as PhotoUploadJob
  }

  /**
   * Get all jobs for an event
   */
  async getEventJobs(eventId: string): Promise<PhotoUploadJob[]> {
    const { data, error } = await this.supabase
      .from('photo_upload_jobs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to get event jobs:', error)
      return []
    }

    return data as PhotoUploadJob[]
  }

  /**
   * Cancel a job in progress
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId)
    if (!job) {
      return false
    }

    // Allow cancelling jobs that are processing or extracting
    if (!['pending', 'uploading', 'extracting', 'processing'].includes(job.status)) {
      throw new Error('Não é possível cancelar um job finalizado')
    }

    // Mark as cancelled for the processing loop
    this.cancelledJobs.add(jobId)

    // Update job status
    const { error } = await this.supabase
      .from('photo_upload_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) {
      console.error('Failed to cancel job:', error)
      this.cancelledJobs.delete(jobId)
      return false
    }

    return true
  }

  /**
   * Retry a failed job (not supported in client-side extraction mode)
   * The user needs to re-upload the ZIP file
   */
  async retryJob(jobId: string): Promise<boolean> {
    // In client-side extraction mode, we can't retry because we don't store the ZIP
    // The user needs to re-upload the file
    throw new Error('Para tentar novamente, faça um novo upload do arquivo ZIP')
  }

  /**
   * Subscribe to job updates using Supabase Realtime
   */
  subscribeToJob(
    jobId: string,
    callback: (job: PhotoUploadJob) => void
  ): () => void {
    const channel = this.supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photo_upload_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          callback(payload.new as PhotoUploadJob)
        }
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}

// Export singleton instance
export const bulkUploadService = new BulkUploadServiceClass()

// Export type for job status polling hook
export type { PhotoUploadJob as UploadJob }
