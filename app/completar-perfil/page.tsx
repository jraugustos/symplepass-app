import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isProfileComplete, sanitizeRedirectUrl } from '@/lib/auth/utils'
import CompleteProfileForm from './complete-profile-form'
import Link from 'next/link'
import Image from 'next/image'
import type { Profile, UserPreferences } from '@/types'

export const metadata: Metadata = {
  title: 'Completar Perfil - Symplepass',
  description: 'Complete seu perfil para começar a participar de eventos esportivos',
}

interface CompleteProfilePageProps {
  searchParams: {
    callbackUrl?: string
  }
}

export default async function CompleteProfilePage({ searchParams }: CompleteProfilePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not authenticated, redirect to login
  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  // Fetch preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single<UserPreferences>()

  // Sanitize callback URL to prevent open redirect
  const safeCallbackUrl = sanitizeRedirectUrl(searchParams.callbackUrl || '/conta')

  // If profile is already complete, redirect to callback or /conta
  if (isProfileComplete(profile, preferences)) {
    redirect(safeCallbackUrl)
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
      <div className="relative z-10 w-full max-w-lg">
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
          <p className="text-gray-200 text-lg">Complete seu perfil para continuar</p>
        </div>

        {/* Complete Profile Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 sm:p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Falta pouco!
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Precisamos de mais algumas informações para personalizar sua experiência.
          </p>

          <CompleteProfileForm
            userId={user.id}
            initialFullName={profile?.full_name || user.user_metadata?.full_name || ''}
            initialPhone={profile?.phone || ''}
            initialFavoriteSports={preferences?.favorite_sports || []}
            callbackUrl={safeCallbackUrl}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          Symplepass © 2025
        </p>
      </div>
    </div>
  )
}
