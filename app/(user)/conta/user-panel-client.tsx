'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  EventsTab,
  OverviewTab,
  PaymentsTab,
  PersonalDataTab,
  PreferencesTab,
  ProfileHeader,
  SettingsTab,
  UserPanelTabs,
} from '@/components/conta'
import type {
  PaymentHistoryItem,
  Profile,
  RegistrationWithDetails,
  TabId,
  UserPanelData,
  UserPreferences,
} from '@/types'
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '@/lib/auth/actions'

const PAYMENT_PAGE_SIZE = 10

type UserPanelClientProps = {
  initialData: UserPanelData
}

export function UserPanelClient({ initialData }: UserPanelClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('visao-geral')
  const [profile, setProfile] = useState<Profile>(initialData.profile)
  const [registrations] = useState<RegistrationWithDetails[]>(initialData.registrations)
  const [preferences, setPreferences] = useState<UserPreferences>(initialData.preferences)
  const [sessions, setSessions] = useState(initialData.sessions)
  const [paymentHistory] = useState<PaymentHistoryItem[]>(initialData.paymentHistory)
  const [stats] = useState(initialData.stats)
  const [paymentPage, setPaymentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '') as TabId
    const validTabs: TabId[] = [
      'visao-geral',
      'eventos',
      'dados',
      'preferencias',
      'pagamentos',
      'config',
    ]
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeTab
    }
  }, [activeTab])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return registrations.filter((registration) => {
      const eventDate = new Date(registration.event.start_date)
      return !isNaN(eventDate.getTime()) && eventDate >= now
    })
  }, [registrations])

  const paymentsForPage = useMemo(() => {
    const start = (paymentPage - 1) * PAYMENT_PAGE_SIZE
    return paymentHistory.slice(start, start + PAYMENT_PAGE_SIZE)
  }, [paymentHistory, paymentPage])

  const totalPaymentPages = Math.max(
    1,
    Math.ceil(paymentHistory.length / PAYMENT_PAGE_SIZE)
  )

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
  }

  const handleProfileUpdate = async (data: Partial<Profile>) => {
    const payload = {
      full_name: data.full_name,
      phone: data.phone ?? undefined,
      date_of_birth: data.date_of_birth ?? undefined,
      gender: data.gender ?? undefined,
    }

    const result = await updateUserProfile(profile.id, payload)
    if (result?.data) {
      startTransition(() => {
        setProfile(result.data as Profile)
      })
    }
    return { error: result?.error }
  }

  const handlePreferencesUpdate = async (favoriteSports: UserPreferences['favorite_sports']) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favorite_sports: favoriteSports }),
        credentials: 'include',
      })

      const payload = await response.json()

      if (!response.ok) {
        return { error: payload?.error || 'Erro ao salvar preferências' }
      }

      setPreferences(payload.data)
      return { error: undefined }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error)
      return { error: 'Erro ao salvar preferências' }
    }
  }

  const handleSettingsUpdate = async (values: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include',
      })

      const payload = await response.json()
      if (!response.ok) {
        return { error: payload?.error || 'Erro ao atualizar configurações' }
      }
      setPreferences(payload.data)
      return { error: undefined }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      return { error: 'Erro ao atualizar configurações' }
    }
  }

  const handleSessionDelete = async (sessionId: string) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
        credentials: 'include',
      })

      const payload = await response.json()
      if (!response.ok) {
        return { error: payload?.error || 'Erro ao encerrar sessão' }
      }

      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      return { error: undefined }
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error)
      return { error: 'Erro ao encerrar sessão' }
    }
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const result = await updateUserPassword(currentPassword, newPassword)
    if (result?.error) {
      return { error: result.error }
    }
    return { error: undefined }
  }

  const handleAccountDeletion = async (password: string) => {
    const result = await deleteUserAccount(profile.id, password)
    if (result?.error) {
      return { error: result.error }
    }
    return { error: undefined }
  }

  return (
    <>
      {/* Orange Gradient Header with Profile and Tabs */}
      <header className="bg-gradient-to-br from-orange-400 to-orange-600">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-8 lg:px-8">
          <ProfileHeader
            userName={profile.full_name}
            userEmail={profile.email}
            avatarUrl={profile.avatar_url}
            isVerified
            onTabChange={handleTabChange}
          />

          <div className="mt-8">
            <UserPanelTabs activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="border-t border-neutral-200 bg-white">
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8" aria-live={isPending ? 'polite' : 'off'}>
          {activeTab === 'visao-geral' && (
            <OverviewTab
              stats={stats}
              upcomingEvents={upcomingEvents}
              preferences={preferences}
              onTabChange={handleTabChange}
            />
          )}

          {activeTab === 'eventos' && <EventsTab registrations={registrations} />}

          {activeTab === 'dados' && (
            <PersonalDataTab profile={profile} onUpdate={handleProfileUpdate} />
          )}

          {activeTab === 'preferencias' && (
            <PreferencesTab preferences={preferences} onUpdate={handlePreferencesUpdate} />
          )}

          {activeTab === 'pagamentos' && (
            <PaymentsTab
              paymentHistory={paymentsForPage}
              currentPage={paymentPage}
              totalPages={totalPaymentPages}
              onPageChange={setPaymentPage}
            />
          )}

          {activeTab === 'config' && (
            <SettingsTab
              preferences={preferences}
              sessions={sessions}
              onUpdate={handleSettingsUpdate}
              onDeleteSession={handleSessionDelete}
              onPasswordChange={handlePasswordChange}
              onDeleteAccount={handleAccountDeletion}
            />
          )}
        </section>
      </main>
    </>
  )
}


export default UserPanelClient
