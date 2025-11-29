'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import type { EventRegulation, RegulationFormData } from '@/types'

interface RegulationsFormProps {
    eventId: string
    regulations: EventRegulation[]
    pdfUrl: string | null
    onCreate: (data: RegulationFormData) => Promise<void>
    onUpdate: (id: string, data: RegulationFormData) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onReorder: (items: { id: string; display_order: number }[]) => Promise<void>
    onPdfUpdate: (url: string) => Promise<void>
}

export function RegulationsForm({
    eventId,
    regulations,
    pdfUrl,
    onCreate,
    onUpdate,
    onDelete,
    onReorder,
    onPdfUpdate,
}: RegulationsFormProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRegulation, setEditingRegulation] = useState<EventRegulation | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<RegulationFormData>({
        title: '',
        content: '',
    })

    const handleOpenModal = (regulation?: EventRegulation) => {
        if (regulation) {
            setEditingRegulation(regulation)
            setFormData({
                title: regulation.title,
                content: regulation.content,
            })
        } else {
            setEditingRegulation(null)
            setFormData({
                title: '',
                content: '',
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingRegulation(null)
        setFormData({
            title: '',
            content: '',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            if (editingRegulation) {
                await onUpdate(editingRegulation.id, formData)
            } else {
                await onCreate(formData)
            }
            handleCloseModal()
        } catch (error) {
            console.error('Error saving regulation:', error)
            setError('Erro ao salvar regulamento. Verifique se todos os campos estão preenchidos corretamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePdfUpdate = async (url: string | null) => {
        if (!url) return
        setIsSubmitting(true)
        try {
            await onPdfUpdate(url)
        } catch (error) {
            console.error('Error updating PDF URL:', error)
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

        const newRegulations = [...regulations]
        const draggedRegulation = newRegulations[draggedIndex]
        newRegulations.splice(draggedIndex, 1)
        newRegulations.splice(index, 0, draggedRegulation)

        const reorderedRegulations = newRegulations.map((regulation, idx) => ({
            id: regulation.id,
            display_order: idx,
        }))

        onReorder(reorderedRegulations)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="space-y-6">
            {/* Regulation Sections */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Seções do Regulamento</h4>
                    <Button size="sm" onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Seção
                    </Button>
                </div>

                {regulations.length > 0 ? (
                    <div className="space-y-2">
                        {regulations.map((regulation, index) => (
                            <div
                                key={regulation.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg cursor-move hover:bg-neutral-100 transition"
                            >
                                <GripVertical className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{regulation.title}</p>
                                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                        {regulation.content}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleOpenModal(regulation)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onDelete(regulation.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-neutral-500 text-sm">
                        Nenhuma seção de regulamento adicionada ainda.
                    </p>
                )}
            </div>

            {/* PDF Document */}
            <div className="border-t border-neutral-200 pt-6">
                <h4 className="font-medium mb-4">Documento Completo (PDF)</h4>
                <div className="space-y-3">
                    <FileUpload
                        bucket="event-documents"
                        folder={`${eventId}/regulations`}
                        value={pdfUrl ?? undefined}
                        onChange={handlePdfUpdate}
                        compress={false}
                        showPreview={false}
                        acceptedTypes={['.pdf']}
                        placeholder="Arraste um arquivo PDF ou clique para selecionar"
                    />
                    {pdfUrl && (
                        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                            <FileText className="h-4 w-4 text-neutral-500" />
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline flex-1"
                            >
                                Ver regulamento em PDF
                            </a>
                        </div>
                    )}
                    <p className="text-xs text-neutral-500">
                        Faça upload do PDF do regulamento completo para download
                    </p>
                </div>
            </div>

            {/* Modal for Add/Edit Regulation */}
            <Modal open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
                <ModalHeader onClose={handleCloseModal}>
                    <ModalTitle>
                        {editingRegulation ? 'Editar Seção' : 'Adicionar Seção'}
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
                                Título *
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Inscrições, cancelamentos e transferências"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Conteúdo *
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={6}
                                placeholder="Digite o conteúdo desta seção do regulamento..."
                                required
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Salvando...'
                                    : editingRegulation
                                        ? 'Atualizar'
                                        : 'Adicionar'}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        </div>
    )
}
