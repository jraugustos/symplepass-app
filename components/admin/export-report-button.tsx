'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportFilters } from '@/types'

interface ExportReportButtonProps {
  filters: ReportFilters
}

export function ExportReportButton({ filters }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Build query params from filters
      const queryParams = new URLSearchParams()
      if (filters.start_date) queryParams.set('start_date', filters.start_date)
      if (filters.end_date) queryParams.set('end_date', filters.end_date)
      if (filters.event_id) queryParams.set('event_id', filters.event_id)
      if (filters.sport_type) queryParams.set('sport_type', filters.sport_type)
      if (filters.payment_status) queryParams.set('payment_status', filters.payment_status)

      // Fetch CSV from API
      const response = await fetch(`/api/admin/reports/export?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      // Get CSV blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = filenameMatch?.[1] || `relatorio-financeiro-${timestamp}.csv`

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting financial report:', error)
      alert('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      disabled={isExporting}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exportando...' : 'Exportar CSV'}
    </Button>
  )
}
