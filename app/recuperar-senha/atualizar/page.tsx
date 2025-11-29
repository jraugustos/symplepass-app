import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import UpdatePasswordForm from './update-password-form'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Atualizar senha - Symplepass',
  description: 'Defina sua nova senha',
}

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Check if there's a token in the URL (Supabase adds it automatically)
  // The token is handled by Supabase client-side, but we can check for error or code
  const error = searchParams.error
  const code = searchParams.code

  // If there's an error or no code, redirect to reset password page
  if (error || !code) {
    redirect('/recuperar-senha?error=invalid_token')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2075"
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
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-white mb-2">Symplepass</h1>
          </Link>
          <p className="text-gray-200 text-lg">Seu próximo desafio está a um clique.</p>
        </div>

        {/* Update Password Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Defina sua nova senha
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Escolha uma senha forte para proteger sua conta.
          </p>

          <UpdatePasswordForm />
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          Symplepass © 2025
        </p>
      </div>
    </div>
  )
}
