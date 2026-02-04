'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, X, AlertCircle, Loader2, CheckCircle2, FileArchive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  bulkUploadService,
  type PhotoUploadJob,
  type UploadProgress,
} from '@/lib/photos/bulk-upload-service'

interface PhotosBulkUploadProps {
  eventId: string
  onJobCreated?: (jobId: string) => void
}

// Comment 6: Handle all job states from the database
type UploadState = 'idle' | 'pending' | 'uploading' | 'extracting' | 'processing' | 'completed' | 'failed' | 'cancelled'

export function PhotosBulkUpload({ eventId, onJobCreated }: PhotosBulkUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [currentJob, setCurrentJob] = useState<PhotoUploadJob | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Comment 9: Track if Realtime is working to avoid redundant polling
  const realtimeActiveRef = useRef(false)
  const lastRealtimeUpdateRef = useRef<number>(0)

  // Comment 6: Helper to update state based on job status
  const handleJobUpdate = useCallback((job: PhotoUploadJob) => {
    setCurrentJob(job)

    // Comment 6: Map all job statuses to UI states
    switch (job.status) {
      case 'completed':
        setState('completed')
        break
      case 'failed':
        setState('failed')
        setError(job.error_message || 'Processamento falhou')
        break
      case 'cancelled':
        setState('cancelled')
        break
      case 'pending':
        setState('pending')
        break
      case 'uploading':
        setState('uploading')
        break
      case 'extracting':
        setState('extracting')
        break
      case 'processing':
        setState('processing')
        break
    }
  }, [])

  // Subscribe to job updates when we have a job
  useEffect(() => {
    // Comment 6: Check for terminal states
    if (!currentJob?.id || state === 'completed' || state === 'failed' || state === 'cancelled') {
      return
    }

    // Subscribe to realtime updates
    const unsubscribe = bulkUploadService.subscribeToJob(currentJob.id, (updatedJob) => {
      // Comment 9: Mark Realtime as active and record timestamp
      realtimeActiveRef.current = true
      lastRealtimeUpdateRef.current = Date.now()
      handleJobUpdate(updatedJob)
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
      realtimeActiveRef.current = false
    }
  }, [currentJob?.id, state, handleJobUpdate])

  // Comment 9: Poll for job status ONLY as fallback when Realtime is not working
  useEffect(() => {
    // Comment 6: Include all active states for polling
    const activeStates: UploadState[] = ['pending', 'uploading', 'extracting', 'processing']
    if (!currentJob?.id || !activeStates.includes(state)) {
      return
    }

    const pollInterval = setInterval(async () => {
      // Comment 9: Skip polling if Realtime received an update recently (within 10s)
      const timeSinceLastRealtime = Date.now() - lastRealtimeUpdateRef.current
      if (realtimeActiveRef.current && timeSinceLastRealtime < 10000) {
        console.log('[PhotosBulkUpload] Skipping poll - Realtime is active')
        return
      }

      console.log('[PhotosBulkUpload] Polling for job status (Realtime fallback)')
      const job = await bulkUploadService.getJobStatus(currentJob.id)
      if (job) {
        handleJobUpdate(job)
      }
    }, 5000) // Poll every 5 seconds (increased from 3s since it's just a fallback)

    return () => clearInterval(pollInterval)
  }, [currentJob?.id, state, handleJobUpdate])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Por favor, selecione um arquivo ZIP')
      return
    }

    // Validate file size (5GB max)
    const maxSize = 5 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo: 5GB')
      return
    }

    setSelectedFile(file)
    setError(null)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setState('uploading')
    setError(null)
    setUploadProgress({ bytesUploaded: 0, bytesTotal: selectedFile.size, percentage: 0 })

    try {
      const jobId = await bulkUploadService.uploadZip(selectedFile, eventId, {
        // Comment 1: Set currentJob immediately when job is created, before upload starts
        // This enables the cancel button to work during the upload phase
        onJobCreated: (job) => {
          setCurrentJob(job)
          onJobCreated?.(job.id)
        },
        onUploadProgress: (progress) => {
          setUploadProgress(progress)
        },
        onUploadComplete: () => {
          setState('processing')
          setUploadProgress(null)
        },
        onUploadError: (err) => {
          setState('failed')
          setError(err.message)
        },
        onProcessingStart: () => {
          setState('processing')
        },
      })

      // Comment 1: Job is already set via onJobCreated callback, but refresh to get latest status
      const job = await bulkUploadService.getJobStatus(jobId)
      if (job) {
        // Use handleJobUpdate to properly sync state with job status
        handleJobUpdate(job)
      }
    } catch (err) {
      // Before showing error, check if job actually succeeded (Edge Function may have completed)
      if (currentJob?.id) {
        const job = await bulkUploadService.getJobStatus(currentJob.id)
        if (job && ['completed', 'processing', 'extracting'].includes(job.status)) {
          // Job is actually processing/completed - don't show error
          handleJobUpdate(job)
          return
        }
      }
      setState('failed')
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    }
  }, [selectedFile, eventId, onJobCreated, currentJob?.id, handleJobUpdate])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleReset = useCallback(() => {
    setState('idle')
    setError(null)
    setUploadProgress(null)
    setCurrentJob(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  // Comment 1: Handle cancel for pending/uploading jobs
  // cancelJob now internally aborts any active TUS upload and prevents processing
  const handleCancel = useCallback(async () => {
    if (!currentJob?.id) return

    try {
      // Comment 1: cancelJob aborts the TUS upload, updates DB status, and cleans up
      const success = await bulkUploadService.cancelJob(currentJob.id)
      if (success) {
        // Clear subscriptions
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
          unsubscribeRef.current = null
        }
        // Reset upload progress
        setUploadProgress(null)
        // Set state to cancelled
        setState('cancelled')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar upload')
    }
  }, [currentJob?.id])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (date: string | null): string => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora mesmo'
    if (minutes === 1) return 'há 1 minuto'
    if (minutes < 60) return `há ${minutes} minutos`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'há 1 hora'
    return `há ${hours} horas`
  }

  // Render based on state
  if (state === 'idle') {
    return (
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center transition-colors border-neutral-300 hover:border-primary-400 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileArchive className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <div>
            <span className="text-primary-600 hover:text-primary-700 font-medium">
              Clique para selecionar
            </span>
            <span className="text-neutral-600"> ou arraste um arquivo ZIP</span>
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            Máximo 5GB. O ZIP deve conter apenas imagens (JPG, PNG, WebP)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Selected File */}
        {selectedFile && (
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-3">
              <FileArchive className="h-8 w-8 text-primary-500" />
              <div>
                <p className="font-medium text-neutral-900">{selectedFile.name}</p>
                <p className="text-sm text-neutral-500">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Upload
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Comment 6: Handle 'pending' state
  // Comment 1: Added cancel button for pending state
  if (state === 'pending') {
    return (
      <div className="space-y-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
            <div>
              <p className="font-medium text-neutral-900">Aguardando...</p>
              <p className="text-sm text-neutral-500">Preparando para iniciar o upload</p>
            </div>
          </div>
          {currentJob && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Comment 1: Added cancel button for uploading state
  if (state === 'uploading') {
    return (
      <div className="space-y-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            <div>
              <p className="font-medium text-neutral-900">Carregando arquivo ZIP...</p>
              <p className="text-sm text-neutral-500">{selectedFile?.name}</p>
            </div>
          </div>
          {currentJob && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>

        {uploadProgress && (
          <div className="space-y-2">
            <Progress value={uploadProgress.percentage} className="h-2" />
            <div className="flex justify-between text-sm text-neutral-500">
              <span>{uploadProgress.percentage}%</span>
              <span>
                {formatBytes(uploadProgress.bytesUploaded)} de {formatBytes(uploadProgress.bytesTotal)}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-neutral-500">
          Preparando arquivo para processamento local...
        </p>
      </div>
    )
  }

  // Comment 6: Handle 'extracting' state separately
  if (state === 'extracting') {
    return (
      <div className="space-y-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            <div>
              <p className="font-medium text-neutral-900">Extraindo arquivos...</p>
              <p className="text-sm text-neutral-500">Analisando conteúdo do ZIP e preparando fotos para processamento</p>
            </div>
          </div>
          {currentJob && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>

        <p className="text-xs text-neutral-500">
          Isso pode levar alguns instantes dependendo do tamanho do arquivo.
        </p>
      </div>
    )
  }

  if (state === 'processing') {
    const progressPercent = currentJob?.total_photos
      ? Math.round(((currentJob.processed_photos + currentJob.failed_photos) / currentJob.total_photos) * 100)
      : 0

    return (
      <div className="space-y-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            <div>
              <p className="font-medium text-neutral-900">Processando fotos...</p>
              <p className="text-sm text-neutral-500">Aplicando marca d'água e fazendo upload</p>
            </div>
          </div>
          {currentJob && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>

        {currentJob && currentJob.total_photos > 0 && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-sm text-neutral-500">
              <span>{currentJob.processed_photos + currentJob.failed_photos} de {currentJob.total_photos} fotos</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">
                ✓ {currentJob.processed_photos} processadas
              </span>
              {currentJob.failed_photos > 0 && (
                <span className="text-red-600">
                  ✗ {currentJob.failed_photos} com erro
                </span>
              )}
            </div>
          </div>
        )}

        {currentJob?.started_at && (
          <p className="text-xs text-neutral-500">
            Iniciado {formatTime(currentJob.started_at)}
          </p>
        )}
      </div>
    )
  }

  if (state === 'completed') {
    return (
      <div className="space-y-4 p-6 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-medium text-green-900">Upload concluído!</p>
            <p className="text-sm text-green-700">
              {currentJob?.processed_photos} fotos adicionadas ao evento
              {currentJob?.failed_photos ? ` (${currentJob.failed_photos} com erro)` : ''}
            </p>
          </div>
        </div>

        {currentJob?.failed_photos != null && currentJob.failed_photos > 0 && currentJob.errors && currentJob.errors.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-red-600 hover:text-red-700">
              Ver {currentJob.failed_photos} erros
            </summary>
            <ul className="mt-2 space-y-1 text-red-600 bg-red-50 p-2 rounded">
              {currentJob.errors.slice(0, 10).map((err, i) => (
                <li key={i} className="truncate">
                  {err.fileName}: {err.error}
                </li>
              ))}
              {currentJob.errors.length > 10 && (
                <li className="text-neutral-500">...e mais {currentJob.errors.length - 10} erros</li>
              )}
            </ul>
          </details>
        )}

        <Button onClick={handleReset} variant="outline">
          Fazer novo upload
        </Button>
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="space-y-4 p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <p className="font-medium text-red-900">Erro no processamento</p>
            <p className="text-sm text-red-700">{error || 'Ocorreu um erro durante o processamento'}</p>
          </div>
        </div>

        {currentJob && currentJob.processed_photos > 0 && (
          <p className="text-sm text-neutral-600">
            {currentJob.processed_photos} fotos foram processadas antes do erro.
          </p>
        )}

        <Button onClick={handleReset} variant="outline">
          Fazer novo upload
        </Button>
      </div>
    )
  }

  // Comment 6: Handle 'cancelled' state
  if (state === 'cancelled') {
    return (
      <div className="space-y-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-3">
          <X className="h-6 w-6 text-neutral-500" />
          <div>
            <p className="font-medium text-neutral-900">Upload cancelado</p>
            <p className="text-sm text-neutral-500">O processamento foi cancelado pelo usuário</p>
          </div>
        </div>

        <Button onClick={handleReset} variant="outline">
          Fazer novo upload
        </Button>
      </div>
    )
  }

  return null
}
