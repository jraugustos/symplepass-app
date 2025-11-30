import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Login - Symplepass',
  description: 'Acesse sua conta Symplepass e gerencie seus eventos esportivos',
}

interface LoginPageProps {
  searchParams: {
    callbackUrl?: string
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Check if user is already authenticated
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    // Respect the callbackUrl if provided, otherwise go to /conta
    const callbackUrl = searchParams.callbackUrl || '/conta'

    // Basic validation to prevent open redirect
    const isValidCallback = callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
    const redirectTo = isValidCallback ? callbackUrl : '/conta'

    redirect(redirectTo)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/login-image.jpeg"
          alt="Esportes"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 pt-8 animate-fade-in">
          <Link href="/" className="inline-block">
            <Image
              src="/assets/symplepass-white.svg"
              alt="Symplepass"
              width={200}
              height={48}
              className="h-12 w-auto mb-2"
              priority
            />
          </Link>
          <p className="text-gray-200 text-lg">Seu próximo desafio está a um clique.</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 sm:p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Acesse sua conta
          </h2>

          <LoginForm />

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Ainda não tem uma conta?{' '}
              <Link
                href="/cadastro"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          Symplepass © 2025
        </p>
      </div>
    </div>
  )
}