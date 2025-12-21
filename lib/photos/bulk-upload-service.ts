/**
 * Bulk Upload Service
 * Handles ZIP file uploads for bulk photo processing
 * Uses TUS protocol for resumable uploads
 */

import { createClient } from '@/lib/supabase/client'

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
  file_list: string[] | null // Comment 2: Persisted file list from extraction
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
  // Comment 1: Callback to provide jobId immediately after job creation, before upload starts
  onJobCreated?: (job: PhotoUploadJob) => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const MAX_ZIP_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const CHUNK_SIZE = 6 * 1024 * 1024 // 6MB chunks for TUS

// Comment 1: ZIP magic bytes signature (PK\x03\x04)
const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]

/**
 * Comment 1: Sanitize filename by removing control characters and enforcing safe charset
 * @param filename - The original filename
 * @param maxLength - Maximum allowed length (default 200)
 * @returns Sanitized filename or null if empty after sanitization
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
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    const maxNameLength = maxLength - ext.length
    sanitized = nameWithoutExt.substring(0, maxNameLength) + ext
  }

  // Return null if empty after sanitization
  return sanitized.length > 0 ? sanitized : null
}

/**
 * Comment 2: Validate ZIP file magic bytes
 * @param file - The file to validate
 * @returns true if the file starts with ZIP magic bytes
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

// Comment 1: Type for abortable upload instance (TUS or fallback)
interface AbortableUpload {
  abort: () => void
  type: 'tus' | 'fallback'
}

// Comment 1: Custom error class for user-initiated cancellations
class UploadCancelledError extends Error {
  constructor(message = 'Upload cancelado pelo usuário') {
    super(message)
    this.name = 'UploadCancelledError'
  }
}

/**
 * Bulk Upload Service class
 * Manages ZIP uploads and job tracking
 */
class BulkUploadServiceClass {
  private supabase = createClient()
  // Comment 1: Store active uploads keyed by jobId for abort functionality (supports TUS and fallback)
  private activeUploads: Map<string, AbortableUpload> = new Map()

  /**
   * Upload a ZIP file for bulk photo processing
   * @param file - The ZIP file to upload
   * @param eventId - The event ID to associate photos with
   * @param callbacks - Optional callbacks for progress tracking
   * @returns The job ID for tracking progress
   */
  async uploadZip(
    file: File,
    eventId: string,
    callbacks?: BulkUploadCallbacks
  ): Promise<string> {
    // Validate file (includes magic bytes check)
    await this.validateZipFile(file)

    // Comment 1: Sanitize filename before persisting
    const sanitizedFileName = sanitizeFilename(file.name)
    if (!sanitizedFileName) {
      throw new Error('Nome do arquivo inválido')
    }

    // Get current user
    const { data: { user }, error: userError } = await this.supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Create job record with sanitized filename
    const { data: job, error: jobError } = await this.supabase
      .from('photo_upload_jobs')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'uploading',
        zip_file_name: sanitizedFileName,
        zip_size_bytes: file.size,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Failed to create job:', jobError)
      throw new Error('Falha ao criar job de upload')
    }

    // Comment 1: Notify caller of job creation immediately, before upload starts
    // This allows the UI to show the cancel button during upload
    callbacks?.onJobCreated?.(job as PhotoUploadJob)

    try {
      // Upload ZIP using TUS protocol for resumability
      const zipPath = await this.uploadWithTus(file, user.id, job.id, callbacks)

      // Comment 1: Clean up active upload reference after completion
      this.activeUploads.delete(job.id)

      // Comment 1: Re-fetch job to check if it was cancelled during upload
      const currentJob = await this.getJobStatus(job.id)
      if (currentJob?.status === 'cancelled') {
        console.log('[BulkUploadService] Job was cancelled during upload, skipping processing')
        return job.id
      }

      // Update job with ZIP path and change status to extracting
      const { error: updateError } = await this.supabase
        .from('photo_upload_jobs')
        .update({
          zip_path: zipPath,
          status: 'extracting',
        })
        .eq('id', job.id)

      if (updateError) {
        throw new Error('Falha ao atualizar job após upload')
      }

      callbacks?.onUploadComplete?.()
      callbacks?.onProcessingStart?.()

      // Trigger Edge Function to start processing
      await this.triggerProcessing(job.id)

      return job.id
    } catch (error) {
      // Comment 1: Clean up active upload reference on error
      this.activeUploads.delete(job.id)

      // Comment 1: Check if this was a user-initiated cancellation
      const isCancellation = error instanceof UploadCancelledError

      // Comment 1: Re-fetch job to check if it was cancelled (avoid overwriting cancelled status)
      const currentJob = await this.getJobStatus(job.id)
      if (currentJob?.status === 'cancelled') {
        console.log('[BulkUploadService] Job already cancelled, not updating to failed')
        // Comment 1: Don't fire onUploadError for user-initiated cancellations
        return job.id
      }

      // Comment 1: Don't update to failed or fire error callback for user cancellations
      if (isCancellation) {
        console.log('[BulkUploadService] Upload cancelled by user')
        return job.id
      }

      // Update job as failed (only for actual errors, not cancellations)
      await this.supabase
        .from('photo_upload_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Upload falhou',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      callbacks?.onUploadError?.(error instanceof Error ? error : new Error('Upload falhou'))
      throw error
    }
  }

