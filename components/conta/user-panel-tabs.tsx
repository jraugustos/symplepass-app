'use client'

import { useRef } from 'react'
import {
  CreditCard,
  FlagTriangleRight,
  Heart,
  LayoutDashboard,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabId } from '@/types'

type UserPanelTabsProps = {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  className?: string
}

const TAB_CONFIG: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'eventos', label: 'Eventos', icon: FlagTriangleRight },
  { id: 'dados', label: 'Dados Pessoais', icon: User },
  { id: 'preferencias', label: 'Preferências', icon: Heart },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'config', label: 'Configurações', icon: Settings },
]

export function UserPanelTabs({ activeTab, onTabChange, className }: UserPanelTabsProps) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const handleTabChange = (tabId: TabId, focusIndex?: number) => {
    onTabChange(tabId)

    if (typeof window !== 'undefined') {
      window.location.hash = tabId
    }

    if (focusIndex !== undefined) {
      buttonsRef.current[focusIndex]?.focus()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = TAB_CONFIG.length

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const nextIndex = (index + 1) % total
      handleTabChange(TAB_CONFIG[nextIndex].id, nextIndex)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const previousIndex = (index - 1 + total) % total
      handleTabChange(TAB_CONFIG[previousIndex].id, previousIndex)
    }
  }

  return (
    <div
      className={cn(
        'flex w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 no-scrollbar',
        className
      )}
      role="tablist"
      aria-label="Navegação do painel do usuário"
    >
      {TAB_CONFIG.map((tab, index) => {
        const Icon = tab.icon
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            ref={(element) => {
              buttonsRef.current[index] = element
            }}
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 font-geist focus-visible:outline focus-visible:outline-white/70',
              isActive
                ? 'bg-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-white/20'
                : 'text-white/80 border border-transparent hover:text-white hover:bg-white/10'
            )}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default UserPanelTabs
