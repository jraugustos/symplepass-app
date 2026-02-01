'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Plus,
    Copy,
    Check,
    UserPlus,
    Link as LinkIcon,
    XCircle,
    Clock,
    CheckCircle,
    Loader2,
    Trash2
} from 'lucide-react'
import { createInviteAction, listInvitesAction, revokeInviteAction, deleteInviteAction } from '@/app/actions/organizer-invites'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { OrganizerInviteTokenWithDetails } from '@/types/database.types'

export default function OrganizersPageClient() {
    const [invites, setInvites] = useState<OrganizerInviteTokenWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [generatedUrl, setGeneratedUrl] = useState('')
    const [copied, setCopied] = useState(false)
    const [email, setEmail] = useState('')
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadInvites()
    }, [])

    async function loadInvites() {
        setLoading(true)
        const result = await listInvitesAction()
        if (!result.error) {
            setInvites(result.data)
        }
        setLoading(false)
    }

    async function handleCreateInvite() {
        setCreating(true)
        const result = await createInviteAction(email || undefined)
        setCreating(false)

        if (result.error) {
            toast.error(result.error)
            return
        }

        setGeneratedUrl(result.inviteUrl!)
        setEmail('')
        loadInvites()
        toast.success('Convite criado com sucesso!')
    }

    async function handleCopyUrl() {
        await navigator.clipboard.writeText(generatedUrl)
        setCopied(true)
        toast.success('Link copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleRevokeInvite(tokenId: string) {
        const result = await revokeInviteAction(tokenId)
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success('Convite revogado!')
        loadInvites()
    }

    async function handleDeleteInvite(tokenId: string) {
        setDeleteTargetId(tokenId)
        setDeleteConfirmOpen(true)
    }

    async function confirmDelete() {
        if (!deleteTargetId) return
        setDeleting(true)
        const result = await deleteInviteAction(deleteTargetId)
        setDeleting(false)
        setDeleteConfirmOpen(false)
        setDeleteTargetId(null)
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success('Convite excluído!')
        loadInvites()
    }

    function getInviteStatus(invite: OrganizerInviteTokenWithDetails) {
        if (invite.used_at) {
            return { label: 'Utilizado', variant: 'success' as const, icon: CheckCircle }
        }
        if (invite.revoked_at) {
            return { label: 'Revogado', variant: 'error' as const, icon: XCircle }
        }
        const expiresAt = new Date(invite.expires_at)
        if (expiresAt < new Date()) {
            return { label: 'Expirado', variant: 'secondary' as const, icon: Clock }
        }
        return { label: 'Pendente', variant: 'warning' as const, icon: Clock }
    }

    return (
        <div className="space-y-6">
            {/* Create Invite Section */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-neutral-900">Convidar Organizador</h2>
                            <p className="text-sm text-neutral-600">
                                Gere um link para um novo organizador se cadastrar
                            </p>
                        </div>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setGeneratedUrl(''); setDialogOpen(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Gerar Convite
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Gerar Link de Convite</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                {!generatedUrl ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-neutral-700">
                                                Email do organizador (opcional)
                                            </label>
                                            <Input
                                                type="email"
                                                placeholder="email@exemplo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-neutral-500 mt-1">
                                                Se informado, o convite será associado a este email
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleCreateInvite}
                                            disabled={creating}
                                            className="w-full"
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Gerando...
                                                </>
                                            ) : (
                                                <>
                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                    Gerar Link
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <p className="text-sm text-green-800 font-medium mb-2">
                                                Convite gerado com sucesso!
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={generatedUrl}
                                                    readOnly
                                                    className="bg-white text-sm"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleCopyUrl}
                                                    className="px-2"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Este link expira em 7 dias. O organizador deve usá-lo para criar sua conta.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setDialogOpen(false)}
                                            className="w-full"
                                        >
                                            Fechar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Invites Table */}
            <div className="bg-white rounded-lg border border-neutral-200">
                <div className="p-4 border-b border-neutral-200">
                    <h2 className="font-semibold text-neutral-900">Histórico de Convites</h2>
                </div>

                {loading ? (
                    <div className="p-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : invites.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        Nenhum convite criado ainda
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead>Expira em</TableHead>
                                <TableHead>Utilizado por</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invites.map((invite) => {
                                const status = getInviteStatus(invite)
                                const StatusIcon = status.icon
                                const isPending = !invite.used_at && !invite.revoked_at && new Date(invite.expires_at) > new Date()

                                return (
                                    <TableRow key={invite.id}>
                                        <TableCell>
                                            {invite.email || <span className="text-neutral-400">Não especificado</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant} className="gap-1">
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(invite.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(invite.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            {invite.usedByUser ? (
                                                <span>{invite.usedByUser.full_name || invite.usedByUser.email}</span>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isPending && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleRevokeInvite(invite.id)}
                                                    >
                                                        Revogar
                                                    </Button>
                                                )}
                                                {!invite.used_at && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-neutral-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteInvite(invite.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Convite</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir este convite? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                            disabled={deleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                'Excluir'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
