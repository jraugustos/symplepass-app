'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GripVertical, Trash2, Upload, X, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { photoUploadService } from '@/lib/photos/upload-service'
import type { EventPhoto } from '@/types/database.types'
import type { CreatePhotoData } from '@/lib/data/admin-photos'

interface PhotosUploadProps {
  eventId: string
  photos: EventPhoto[]
  onPhotoCreate: (data: Omit<CreatePhotoData, 'event_id'>) => Promise<any>
  onPhotoDelete: (photoId: string) => Promise<void>
  onPhotosReorder: (items: { id: string; display_order: number }[]) => Promise<void>
}

interface UploadProgress {
  current: number
  total: number
  fileName: string
}

export function PhotosUpload({
  eventId,
  photos,
  onPhotoCreate,
  onPhotoDelete,
  onPhotosReorder,
}: PhotosUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for optimistic UI during drag operations
  const [localPhotos, setLocalPhotos] = useState<EventPhoto[]>(photos)

  // Sync local state when props change (after server revalidation)
  useEffect(() => {
    setLocalPhotos(photos)
  }, [photos])

  const handleFilesSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Validate max files
    if (files.length > 50) {
      setError('Máximo de 50 fotos por upload')
      return
    }

    setUploading(true)
    setError(null)
    setProgress({ current: 0, total: files.length, fileName: '' })

    try {
      const result = await photoUploadService.uploadMultipleEventPhotos(
        Array.from(files),
        eventId,
        (current, total, fileName) => {
          setProgress({ current, total, fileName })
        }
      )

      // Save metadata to database for successful uploads
      for (const photo of result.successful) {
        try {
          await onPhotoCreate({
            original_path: photo.originalPath,
            watermarked_path: photo.watermarkedPath,
            thumbnail_path: photo.thumbnailPath,
            file_name: photo.fileName,
            file_size: photo.fileSize,
            width: photo.dimensions.width,
            height: photo.dimensions.height,
          })
        } catch (err) {
          console.error('Error saving photo metadata:', err)
        }
      }

      // Show errors if any failed
      if (result.failed.length > 0) {
        const errorMessages = result.failed.map(f => `${f.fileName}: ${f.error}`).join('\n')
        setError(`Algumas fotos falharam:\n${errorMessages}`)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload das fotos')
    } finally {
      setUploading(false)
      setProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [eventId, onPhotoCreate])

  const handleDelete = useCallback(async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    setDeletingId(photoId)
    try {
      await onPhotoDelete(photoId)
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir foto')
    } finally {
      setDeletingId(null)
    }
  }, [onPhotoDelete])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Update local state for immediate visual feedback
    const newPhotos = [...localPhotos]
    const draggedPhoto = newPhotos[draggedIndex]
    newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(index, 0, draggedPhoto)

    setLocalPhotos(newPhotos)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    // Only call API on drag end with the final order
    const reorderedItems = localPhotos.map((photo, idx) => ({
      id: photo.id,
      display_order: idx,
    }))

    setDraggedIndex(null)

    try {
      await onPhotosReorder(reorderedItems)
    } catch (err) {
      console.error('Error saving photo order:', err)
      // Revert to server state on error
      setLocalPhotos(photos)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFilesSelect(files)
    }
  }, [handleFilesSelect])

  const handleDragOverDropzone = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploading ? 'border-primary-300 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOverDropzone}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 mx-auto text-primary-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Processando foto {progress?.current || 0} de {progress?.total || 0}
              </p>
              <p className="text-xs text-neutral-500 mt-1">{progress?.fileName}</p>
              <div className="w-full bg-neutral-200 rounded-full h-2 mt-3">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${((progress?.current || 0) / (progress?.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto text-neutral-400" />
            <div className="mt-4">
              <label className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Clique para selecionar
                </span>
                <span className="text-neutral-600"> ou arraste fotos aqui</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleFilesSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              JPG, PNG ou WebP. Máximo 50MB por foto. Até 50 fotos por vez.
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Photos Grid */}
      {localPhotos.length > 0 ? (
        <div>
          <h4 className="font-medium mb-4">Fotos do Evento ({localPhotos.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {localPhotos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-move rounded-lg overflow-hidden border border-neutral-200 ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                {/* Thumbnail Image */}
                <div className="aspect-square bg-neutral-100">
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos-watermarked/${photo.thumbnail_path}`}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Overlay with Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded cursor-grab">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletingId === photo.id}
                    className="p-1.5 bg-red-500 hover:bg-red-600 rounded disabled:opacity-50"
                  >
                    {deletingId === photo.id ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            Arraste as fotos para reordenar. A ordem será mantida na galeria pública.
          </p>
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          <p>Nenhuma foto adicionada ainda.</p>
          <p className="text-sm mt-1">Faça upload das fotos do evento acima.</p>
        </div>
      )}
    </div>
  )
}
