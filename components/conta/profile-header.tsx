'use client'

import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import type { TabId } from '@/types'

type ProfileHeaderProps = {
  userName: string
  userEmail: string
  avatarUrl?: string | null
  isVerified?: boolean
  onTabChange: (tab: TabId) => void
}

export function ProfileHeader({
  userName,
  userEmail,
  avatarUrl,
  isVerified = false,
  onTabChange,
}: ProfileHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'Atleta'
  const initials = getInitials(userName || userEmail)

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={userName || userEmail}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-white/20"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold text-white ring-2 ring-white/20">
            {initials}
          </div>
        )}
        <div>
          <h1 className="font-geist text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Olá, {firstName} <span className="align-middle">👋</span>
          </h1>
          <p className="mt-1 font-geist text-white/80">
            Gerencie seus eventos, pagamentos e dados pessoais
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        {isVerified && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Conta verificada
          </span>
        )}
        <Button
          variant="secondary"
          className="rounded-full border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
          onClick={() => onTabChange('eventos')}
        >
          Meus eventos
        </Button>
      </div>
    </div>
  )
}

export default ProfileHeader