  /**
   * Upload file using TUS protocol for resumable uploads
   */
  private async uploadWithTus(
    file: File,
    userId: string,
    jobId: string,
    callbacks?: BulkUploadCallbacks
  ): Promise<string> {
    // Comment 1: Use sanitized filename for storage path
    const sanitizedFileName = sanitizeFilename(file.name) || 'upload.zip'
    const fileName = `${userId}/${jobId}/${sanitizedFileName}`

    // For Supabase, we'll use their resumable upload API
    // Supabase Storage supports TUS protocol natively

    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Sessão não encontrada')
    }

    // Use Supabase's TUS endpoint
    const tusEndpoint = `${SUPABASE_URL}/storage/v1/upload/resumable`

    return new Promise((resolve, reject) => {
      // Dynamic import of tus-js-client for browser
      import('tus-js-client').then((tusModule) => {
        const Upload = tusModule.Upload
        const upload = new Upload(file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000, 10000], // Retry delays in ms
          chunkSize: CHUNK_SIZE,
          metadata: {
            bucketName: 'photo-uploads-temp',
            objectName: fileName,
            contentType: file.type || 'application/zip',
            cacheControl: '3600',
          },
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true', // Overwrite if exists
          },
          uploadSize: file.size,
          onError: (error: Error) => {
            // Comment 1: Clean up on error
            this.activeUploads.delete(jobId)
            console.error('TUS upload error:', error)
            // Comment 1: Check if this was an abort (user cancellation)
            if (error.message?.includes('abort') || error.message?.includes('cancel')) {
              reject(new UploadCancelledError())
            } else {
              reject(new Error(`Upload falhou: ${error.message}`))
            }
          },
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
            callbacks?.onUploadProgress?.({
              bytesUploaded,
              bytesTotal,
              percentage,
            })
          },
          onSuccess: () => {
            // Comment 1: Clean up on success
            this.activeUploads.delete(jobId)
            resolve(fileName)
          },
        })

        // Comment 1: Store the upload instance for potential abort
        this.activeUploads.set(jobId, { abort: () => upload.abort(), type: 'tus' })

