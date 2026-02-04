'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Search, Loader2, AlertCircle, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SelfieGuidelines } from './selfie-guidelines'
import { SelfieCapture } from './selfie-capture'
import {
  loadFaceDetectionModels,
  detectSingleFace,
  getModelLoadingStatus,
} from '@/lib/photos/face-detection'

type CaptureStep = 'guidelines' | 'capture' | 'processing' | 'error'

interface FaceSearchMatch {
  photoId: string
  similarity: number
}

interface SelfieCaptureModalProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onSearchResults: (matches: FaceSearchMatch[]) => void
}

export function SelfieCaptureModal({
  eventId,
  isOpen,
  onClose,
  onSearchResults,
}: SelfieCaptureModalProps) {
  const [step, setStep] = useState<CaptureStep>('guidelines')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('guidelines')
      setError(null)
    }
  }, [isOpen])

  // Preload models when modal opens
  useEffect(() => {
    if (!isOpen) return

    const status = getModelLoadingStatus()
    if (!status.isLoaded && !status.isLoading) {
      setIsLoadingModels(true)
      loadFaceDetectionModels()
        .then(() => setIsLoadingModels(false))
        .catch((err) => {
          console.error('[SelfieCaptureModal] Model loading error:', err)
          setIsLoadingModels(false)
        })
    }
  }, [isOpen])

  // Handle selfie capture
  const handleCapture = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setStep('processing')
      setError(null)

      try {
        // Ensure models are loaded
        await loadFaceDetectionModels()

        // Detect face in selfie
        const faceResult = await detectSingleFace(file)

        if (!faceResult) {
          setError('Nao foi possivel detectar um rosto na sua foto. Por favor, tente novamente com uma foto diferente.')
          setStep('error')
          return
        }

        // Search for matching faces in the event with higher threshold
        const response = await fetch('/api/photos/search/face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            embedding: faceResult.embedding,
            threshold: 0.85, // Very high threshold for validation
            limit: 50,
          }),
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar fotos')
        }

        const data = await response.json()
        const matches: FaceSearchMatch[] = (data.matches || []).map((m: any) => ({
          photoId: m.photoId,
          similarity: m.similarity,
        }))

        // Return results to parent - it will filter the gallery
        onSearchResults(matches)
      } catch (err) {
        console.error('[SelfieCaptureModal] Search error:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Ocorreu um erro ao processar sua foto. Por favor, tente novamente.'
        )
        setStep('error')
      } finally {
        setIsProcessing(false)
      }
    },
    [eventId, onSearchResults]
  )

  // Handle retry from error
  const handleRetry = useCallback(() => {
    setError(null)
    setStep('capture')
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden',
          'flex flex-col',
          'mx-4 sm:mx-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-neutral-900">Encontrar suas fotos</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading models overlay */}
          {isLoadingModels && step === 'guidelines' && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <p className="text-sm text-neutral-600">Carregando modelos de deteccao...</p>
            </div>
          )}

          {/* Step: Guidelines */}
          {step === 'guidelines' && (
            <SelfieGuidelines onContinue={() => setStep('capture')} />
          )}

          {/* Step: Capture */}
          {step === 'capture' && (
            <SelfieCapture
              onCapture={handleCapture}
              onCancel={() => setStep('guidelines')}
              isProcessing={isProcessing}
            />
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Procurando suas fotos...
              </h3>
              <p className="text-sm text-neutral-500 text-center px-4">
                Analisando {'>'}1000 fotos do evento. Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Algo deu errado
              </h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-xs">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
