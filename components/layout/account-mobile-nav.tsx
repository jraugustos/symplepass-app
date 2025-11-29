'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountNavLink {
  href: string
  label: string
  count?: number
}

interface AccountMobileNavProps {
  links: AccountNavLink[]
  userName?: string
}

export function AccountMobileNav({ links, userName }: AccountMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => setIsOpen((previous) => !previous)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="md:hidden border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-neutral-500">Área do usuário</p>
          <p className="text-sm font-semibold text-neutral-900">{userName || 'Minha conta'}</p>
        </div>
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700"
        >
          Menu
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {isOpen && (
        <nav className="px-4 pb-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                )}
              >
                <span>{link.label}</span>
                {typeof link.count === 'number' && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {link.count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
