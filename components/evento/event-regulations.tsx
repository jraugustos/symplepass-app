'use client'

import { ChevronDown, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { EventRegulation } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventRegulationsProps {
  regulations: EventRegulation[]
  regulationPdfUrl: string | null
  regulationUpdatedAt: string | null
}

export default function EventRegulations({
  regulations,
  regulationPdfUrl,
  regulationUpdatedAt,
}: EventRegulationsProps) {
  if (!regulations || regulations.length === 0) {
    return (
      <section id="regulamento" className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Regulamento</h2>
          <p className="text-neutral-600">Regulamento em breve.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="regulamento" className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Regulamento</h2>

        <div className="space-y-3">
          {regulations.map((regulation) => (
            <details
              key={regulation.id}
              className="group rounded-xl border border-neutral-200 bg-white p-4 open:shadow-sm transition-shadow"
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium text-neutral-900 list-none">
                <span>{regulation.title}</span>
                <ChevronDown className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {regulation.content}
              </div>
            </details>
          ))}
        </div>

        {/* PDF Download Card */}
        {regulationPdfUrl && (
          <div className="mt-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Documento completo</p>
                <h3 className="font-medium font-geist mt-1">Baixe o regulamento oficial</h3>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                asChild
              >
                <a href={regulationPdfUrl} download target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF
                </a>
              </Button>

              {regulationUpdatedAt && (
                <p className="text-xs text-neutral-500">
                  Última atualização: {formatDate(regulationUpdatedAt)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
