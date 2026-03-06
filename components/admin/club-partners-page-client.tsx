'use client'

import { useState, useRef } from 'react'
import {
    Plus,
    Pencil,
    Trash2,
    ExternalLink,
    Eye,
    EyeOff,
    Upload,
    X,
    Crown,
    GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import type { ClubPartner } from '@/lib/data/club-partners'

interface ClubPartnersPageClientProps {
    partners: ClubPartner[]
}

type PartnerFormData = {
    name: string
    description: string
    link: string
    logo_url: string
    sort_order: number
}

const emptyForm: PartnerFormData = {
    name: '',
    description: '',
    link: '',
    logo_url: '',
    sort_order: 0,
}

export function ClubPartnersPageClient({ partners: initialPartners }: ClubPartnersPageClientProps) {
    const [partners, setPartners] = useState(initialPartners)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [editingPartner, setEditingPartner] = useState<ClubPartner | null>(null)
    const [deletingPartner, setDeletingPartner] = useState<ClubPartner | null>(null)
    const [form, setForm] = useState<PartnerFormData>(emptyForm)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function openCreateModal() {
        setEditingPartner(null)
        setForm({ ...emptyForm, sort_order: partners.length })
        setModalOpen(true)
    }

    function openEditModal(partner: ClubPartner) {
        setEditingPartner(partner)
        setForm({
            name: partner.name,
            description: partner.description || '',
            link: partner.link || '',
            logo_url: partner.logo_url || '',
            sort_order: partner.sort_order,
        })
        setModalOpen(true)
    }

    function openDeleteModal(partner: ClubPartner) {
        setDeletingPartner(partner)
        setDeleteModalOpen(true)
    }

    function showStatus(type: 'success' | 'error', text: string) {
        setStatusMessage({ type, text })
        setTimeout(() => setStatusMessage(null), 4000)
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'club-partners')
            formData.append('folder', 'logos')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                showStatus('error', data.error || 'Erro ao fazer upload')
                return
            }

            setForm(prev => ({ ...prev, logo_url: data.url }))
        } catch {
            showStatus('error', 'Erro ao fazer upload da logo')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    async function handleSave() {
        if (!form.name.trim()) {
            showStatus('error', 'Nome do parceiro é obrigatório')
            return
        }

        setIsLoading(true)
        try {
            if (editingPartner) {
                // Update
                const response = await fetch(`/api/admin/club-partners/${editingPartner.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })

                const data = await response.json()

                if (!response.ok) {
                    showStatus('error', data.error || 'Erro ao atualizar parceiro')
                    return
                }

                setPartners(prev =>
                    prev.map(p => (p.id === editingPartner.id ? data.partner : p))
                )
                showStatus('success', 'Parceiro atualizado com sucesso!')
            } else {
                // Create
                const response = await fetch('/api/admin/club-partners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })

                const data = await response.json()

                if (!response.ok) {
                    showStatus('error', data.error || 'Erro ao criar parceiro')
                    return
                }

                setPartners(prev => [...prev, data.partner])
                showStatus('success', 'Parceiro adicionado com sucesso!')
            }

            setModalOpen(false)
        } catch {
            showStatus('error', 'Erro ao salvar parceiro')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!deletingPartner) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/club-partners/${deletingPartner.id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const data = await response.json()
                showStatus('error', data.error || 'Erro ao deletar parceiro')
                return
            }

            setPartners(prev => prev.filter(p => p.id !== deletingPartner.id))
            setDeleteModalOpen(false)
            showStatus('success', 'Parceiro removido com sucesso!')
        } catch {
            showStatus('error', 'Erro ao deletar parceiro')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleActive(partner: ClubPartner) {
        try {
            const response = await fetch(`/api/admin/club-partners/${partner.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !partner.is_active }),
            })

            const data = await response.json()

            if (!response.ok) {
                showStatus('error', data.error || 'Erro ao atualizar status')
                return
            }

            setPartners(prev =>
                prev.map(p => (p.id === partner.id ? data.partner : p))
            )
            showStatus('success', partner.is_active ? 'Parceiro desativado' : 'Parceiro ativado')
        } catch {
            showStatus('error', 'Erro ao atualizar status')
        }
    }

    return (
        <div className="space-y-6">
            {/* Status Message */}
            {statusMessage && (
                <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${statusMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {statusMessage.text}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                        <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-neutral-900">Parceiros</h2>
                        <p className="text-sm text-neutral-500">{partners.length} parceiro{partners.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <Button variant="primary" onClick={openCreateModal}>
                    <Plus className="w-4 h-4" />
                    Adicionar Parceiro
                </Button>
            </div>

            {/* Partners List */}
            {partners.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                    <Crown className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p className="font-medium">Nenhum parceiro cadastrado</p>
                    <p className="text-sm mt-1">Adicione o primeiro parceiro do clube</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {partners.map(partner => (
                        <div
                            key={partner.id}
                            className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${partner.is_active
                                    ? 'border-neutral-200 bg-white'
                                    : 'border-neutral-100 bg-neutral-50 opacity-60'
                                }`}
                        >
                            {/* Sort Handle */}
                            <div className="text-neutral-300">
                                <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Logo */}
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden">
                                {partner.logo_url ? (
                                    <img
                                        src={partner.logo_url}
                                        alt={partner.name}
                                        className="w-full h-full object-contain p-1"
                                    />
                                ) : (
                                    <Crown className="w-6 h-6 text-neutral-400" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-neutral-900 truncate">{partner.name}</h3>
                                    {!partner.is_active && (
                                        <Badge variant="warning" size="sm">Inativo</Badge>
                                    )}
                                </div>
                                {partner.description && (
                                    <p className="text-sm text-neutral-500 truncate mt-0.5">{partner.description}</p>
                                )}
                                {partner.link && (
                                    <a
                                        href={partner.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-orange-600 hover:underline mt-1 inline-flex items-center gap-1"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        {partner.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </a>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleActive(partner)}
                                    title={partner.is_active ? 'Desativar' : 'Ativar'}
                                >
                                    {partner.is_active ? (
                                        <Eye className="w-4 h-4 text-neutral-500" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-neutral-400" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(partner)}
                                >
                                    <Pencil className="w-4 h-4 text-neutral-500" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteModal(partner)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal open={modalOpen} onOpenChange={setModalOpen}>
                <ModalHeader onClose={() => setModalOpen(false)}>
                    <ModalTitle>{editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}</ModalTitle>
                </ModalHeader>
                <ModalBody className="space-y-4">
                    <FormField label="Nome do parceiro *">
                        <Input
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Academia FitZone"
                        />
                    </FormField>

                    <FormField label="Descrição">
                        <Input
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Ex: 20% de desconto na mensalidade"
                        />
                    </FormField>

                    <FormField label="Link (URL)">
                        <Input
                            value={form.link}
                            onChange={e => setForm(prev => ({ ...prev, link: e.target.value }))}
                            placeholder="https://exemplo.com.br"
                        />
                    </FormField>

                    <FormField label="Logo do parceiro">
                        <div className="space-y-3">
                            {form.logo_url && (
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={form.logo_url}
                                            alt="Logo preview"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />

                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? 'Enviando...' : form.logo_url ? 'Trocar logo' : 'Fazer upload'}
                            </Button>
                        </div>
                    </FormField>

                    <FormField label="Ordem de exibição">
                        <Input
                            type="number"
                            value={form.sort_order}
                            onChange={e => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                            min={0}
                        />
                    </FormField>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button isLoading={isLoading} onClick={handleSave}>
                        {editingPartner ? 'Salvar Alterações' : 'Adicionar Parceiro'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <ModalHeader onClose={() => setDeleteModalOpen(false)}>
                    <ModalTitle>Remover Parceiro</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <p className="text-sm text-neutral-700">
                        Tem certeza que deseja remover o parceiro <strong>{deletingPartner?.name}</strong>?
                        Esta ação não pode ser desfeita.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" isLoading={isLoading} onClick={handleDelete}>
                        Remover
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
