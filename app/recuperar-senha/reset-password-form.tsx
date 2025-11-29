'use client'

import { useState } from 'react'
import { Mail, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { resetPasswordForEmail } from '@/lib/auth/actions'
import { resetPasswordSchema, validateFormData } from '@/lib/auth/validation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validate form data using helper
    const result = validateFormData(resetPasswordSchema, { email })
    if (!result.success) {
      setError(Object.values(result.errors)[0])
      setFieldErrors(result.errors)
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPasswordForEmail(email)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Erro ao enviar email de recuperação. Tente novamente.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Email enviado com sucesso!
          </h3>
          <p className="text-gray-600 text-sm">
            Enviamos um link de recuperação para <strong>{email}</strong>.
            Verifique sua caixa de entrada e siga as instruções.
          </p>
        </div>
        <p className="text-xs text-gray-500 pt-4">
          Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Reset password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 ${fieldErrors.email ? 'border-red-500' : ''}`}
              disabled={isLoading}
              required
              autoFocus
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            'Enviar link de recuperação'
          )}
        </Button>
      </form>
    </div>
  )
}
