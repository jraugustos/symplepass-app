'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { formatCurrency } from '@/lib/utils'
import type { EventKitItem, KitItemFormData } from '@/types'

interface KitItemsFormProps {
    eventId: string
    items: EventKitItem[]
    onCreate: (data: KitItemFormData) => Promise<void>
    onUpdate: (id: string, data: KitItemFormData) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onReorder: (items: { id: string; display_order: number }[]) => Promise<void>
}

const ICON_OPTIONS = [
    { value: 'shirt', label: 'Camiseta' },
    { value: 'barcode', label: 'Número de Peito' },
    { value: 'medal', label: 'Medalha' },
    { value: 'shopping-bag', label: 'Sacochila' },
    { value: 'droplets', label: 'Hidratação' },
    { value: 'book-open', label: 'Guia' },
    { value: 'gift', label: 'Brinde' },
    { value: 'package', label: 'Pacote' },
]

export function KitItemsForm({
    eventId,
    items,
    onCreate,
    onUpdate,
    onDelete,
    onReorder,
}: KitItemsFormProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<EventKitItem | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState<KitItemFormData>({
        name: '',
        description: '',
        icon: 'package',
        image_url: null,
        price: 0,
    })

    const handleOpenModal = (item?: EventKitItem) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                name: item.name,
                description: item.description,
                icon: item.icon,
                image_url: item.image_url,
                price: item.price || 0,
            })
        } else {
            setEditingItem(null)
            setFormData({
                name: '',
                description: '',
                icon: 'package',
                image_url: null,
                price: 0,
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingItem(null)
        setFormData({
            name: '',
            description: '',
            icon: 'package',
            image_url: null,
            price: 0,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            if (editingItem) {
                await onUpdate(editingItem.id, formData)
            } else {
                await onCreate(formData)
            }
            handleCloseModal()
        } catch (error) {
            console.error('Error saving kit item:', error)
            setError('Erro ao salvar item. Verifique se todos os campos estão preenchidos corretamente.')
        } finally {
            setIsSubmitting(false)
        }
    }


    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        const newItems = [...items]
        const draggedItem = newItems[draggedIndex]
        newItems.splice(draggedIndex, 1)
        newItems.splice(index, 0, draggedItem)

        // Update display_order
        const reorderedItems = newItems.map((item, idx) => ({
            id: item.id,
            display_order: idx,
        }))

        onReorder(reorderedItems)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="space-y-6">
            {/* Kit Items List */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-sm text-neutral-900">Itens Adicionados</h4>
                    <Button size="sm" onClick={() => handleOpenModal()} variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Item
                    </Button>
                </div>

                {items.length > 0 ? (
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-move hover:border-neutral-300 transition shadow-sm"
                            >
                                <GripVertical className="h-5 w-5 text-neutral-400" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm text-neutral-900">{item.name}</p>
                                            <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                                        </div>
                                        {/* Price display removed */}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleOpenModal(item)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                        <p className="text-neutral-500 text-sm">Nenhum item adicionado ao kit ainda.</p>
                        <Button variant="ghost" onClick={() => handleOpenModal()} className="mt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                            Adicionar primeiro item
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit Kit Item */}
            <Modal open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
                <ModalHeader onClose={handleCloseModal}>
                    <ModalTitle>
                        {editingItem ? 'Editar Item do Kit' : 'Adicionar Item do Kit'}
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
                                Nome do Item *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Camiseta oficial"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Descrição *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                                placeholder="Ex: Modelos masculino e feminino • Tamanhos P ao GG"
                                required
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                            />
                        </div>

                        {/* Price field removed as kit pricing is now category-based */}
                        {/* Kept internally as 0 for compatibility if needed */}

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Ícone *
                            </label>
                            <select
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                required
                            >
                                {ICON_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Imagem (opcional)
                            </label>
                            <FileUpload
                                bucket="kit-items"
                                folder={eventId}
                                value={formData.image_url ?? undefined}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                compress={true}
                                showPreview={true}
                                placeholder="Arraste uma imagem do item ou clique para selecionar"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        </div>
    )
}
