// Type declarations for tus-js-client
// Minimal types for Supabase resumable upload usage

declare module 'tus-js-client' {
  export interface UploadOptions {
    endpoint: string
    retryDelays?: number[]
    chunkSize?: number
    metadata?: Record<string, string>
    headers?: Record<string, string>
    uploadSize?: number
    onError?: (error: Error) => void
    onProgress?: (bytesUploaded: number, bytesTotal: number) => void
    onSuccess?: () => void
  }

  export interface PreviousUpload {
    uploadUrl: string
    [key: string]: unknown
  }

  export class Upload {
    constructor(file: File | Blob, options: UploadOptions)
    start(): void
    abort(): void
    findPreviousUploads(): Promise<PreviousUpload[]>
    resumeFromPreviousUpload(previousUpload: PreviousUpload): void
  }
}
