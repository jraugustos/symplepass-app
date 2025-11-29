'use client'

import { useState } from 'react'
import { Download, Loader2, QrCode as QrCodeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRCodeDisplayProps {
  qrCodeDataUrl: string | null
  ticketCode: string
  registrationId: string
}

export function QRCodeDisplay({ qrCodeDataUrl, ticketCode, registrationId }: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!registrationId) return

    try {
      setIsDownloading(true)
      const response = await fetch(`/api/receipt/${registrationId}`)

      if (!response.ok) {
        throw new Error('Não foi possível gerar o comprovante.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `comprovante-${ticketCode.replace('#', '')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" data-animate>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">Seu QR Code de acesso</p>
        <p className="text-sm text-slate-500">Apresente no credenciamento ou mostre este comprovante na retirada do kit.</p>
      </div>
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="QR Code" className="h-40 w-40" />
          ) : (
            <QrCodeIcon className="h-16 w-16 text-slate-400" />
          )}
        </div>
        <p className="text-sm font-medium text-slate-500">Código: <span className="font-semibold text-slate-900">{ticketCode}</span></p>
        <Button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 py-6 text-base font-semibold"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando comprovante...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Baixar comprovante (PDF)
            </>
          )}
        </Button>
      </div>
    </section>
  )
}
