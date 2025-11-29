'use client'

import { formatCurrency, calculateLot } from '@/lib/utils'
import { Badge, StatusBadge } from '@/components/ui/badge'
import type { EventCategory, EventType, EventStatus } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventCategoriesProps {
  categories: EventCategory[]
  eventType: EventType
  eventStatus: EventStatus
  solidarityMessage?: string | null
  onCategorySelect: (category: EventCategory) => void
}

export default function EventCategories({ categories, eventType, eventStatus, solidarityMessage, onCategorySelect }: EventCategoriesProps) {
  const registrationsNotAllowed = eventStatus === 'published_no_registration'
  if (!categories || categories.length === 0) {
    return (
      <section id="categorias" className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">
            Categorias e lotes
          </h2>
          <p className="text-neutral-600">Categorias em breve.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="categorias" className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">
          Categorias e lotes
        </h2>

        {/* Horizontal list */}
        <div className="mt-4 space-y-2">
          {categories.map((category) => {
            // Se max_participants for null/undefined/0, o evento é ilimitado (nunca esgota)
            const isUnlimited = !category.max_participants || category.max_participants === 0
            const isSoldOut = !isUnlimited && category.max_participants !== null && category.current_participants >= category.max_participants
            const lot = calculateLot(category.current_participants, category.max_participants)
            const priceLabel =
              eventType === 'free'
                ? 'Evento gratuito'
                : eventType === 'solidarity'
                ? solidarityMessage || 'Evento solidário'
                : formatCurrency(category.price)

            return (
              <div
                key={category.id}
                className={`rounded-xl border border-neutral-200 p-4 font-geist ${
                  isSoldOut ? 'bg-neutral-50 opacity-70' : 'bg-white'
                }`}
              >
                {/* Layout flex */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left column: Info */}
                  <div className="min-w-0">
                    <p className="font-medium tracking-tight font-geist">{category.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Status da inscrição */}
                      {registrationsNotAllowed ? (
                        <StatusBadge status="warning">Inscrições em breve</StatusBadge>
                      ) : isSoldOut ? (
                        <StatusBadge status="soldout">Esgotado</StatusBadge>
                      ) : (
                        <StatusBadge status="available">Inscrições abertas</StatusBadge>
                      )}

                      {/* Tipo de evento */}
                      {eventType === 'free' && (
                        <Badge variant="success" size="sm">Gratuito</Badge>
                      )}

                      {/* Vagas limitadas */}
                      {!isUnlimited && !isSoldOut && category.max_participants && (
                        <Badge variant="warning" size="sm">
                          {category.max_participants - category.current_participants} vagas
                        </Badge>
                      )}

                      {/* Lote atual */}
                      {!isSoldOut && eventType === 'paid' && (
                        <Badge variant="neutral" size="sm">{lot}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Right column: Price + Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Price */}
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium font-geist">{priceLabel}</p>
                    </div>

                    {/* Button desktop */}
                    <button
                      onClick={() => onCategorySelect(category)}
                      disabled={isSoldOut || registrationsNotAllowed}
                      className={`hidden sm:inline-flex items-center justify-center gap-2 text-sm font-medium rounded-full px-4 py-2.5 whitespace-nowrap font-geist ${
                        isSoldOut || registrationsNotAllowed
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-0'
                          : 'text-white hover:opacity-95 border-0'
                      }`}
                      style={
                        isSoldOut || registrationsNotAllowed
                          ? undefined
                          : { backgroundImage: 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))' }
                      }
                    >
                      {registrationsNotAllowed ? 'Em breve' : 'Inscreva-se'}
                    </button>
                  </div>
                </div>

                {/* Button mobile (full width) */}
                <button
                  onClick={() => onCategorySelect(category)}
                  disabled={isSoldOut || registrationsNotAllowed}
                  className={`mt-3 sm:hidden w-full inline-flex items-center justify-center gap-2 text-sm font-medium rounded-full px-4 py-2.5 font-geist ${
                    isSoldOut || registrationsNotAllowed
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'text-white hover:opacity-95'
                  }`}
                  style={
                    isSoldOut || registrationsNotAllowed
                      ? undefined
                      : { backgroundImage: 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))' }
                  }
                >
                  {registrationsNotAllowed ? 'Em breve' : 'Inscreva-se'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
