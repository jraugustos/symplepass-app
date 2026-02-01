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
    <div className="min-h-screen w-full bg-white lg:grid lg:grid-cols-12">
      {/* Left Column - Image/Branding */}
      <div className="hidden lg:sticky lg:top-0 lg:col-span-5 lg:flex lg:h-screen lg:flex-col lg:justify-between xl:col-span-4">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/login-image.jpeg"
            alt="Esportes"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-black/50 to-black/80" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="animate-fade-in">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/symplepass-white.svg"
                alt="Symplepass"
                width={180}
                height={42}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="space-y-6 animate-slide-up">
            <h1 className="text-4xl font-bold leading-tight">
              Sua jornada esportiva começa aqui.
            </h1>
            <p className="text-lg text-white/80">
              Personalize seu perfil para encontrar os melhores eventos e desafios para você.
            </p>
          </div>

          <div className="text-sm text-white/40">
            Symplepass © {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Right Column - Content */}
      <div className="col-span-12 flex flex-col bg-white lg:col-span-7 xl:col-span-8">
        {/* Mobile Header */}
        <div className="flex-none bg-neutral-900 p-4 lg:hidden">
          <Link href="/" className="inline-block">
            <Image
              src="/assets/symplepass-white.svg"
              alt="Symplepass"
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Content Area */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-12 lg:py-12">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">
                Falta pouco!
              </h2>
              <p className="mt-2 text-neutral-600">
                Precisamos de mais algumas informações para personalizar sua experiência.
              </p>
            </div>

            <div className="animate-fade-in-up delay-100">
              <CompleteProfileForm
                userId={user.id}
                initialFullName={profile?.full_name || user.user_metadata?.full_name || ''}
                initialPhone={profile?.phone || ''}
                initialFavoriteSports={preferences?.favorite_sports || []}
                callbackUrl={safeCallbackUrl}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
