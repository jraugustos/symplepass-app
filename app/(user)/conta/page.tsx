import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { getUserRegistrations } from '@/lib/data/registrations'
import { getUserPreferences, getUserSessions } from '@/lib/data/user-preferences'
import { getUserPaymentHistory } from '@/lib/data/payments'
import type { Profile, UserPanelData, UserPanelStats } from '@/types'
import { UserPanelClient } from './user-panel-client'

export const metadata: Metadata = {
  title: 'Minha Conta - Symplepass',
}

export default async function ContaPage() {
  const userData = await getCurrentUser()

  if (!userData?.user) {
    redirect('/login')
  }

  const { user, profile } = userData

  const [registrationsResult, preferencesResult, paymentResult, sessionsResult] = await Promise.all([
    getUserRegistrations(user.id),
    getUserPreferences(user.id),
    getUserPaymentHistory(user.id, 40),
    getUserSessions(user.id),
  ])

  const registrations = registrationsResult.data ?? []
  const preferences = preferencesResult.data ?? {
    id: user.id,
    user_id: user.id,
    favorite_sports: [],
    notification_events: true,
    notification_promotions: true,
    theme: 'system',
    language: 'pt-BR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const paymentHistory = paymentResult.data ?? []
  const sessions = sessionsResult.data ?? []

  const resolvedProfile: Profile =
    profile ??
    ({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name || user.email || 'Atleta Symplepass',
      cpf: null,
      phone: null,
      date_of_birth: null,
      gender: null,
      role: 'user',
      avatar_url: null,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    } as Profile)

  const upcomingEventsCount = registrations.filter((registration) => {
    const eventDate = new Date(registration.event.start_date)
    return !isNaN(eventDate.getTime()) && eventDate > new Date()
  }).length

  const pendingPayments = registrations.filter((registration) => registration.payment_status === 'pending').length
  const paidEvents = registrations.filter((registration) => registration.payment_status === 'paid').length

  const stats: UserPanelStats = {
    totalRegistrations: registrations.length,
    upcomingEvents: upcomingEventsCount,
    pendingPayments,
    totalPaidEvents: paidEvents,
  }

  const panelData: UserPanelData = {
    profile: resolvedProfile,
    registrations,
    paymentHistory,
    preferences,
    sessions,
    stats,
  }

  return <UserPanelClient initialData={panelData} />
}
