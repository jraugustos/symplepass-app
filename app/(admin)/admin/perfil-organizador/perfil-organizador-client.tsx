'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { OrganizerProfileForm } from '@/components/admin/organizer-profile-form'
import { OrganizerFormData, OrganizerProfileData } from '@/types'

export function PerfilOrganizadorClient() {
  const router = useRouter()
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizerProfile()
  }, [])

  const fetchOrganizerProfile = async () => {
    try {
      const response = await fetch('/api/user/organizer')

      if (response.status === 404) {
        // Profile doesn't exist yet
        setOrganizerProfile(null)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()

        if (response.status === 403) {
          // User doesn't have permission
          router.push('/admin/dashboard')
          return
        }

        throw new Error(data.error || 'Erro ao carregar perfil')
      }

      const data = await response.json()
      setOrganizerProfile(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: OrganizerFormData) => {
    const method = organizerProfile ? 'PATCH' : 'POST'
    const response = await fetch('/api/user/organizer', {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao salvar perfil')
    }

    // Refresh the profile data
    await fetchOrganizerProfile()
  }

  const handleDelete = async () => {
    const response = await fetch('/api/user/organizer', {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao excluir perfil')
    }

    // Redirect to dashboard after deletion
    router.push('/admin/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl">
        <OrganizerProfileForm
          organizerProfile={organizerProfile}
          organizerId={organizerProfile?.id}
          onSubmit={handleSubmit}
          onDelete={organizerProfile ? handleDelete : undefined}
        />
      </div>
    </>
  )
}
