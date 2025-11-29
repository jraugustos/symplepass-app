'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { updatePassword } from '@/lib/auth/actions'
import { updatePasswordSchema, validateFormData } from '@/lib/auth/validation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getPasswordStrength } from '@/lib/utils'

export default function UpdatePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null
  const passwordsMatch = confirmNewPassword && newPassword === confirmNewPassword

  // Redirect to login after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validate form data using helper
    const result = validateFormData(updatePasswordSchema, {
      newPassword,
      confirmNewPassword,
    })

    if (!result.success) {
      setError(Object.values(result.errors)[0])
      setFieldErrors(result.errors)
      return
    }

    setIsLoading(true)

    try {
      const result = await updatePassword(newPassword)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Update password error:', err)
      setError('Erro ao atualizar senha. Tente novamente.')
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
            Senha atualizada com sucesso!
          </h3>
          <p className="text-gray-600 text-sm">
            Sua senha foi alterada. Você será redirecionado para o login em instantes...
          </p>
        </div>
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

      {/* Update password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password input */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`pl-10 pr-10 ${fieldErrors.newPassword ? 'border-red-500' : ''}`}
              disabled={isLoading}
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
              aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>
          )}

          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                <div
                  className={`h-1 flex-1 rounded transition-colors ${
                    passwordStrength ? 'bg-red-500' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded transition-colors ${
                    passwordStrength === 'medium' || passwordStrength === 'strong'
                      ? 'bg-yellow-500'
                      : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded transition-colors ${
                    passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              </div>
              <p
                className={`text-xs ${
                  passwordStrength === 'weak'
                    ? 'text-red-600'
                    : passwordStrength === 'medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}
              >
                Senha{' '}
                {passwordStrength === 'weak'
                  ? 'fraca'
                  : passwordStrength === 'medium'
                  ? 'média'
                  : 'forte'}
              </p>
            </div>
          )}
        </div>

        {/* Confirm new password input */}
        <div>
          <label
            htmlFor="confirmNewPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Confirmar nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmNewPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={`pl-10 pr-10 ${
                fieldErrors.confirmNewPassword || (confirmNewPassword && !passwordsMatch)
                  ? 'border-red-500'
                  : passwordsMatch
                  ? 'border-green-500'
                  : ''
              }`}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {passwordsMatch && (
              <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          {fieldErrors.confirmNewPassword && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmNewPassword}</p>
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
              Atualizando...
            </>
          ) : (
            'Atualizar senha'
          )}
        </Button>
      </form>
    </div>
  )
}
