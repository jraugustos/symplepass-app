'use client'

import * as React from 'react'
import { Mail, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscribeToNewsletter } from '@/app/actions/newsletter'

interface NewsletterFormProps {
  variant?: 'dark' | 'light'
}

export function NewsletterForm({ variant = 'dark' }: NewsletterFormProps) {
  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setStatus('error')
      setMessage('Por favor, insira seu email')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const result = await subscribeToNewsletter({ email, source: 'footer' })

      if (result.success) {
        setStatus('success')
        setMessage('Inscrito com sucesso!')
        setEmail('')
        // Reset after 3 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(result.error || 'Erro ao inscrever')
      }
    } catch {
      setStatus('error')
      setMessage('Erro ao inscrever. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h4 className="text-sm font-semibold font-geist mb-3">Receba novidades</h4>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Mail
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              variant === 'dark' ? 'text-neutral-500' : 'text-neutral-400'
            )}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu e-mail"
            disabled={isLoading}
            className={cn(
              'w-full pl-10 pr-3 py-2 rounded-lg border text-sm font-inter outline-none transition-colors',
              'focus:ring-2 focus:ring-primary disabled:opacity-50',
              variant === 'dark'
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500'
                : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400',
              status === 'error' && 'border-red-500 focus:ring-red-500',
              status === 'success' && 'border-green-500 focus:ring-green-500'
            )}
            aria-label="Email for newsletter"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium font-geist transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            status === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-gradient-primary text-white hover:shadow-custom-md hover:-translate-y-0.5'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            'Inscrever'
          )}
        </button>
      </form>
      {message && (
        <p
          className={cn(
            'text-xs mt-2',
            status === 'error' ? 'text-red-500' : 'text-green-500'
          )}
        >
          {message}
        </p>
      )}
    </div>
  )
}
