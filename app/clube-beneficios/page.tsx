import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/actions'
import { getActiveSubscription } from '@/lib/data/subscriptions'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ClubBenefitsPageClient } from './club-benefits-page-client'

export const metadata: Metadata = {
  title: 'Clube de Benefícios | Symplepass',
  description: 'Assine o Clube Symplepass por R$ 15/mês e tenha descontos exclusivos em eventos, estabelecimentos parceiros e muito mais.',
}

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function ClubeBeneficiosPage() {
  const userData = await getCurrentUser()

  let subscription = null
  if (userData?.user) {
    const { data } = await getActiveSubscription(userData.user.id)
    subscription = data
  }

  return (
    <div className="min-h-screen bg-white">
      <Header variant="gradient" />
      <ClubBenefitsPageClient
        isAuthenticated={!!userData?.user}
        subscription={subscription}
      />
      <Footer variant="light" />
    </div>
  )
}
