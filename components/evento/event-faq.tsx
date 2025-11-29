'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventFAQ } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventFAQProps {
  faqs: EventFAQ[]
}

export default function EventFAQ({ faqs }: EventFAQProps) {
  if (!faqs || faqs.length === 0) {
    return (
      <section id="faq" className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">
            Perguntas frequentes
          </h2>
          <p className="text-neutral-600">Nenhuma pergunta frequente disponível.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="faq" className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">
          Perguntas frequentes
        </h2>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group rounded-xl border border-neutral-200 bg-white p-4 open:shadow-sm transition-shadow"
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium text-neutral-900 list-none">
                <span>{faq.question}</span>
                <Plus className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-45" />
              </summary>
              <div className="mt-3 text-sm text-neutral-600 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
