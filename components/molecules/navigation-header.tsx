'use client'

import * as React from 'react'
import { cn, getInitials } from '@/lib/utils'
import { Menu, X, User, LogOut, Settings, LayoutDashboard, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationVariant, UserRole } from '@/types'

export interface NavigationHeaderProps {
  variant?: NavigationVariant
  sticky?: boolean
  isAuthenticated?: boolean
  userName?: string
  userEmail?: string
  userRole?: UserRole
  onLogin?: () => void
  onLogout?: () => void
  onProfileClick?: (destination?: string) => void
  className?: string
}

export function NavigationHeader({
  variant = 'dark',
  sticky = true,
  isAuthenticated = false,
  userName,
  userEmail,
  userRole = 'user',
  onLogin = () => { },
  onLogout = () => { },
  onProfileClick = () => { },
  className,
}: NavigationHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)
  const handleLoginClick = React.useCallback(() => {
    onLogin?.()
  }, [onLogin])

  // Close mobile menu on resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close user menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const variantClasses = {
    dark: 'bg-neutral-900 text-white border-neutral-800',
    light: 'bg-white text-neutral-900 border-neutral-200',
    gradient: 'bg-gradient-primary text-white border-transparent',
    transparent: 'bg-transparent text-white border-transparent',
  }

  const linkClasses = {
    dark: 'text-neutral-300 hover:text-white',
    light: 'text-neutral-600 hover:text-neutral-900',
    gradient: 'text-white/90 hover:text-white',
    transparent: 'text-white/90 hover:text-white',
  }

  const mobileMenuClasses = {
    dark: 'bg-neutral-900 border-neutral-800',
    light: 'bg-white border-neutral-200',
    gradient: 'bg-gradient-primary border-transparent',
    transparent: 'bg-neutral-900/80 border-transparent backdrop-blur-md',
  }

  const navigationLinks = [
    { href: '/eventos', label: 'Eventos' },
    { href: '/modalidades', label: 'Modalidades' },
    { href: '/sobre', label: 'Sobre nós' },
    { href: '/clube-beneficios', label: 'Clube de benefícios' },
    { href: '/contato', label: 'Contato' },
  ]

  return (
    <header
      className={cn(
        'w-full transition-all duration-300 relative z-50',
        variant !== 'transparent' && 'border-b',
        sticky && 'sticky top-0',
        variantClasses[variant],
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2 font-geist font-bold text-xl"
            aria-label="Symplepass Home"
          >
            <img src="/assets/symplepass-white.svg" alt="Symplepass" className="h-6 w-auto" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'font-inter text-sm font-medium transition-colors duration-200',
                  linkClasses[variant]
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200',
                    variant === 'light'
                      ? 'hover:bg-neutral-100'
                      : 'hover:bg-white/10'
                  )}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                      variant === 'gradient' || variant === 'dark' || variant === 'transparent'
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-200 text-neutral-700'
                    )}
                  >
                    {getInitials(userName || '')}
                  </div>
                  <span className="text-sm font-medium font-inter max-w-[100px] truncate">
                    {userName || 'User'}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className={cn(
                      'absolute right-0 mt-2 w-64 rounded-xl shadow-custom-lg border overflow-hidden',
                      'animate-fade-in-up',
                      variant === 'light'
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-800 border-neutral-700'
                    )}
                    role="menu"
                  >
                    {/* User Info */}
                    <div
                      className={cn(
                        'px-4 py-3 border-b',
                        variant === 'light' ? 'border-neutral-200' : 'border-neutral-700'
                      )}
                    >
                      <p
                        className={cn(
                          'text-sm font-semibold font-geist',
                          variant === 'light' ? 'text-neutral-900' : 'text-white'
                        )}
                      >
                        {userName}
                      </p>
                      <p
                        className={cn(
                          'text-xs font-inter truncate',
                          variant === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                        )}
                      >
                        {userEmail}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Admin Panel (only for admin/organizer) */}
                      {(userRole === 'admin' || userRole === 'organizer') && (
                        <button
                          onClick={() => {
                            onProfileClick('/admin/dashboard')
                            setIsUserMenuOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors',
                            variant === 'light'
                              ? 'text-neutral-700 hover:bg-neutral-50'
                              : 'text-neutral-300 hover:bg-neutral-700'
                          )}
                          role="menuitem"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Painel Admin</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onProfileClick('/conta')
                          setIsUserMenuOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors',
                          variant === 'light'
                            ? 'text-neutral-700 hover:bg-neutral-50'
                            : 'text-neutral-300 hover:bg-neutral-700'
                        )}
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        <span>Meu Perfil</span>
                      </button>
                      <button
                        onClick={() => {
                          onProfileClick('/conta/eventos')
                          setIsUserMenuOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors',
                          variant === 'light'
                            ? 'text-neutral-700 hover:bg-neutral-50'
                            : 'text-neutral-300 hover:bg-neutral-700'
                        )}
                        role="menuitem"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Meus Ingressos</span>
                      </button>
                      <button
                        onClick={() => {
                          onProfileClick('/conta/configuracoes')
                          setIsUserMenuOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors',
                          variant === 'light'
                            ? 'text-neutral-700 hover:bg-neutral-50'
                            : 'text-neutral-300 hover:bg-neutral-700'
                        )}
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configurações</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div
                      className={cn(
                        'border-t',
                        variant === 'light' ? 'border-neutral-200' : 'border-neutral-700'
                      )}
                    >
                      <button
                        onClick={() => {
                          onLogout()
                          setIsUserMenuOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-sm font-inter transition-colors',
                          'text-error hover:bg-error/10'
                        )}
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant={variant === 'light' ? 'primary' : 'secondary'}
                size="default"
                onClick={handleLoginClick}
              >
                Entrar
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              'md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              variant === 'light' ? 'hover:bg-neutral-100' : 'hover:bg-white/10'
            )}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className={cn(
            'md:hidden fixed inset-0 top-16 z-40 overflow-y-auto border-t animate-slide-in-right',
            mobileMenuClasses[variant]
          )}
        >
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-1" aria-label="Mobile navigation">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-3 rounded-lg font-inter text-base font-medium transition-colors',
                  linkClasses[variant],
                  variant === 'light' ? 'hover:bg-neutral-50' : 'hover:bg-white/10'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            {/* Mobile Auth Section */}
            <div className="mt-6 pt-6 border-t border-current/10">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 mb-2">
                    <p
                      className={cn(
                        'text-sm font-semibold font-geist',
                        variant === 'light' ? 'text-neutral-900' : 'text-white'
                      )}
                    >
                      {userName}
                    </p>
                    <p
                      className={cn(
                        'text-xs font-inter truncate',
                        variant === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                      )}
                    >
                      {userEmail}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onProfileClick('/conta')
                      setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-base transition-colors',
                      linkClasses[variant],
                      variant === 'light' ? 'hover:bg-neutral-50' : 'hover:bg-white/10'
                    )}
                  >
                    <User className="w-5 h-5" />
                    <span>Meu Perfil</span>
                  </button>
                  {(userRole === 'admin' || userRole === 'organizer') && (
                    <button
                      onClick={() => {
                        onProfileClick('/admin/dashboard')
                        setIsMobileMenuOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-base transition-colors',
                        linkClasses[variant],
                        variant === 'light' ? 'hover:bg-neutral-50' : 'hover:bg-white/10'
                      )}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Painel Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onProfileClick('/conta/eventos')
                      setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-base transition-colors',
                      linkClasses[variant],
                      variant === 'light' ? 'hover:bg-neutral-50' : 'hover:bg-white/10'
                    )}
                  >
                    <Ticket className="w-5 h-5" />
                    <span>Meus Ingressos</span>
                  </button>
                  <button
                    onClick={() => {
                      onProfileClick('/conta/configuracoes')
                      setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-base transition-colors',
                      linkClasses[variant],
                      variant === 'light' ? 'hover:bg-neutral-50' : 'hover:bg-white/10'
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Configurações</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-base transition-colors mt-2',
                      'text-error hover:bg-error/10'
                    )}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <Button
                  variant={variant === 'light' ? 'primary' : 'secondary'}
                  size="lg"
                  onClick={handleLoginClick}
                  className="w-full"
                >
                  Entrar
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
