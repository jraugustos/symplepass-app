'use client'

import { useState, useCallback, useEffect } from 'react'
import { Scan, Loader2, CheckCircle2, AlertCircle, XCircle, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  loadFaceDetectionModels,
  detectFaces,
  getModelLoadingStatus,
} from '@/lib/photos/face-detection'
import type { FaceProcessingStats } from '@/lib/data/face-embeddings'

interface FaceProcessingButtonProps {
  eventId: string
  photoCount: number
  className?: string
}

type ProcessingStatus = 'idle' | 'loading-models' | 'processing' | 'completed' | 'error' | 'cancelled'

interface ProcessingProgress {
  current: number
  total: number
  facesFound: number
  errors: number
}

export function FaceProcessingButton({ eventId, photoCount, className }: FaceProcessingButtonProps) {
  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [progress, setProgress] = useState<ProcessingProgress>({ current: 0, total: 0, facesFound: 0, errors: 0 })
  const [stats, setStats] = useState<FaceProcessingStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shouldCancel, setShouldCancel] = useState(false)

  // Fetch current stats on mount
  useEffect(() => {
    fetchStats()
  }, [eventId])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/face-processing/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('[FaceProcessing] Error fetching stats:', err)
    }
  }

  const startProcessing = useCallback(async () => {
    setStatus('loading-models')
    setError(null)
    setShouldCancel(false)
    setProgress({ current: 0, total: 0, facesFound: 0, errors: 0 })

    try {
      // Load face detection models
      await loadFaceDetectionModels()

      // Get pending photos
      const pendingResponse = await fetch(
        `/api/admin/events/${eventId}/face-processing/pending`
      )
      if (!pendingResponse.ok) {
        throw new Error('Falha ao buscar fotos pendentes')
      }

      const { photos: pendingPhotos } = await pendingResponse.json()

      if (pendingPhotos.length === 0) {
        setStatus('completed')
        setProgress((p) => ({ ...p, total: 0 }))
        await fetchStats()
        return
      }

      setStatus('processing')
      setProgress((p) => ({ ...p, total: pendingPhotos.length }))

      let facesFound = 0
      let errors = 0

      // Process photos one by one
      for (let i = 0; i < pendingPhotos.length; i++) {
        // Check for cancellation
        if (shouldCancel) {
          setStatus('cancelled')
          break
        }

        const photo = pendingPhotos[i]

        try {
          // Update status to processing
          await fetch('/api/photos/embeddings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: photo.id,
              status: 'processing',
            }),
          })

          // Detect faces in the photo
          const faces = await detectFaces(photo.thumbnailUrl)

          // Save embeddings
          await fetch('/api/photos/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: photo.id,
              eventId,
              embeddings: faces.map((f) => ({
                embedding: f.embedding,
                boundingBox: f.boundingBox,
                confidence: f.confidence,
              })),
            }),
          })

          facesFound += faces.length
        } catch (err) {
          console.error(`[FaceProcessing] Error processing photo ${photo.id}:`, err)
          errors++

          // Mark as failed
          await fetch('/api/photos/embeddings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: photo.id,
              status: 'failed',
              errorMessage: err instanceof Error ? err.message : 'Unknown error',
            }),
          })
        }

        setProgress({
          current: i + 1,
          total: pendingPhotos.length,
          facesFound,
          errors,
        })
      }

      if (!shouldCancel) {
        setStatus('completed')
      }

      // Refresh stats
      await fetchStats()
    } catch (err) {
      console.error('[FaceProcessing] Processing error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao processar fotos')
      setStatus('error')
    }
  }, [eventId, shouldCancel])

  const cancelProcessing = useCallback(() => {
    setShouldCancel(true)
  }, [])

  const resetAndRestart = useCallback(() => {
    setStatus('idle')
    setProgress({ current: 0, total: 0, facesFound: 0, errors: 0 })
    setError(null)
    setShouldCancel(false)
  }, [])

  // Calculate percentages for display
  const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const pendingCount = stats ? stats.pending_photos : photoCount
  const completedCount = stats?.completed_photos || 0
  const totalFaces = stats?.total_faces_found || 0

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <Scan className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900">Reconhecimento Facial</h3>
          <p className="text-sm text-neutral-500">Processe fotos para habilitar busca facial</p>
        </div>
      </div>

      {/* Stats */}
      {stats && status === 'idle' && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
            <p className="text-xs text-neutral-500">Processadas</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-neutral-500">Pendentes</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalFaces}</p>
            <p className="text-xs text-neutral-500">Rostos</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {(status === 'loading-models' || status === 'processing') && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600">
              {status === 'loading-models' ? 'Carregando modelos...' : `Processando foto ${progress.current} de ${progress.total}`}
            </span>
            <span className="font-medium text-neutral-900">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {status === 'processing' && (
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
              <span>{progress.facesFound} rostos detectados</span>
              {progress.errors > 0 && (
                <span className="text-red-500">{progress.errors} erros</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completed state */}
      {status === 'completed' && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Processamento concluído</p>
            <p className="text-xs text-green-700">
              {progress.facesFound} rostos detectados em {progress.current} fotos
            </p>
          </div>
        </div>
      )}

      {/* Cancelled state */}
      {status === 'cancelled' && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 rounded-lg">
          <XCircle className="w-5 h-5 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">Processamento cancelado</p>
            <p className="text-xs text-yellow-700">
              {progress.current} de {progress.total} fotos processadas
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Erro no processamento</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <Button
            onClick={startProcessing}
            disabled={pendingCount === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            {pendingCount === 0 ? 'Todas processadas' : `Processar ${pendingCount} fotos`}
          </Button>
        )}

        {(status === 'loading-models' || status === 'processing') && (
          <Button
            onClick={cancelProcessing}
            variant="outline"
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}

        {(status === 'completed' || status === 'error' || status === 'cancelled') && (
          <Button
            onClick={resetAndRestart}
            variant="outline"
            className="flex-1"
          >
            Voltar
          </Button>
        )}
      </div>

      {/* Info note */}
      {status === 'idle' && pendingCount > 0 && (
        <p className="text-xs text-neutral-400 mt-3">
          O processamento detecta rostos nas fotos para permitir busca por selfie.
          Pode levar alguns minutos dependendo da quantidade de fotos.
        </p>
      )}
    </div>
  )
}
