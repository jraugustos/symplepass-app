'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileArchive,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  bulkUploadService,
  type PhotoUploadJob,
} from '@/lib/photos/bulk-upload-service'
import { createClient } from '@/lib/supabase/client'

interface PhotoJobsStatusProps {
  eventId: string
  refreshTrigger?: number // Increment to force refresh
}

export function PhotoJobsStatus({ eventId, refreshTrigger }: PhotoJobsStatusProps) {
  const [jobs, setJobs] = useState<PhotoUploadJob[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Comment 2: Track Realtime activity for polling fallback
  const realtimeActiveRef = useRef(false)
  const lastRealtimeUpdateRef = useRef<number>(0)
  const supabaseRef = useRef(createClient())

  const fetchJobs = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await bulkUploadService.getEventJobs(eventId)
      setJobs(data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      // Set empty array on error to prevent infinite loading
      setJobs([])
    } finally {
      setLoading(false)
      setInitialLoadDone(true)
    }
  }, [eventId])

  // Fetch jobs on mount and when eventId changes
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setInitialLoadDone(false)

    // Set a timeout to prevent infinite loading state (reduced to 3 seconds)
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(false)
        setInitialLoadDone(true)
      }
    }, 3000)

    const doFetch = async () => {
      try {
        const data = await bulkUploadService.getEventJobs(eventId)
        if (isMounted) {
          setJobs(data)
          setLoading(false)
          setInitialLoadDone(true)
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
        if (isMounted) {
          setJobs([])
          setLoading(false)
          setInitialLoadDone(true)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    doFetch()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [eventId]) // Only re-run on eventId change

  // Refresh when refreshTrigger changes (after initial load)
  useEffect(() => {
    if (initialLoadDone && refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchJobs(false) // Don't show loading spinner for refresh
    }
  }, [refreshTrigger, initialLoadDone, fetchJobs])

  // Comment 2: Subscribe to Realtime updates for jobs in this event
  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`event-jobs-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photo_upload_jobs',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Mark Realtime as active and record timestamp
          realtimeActiveRef.current = true
          lastRealtimeUpdateRef.current = Date.now()

          // Update the specific job in state
          const updatedJob = payload.new as PhotoUploadJob
          setJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.id === updatedJob.id ? updatedJob : job
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photo_upload_jobs',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Mark Realtime as active and record timestamp
          realtimeActiveRef.current = true
          lastRealtimeUpdateRef.current = Date.now()

          // Add new job to state
          const newJob = payload.new as PhotoUploadJob
          setJobs((prevJobs) => [newJob, ...prevJobs].slice(0, 10))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      realtimeActiveRef.current = false
    }
  }, [eventId])

  // Comment 2: Poll for updates ONLY as fallback when Realtime is not working
  useEffect(() => {
    const hasActiveJobs = jobs.some((job) =>
      ['pending', 'uploading', 'extracting', 'processing'].includes(job.status)
    )

    if (!hasActiveJobs) return

    const interval = setInterval(() => {
      // Skip polling if Realtime received an update recently (within 10s)
      const timeSinceLastRealtime = Date.now() - lastRealtimeUpdateRef.current
      if (realtimeActiveRef.current && timeSinceLastRealtime < 10000) {
        console.log('[PhotoJobsStatus] Skipping poll - Realtime is active')
        return
      }

      console.log('[PhotoJobsStatus] Polling for job status (Realtime fallback)')
      fetchJobs(false) // Don't show loading spinner for polling
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [jobs, fetchJobs])

  const handleRetry = async (jobId: string) => {
    try {
      await bulkUploadService.retryJob(jobId)
      fetchJobs()
    } catch (error) {
      console.error('Failed to retry job:', error)
    }
  }

  const handleForceCancel = async (jobId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este upload? Esta ação não pode ser desfeita.')) {
      return
    }
    try {
      const supabase = supabaseRef.current
      // Force update job to cancelled status
      await supabase
        .from('photo_upload_jobs')
        .update({
          status: 'cancelled',
          error_message: 'Cancelado manualmente pelo usuário',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      fetchJobs()
    } catch (error) {
      console.error('Failed to cancel job:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de upload?')) {
      return
    }
    try {
      const supabase = supabaseRef.current
      await supabase
        .from('photo_upload_jobs')
        .delete()
        .eq('id', jobId)
      fetchJobs()
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  const formatTime = (date: string | null): string => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'agora mesmo'
    if (diffMins === 1) return 'há 1 minuto'
    if (diffMins < 60) return `há ${diffMins} minutos`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'há 1 dia'
    return `há ${diffDays} dias`
  }

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-neutral-400" />
      case 'pending':
        return <Clock className="h-5 w-5 text-neutral-400" />
      default:
        return <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
    }
  }

  const getStatusText = (job: PhotoUploadJob): string => {
    switch (job.status) {
      case 'pending':
        return 'Aguardando'
      case 'uploading':
        return 'Enviando ZIP...'
      case 'extracting':
        return 'Extraindo arquivos...'
      case 'processing':
        return `Processando ${job.processed_photos + job.failed_photos}/${job.total_photos} fotos`
      case 'completed':
        return `Concluído - ${job.processed_photos} fotos`
      case 'failed':
        return 'Falhou'
      case 'cancelled':
        return 'Cancelado'
      default:
        return job.status
    }
  }

  const getProgressPercent = (job: PhotoUploadJob): number => {
    if (job.total_photos === 0) return 0
    return Math.round(((job.processed_photos + job.failed_photos) / job.total_photos) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return null // Don't show anything if there are no jobs
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-neutral-900">Uploads Recentes</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchJobs(false)}
          className="text-neutral-500 hover:text-neutral-700"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="border border-neutral-200 rounded-lg overflow-hidden bg-white"
          >
            {/* Job Header */}
            <button
              onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
              className="w-full p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
            >
              {getStatusIcon(job.status)}

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <FileArchive className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  <span className="font-medium text-neutral-900 truncate">
                    {job.zip_file_name || 'Upload em massa'}
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {getStatusText(job)}
                  {job.failed_photos > 0 && job.status !== 'failed' && (
                    <span className="text-red-500 ml-1">
                      ({job.failed_photos} erro{job.failed_photos > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span>{formatTime(job.created_at)}</span>
                {expandedJobId === job.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Comment 6: Progress Bar for Active Jobs - include uploading with indeterminate state */}
            {['processing', 'extracting'].includes(job.status) && job.total_photos > 0 && (
              <div className="px-3 pb-2">
                <Progress value={getProgressPercent(job)} className="h-1.5" />
              </div>
            )}
            {job.status === 'uploading' && (
              <div className="px-3 pb-2">
                <Progress value={undefined} className="h-1.5 animate-pulse" />
              </div>
            )}

            {/* Expanded Details */}
            {expandedJobId === job.id && (
              <div className="px-3 pb-3 pt-1 border-t border-neutral-100 bg-neutral-50 text-sm">
                <div className="grid grid-cols-2 gap-2 text-neutral-600">
                  {job.zip_size_bytes && (
                    <div>
                      <span className="text-neutral-400">Tamanho:</span>{' '}
                      {formatBytes(job.zip_size_bytes)}
                    </div>
                  )}
                  {job.total_photos > 0 && (
                    <div>
                      <span className="text-neutral-400">Total:</span>{' '}
                      {job.total_photos} fotos
                    </div>
                  )}
                  {job.processed_photos > 0 && (
                    <div>
                      <span className="text-neutral-400">Processadas:</span>{' '}
                      <span className="text-green-600">{job.processed_photos}</span>
                    </div>
                  )}
                  {job.failed_photos > 0 && (
                    <div>
                      <span className="text-neutral-400">Falhas:</span>{' '}
                      <span className="text-red-600">{job.failed_photos}</span>
                    </div>
                  )}
                  {job.started_at && (
                    <div>
                      <span className="text-neutral-400">Iniciado:</span>{' '}
                      {formatTime(job.started_at)}
                    </div>
                  )}
                  {job.completed_at && (
                    <div>
                      <span className="text-neutral-400">Finalizado:</span>{' '}
                      {formatTime(job.completed_at)}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {job.error_message && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                    {job.error_message}
                  </div>
                )}

                {/* Error List */}
                {job.errors && job.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 hover:text-red-700 text-xs">
                      Ver {job.errors.length} erro{job.errors.length > 1 ? 's' : ''} de arquivo
                    </summary>
                    <ul className="mt-1 space-y-0.5 text-xs text-red-600 bg-red-50 p-2 rounded max-h-32 overflow-y-auto">
                      {job.errors.map((err, i) => (
                        <li key={i} className="truncate">
                          <span className="font-medium">{err.fileName}:</span> {err.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  {/* Retry Button for failed jobs */}
                  {job.status === 'failed' && job.zip_path && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRetry(job.id)
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Tentar novamente
                    </Button>
                  )}

                  {/* Cancel Button for stuck/active jobs */}
                  {['uploading', 'extracting', 'processing', 'pending'].includes(job.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleForceCancel(job.id)
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  )}

                  {/* Delete Button for finished jobs */}
                  {['completed', 'failed', 'cancelled'].includes(job.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-neutral-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteJob(job.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
