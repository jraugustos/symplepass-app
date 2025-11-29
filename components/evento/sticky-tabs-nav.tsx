'use client'

import { useRef } from 'react'
import { useStickyTabs } from '@/lib/hooks/use-sticky-tabs'
import { cn } from '@/lib/utils'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface Tab {
  id: string
  label: string
}

interface StickyTabsNavProps {
  tabs: Tab[]
  className?: string
  variant?: 'gradient' | 'light' // gradient = sobre fundo laranja, light = sobre fundo branco
}

export const DEFAULT_EVENT_TABS: Tab[] = [
  { id: 'sobre', label: 'Sobre' },
  { id: 'categorias', label: 'Categorias' },
  { id: 'kit', label: 'Kit' },
  { id: 'percurso', label: 'Percurso' },
  { id: 'regulamento', label: 'Regulamento' },
  { id: 'faq', label: 'FAQ' },
  { id: 'organizador', label: 'Organizador' },
]

export default function StickyTabsNav({ tabs, className, variant = 'gradient' }: StickyTabsNavProps) {
  const tabsRef = useRef<HTMLElement>(null)

  const { activeTab, isSticky, scrollToSection } = useStickyTabs(
    tabs.map(t => t.id),
    { headerOffset: 0, tabsOffset: 60, tabsRef }
  )

  // Para variant light, sempre usa o estilo claro
  const useLightStyle = variant === 'light' || isSticky

  return (
    <nav
      ref={tabsRef}
      className={cn(
        'sticky top-0 z-30 transition-all duration-300',
        useLightStyle
          ? 'bg-neutral-50 border-b border-neutral-200'
          : 'bg-transparent border-b border-white/20',
        className
      )}
      aria-label="Navegação de seções"
    >
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <div className="flex overflow-x-auto no-scrollbar pt-4 pb-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={cn(
                'inline-flex items-center whitespace-nowrap text-sm font-medium rounded-lg px-4 py-2 border font-inter transition-all',
                useLightStyle
                  ? activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-custom-sm'
                  : activeTab === tab.id
                    ? 'bg-white text-neutral-900 border-white'
                    : 'text-white/90 border-white/20 hover:text-white hover:bg-white/10'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
