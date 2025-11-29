'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import type { EventType, EventStatus } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface StickyCtaBarProps {
  minPrice: number | null
  eventType: EventType
  eventStatus: EventStatus
  solidarityMessage?: string | null
  onCtaClick: () => void
}

export default function StickyCtaBar({ minPrice, eventType, eventStatus, solidarityMessage, onCtaClick }: StickyCtaBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const registrationsNotAllowed = eventStatus === 'published_no_registration'

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (600px)
      const scrollY = window.scrollY
      const categoriesSection = document.getElementById('categorias')

      if (scrollY > 600) {
        // Hide if categories section is in viewport
        if (categoriesSection) {
          const rect = categoriesSection.getBoundingClientRect()
          const inView = rect.top >= 0 && rect.top <= window.innerHeight
          setIsVisible(!inView)
        } else {
          setIsVisible(true)
        }
      } else {
        setIsVisible(false)
      }
    }

    handleScroll() // Check initially
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-transform duration-300',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className={`${EVENT_PAGE_CONTENT_CLASS} py-3 flex items-center justify-between gap-4`}>
        <div className="flex-1">
          <p className="text-xs text-neutral-500">Inscrições a partir de</p>
          <p className="text-base font-medium text-neutral-900">
            {eventType === 'free'
              ? 'Evento gratuito'
              : eventType === 'solidarity'
              ? solidarityMessage || 'Evento solidário'
              : minPrice !== null
              ? formatCurrency(minPrice)
              : 'Consulte valores'}
          </p>
        </div>

        <Button
          onClick={onCtaClick}
          disabled={registrationsNotAllowed}
          className={registrationsNotAllowed
            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          }
        >
          {registrationsNotAllowed ? 'Em breve' : 'Inscreva-se'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
