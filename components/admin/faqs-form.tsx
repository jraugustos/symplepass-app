'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import type { EventFAQ, FAQFormData } from '@/types'

interface FAQsFormProps {
    eventId: string
    faqs: EventFAQ[]
    onCreate: (data: FAQFormData) => Promise<void>
    onUpdate: (id: string, data: FAQFormData) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onReorder: (items: { id: string; display_order: number }[]) => Promise<void>
}

export function FAQsForm({
    eventId,
    faqs,
    onCreate,
    onUpdate,
    onDelete,
    onReorder,
}: FAQsFormProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingFAQ, setEditingFAQ] = useState<EventFAQ | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<FAQFormData>({
        question: '',
        answer: '',
    })

    const handleOpenModal = (faq?: EventFAQ) => {
        if (faq) {
            setEditingFAQ(faq)
            setFormData({
                question: faq.question,
                answer: faq.answer || '',
            })
        } else {
            setEditingFAQ(null)
            setFormData({
                question: '',
                answer: '',
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingFAQ(null)
        setFormData({
            question: '',
            answer: '',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            if (editingFAQ) {
                await onUpdate(editingFAQ.id, formData)
            } else {
                await onCreate(formData)
            }
            handleCloseModal()
        } catch (error) {
            console.error('Error saving FAQ:', error)
            setError('Erro ao salvar FAQ. Verifique se todos os campos estão preenchidos corretamente.')
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

        const newFAQs = [...faqs]
        const draggedFAQ = newFAQs[draggedIndex]
        newFAQs.splice(draggedIndex, 1)
        newFAQs.splice(index, 0, draggedFAQ)

        const reorderedFAQs = newFAQs.map((faq, idx) => ({
            id: faq.id,
            display_order: idx,
        }))

        onReorder(reorderedFAQs)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">Perguntas Frequentes</h4>
                <Button size="sm" onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar FAQ
                </Button>
            </div>

            {faqs.length > 0 ? (
                <div className="space-y-2">
                    {faqs.map((faq, index) => (
                        <div
                            key={faq.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg cursor-move hover:bg-neutral-100 transition"
                        >
                            <GripVertical className="h-5 w-5 text-neutral-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">{faq.question}</p>
                                {faq.answer && (
                                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenModal(faq)}
                                >
                                    Editar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => onDelete(faq.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-neutral-500 text-sm">Nenhuma FAQ adicionada ainda.</p>
            )}

            <Modal open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
                <ModalHeader onClose={handleCloseModal}>
                    <ModalTitle>{editingFAQ ? 'Editar FAQ' : 'Adicionar FAQ'}</ModalTitle>
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
                                Pergunta *
                            </label>
                            <Input
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="Ex: Posso alterar minha categoria após a inscrição?"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Resposta *
                            </label>
                            <textarea
                                value={formData.answer || ''}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                rows={4}
                                placeholder="Digite a resposta..."
                                required
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : editingFAQ ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        </div>
    )
}
