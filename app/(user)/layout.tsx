import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AccountMobileNav } from '@/components/layout/account-mobile-nav'
import { getCurrentUser } from '@/lib/auth/actions'

const accountLinks = [
  { href: '/conta', label: 'Visão Geral' },
  { href: '/conta/eventos', label: 'Meus Eventos' },
  { href: '/conta/dados', label: 'Dados Pessoais' },
  { href: '/conta/configuracoes', label: 'Configurações' },
]

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userData = await getCurrentUser()

  if (!userData?.user) {
    redirect('/login?callbackUrl=/conta')
  }

  const { user, profile } = userData

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header variant="gradient" sticky />
      <AccountMobileNav links={accountLinks} userName={profile?.full_name || user.email} />

      <main className="flex-1">
        {children}
      </main>

      <Footer variant="light" />
    </div>
  )
}
