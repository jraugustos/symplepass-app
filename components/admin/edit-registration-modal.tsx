'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EventCategory } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { UpdateRegistrationData } from '@/lib/data/admin-registrations'
import { ShirtSizesByGender } from '@/types'

const DEFAULT_SHIRT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']
const ALL_SHIRT_GENDERS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'infantil', label: 'Infantil' },
]

const teamMemberSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  shirtSize: z.string().optional(),
  shirtGender: z.enum(['masculino', 'feminino', 'infantil']).optional().or(z.literal('')),
})

const editRegistrationSchema = z.object({
  category_id: z.string().uuid(),
  partner_name: z.string().optional(),
  partner_email: z.string().email('Email inválido').optional().or(z.literal('')),
  partner_cpf: z.string().optional(),
  partner_phone: z.string().optional(),
  partner_shirtSize: z.string().optional(),
  partner_shirtGender: z.enum(['masculino', 'feminino', 'infantil']).optional().or(z.literal('')),
  team_members: z.array(teamMemberSchema).optional(),
})

type EditRegistrationFormData = z.infer<typeof editRegistrationSchema>

interface EditRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: UpdateRegistrationData) => Promise<void>
  registration: any | null
  categories: EventCategory[]
  allowsPairRegistration: boolean
  allowsTeamRegistration?: boolean
  shirtSizesConfig?: ShirtSizesByGender | null
}

