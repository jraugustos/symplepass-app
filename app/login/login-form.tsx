'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth/actions'
import { loginSchema, validateFormData } from '@/lib/auth/validation'
import { redirectAfterLogin, getCallbackUrl, sanitizeRedirectUrl } from '@/lib/auth/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validate form data using helper
    const result = validateFormData(loginSchema, { email, password })
    if (!result.success) {
      setError(Object.values(result.errors)[0])
      setFieldErrors(result.errors)
      return
    }

    setIsLoading(true)

    try {
      const result = await signInWithEmail(email, password)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Get callback URL or redirect based on role
      const callbackUrl = getCallbackUrl(searchParams)
      const safeUrl = sanitizeRedirectUrl(callbackUrl)

      if (safeUrl !== '/conta') {
        router.push(safeUrl)
      } else {
        const role = result.data?.profile?.role
        router.push(redirectAfterLogin(role || 'user'))
      }

      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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
      console.error('Google login error:', err)
      setError('Erro ao fazer login com Google. Tente novamente.')
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

      {/* Login form */}
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
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600">Lembrar-me</span>
          </label>

          <Link
            href="/recuperar-senha"
            className="text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium"
          >
            Esqueci minha senha
          </Link>
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
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">ou continue com</span>
        </div>
      </div>

      {/* Google login button */}
      <Button
        type="button"
        onClick={handleGoogleLogin}
        variant="outline"
        className="w-full border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
        disabled={isLoading}
      >
        <FcGoogle className="w-5 h-5" />
        Continuar com Google
      </Button>
    </div>
  )
}