        // Check for previous uploads to resume
        upload.findPreviousUploads().then((previousUploads: Array<{ uploadUrl: string }>) => {
          if (previousUploads.length > 0) {
            console.log('Resuming previous upload...')
            upload.resumeFromPreviousUpload(previousUploads[0])
          }
          upload.start()
        })
      }).catch((error: unknown) => {
        console.error('Failed to load TUS client:', error)
        // Comment 1: Fallback to standard upload if TUS fails, passing jobId for abort support
        this.fallbackUpload(file, fileName, jobId, callbacks)
          .then(resolve)
          .catch(reject)
      })
    })
  }

  /**
   * Fallback upload method if TUS is not available
   * Comment 7: This method is called within uploadWithTus context, so job already exists
   * The caller (uploadWithTus) handles the job status transitions
   * Comment 1: Now supports AbortController for cancellation
   */
  private async fallbackUpload(
    file: File,
    fileName: string,
    jobId: string,
    callbacks?: BulkUploadCallbacks
  ): Promise<string> {
    console.log('Using fallback upload method...')

    // Comment 1: Create AbortController for cancellation support
    const abortController = new AbortController()

    // Comment 1: Register the abort controller with activeUploads
    this.activeUploads.set(jobId, {
      abort: () => abortController.abort(),
      type: 'fallback',
    })

    // Comment 7: Simulate progress updates during upload
    // Since standard upload doesn't provide progress, we show indeterminate state
    callbacks?.onUploadProgress?.({
      bytesUploaded: 0,
      bytesTotal: file.size,
      percentage: 0,
    })

    try {
      // Comment 1: Use fetch with AbortController signal for cancellable upload
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Sessão não encontrada')
      }

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/photo-uploads-temp/${fileName}`

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': file.type || 'application/zip',
          'x-upsert': 'true',
          'cache-control': '3600',
        },
        body: file,
        signal: abortController.signal,
      })

      // Comment 1: Clean up on completion
      this.activeUploads.delete(jobId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload falhou: ${errorText}`)
      }

      // Comment 7: Update progress to 100% after successful upload
      callbacks?.onUploadProgress?.({
        bytesUploaded: file.size,
        bytesTotal: file.size,
        percentage: 100,
      })

      return fileName
    } catch (error) {
      // Comment 1: Clean up on error
      this.activeUploads.delete(jobId)

      // Comment 1: Throw UploadCancelledError for user-initiated aborts
      if (error instanceof Error && error.name === 'AbortError') {
        throw new UploadCancelledError()
      }
      throw error
    }
  }

  /**
   * Trigger the Edge Function to start processing
   * Comment 2: Now with bounded retries and backoff for transient failures
   */
  private async triggerProcessing(jobId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Sessão não encontrada')
    }

    const functionUrl = `${SUPABASE_URL}/functions/v1/process-photo-zip`
    const maxRetries = 3
    const backoffDelays = [1000, 2000, 4000] // 1s, 2s, 4s

    let lastError: string | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ jobId }),
        })

        if (response.ok) {
          console.log(`[BulkUploadService] Edge Function triggered successfully for job: ${jobId}`)
          return // Success, exit
        }

        lastError = await response.text()
        console.error(`[BulkUploadService] Edge Function attempt ${attempt + 1} failed:`, lastError)
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error'
        console.error(`[BulkUploadService] Edge Function attempt ${attempt + 1} error:`, lastError)
      }

      // Comment 2: Wait before retry (except on last attempt)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt]))
      }
    }

    // Comment 2: All retries exhausted - but first check if job already completed
    // The Edge Function may have succeeded but the response was lost due to timeout/network issues
    console.error(`[BulkUploadService] All ${maxRetries} attempts to trigger Edge Function failed for job: ${jobId}`)

    const currentJob = await this.getJobStatus(jobId)
    if (currentJob && ['completed', 'processing', 'extracting'].includes(currentJob.status)) {
      // Job is already being processed or completed - don't mark as failed
      console.log(`[BulkUploadService] Job ${jobId} is already ${currentJob.status}, not marking as failed`)
      return
    }

    await this.supabase
      .from('photo_upload_jobs')
      .update({
        status: 'failed',
        error_message: `Falha ao iniciar processamento após ${maxRetries} tentativas: ${lastError}`,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }

  /**
   * Validate ZIP file before upload
   * Comment 2: Now validates magic bytes in addition to extension/MIME
   */
  private async validateZipFile(file: File): Promise<void> {
    // Check file type by extension (MIME types are unreliable)
    const isZipByExtension = file.name.toLowerCase().endsWith('.zip')

    if (!isZipByExtension) {
      throw new Error('Arquivo deve ser um ZIP')
    }

    // Check file size
    if (file.size > MAX_ZIP_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024))
      const maxMB = Math.round(MAX_ZIP_SIZE / (1024 * 1024))
      throw new Error(`Arquivo muito grande (${sizeMB}MB). Máximo: ${maxMB}MB`)
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error('Arquivo ZIP está vazio')
    }

    // Comment 2: Validate ZIP magic bytes (PK\x03\x04)
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
   * Comment 1: Abort an active upload by job ID (supports both TUS and fallback)
   * This stops the in-flight upload immediately
   */
  abortUpload(jobId: string): boolean {
    const upload = this.activeUploads.get(jobId)
    if (upload) {
      console.log(`[BulkUploadService] Aborting active ${upload.type} upload for job:`, jobId)
      upload.abort()
      this.activeUploads.delete(jobId)
      return true
    }
    return false
  }

  /**
   * Cancel a pending or uploading job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId)

    if (!job) {
      return false
    }

    // Only allow cancelling pending or uploading jobs
    if (!['pending', 'uploading'].includes(job.status)) {
      throw new Error('Não é possível cancelar um job em processamento')
    }

    // Comment 1: Abort any active upload for this job (TUS or fallback)
    this.abortUpload(jobId)

    // Delete ZIP if it exists
    if (job.zip_path) {
      await this.supabase.storage
        .from('photo-uploads-temp')
        .remove([job.zip_path])
    }

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
      return false
    }

    return true
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId)

    if (!job) {
      return false
    }

    // Only allow retrying failed jobs that still have a ZIP
    if (job.status !== 'failed' || !job.zip_path) {
      throw new Error('Não é possível tentar novamente este job')
    }

    // Reset job status to extracting
    const { error } = await this.supabase
      .from('photo_upload_jobs')
      .update({
        status: 'extracting',
        error_message: null,
        completed_at: null,
      })
      .eq('id', jobId)

    if (error) {
      console.error('Failed to retry job:', error)
      return false
    }

    // Trigger processing again
    await this.triggerProcessing(jobId)

    return true
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

    // Return unsubscribe function
    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}

// Export singleton instance
export const bulkUploadService = new BulkUploadServiceClass()

// Export type for job status polling hook
export type { PhotoUploadJob as UploadJob }
