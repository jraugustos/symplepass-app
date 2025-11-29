'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventSectionWrapperProps {
  id: string
  title?: string
  children: React.ReactNode
  variant?: 'default' | 'with-reader' | 'full'
  className?: string
  showTitle?: boolean
}

export function EventSectionWrapper({
  id,
  title,
  children,
  variant = 'default',
  className,
  showTitle = true
}: EventSectionWrapperProps) {
  // Classes base para a seção
  const sectionClasses = cn(
    'scroll-mt-40',
    className
  )

  return (
    <section id={id} className={sectionClasses}>
      {title && showTitle && (
        <div className={`${EVENT_PAGE_CONTENT_CLASS} mb-8`}>
          <h2 className="text-3xl font-bold text-neutral-900">
            {title}
          </h2>
        </div>
      )}
      {children}
    </section>
  )
}

// Componente para o Reader lateral
interface EventReaderProps {
  event: {
    title: string
    start_date: string
    location: {
      city?: string
      state?: string
      venue?: string
    }
    categories?: Array<{
      name: string
      price: number
    }>
  }
  onRegisterClick: () => void
}

export function EventReader({ event, onRegisterClick }: EventReaderProps) {
  const lowestPrice = event.categories?.length
    ? Math.min(...event.categories.map(c => c.price))
    : 0

  return (
    <aside className="sticky top-24 h-fit">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Resumo do Evento
        </h3>

        <div className="space-y-4">
          {/* Data */}
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-orange-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-sm text-neutral-600">Data</p>
              <p className="text-sm font-medium text-neutral-900">
                {new Date(event.start_date).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Local */}
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-orange-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-neutral-600">Local</p>
              <p className="text-sm font-medium text-neutral-900">
                {event.location?.venue || 'Local a definir'}
              </p>
              {event.location?.city && event.location?.state && (
                <p className="text-xs text-neutral-500">
                  {event.location.city}, {event.location.state}
                </p>
              )}
            </div>
          </div>

          {/* Preço */}
          {lowestPrice > 0 && (
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-orange-500 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-neutral-600">A partir de</p>
                <p className="text-lg font-bold text-neutral-900">
                  R$ {lowestPrice.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botão de inscrição */}
        <button
          onClick={onRegisterClick}
          className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Inscreva-se Agora
        </button>

        {/* Info adicional */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 text-center">
            Vagas limitadas • Garanta já a sua!
          </p>
        </div>
      </div>
    </aside>
  )
}

// Layout com Reader
interface EventLayoutWithReaderProps {
  children: React.ReactNode
  reader: React.ReactNode
}

export function EventLayoutWithReader({ children, reader }: EventLayoutWithReaderProps) {
  return (
    <div className={EVENT_PAGE_CONTENT_CLASS}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
        <div className="min-w-0">
          {children}
        </div>
        <div className="hidden lg:block">
          {reader}
        </div>
      </div>
    </div>
  )
}
