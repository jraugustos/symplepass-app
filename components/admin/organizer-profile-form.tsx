'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { organizerProfileSchema } from '@/lib/auth/validation'
import { OrganizerFormData, OrganizerProfileData } from '@/types'
import { z } from 'zod'

interface OrganizerProfileFormProps {
  organizerProfile?: OrganizerProfileData | null
  onSubmit: (data: OrganizerFormData) => Promise<void>
  onDelete?: () => Promise<void>
  organizerId?: string
}

type FormData = z.infer<typeof organizerProfileSchema>

export function OrganizerProfileForm({
  organizerProfile,
  onSubmit,
  onDelete,
  organizerId,
}: OrganizerProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(organizerProfileSchema),
    defaultValues: {
      company_name: organizerProfile?.company_name || '',
      cnpj: organizerProfile?.cnpj || null,
      description: organizerProfile?.description || null,
      logo_url: organizerProfile?.logo_url || null,
      website: organizerProfile?.website || null,
      contact_email: organizerProfile?.contact_email || null,
    },
  })

  const logoUrl = watch('logo_url')

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await onSubmit(data)
      setSuccess('Perfil salvo com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    const confirmed = confirm(
      'Tem certeza que deseja excluir seu perfil de organizador? Esta ação não pode ser desfeita.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      await onDelete()
      setSuccess('Perfil excluído com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir perfil')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogoUpload = (url: string | null) => {
    setValue('logo_url', url ?? '')
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Perfil do Organizador</h2>
          <p className="text-sm text-neutral-600">
            Essas informações serão exibidas publicamente nos eventos que você criar quando a opção
            "Exibir informações do organizador" estiver ativada.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nome da Empresa <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('company_name')}
            placeholder="Nome da sua empresa ou organização"
            error={errors.company_name?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            CNPJ <span className="text-neutral-500 text-xs">(opcional)</span>
          </label>
          <Input
            {...register('cnpj')}
            placeholder="00.000.000/0000-00"
            onChange={(e) => {
              const formatted = formatCNPJ(e.target.value)
              setValue('cnpj', formatted || null)
            }}
            error={errors.cnpj?.message}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Formato: 00.000.000/0000-00
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Descrição <span className="text-neutral-500 text-xs">(opcional)</span>
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Conte um pouco sobre sua empresa e experiência na organização de eventos..."
            maxLength={1000}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Máximo de 1000 caracteres
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Logo <span className="text-neutral-500 text-xs">(opcional)</span>
          </label>
          <FileUpload
            bucket="organizer-assets"
            folder={organizerId || organizerProfile?.id || ''}
            disabled={!organizerId && !organizerProfile?.id}
            value={logoUrl || undefined}
            onChange={handleLogoUpload}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxSize={2 * 1024 * 1024}
          />
          {!organizerId && !organizerProfile?.id && (
            <p className="text-sm text-gray-600 mt-2">
              💡 Salve o perfil primeiro para habilitar o upload do logo
            </p>
          )}
          {errors.logo_url && (
            <p className="mt-1 text-sm text-red-600">{errors.logo_url.message}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Recomendado: imagem quadrada, máximo 2MB
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Website <span className="text-neutral-500 text-xs">(opcional)</span>
          </label>
          <Input
            {...register('website')}
            type="url"
            placeholder="https://www.seusite.com.br"
            error={errors.website?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Email de Contato <span className="text-neutral-500 text-xs">(opcional)</span>
          </label>
          <Input
            {...register('contact_email')}
            type="email"
            placeholder="contato@empresa.com.br"
            error={errors.contact_email?.message}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Email público para os participantes entrarem em contato
          </p>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
          <Button
            type="submit"
            disabled={isSubmitting || isDeleting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Perfil'
            )}
          </Button>

          {organizerProfile && onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Perfil'
              )}
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
