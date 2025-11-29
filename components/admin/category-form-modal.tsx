'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CategoryFormData } from '@/types'
import { EventCategory, EventType } from '@/types/database.types'

const createCategoryFormSchema = (eventType?: EventType) => {
  return z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
    max_participants: z.number().int().min(0, 'Vagas devem ser maior ou igual a 0').optional().nullable(),
  }).refine(
    (data) => {
      // For free and solidarity events, price must be 0
      if (eventType === 'free' || eventType === 'solidarity') {
        return data.price === 0
      }
      return true
    },
    {
      message: eventType === 'solidarity'
        ? 'Categorias de eventos solidários devem ter preço R$ 0,00'
        : 'Categorias de eventos gratuitos devem ter preço R$ 0,00',
      path: ['price'],
    }
  )
}

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CategoryFormData) => Promise<void>
  category?: EventCategory
  eventType?: EventType
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  eventType,
}: CategoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFreeOrSolidarity = eventType === 'free' || eventType === 'solidarity'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(createCategoryFormSchema(eventType)),
    defaultValues: category
      ? {
        name: category.name,
        description: category.description || '',
        price: isFreeOrSolidarity ? 0 : category.price,
        max_participants: category.max_participants,
      }
      : {
        name: '',
        description: '',
        price: isFreeOrSolidarity ? 0 : 0,
        max_participants: null,
      },
  })

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      reset(
        category
          ? {
            name: category.name,
            description: category.description || '',
            price: isFreeOrSolidarity ? 0 : category.price,
            max_participants: category.max_participants,
          }
          : {
            name: '',
            description: '',
            price: isFreeOrSolidarity ? 0 : 0,
            max_participants: null,
          }
      )
      setError(null)

      // Force price to 0 for free/solidarity events
      if (isFreeOrSolidarity) {
        setValue('price', 0)
      }
    }
  }, [isOpen, category, reset, isFreeOrSolidarity, setValue])

  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(data)
      onClose()
      reset()
    } catch (err) {
      setError('Erro ao salvar categoria. Tente novamente.')
      console.error('Error submitting category:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>
          {category ? 'Editar Categoria' : 'Nova Categoria'}
        </ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Nome da Categoria *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: 5km, 10km, Caminhada"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Descrição opcional da categoria"
                {...register('description')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">
                Preço (R$) *
              </label>
              {isFreeOrSolidarity && (
                <div className="mb-2 rounded-lg bg-blue-50 border border-blue-200 p-2.5">
                  <p className="text-xs text-blue-800 font-medium">
                    ℹ️ {eventType === 'solidarity' ? 'Evento Solidário' : 'Evento Gratuito'} - Preço fixado em R$ 0,00
                  </p>
                </div>
              )}
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={isFreeOrSolidarity}
                {...register('price', { valueAsNumber: true })}
                error={errors.price?.message}
                className={isFreeOrSolidarity ? 'bg-neutral-100 cursor-not-allowed' : ''}
              />
              {isFreeOrSolidarity && (
                <p className="mt-1 text-xs text-neutral-500">
                  Categorias de eventos {eventType === 'solidarity' ? 'solidários' : 'gratuitos'} não podem ter valor
                </p>
              )}
            </div>

            <div>
              <label htmlFor="max_participants" className="block text-sm font-medium text-neutral-700 mb-1">
                Vagas Máximas
              </label>
              <Input
                id="max_participants"
                type="number"
                min="0"
                placeholder="Deixe vazio para ilimitado"
                {...register('max_participants', {
                  setValueAs: (v) => (v === '' || v === null ? null : parseInt(v)),
                })}
                error={errors.max_participants?.message}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Deixe em branco para vagas ilimitadas
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
