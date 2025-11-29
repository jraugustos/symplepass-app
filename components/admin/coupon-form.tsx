'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CouponFormData } from '@/types'

const couponFormSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(20, 'Máximo 20 caracteres'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.preprocess(
    (val) => Number(val),
    z.number().positive('Valor deve ser positivo')
  ),
  event_id: z.string().nullable().optional(),
  valid_from: z.string().min(1, 'Data inicial é obrigatória'),
  valid_until: z.string().min(1, 'Data final é obrigatória'),
  max_uses: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().int().positive().nullable().optional()
  ),
  status: z.enum(['active', 'expired', 'disabled']),
})

interface CouponFormProps {
  initialData?: Partial<CouponFormData>
  onSubmit: (data: CouponFormData) => Promise<void>
  onCancel?: () => void
  events?: Array<{ id: string; title: string }>
}

export function CouponForm({
  initialData,
  onSubmit,
  onCancel,
  events = [],
}: CouponFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: initialData || {
      discount_type: 'percentage',
      status: 'active',
    },
  })

  const discountType = watch('discount_type')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Código do Cupom *
          </label>
          <Input
            {...register('code')}
            placeholder="PROMO2025"
            className="uppercase"
          />
          {errors.code && (
            <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>
          )}
        </div>

        {/* Discount Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Tipo de Desconto *
          </label>
          <select
            {...register('discount_type')}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="percentage">Porcentagem</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Valor do Desconto *
          </label>
          <Input
            type="number"
            step="0.01"
            {...register('discount_value')}
            placeholder={discountType === 'percentage' ? '0-100' : '0.00'}
          />
          {errors.discount_value && (
            <p className="text-sm text-red-600 mt-1">{errors.discount_value.message}</p>
          )}
        </div>

        {/* Event */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Evento (Opcional)
          </label>
          <select
            {...register('event_id')}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos os eventos</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        {/* Valid From */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Válido de *
          </label>
          <Input type="datetime-local" {...register('valid_from')} />
          {errors.valid_from && (
            <p className="text-sm text-red-600 mt-1">{errors.valid_from.message}</p>
          )}
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Válido até *
          </label>
          <Input type="datetime-local" {...register('valid_until')} />
          {errors.valid_until && (
            <p className="text-sm text-red-600 mt-1">{errors.valid_until.message}</p>
          )}
        </div>

        {/* Max Uses */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Máximo de Usos (Opcional)
          </label>
          <Input
            type="number"
            {...register('max_uses')}
            placeholder="Ilimitado"
          />
          {errors.max_uses && (
            <p className="text-sm text-red-600 mt-1">{errors.max_uses.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Status *
          </label>
          <select
            {...register('status')}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="active">Ativo</option>
            <option value="disabled">Desabilitado</option>
            <option value="expired">Expirado</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Cupom' : 'Criar Cupom'}
        </Button>
      </div>
    </form>
  )
}