export function EditRegistrationModal({
  isOpen,
  onClose,
  onSave,
  registration,
  categories,
  allowsPairRegistration,
  allowsTeamRegistration,
  shirtSizesConfig,
}: EditRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('categoria')

  const hasPartner = registration?.registration_data?.partner || registration?.partner_name
  const hasTeamMembers = registration?.registration_data?.team_members && registration.registration_data.team_members.length > 0

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EditRegistrationFormData>({
    resolver: zodResolver(editRegistrationSchema),
    defaultValues: {
      category_id: registration?.category_id || '',
      partner_name: registration?.registration_data?.partner?.name || registration?.partner_name || '',
      partner_email: registration?.registration_data?.partner?.email || '',
      partner_cpf: registration?.registration_data?.partner?.cpf || '',
      partner_phone: registration?.registration_data?.partner?.phone || '',
      partner_shirtSize: registration?.registration_data?.partner?.shirtSize || '',
      partner_shirtGender: registration?.registration_data?.partner?.shirtGender || '',
      team_members: registration?.registration_data?.team_members || [],
    },
  })

  const { fields: teamMemberFields } = useFieldArray({
    control,
    name: 'team_members',
  })

  // Watch category_id and partner_shirtGender to get available options
  const selectedCategoryId = useWatch({ control, name: 'category_id' })
  const selectedShirtGender = useWatch({ control, name: 'partner_shirtGender' })
  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  // Get available shirt genders from selected category
  const availableShirtGenders = selectedCategory?.shirt_genders && selectedCategory.shirt_genders.length > 0
    ? ALL_SHIRT_GENDERS.filter(g => selectedCategory.shirt_genders?.includes(g.value as 'masculino' | 'feminino' | 'infantil'))
    : ALL_SHIRT_GENDERS

  // Get available shirt sizes based on selected gender and event config
  const getAvailableShirtSizes = (): string[] => {
    const rawGender = selectedShirtGender as string | undefined
    if (!rawGender || rawGender === '') {
      return DEFAULT_SHIRT_SIZES
    }

    const genderKey = rawGender as keyof ShirtSizesByGender
    if (shirtSizesConfig && shirtSizesConfig[genderKey] && shirtSizesConfig[genderKey].length > 0) {
      return shirtSizesConfig[genderKey]
    }

    return DEFAULT_SHIRT_SIZES
  }

  const availableShirtSizes = getAvailableShirtSizes()

  // Reset form when modal opens or registration changes
  useEffect(() => {
    if (isOpen && registration) {
      reset({
        category_id: registration.category_id || '',
        partner_name: registration.registration_data?.partner?.name || registration.partner_name || '',
        partner_email: registration.registration_data?.partner?.email || '',
        partner_cpf: registration.registration_data?.partner?.cpf || '',
        partner_phone: registration.registration_data?.partner?.phone || '',
        partner_shirtSize: registration.registration_data?.partner?.shirtSize || '',
        partner_shirtGender: registration.registration_data?.partner?.shirtGender || '',
        team_members: registration.registration_data?.team_members || [],
      })
      setError(null)
      setActiveTab('categoria')
    }
  }, [isOpen, registration, reset])

  const handleFormSubmit = async (data: EditRegistrationFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: UpdateRegistrationData = {}

      // Include category if it changed
      if (data.category_id !== registration?.category_id) {
        updateData.category_id = data.category_id
      }

      // Check for partner data changes - include all partner fields if any changed
      const currentPartner = registration?.registration_data?.partner
      const originalPartnerName = currentPartner?.name || registration?.partner_name || ''
      const originalPartnerEmail = currentPartner?.email || ''
      const originalPartnerCpf = currentPartner?.cpf || ''
      const originalPartnerPhone = currentPartner?.phone || ''
      const originalPartnerShirtSize = currentPartner?.shirtSize || ''
      const originalPartnerShirtGender = currentPartner?.shirtGender || ''

      const hasPartnerChanges =
        (data.partner_name || '') !== originalPartnerName ||
        (data.partner_email || '') !== originalPartnerEmail ||
        (data.partner_cpf || '') !== originalPartnerCpf ||
        (data.partner_phone || '') !== originalPartnerPhone ||
        (data.partner_shirtSize || '') !== originalPartnerShirtSize ||
        (data.partner_shirtGender || '') !== originalPartnerShirtGender

      // Always include partner_data if there are changes and partner has a name
      if (hasPartnerChanges) {
        if (data.partner_name) {
          // Convert empty string to undefined for shirtGender
          const rawShirtGender = data.partner_shirtGender as string | undefined
          const shirtGenderValue = rawShirtGender && rawShirtGender !== ''
            ? rawShirtGender as 'masculino' | 'feminino' | 'infantil'
            : undefined

          updateData.partner_data = {
            name: data.partner_name,
            email: data.partner_email || '',
            cpf: data.partner_cpf || '',
            phone: data.partner_phone || '',
            shirtSize: data.partner_shirtSize || '',
            shirtGender: shirtGenderValue,
          }
        }
      }

      // Check for team members changes
      const originalTeamMembers = registration?.registration_data?.team_members || []
      const currentTeamMembers = data.team_members || []

      // Compare team members to detect changes
      const hasTeamMembersChanges = (() => {
        if (originalTeamMembers.length !== currentTeamMembers.length) return true
        for (let i = 0; i < originalTeamMembers.length; i++) {
          const orig = originalTeamMembers[i]
          const curr = currentTeamMembers[i]
          if (
            (orig?.name || '') !== (curr?.name || '') ||
            (orig?.email || '') !== (curr?.email || '') ||
            (orig?.cpf || '') !== (curr?.cpf || '') ||
            (orig?.phone || '') !== (curr?.phone || '') ||
            (orig?.shirtSize || '') !== (curr?.shirtSize || '') ||
            (orig?.shirtGender || '') !== (curr?.shirtGender || '')
          ) {
            return true
          }
        }
        return false
      })()

      if (hasTeamMembersChanges && currentTeamMembers.length > 0) {
        updateData.team_members_data = currentTeamMembers.map((member) => {
          const rawGender = member.shirtGender as string | undefined
          const genderValue = rawGender && rawGender !== ''
            ? rawGender as 'masculino' | 'feminino' | 'infantil'
            : undefined

          return {
            name: member.name || '',
            email: member.email || '',
            cpf: member.cpf || '',
            phone: member.phone || '',
            shirtSize: member.shirtSize || '',
            shirtGender: genderValue,
          }
        })
      }

      // Only call API if there are changes
      if (Object.keys(updateData).length === 0) {
        onClose()
        return
      }

      await onSave(updateData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações. Tente novamente.')
      console.error('Error saving registration:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!registration) return null

  return (
    <Modal open={isOpen} onOpenChange={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Editar Inscrição</ModalTitle>
      </ModalHeader>

      <form
        className="flex flex-col max-h-[80vh]"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <ModalBody className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="categoria">Categoria</TabsTrigger>
              {allowsPairRegistration && (
                <TabsTrigger value="parceiro">Dados do Parceiro</TabsTrigger>
              )}
              {(allowsTeamRegistration || hasTeamMembers) && (
                <TabsTrigger value="equipe">Membros da Equipe</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="categoria">
              <div className="space-y-4">
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-neutral-700 mb-1">
                    Categoria
                  </label>
                  <Select
                    id="category_id"
                    {...register('category_id')}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} - {formatCurrency(category.price)}
                      </option>
                    ))}
                  </Select>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                  )}
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Alterar a categoria <strong>não</strong> recalcula o valor pago. O valor da inscrição permanecerá {formatCurrency(registration.amount_paid || 0)}.
                  </p>
                </div>
              </div>
            </TabsContent>

            {allowsPairRegistration && (
              <TabsContent value="parceiro">
                <div className="space-y-4">
                  {!hasPartner && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-sm text-blue-800">
                        Esta inscrição não possui parceiro cadastrado. Preencha os campos abaixo para adicionar um parceiro.
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="partner_name" className="block text-sm font-medium text-neutral-700 mb-1">
                      Nome do Parceiro {hasPartner && '*'}
                    </label>
                    <Input
                      id="partner_name"
                      type="text"
                      placeholder="Nome completo"
                      {...register('partner_name')}
                      error={errors.partner_name?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="partner_email" className="block text-sm font-medium text-neutral-700 mb-1">
                        Email
                      </label>
                      <Input
                        id="partner_email"
                        type="email"
                        placeholder="email@exemplo.com"
                        {...register('partner_email')}
                        error={errors.partner_email?.message}
                      />
                    </div>

                    <div>
                      <label htmlFor="partner_cpf" className="block text-sm font-medium text-neutral-700 mb-1">
                        CPF
                      </label>
                      <Input
                        id="partner_cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        {...register('partner_cpf')}
                        error={errors.partner_cpf?.message}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="partner_phone" className="block text-sm font-medium text-neutral-700 mb-1">
                        Telefone
                      </label>
                      <Input
                        id="partner_phone"
                        type="text"
                        placeholder="(00) 00000-0000"
                        {...register('partner_phone')}
                        error={errors.partner_phone?.message}
                      />
                    </div>

                    <div>
                      <label htmlFor="partner_shirtSize" className="block text-sm font-medium text-neutral-700 mb-1">
                        Tamanho da Camisa
                      </label>
                      <Select
                        id="partner_shirtSize"
                        {...register('partner_shirtSize')}
                      >
                        <option value="">Selecione</option>
                        {availableShirtSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </Select>
                      {selectedShirtGender && availableShirtSizes.length === 1 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Tamanho único disponível para este gênero
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="partner_shirtGender" className="block text-sm font-medium text-neutral-700 mb-1">
                      Gênero da Camisa
                    </label>
                    <Select
                      id="partner_shirtGender"
                      {...register('partner_shirtGender')}
                    >
                      <option value="">Selecione</option>
                      {availableShirtGenders.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </TabsContent>
            )}

            {(allowsTeamRegistration || hasTeamMembers) && (
              <TabsContent value="equipe">
                <div className="space-y-6">
                  {!hasTeamMembers && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-sm text-blue-800">
                        Esta inscrição não possui membros de equipe cadastrados.
                      </p>
                    </div>
                  )}

                  {teamMemberFields.map((field, index) => (
                    <div key={field.id} className="border border-neutral-200 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-neutral-900">
                        Membro {index + 2}
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Nome
                        </label>
                        <Input
                          type="text"
                          placeholder="Nome completo"
                          {...register(`team_members.${index}.name`)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Email
                          </label>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            {...register(`team_members.${index}.email`)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            CPF
                          </label>
                          <Input
                            type="text"
                            placeholder="000.000.000-00"
                            {...register(`team_members.${index}.cpf`)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Telefone
                          </label>
                          <Input
                            type="text"
                            placeholder="(00) 00000-0000"
                            {...register(`team_members.${index}.phone`)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Tamanho da Camisa
                          </label>
                          <Select
                            {...register(`team_members.${index}.shirtSize`)}
                          >
                            <option value="">Selecione</option>
                            {availableShirtSizes.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Gênero da Camisa
                        </label>
                        <Select
                          {...register(`team_members.${index}.shirtGender`)}
                        >
                          <option value="">Selecione</option>
                          {availableShirtGenders.map((gender) => (
                            <option key={gender.value} value={gender.value}>
                              {gender.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
