'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'
import type { PhotoPackage } from '@/types/database.types'
import type { PhotoPackageFormData } from '@/types'

interface PhotoPackagesFormProps {
  eventId: string
  packages: PhotoPackage[]
  onCreate: (data: PhotoPackageFormData) => Promise<any>
  onUpdate: (packageId: string, data: PhotoPackageFormData) => Promise<any>
  onDelete: (packageId: string) => Promise<void>
  onReorder: (items: { id: string; display_order: number }[]) => Promise<void>
}

export function PhotoPackagesForm({
  eventId,
  packages,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: PhotoPackagesFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PhotoPackage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Local state for optimistic UI during drag operations
  const [localPackages, setLocalPackages] = useState<PhotoPackage[]>(packages)

  // Sync local state when props change (after server revalidation)
  useEffect(() => {
    setLocalPackages(packages)
  }, [packages])

  // Form state
  const [formData, setFormData] = useState<PhotoPackageFormData>({
    name: '',
    quantity: 1,
    price: 0,
  })

  const handleOpenModal = (pkg?: PhotoPackage) => {
    if (pkg) {
      setEditingPackage(pkg)
      setFormData({
        name: pkg.name,
        quantity: pkg.quantity,
        price: pkg.price,
      })
    } else {
      setEditingPackage(null)
      setFormData({
        name: '',
        quantity: 1,
        price: 0,
      })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPackage(null)
    setFormData({
      name: '',
      quantity: 1,
      price: 0,
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate
    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      setIsSubmitting(false)
      return
    }

    if (formData.quantity <= 0) {
      setError('Quantidade deve ser maior que 0')
      setIsSubmitting(false)
      return
    }

    if (formData.price < 0) {
      setError('Preço não pode ser negativo')
      setIsSubmitting(false)
      return
    }

    try {
      if (editingPackage) {
        await onUpdate(editingPackage.id, formData)
      } else {
        await onCreate(formData)
      }
      handleCloseModal()
    } catch (err) {
      console.error('Error saving package:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar pacote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (packageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return

    setDeletingId(packageId)
    try {
      await onDelete(packageId)
    } catch (err) {
      console.error('Error deleting package:', err)
      alert(err instanceof Error ? err.message : 'Erro ao excluir pacote')
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
    const newPackages = [...localPackages]
    const draggedPackage = newPackages[draggedIndex]
    newPackages.splice(draggedIndex, 1)
    newPackages.splice(index, 0, draggedPackage)

    setLocalPackages(newPackages)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    // Only call API on drag end with the final order
    const reorderedItems = localPackages.map((pkg, idx) => ({
      id: pkg.id,
      display_order: idx,
    }))

    setDraggedIndex(null)

    try {
      await onReorder(reorderedItems)
    } catch (err) {
      console.error('Error saving package order:', err)
      // Revert to server state on error
      setLocalPackages(packages)
    }
  }

  const pricePerPhoto = formData.quantity > 0 ? formData.price / formData.quantity : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">Pacotes de Preços</h4>
          <p className="text-sm text-neutral-500 mt-1">
            Configure os pacotes de fotos disponíveis para compra
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Pacote
        </Button>
      </div>

      {/* Packages List */}
      {localPackages.length > 0 ? (
        <div className="space-y-2">
          {localPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-4 bg-neutral-50 rounded-lg cursor-move hover:bg-neutral-100 transition ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="h-5 w-5 text-neutral-400 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{pkg.name}</p>
                <p className="text-sm text-neutral-600">
                  {pkg.quantity} {pkg.quantity === 1 ? 'foto' : 'fotos'} · {formatCurrency(pkg.price / pkg.quantity)}/foto
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-primary-600">{formatCurrency(pkg.price)}</p>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenModal(pkg)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(pkg.id)}
                  disabled={deletingId === pkg.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg">
          <p>Nenhum pacote configurado.</p>
          <p className="text-sm mt-1">Adicione pacotes para permitir a compra de fotos.</p>
        </div>
      )}

      {/* Modal for Add/Edit Package */}
      <Modal open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <ModalHeader onClose={handleCloseModal}>
          <ModalTitle>
            {editingPackage ? 'Editar Pacote' : 'Adicionar Pacote'}
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
                Nome do Pacote *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pacote 3 Fotos"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Quantidade de Fotos *
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                min={1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Preço (R$) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min={0}
                required
              />
            </div>

            {formData.quantity > 0 && formData.price > 0 && (
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700">
                  Preço por foto: <strong>{formatCurrency(pricePerPhoto)}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : editingPackage ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  )
}
