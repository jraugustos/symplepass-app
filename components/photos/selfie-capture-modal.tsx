'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Loader2, AlertCircle, Upload, Sun, User, ImageIcon, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  loadFaceDetectionModels,
  detectSingleFace,
  getModelLoadingStatus,
} from '@/lib/photos/face-detection'

type ModalStep = 'upload' | 'preview' | 'processing' | 'error'

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
  const [step, setStep] = useState<ModalStep>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('upload')
      setError(null)
      setSelectedImage(null)
      setSelectedFile(null)
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

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem valido.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no maximo 10MB.')
      return
    }

    setSelectedFile(file)
    setSelectedImage(URL.createObjectURL(file))
    setStep('preview')
    setError(null)
  }, [])

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setStep('processing')
    setError(null)

    try {
      // Step 1: Load models
      console.log('[SelfieCaptureModal] Loading models...')
      try {
        await loadFaceDetectionModels()
      } catch (modelErr) {
        console.error('[SelfieCaptureModal] Model loading failed:', modelErr)
        throw new Error('Erro ao carregar modelos de reconhecimento. Verifique sua conexao e tente novamente.')
      }

      // Step 2: Detect face
      console.log('[SelfieCaptureModal] Detecting face...')
      let faceResult
      try {
        faceResult = await detectSingleFace(selectedFile)
      } catch (detectErr) {
        console.error('[SelfieCaptureModal] Face detection failed:', detectErr)
        throw new Error('Erro ao processar sua foto. Tente com uma foto diferente.')
      }

      if (!faceResult) {
        setError('Nao foi possivel detectar um rosto na sua foto. Por favor, tente novamente com uma foto diferente.')
        setStep('error')
        return
      }

      // Step 3: Search API
      console.log('[SelfieCaptureModal] Searching faces...')
      const response = await fetch('/api/photos/search/face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          embedding: faceResult.embedding,
          threshold: 0.85,
          limit: 50,
        }),
      })

      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[SelfieCaptureModal] Invalid response type:', contentType, 'Status:', response.status)
        throw new Error('Erro de comunicacao com o servidor. Tente novamente.')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao buscar fotos')
      }

      const data = await response.json()
      const matches: FaceSearchMatch[] = (data.matches || []).map((m: any) => ({
        photoId: m.photoId,
        similarity: m.similarity,
      }))

      console.log('[SelfieCaptureModal] Found', matches.length, 'matches')
      // Return results to parent
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
  }, [eventId, selectedFile, onSearchResults])

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null)
    setSelectedImage(null)
    setSelectedFile(null)
    setStep('upload')
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle choose different photo
  const handleChooseDifferent = useCallback(() => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage)
    }
    setSelectedImage(null)
    setSelectedFile(null)
    setStep('upload')
    // Reset and trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [selectedImage])

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
          'relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden',
          'flex flex-col',
          'mx-4 sm:mx-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-500" />
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
          {isLoadingModels && step === 'upload' && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <p className="text-sm text-neutral-600">Preparando busca facial...</p>
            </div>
          )}

          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center px-6 py-8">
              {/* Instructions */}
              <p className="text-sm text-neutral-600 text-center mb-6">
                Envie uma foto sua para encontrarmos as fotos do evento em que voce aparece.
              </p>

              {/* Tips - compact */}
              <div className="flex gap-4 mb-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                    <Sun className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-xs text-neutral-500">Boa iluminacao</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                    <User className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-xs text-neutral-500">Rosto visivel</span>
                </div>
              </div>

              {/* Upload area */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed',
                  'border-orange-300 bg-orange-50 hover:bg-orange-100 hover:border-orange-400',
                  'flex flex-col items-center justify-center gap-3',
                  'transition-colors cursor-pointer'
                )}
              >
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-orange-600">Selecionar foto</p>
                  <p className="text-xs text-orange-500 mt-1">JPG, PNG ate 10MB</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="flex flex-col items-center px-6 py-6">
              <p className="text-sm text-neutral-600 mb-4">Sua foto esta boa?</p>

              {/* Image preview */}
              <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-6">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Foto selecionada"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  onClick={handleChooseDifferent}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Trocar
                </Button>

                <Button
                  onClick={handleSearch}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Procurando suas fotos...
              </h3>
              <p className="text-sm text-neutral-500 text-center">
                Analisando as fotos do evento. Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Algo deu errado
              </h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-xs">{error}</p>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-neutral-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRetry}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
