'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Pencil, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'
import type { PhotoPricingTier } from '@/types/database.types'
import type { PhotoPricingTierFormData } from '@/types'

interface PhotoPricingTiersFormProps {
  eventId: string
  tiers: PhotoPricingTier[]
  onCreate: (data: PhotoPricingTierFormData) => Promise<any>
  onUpdate: (tierId: string, data: PhotoPricingTierFormData) => Promise<any>
  onDelete: (tierId: string) => Promise<void>
  onReorder: (items: { id: string; display_order: number }[]) => Promise<void>
}

export function PhotoPricingTiersForm({
  eventId,
  tiers,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: PhotoPricingTiersFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<PhotoPricingTier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Local state for optimistic UI during drag operations
  const [localTiers, setLocalTiers] = useState<PhotoPricingTier[]>(tiers)

  // Sync local state when props change (after server revalidation)
  useEffect(() => {
    setLocalTiers(tiers)
  }, [tiers])

  // Form state
  const [formData, setFormData] = useState<PhotoPricingTierFormData>({
    min_quantity: 1,
    price_per_photo: 0,
  })

  const handleOpenModal = (tier?: PhotoPricingTier) => {
    if (tier) {
      setEditingTier(tier)
      setFormData({
        min_quantity: tier.min_quantity,
        price_per_photo: tier.price_per_photo,
      })
    } else {
      setEditingTier(null)
      // Suggest next min_quantity based on existing tiers
      const maxMinQty = localTiers.length > 0
        ? Math.max(...localTiers.map((t) => t.min_quantity))
        : 0
      setFormData({
        min_quantity: maxMinQty + 1,
        price_per_photo: 0,
      })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTier(null)
    setFormData({
      min_quantity: 1,
      price_per_photo: 0,
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate
    if (formData.min_quantity <= 0) {
      setError('Quantidade mínima deve ser maior que 0')
      setIsSubmitting(false)
      return
    }

    if (formData.price_per_photo < 0) {
      setError('Preço por foto não pode ser negativo')
      setIsSubmitting(false)
      return
    }

    // Check for duplicate min_quantity (excluding current tier when editing)
    const isDuplicate = localTiers.some(
      (t) => t.min_quantity === formData.min_quantity && t.id !== editingTier?.id
    )
    if (isDuplicate) {
      setError(`Já existe uma faixa de preço para ${formData.min_quantity}+ fotos`)
      setIsSubmitting(false)
      return
    }

    try {
      if (editingTier) {
        await onUpdate(editingTier.id, formData)
      } else {
        await onCreate(formData)
      }
      handleCloseModal()
    } catch (err) {
      console.error('Error saving pricing tier:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar faixa de preço')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (tierId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta faixa de preço?')) return

    setDeletingId(tierId)
    try {
      await onDelete(tierId)
    } catch (err) {
      console.error('Error deleting pricing tier:', err)
      alert(err instanceof Error ? err.message : 'Erro ao excluir faixa de preço')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Update local state for immediate visual feedback
    const newTiers = [...localTiers]
    const draggedTier = newTiers[draggedIndex]
    newTiers.splice(draggedIndex, 1)
    newTiers.splice(index, 0, draggedTier)

    setLocalTiers(newTiers)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    // Only call API on drag end with the final order
    const reorderedItems = localTiers.map((tier, idx) => ({
      id: tier.id,
      display_order: idx,
    }))

    setDraggedIndex(null)

    try {
      await onReorder(reorderedItems)
    } catch (err) {
      console.error('Error saving tier order:', err)
      // Revert to server state on error
      setLocalTiers(tiers)
    }
  }

  // Sort tiers by min_quantity for display
  const sortedTiers = [...localTiers].sort((a, b) => a.min_quantity - b.min_quantity)

  // Calculate discount percentage compared to base tier
  const getDiscountPercentage = (tier: PhotoPricingTier) => {
    const baseTier = sortedTiers.find((t) => t.min_quantity === 1)
    if (!baseTier || tier.min_quantity === 1) return null

    const basePrice = baseTier.price_per_photo
    const discount = ((basePrice - tier.price_per_photo) / basePrice) * 100
    return discount > 0 ? Math.round(discount) : null
  }

  // Get label for tier range
  const getTierLabel = (tier: PhotoPricingTier, index: number) => {
    const nextTier = sortedTiers[index + 1]
    if (!nextTier) {
      return `${tier.min_quantity}+ fotos`
    }
    if (tier.min_quantity === nextTier.min_quantity - 1) {
      return `${tier.min_quantity} ${tier.min_quantity === 1 ? 'foto' : 'fotos'}`
    }
    return `${tier.min_quantity}-${nextTier.min_quantity - 1} fotos`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">Faixas de Preço</h4>
          <p className="text-sm text-neutral-500 mt-1">
            Configure preços progressivos por quantidade de fotos
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Faixa
        </Button>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <p className="font-medium mb-1">Como funciona:</p>
        <p>
          Defina faixas de preço progressivas. O cliente paga o valor por foto multiplicado pela
          quantidade selecionada. Quanto mais fotos, menor o preço unitário.
        </p>
        <p className="mt-2 text-blue-600">
          <strong>Exemplo:</strong> 1+ foto = R$10 cada | 3+ fotos = R$7 cada | 10+ fotos = R$5 cada
        </p>
      </div>

      {/* Tiers List */}
      {sortedTiers.length > 0 ? (
        <div className="space-y-2">
          {sortedTiers.map((tier, index) => {
            const discount = getDiscountPercentage(tier)
            const label = getTierLabel(tier, index)

            return (
              <div
                key={tier.id}
                draggable
                onDragStart={() => handleDragStart(localTiers.indexOf(tier))}
                onDragOver={(e) => handleDragOver(e, localTiers.indexOf(tier))}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 bg-neutral-50 rounded-lg cursor-move hover:bg-neutral-100 transition ${
                  draggedIndex === localTiers.indexOf(tier) ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-5 w-5 text-neutral-400 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{tier.min_quantity}+ fotos</p>
                    {discount && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <TrendingDown className="h-3 w-3" />
                        {discount}% off
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">{label}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-primary-600">
                    {formatCurrency(tier.price_per_photo)}<span className="text-sm font-normal text-neutral-500">/foto</span>
                  </p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenModal(tier)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tier.id)}
                    disabled={deletingId === tier.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg">
          <p>Nenhuma faixa de preço configurada.</p>
          <p className="text-sm mt-1">Adicione faixas para permitir a compra de fotos.</p>
        </div>
      )}

      {/* Warning if no base tier (min_quantity = 1) */}
      {sortedTiers.length > 0 && !sortedTiers.some((t) => t.min_quantity === 1) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          <strong>Atenção:</strong> Adicione uma faixa para &quot;1+ foto&quot; para que os clientes possam comprar qualquer quantidade de fotos.
        </div>
      )}

      {/* Modal for Add/Edit Tier */}
      <Modal open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <ModalHeader onClose={handleCloseModal}>
          <ModalTitle>
            {editingTier ? 'Editar Faixa de Preço' : 'Adicionar Faixa de Preço'}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                A partir de quantas fotos? *
              </label>
              <Input
                type="number"
                value={formData.min_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })
                }
                min={1}
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                Ex: &quot;3&quot; significa que esta faixa se aplica para 3 ou mais fotos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Preço por foto (R$) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price_per_photo}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_photo: parseFloat(e.target.value) || 0 })
                }
                min={0}
                required
              />
            </div>

            {formData.min_quantity > 0 && formData.price_per_photo > 0 && (
              <div className="p-3 bg-primary-50 rounded-lg space-y-1">
                <p className="text-sm text-primary-700">
                  <strong>{formData.min_quantity}+</strong> fotos = <strong>{formatCurrency(formData.price_per_photo)}</strong>/foto
                </p>
                <p className="text-xs text-primary-600">
                  Ex: {formData.min_quantity} fotos = {formatCurrency(formData.min_quantity * formData.price_per_photo)} |{' '}
                  {formData.min_quantity + 2} fotos = {formatCurrency((formData.min_quantity + 2) * formData.price_per_photo)}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : editingTier ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  )
}
