'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Upload, RefreshCw, X, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SelfieCaptureProps {
  onCapture: (file: File) => void
  onCancel: () => void
  isProcessing?: boolean
}

type CaptureMode = 'select' | 'camera' | 'preview'

export function SelfieCapture({ onCapture, onCancel, isProcessing }: SelfieCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('select')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStreamReady, setIsStreamReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setIsStreamReady(false)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsStreamReady(true)
        }
      }

      setMode('camera')
    } catch (error) {
      console.error('[SelfieCapture] Camera error:', error)
      setCameraError(
        'Não foi possível acessar a câmera. Verifique as permissões do navegador.'
      )
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreamReady(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Take photo from camera
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current frame
    context.drawImage(video, 0, 0)

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
        setCapturedFile(file)
        setCapturedImage(URL.createObjectURL(blob))
        setMode('preview')
        stopCamera()
      },
      'image/jpeg',
      0.9
    )
  }, [stopCamera])

  // Handle file upload
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setCameraError('Por favor, selecione um arquivo de imagem válido.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCameraError('A imagem deve ter no máximo 10MB.')
      return
    }

    setCapturedFile(file)
    setCapturedImage(URL.createObjectURL(file))
    setMode('preview')
  }, [])

  // Retake photo
  const retake = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    setCapturedFile(null)
    setMode('select')
  }, [capturedImage])

  // Confirm and submit
  const confirm = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile)
    }
  }, [capturedFile, onCapture])

  // Handle cancel
  const handleCancel = useCallback(() => {
    stopCamera()
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    onCancel()
  }, [stopCamera, capturedImage, onCancel])

  // Render mode selection
  if (mode === 'select') {
    return (
      <div className="flex flex-col items-center px-4 py-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Como você quer enviar sua foto?
        </h3>
        <p className="text-sm text-neutral-500 mb-8 text-center">
          Escolha tirar uma selfie agora ou enviar uma foto existente
        </p>

        {cameraError && (
          <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{cameraError}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-md">
          <Button
            onClick={startCamera}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Tirar selfie
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full h-14"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Enviar foto
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <Button
          onClick={handleCancel}
          variant="ghost"
          className="mt-6 text-neutral-500"
        >
          Cancelar
        </Button>
      </div>
    )
  }

  // Render camera view
  if (mode === 'camera') {
    return (
      <div className="flex flex-col items-center px-4 py-6">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden bg-black mb-4">
          {/* Video stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              // Mirror the video for selfie mode
              'scale-x-[-1]'
            )}
          />

          {/* Loading overlay */}
          {!isStreamReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {/* Face guide overlay */}
          {isStreamReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 rounded-[50%] border-2 border-white/50" />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture button */}
        <Button
          onClick={takePhoto}
          disabled={!isStreamReady}
          className="w-16 h-16 rounded-full bg-white border-4 border-orange-500 hover:bg-orange-50 disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-full bg-orange-500" />
        </Button>

        <p className="text-sm text-neutral-500 mt-4">
          Posicione seu rosto no centro e toque para capturar
        </p>
      </div>
    )
  }

  // Render preview
  if (mode === 'preview') {
    return (
      <div className="flex flex-col items-center px-4 py-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Sua foto está boa?
        </h3>

        <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 mb-6">
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Selfie capturada"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
              <p className="text-white text-sm">Analisando sua foto...</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full max-w-md">
          <Button
            onClick={retake}
            variant="outline"
            className="flex-1 h-12"
            disabled={isProcessing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tirar outra
          </Button>

          <Button
            onClick={confirm}
            className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Usar esta foto
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
