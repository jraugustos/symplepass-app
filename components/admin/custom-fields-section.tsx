'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import type { EventCustomField } from '@/types/database.types'
import type { EventCustomFieldFormData } from '@/types'

interface CustomFieldsSectionProps {
    eventId: string
    customFields: EventCustomField[]
    onCreate: (data: EventCustomFieldFormData) => Promise<void>
    onUpdate: (id: string, data: EventCustomFieldFormData) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

const FIELD_TYPE_LABELS: Record<string, string> = {
    text: 'Texto',
    number: 'Número',
    select: 'Seleção',
    checkbox: 'Checkbox',
}

function generateSlug(label: string): string {
    return label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
}

export function CustomFieldsSection({
    eventId,
    customFields,
    onCreate,
    onUpdate,
    onDelete,
}: CustomFieldsSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingField, setEditingField] = useState<EventCustomField | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<EventCustomFieldFormData>({
        name: '',
        label: '',
        field_type: 'text',
        is_required: false,
        options: null,
        placeholder: null,
    })

    const [optionsText, setOptionsText] = useState('')

    const handleOpenModal = (field?: EventCustomField) => {
        if (field) {
            setEditingField(field)
            setFormData({
                name: field.name,
                label: field.label,
                field_type: field.field_type,
                is_required: field.is_required,
                options: field.options,
                placeholder: field.placeholder,
            })
            setOptionsText(field.options?.join('\n') || '')
        } else {
            setEditingField(null)
            setFormData({
                name: '',
                label: '',
                field_type: 'text',
                is_required: false,
                options: null,
                placeholder: null,
            })
            setOptionsText('')
        }
        setError(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingField(null)
        setError(null)
    }

    const handleLabelChange = (label: string) => {
        const newData = { ...formData, label }
        // Auto-generate name from label when creating (not editing)
        if (!editingField) {
            newData.name = generateSlug(label)
        }
        setFormData(newData)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            const submitData: EventCustomFieldFormData = {
                ...formData,
                options: formData.field_type === 'select'
                    ? optionsText.split('\n').map(o => o.trim()).filter(Boolean)
                    : null,
            }

            if (!submitData.label.trim()) {
                setError('O label é obrigatório')
                return
            }

            if (!submitData.name.trim()) {
                submitData.name = generateSlug(submitData.label)
            }

            if (submitData.field_type === 'select' && (!submitData.options || submitData.options.length < 2)) {
                setError('Campos do tipo Seleção precisam de pelo menos 2 opções')
                return
            }

            if (editingField) {
                await onUpdate(editingField.id, submitData)
            } else {
                await onCreate(submitData)
            }
            handleCloseModal()
        } catch (err) {
            console.error('Error saving custom field:', err)
            setError('Erro ao salvar campo personalizado.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (fieldId: string, fieldLabel: string) => {
        const confirmed = window.confirm(
            `Tem certeza que deseja excluir o campo "${fieldLabel}"?\n\nDados já preenchidos por inscritos para este campo NÃO serão removidos.`
        )
        if (!confirmed) return
        await onDelete(fieldId)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium">Campos Personalizados</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                        Adicione campos extras ao formulário de inscrição (ex: equipe, número do peito).
                    </p>
                </div>
                <Button size="sm" onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                </Button>
            </div>

            {customFields.length > 0 ? (
                <div className="space-y-2">
                    {customFields.map((field) => (
                        <div
                            key={field.id}
                            className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition"
                        >
                            <GripVertical className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{field.label}</p>
                                    <span className="text-xs text-neutral-400 bg-neutral-200 px-1.5 py-0.5 rounded">
                                        {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                                    </span>
                                    {field.is_required && (
                                        <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                                            Obrigatório
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Slug: {field.name}
                                    {field.field_type === 'select' && field.options && (
                                        <> · Opções: {field.options.join(', ')}</>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" variant="ghost" onClick={() => handleOpenModal(field)}>
                                    Editar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(field.id, field.label)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-neutral-500 text-sm">Nenhum campo personalizado adicionado.</p>
            )}

            <Modal open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
                <ModalHeader onClose={handleCloseModal}>
                    <ModalTitle>{editingField ? 'Editar Campo' : 'Adicionar Campo'}</ModalTitle>
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
                                Label (exibido no formulário) *
                            </label>
                            <Input
                                value={formData.label}
                                onChange={(e) => handleLabelChange(e.target.value)}
                                placeholder="Ex: Nome da equipe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Nome interno (slug)
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: nome_equipe"
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                Gerado automaticamente a partir do label. Usado como chave no CSV.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Tipo do campo
                            </label>
                            <Select
                                value={formData.field_type}
                                onChange={(e) => setFormData({ ...formData, field_type: e.target.value as any })}
                            >
                                <option value="text">Texto</option>
                                <option value="number">Número</option>
                                <option value="select">Seleção (dropdown)</option>
                                <option value="checkbox">Checkbox (sim/não)</option>
                            </Select>
                        </div>

                        {formData.field_type === 'select' && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Opções (uma por linha) *
                                </label>
                                <textarea
                                    value={optionsText}
                                    onChange={(e) => setOptionsText(e.target.value)}
                                    rows={4}
                                    placeholder={"Opção 1\nOpção 2\nOpção 3"}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                                />
                            </div>
                        )}

                        {formData.field_type !== 'checkbox' && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Placeholder (opcional)
                                </label>
                                <Input
                                    value={formData.placeholder || ''}
                                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value || null })}
                                    placeholder="Ex: Digite o nome da sua equipe"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_required"
                                checked={formData.is_required}
                                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="is_required" className="text-sm font-medium text-neutral-700">
                                Campo obrigatório
                            </label>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : editingField ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        </div>
    )
}
