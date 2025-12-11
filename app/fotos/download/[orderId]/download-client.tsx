'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Download, Package, CheckCircle2, Loader2, AlertCircle, ImageIcon, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency, formatDateTimeLong, extractLocationString } from '@/lib/utils'
import type { PhotoDownloadPageData, PhotoDownloadResponse } from '@/types'

interface PhotoDownloadClientProps {
  data: PhotoDownloadPageData
}

type DownloadState = 'idle' | 'loading' | 'success' | 'error'

interface PhotoDownloadState {
  [photoId: string]: DownloadState
}

export function PhotoDownloadClient({ data }: PhotoDownloadClientProps) {
  const [downloadStates, setDownloadStates] = useState<PhotoDownloadState>({})
  const [batchState, setBatchState] = useState<DownloadState>('idle')
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const setPhotoState = useCallback((photoId: string, state: DownloadState) => {
    setDownloadStates((prev) => ({ ...prev, [photoId]: state }))
  }, [])

  // Download single photo
  const handleDownloadSingle = useCallback(
    async (photoId: string, fileName: string) => {
      setPhotoState(photoId, 'loading')
      setErrorMessage(null)

      try {
        const response = await fetch(
          `/api/photos/download?orderId=${data.order.id}&photoId=${photoId}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao gerar link de download')
        }

        const result: PhotoDownloadResponse = await response.json()

        if (!result.url) {
          throw new Error('URL de download não disponível')
        }

        // Trigger download
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.fileName || fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setPhotoState(photoId, 'success')
      } catch (error) {
        console.error('Download failed:', error)
        setPhotoState(photoId, 'error')
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao baixar foto')
      }
    },
    [data.order.id, setPhotoState]
  )

  // Download all photos as ZIP
  const handleDownloadAll = useCallback(async () => {
    setBatchState('loading')
    setBatchProgress({ current: 0, total: data.photos.length })
    setErrorMessage(null)

    try {
      // Fetch all signed URLs at once
      const photoIdsParam = data.photos.map((p) => p.id).join(',')
      const response = await fetch(
        `/api/photos/download?orderId=${data.order.id}&photoIds=${photoIdsParam}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar links de download')
      }

      const result: PhotoDownloadResponse = await response.json()

      if (!result.photos || result.photos.length === 0) {
        throw new Error('Nenhuma foto disponível para download')
      }

      // Dynamically import JSZip only when needed
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Download each photo and add to ZIP
      for (let i = 0; i < result.photos.length; i++) {
        const photo = result.photos[i]
        setBatchProgress({ current: i + 1, total: result.photos.length })

        try {
          const photoResponse = await fetch(photo.url)
          if (!photoResponse.ok) {
            console.warn(`Failed to fetch photo ${photo.id}`)
            continue
          }
          const blob = await photoResponse.blob()
          zip.file(photo.fileName, blob)
        } catch (err) {
          console.warn(`Failed to add photo ${photo.id} to ZIP:`, err)
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      })

      const zipFileName = `fotos-${data.event.slug || data.event.id}-${data.order.id.slice(0, 8)}.zip`
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = zipFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      setBatchState('success')
    } catch (error) {
      console.error('Batch download failed:', error)
      setBatchState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao baixar fotos')
    }
  }, [data])

  const eventDate = data.event.start_date
    ? formatDateTimeLong(data.event.start_date)
    : 'Data a definir'
  const eventLocation = data.event.location
    ? extractLocationString(data.event.location)
    : 'Local a definir'

  return (
    <div className="mt-[90px] space-y-6">
      {/* Order Summary Card */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle className="text-lg text-green-800">Pagamento confirmado</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Suas fotos estão prontas para download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Evento</p>
              <p className="mt-1 font-semibold text-slate-900">{data.event.title}</p>
              <p className="text-sm text-slate-600">{eventDate}</p>
              <p className="text-sm text-slate-600">{eventLocation}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pedido</p>
              <p className="mt-1 font-semibold text-slate-900">
                #{data.order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-sm text-slate-600">
                {data.photos.length} {data.photos.length === 1 ? 'foto' : 'fotos'}
                {data.order.package && ` - ${data.order.package.name}`}
              </p>
              <p className="text-sm font-medium text-green-700">
                {formatCurrency(data.order.total_amount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download All Button - only show when there are photos */}
      {data.photos.length > 0 && (
        <Card className="shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Package className="h-5 w-5" />
              <span>Baixar todas as fotos em um arquivo ZIP</span>
            </div>
            <Button
              size="lg"
              onClick={handleDownloadAll}
              disabled={batchState === 'loading'}
              className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 hover:from-orange-600 hover:to-orange-700"
            >
              {batchState === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Baixando {batchProgress.current}/{batchProgress.total}...
                </>
              ) : batchState === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Download concluído
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Baixar todas ({data.photos.length} fotos)
                </>
              )}
            </Button>
            {batchState === 'success' && (
              <Button variant="outline" size="sm" onClick={() => setBatchState('idle')}>
                Baixar novamente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Individual Photos Grid */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Suas fotos</CardTitle>
          <CardDescription>
            {data.photos.length > 0
              ? 'Clique em uma foto para baixar individualmente ou use o botão acima para baixar todas'
              : 'Nenhuma foto disponível no momento'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-amber-100 p-4">
                <HelpCircle className="h-8 w-8 text-amber-600" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-slate-700">
                  Nenhuma foto disponível para este pedido
                </p>
                <p className="max-w-md text-sm text-slate-500">
                  As fotos podem estar sendo processadas ou houve um problema com o pedido.
                  Entre em contato com o suporte para mais informações.
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/contato">Entrar em contato</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {data.photos.map((photo) => {
                const state = downloadStates[photo.id] || 'idle'
                return (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  >
                    {photo.thumbnailUrl ? (
                      <Image
                        src={photo.thumbnailUrl}
                        alt={photo.file_name}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      </div>
                    )}

                    {/* Overlay with download button */}
                    <div
                      className={cn(
                        'absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity',
                        state === 'idle' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                      )}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadSingle(photo.id, photo.file_name)}
                        disabled={state === 'loading'}
                        className="shadow-lg"
                      >
                        {state === 'loading' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : state === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : state === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <p className="text-center text-sm text-slate-500">
        Os links de download expiram em 1 hora. Se necessário, recarregue a página para gerar novos
        links.
      </p>
    </div>
  )
}
