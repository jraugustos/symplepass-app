'use client'

import * as React from 'react'
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { submitContactForm } from '@/app/actions/contact'

export function ContactForm() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const result = await submitContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      })

      if (result.success) {
        setStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        })
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Erro ao enviar mensagem')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-custom-xl border border-neutral-200 p-8 md:p-10 h-full">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold font-geist text-neutral-900 mb-2">
            Mensagem enviada!
          </h2>
          <p className="text-neutral-500 mb-8 font-inter max-w-md">
            Recebemos sua mensagem e retornaremos o mais breve possível.
          </p>
          <Button
            onClick={() => setStatus('idle')}
            variant="outline"
            className="h-12 px-6 rounded-xl"
          >
            Enviar outra mensagem
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-custom-xl border border-neutral-200 p-8 md:p-10 h-full">
      <h2 className="text-2xl font-bold font-geist text-neutral-900 mb-2">
        Envie uma mensagem
      </h2>
      <p className="text-neutral-500 mb-8 font-inter">
        Preencha o formulário abaixo e retornaremos o mais breve possível.
      </p>

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-neutral-700">
              Nome completo
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className="bg-neutral-50 border-neutral-200 h-12 focus:ring-orange-500/20 focus:border-orange-500"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="bg-neutral-50 border-neutral-200 h-12 focus:ring-orange-500/20 focus:border-orange-500"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
              Telefone (opcional)
            </label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className="bg-neutral-50 border-neutral-200 h-12 focus:ring-orange-500/20 focus:border-orange-500"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-neutral-700">
              Assunto
            </label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Como podemos ajudar?"
              className="bg-neutral-50 border-neutral-200 h-12 focus:ring-orange-500/20 focus:border-orange-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-neutral-700">
            Mensagem
          </label>
          <textarea
            id="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            className="flex w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
            placeholder="Escreva sua mensagem aqui..."
            required
            disabled={isLoading}
          />
        </div>

        <div className="pt-4 flex items-center justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar Mensagem
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
