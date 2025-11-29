import * as React from 'react'
import { cn } from '@/lib/utils'
import { Facebook, Instagram, Mail } from 'lucide-react'

export interface FooterProps {
  variant?: 'dark' | 'light'
  className?: string
}

export function Footer({ variant = 'dark', className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const variantClasses = {
    dark: 'bg-neutral-900 text-white border-neutral-800',
    light: 'bg-neutral-50 text-neutral-900 border-neutral-200',
  }

  const linkClasses = {
    dark: 'text-neutral-400 hover:text-white',
    light: 'text-neutral-600 hover:text-neutral-900',
  }

  const footerLinks = {
    platform: {
      title: 'Plataforma',
      links: [
        { label: 'Buscar Eventos', href: '/eventos' },
        { label: 'Categorias', href: '/categorias' },
        { label: 'Criar Evento', href: '/organizadores' },
        { label: 'Minha Conta', href: '/conta' },
      ],
    },
    company: {
      title: 'Empresa',
      links: [
        { label: 'Sobre Nós', href: '/sobre' },
        { label: 'Contato', href: '/contato' },
        { label: 'Clube de Benefícios', href: '/clube-beneficios' },
      ],
    },
    legal: {
      title: 'Legal',
      links: [
        { label: 'Termos de Uso', href: '/termos' },
        { label: 'Política de Privacidade', href: '/privacidade' },
        { label: 'Política de Reembolso', href: '/reembolso' },
      ],
    },
  }

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61584241477158', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/symplepass', label: 'Instagram' },
  ]

  return (
    <footer
      className={cn(
        'border-t',
        variantClasses[variant],
        className
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <a
                href="/"
                className="inline-flex items-center gap-2 font-geist font-bold text-xl mb-4"
                aria-label="Symplepass Home"
              >
                <img src="/assets/symplepass-color.svg" alt="Symplepass" className="h-7 w-auto" />
              </a>
              <p
                className={cn(
                  'text-sm mb-6 max-w-sm font-inter',
                  variant === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
                )}
              >
                A plataforma completa para descobrir, criar e gerenciar eventos incríveis.
                Conecte-se com experiências únicas.
              </p>

              {/* Newsletter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold font-geist mb-3">
                  Receba novidades
                </h4>
                <form className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        variant === 'dark' ? 'text-neutral-500' : 'text-neutral-400'
                      )}
                    />
                    <input
                      type="email"
                      placeholder="Seu e-mail"
                      className={cn(
                        'w-full pl-10 pr-3 py-2 rounded-lg border text-sm font-inter outline-none transition-colors',
                        'focus:ring-2 focus:ring-primary',
                        variant === 'dark'
                          ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500'
                          : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                      )}
                      aria-label="Email for newsletter"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-medium font-geist transition-all hover:shadow-custom-md hover:-translate-y-0.5"
                  >
                    Inscrever
                  </button>
                </form>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-sm font-semibold font-geist mb-4">
                {footerLinks.platform.title}
              </h4>
              <ul className="space-y-3">
                {footerLinks.platform.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={cn(
                        'text-sm font-inter transition-colors',
                        linkClasses[variant]
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-semibold font-geist mb-4">
                {footerLinks.company.title}
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={cn(
                        'text-sm font-inter transition-colors',
                        linkClasses[variant]
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-sm font-semibold font-geist mb-4">
                {footerLinks.legal.title}
              </h4>
              <ul className="space-y-3">
                {footerLinks.legal.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={cn(
                        'text-sm font-inter transition-colors',
                        linkClasses[variant]
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={cn(
            'py-6 border-t',
            variant === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
          )}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p
              className={cn(
                'text-sm font-inter',
                variant === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
              )}
            >
              © {currentYear} Symplepass. Todos os direitos reservados.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all',
                      variant === 'dark'
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
                        : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-600 hover:text-neutral-900'
                    )}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
