'use client'

import { ChevronLeft, ChevronRight, Package, MapPin, CreditCard } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useKitCarousel } from '@/lib/hooks/use-kit-carousel'
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'
import type { EventKitItem } from '@/types/database.types'
import type { KitPickupInfo } from '@/types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventKitProps {
  kitItems: EventKitItem[]
  kitPickupInfo: KitPickupInfo | null
}

export default function EventKit({ kitItems, kitPickupInfo }: EventKitProps) {
  const { currentIndex, goToNext, goToPrevious } = useKitCarousel(kitItems.length)
  const { ref: listRef, hasIntersected } = useIntersectionObserver<HTMLUListElement>()

  if (!kitItems || kitItems.length === 0) {
    return (
      <section id="kit" className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Kit do atleta</h2>
          <p className="text-neutral-600">Informações do kit em breve.</p>
        </div>
      </section>
    )
  }

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Package
    return Icon
  }

  return (
    <section id="kit" className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Kit do atleta</h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Carousel */}
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {kitItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full flex-shrink-0 aspect-[16/11] bg-neutral-100"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                      {(() => {
                        const Icon = getIcon(item.icon)
                        return <Icon className="h-16 w-16 text-orange-500" />
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            {kitItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5 text-neutral-900" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5 text-neutral-900" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {kitItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {kitItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {}}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      index === currentIndex ? 'bg-amber-500' : 'bg-white/60'
                    )}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Kit Items List and Pickup Info */}
          <div className="space-y-6">
            {/* Items List */}
            <ul ref={listRef} className="space-y-3">
              {kitItems.map((item, index) => {
                const Icon = getIcon(item.icon)
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 transition-all duration-500',
                      hasIntersected
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                    )}
                    style={{
                      transitionDelay: hasIntersected ? `${index * 75}ms` : '0ms',
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="h-9 w-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium font-geist text-neutral-900">{item.name}</p>
                      <p className="text-sm text-neutral-600 mt-0.5">{item.description}</p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Kit Pickup Info */}
            {kitPickupInfo && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <h3 className="font-medium font-geist">Retirada do kit</h3>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Data:</span> {kitPickupInfo.dates}
                  </p>
                  <p>
                    <span className="font-medium">Horário:</span> {kitPickupInfo.hours}
                  </p>
                  <p>
                    <span className="font-medium">Local:</span> {kitPickupInfo.location}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ver rota
                  </button>
                  <button className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    O que levar
                  </button>
                </div>

                {kitPickupInfo.notes && (
                  <p className="text-xs text-neutral-500">{kitPickupInfo.notes}</p>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-500">
              * Itens podem variar conforme disponibilidade e categoria de inscrição.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
