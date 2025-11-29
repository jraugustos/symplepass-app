'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth/actions'
import { registerSchema, validateFormData } from '@/lib/auth/validation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getPasswordStrength } from '@/lib/utils'
import { FcGoogle } from 'react-icons/fc'

export default function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const passwordStrength = password ? getPasswordStrength(password) : null
  const passwordsMatch = confirmPassword && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Check terms acceptance
    if (!acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade')
      return
    }

    // Validate form data using helper
    const result = validateFormData(registerSchema, {
      fullName,
      email,
      password,
      confirmPassword,
    })

    if (!result.success) {
      setError(Object.values(result.errors)[0])
      setFieldErrors(result.errors)
      return
    }

    setIsLoading(true)

    try {
      const result = await signUpWithEmail(email, password, fullName)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Redirect to account page
      router.push('/conta')
      router.refresh()
    } catch (err) {
      console.error('Register error:', err)
      setError('Erro ao criar conta. Tente novamente.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result.data?.url) {
        window.location.href = result.data.url
      }
    } catch (err) {
      console.error('Google sign up error:', err)
      setError('Erro ao cadastrar com Google. Tente novamente.')
      setIsLoading(false)
    }
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

      {/* Register form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full name input */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="fullName"
              type="text"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`pl-10 ${fieldErrors.fullName ? 'border-red-500' : ''}`}
              disabled={isLoading}
              required
            />
          </div>
          {fieldErrors.fullName && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
          )}
        </div>

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
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}

          {/* Password strength indicator */}
          {password && (
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

        {/* Confirm password input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`pl-10 pr-10 ${
                fieldErrors.confirmPassword || (confirmPassword && !passwordsMatch)
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
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms acceptance */}
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
              disabled={isLoading}
              required
            />
            <span className="text-sm text-gray-600">
              Li e aceito os{' '}
              <Link href="/termos" className="text-orange-600 hover:text-orange-700 font-medium">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link
                href="/privacidade"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Política de Privacidade
              </Link>
            </span>
          </label>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          disabled={isLoading || !acceptedTerms}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">ou cadastre-se com</span>
        </div>
      </div>

      {/* Google sign up button */}
      <Button
        type="button"
        onClick={handleGoogleSignUp}
        variant="outline"
        className="w-full border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
        disabled={isLoading}
      >
        <FcGoogle className="w-5 h-5" />
        Cadastrar com Google
      </Button>
    </div>
  )
}
