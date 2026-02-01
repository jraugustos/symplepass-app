'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    CheckCircle,
    XCircle,
    Calendar,
    MapPin,
    User,
    Loader2,
    Clock,
    DollarSign,
    Percent,
    Trophy
} from 'lucide-react'
import {
    getPendingEventsAction,
    approveEventAction,
    rejectEventAction
} from '@/app/actions/event-approval'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Event, SportType } from '@/types/database.types'

// Sport type labels for display
const SPORT_TYPE_LABELS: Record<SportType, string> = {
    corrida: 'Corrida',
    caminhada: 'Caminhada',
    trail_running: 'Trail Running',
    ciclismo: 'Ciclismo',
    mountain_bike: 'Mountain Bike',
    triatlo: 'Triatlo',
    duatlo: 'Duatlo',
    natacao: 'Natação',
    aguas_abertas: 'Águas Abertas',
    beach_tenis: 'Beach Tennis',
    futevolei: 'Futevôlei',
    volei_praia: 'Vôlei de Praia',
    surf: 'Surf',
    bodyboard: 'Bodyboard',
    kitesurf: 'Kitesurf',
    windsurf: 'Windsurf',
    stand_up_paddle: 'Stand Up Paddle',
    beach_run: 'Beach Run',
    crossfit: 'CrossFit',
    funcional: 'Funcional',
    calistenia: 'Calistenia',
    academia: 'Academia',
    spinning: 'Spinning',
    pilates: 'Pilates',
    yoga: 'Yoga',
    futebol: 'Futebol',
    futsal: 'Futsal',
    basquete: 'Basquete',
    volei: 'Vôlei',
    handebol: 'Handebol',
    rugby: 'Rugby',
    canoagem: 'Canoagem',
    remo: 'Remo',
    corrida_montanha: 'Corrida de Montanha',
    orientacao: 'Orientação',
    rapel: 'Rapel',
    parkour: 'Parkour',
    patins: 'Patins',
    skate: 'Skate',
    longboard: 'Longboard',
    bike_urbana: 'Bike Urbana',
    tiro_com_arco: 'Tiro com Arco',
    tiro_esportivo: 'Tiro Esportivo',
    multiesportes: 'Multiesportes',
    obstaculos: 'Corrida de Obstáculos',
    outro: 'Outro',
}

interface PendingEvent extends Event {
    profiles?: {
        id: string
        full_name: string | null
        email: string
    }
}

type FeeType = 'fixed' | 'percentage'

export default function ApprovacoesPageClient() {
    const [events, setEvents] = useState<PendingEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Approve dialog state
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null)
    const [feeType, setFeeType] = useState<FeeType>('fixed')
    const [serviceFee, setServiceFee] = useState('')
    const [approveNotes, setApproveNotes] = useState('')

    // Reject dialog state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        loadEvents()
    }, [])

    async function loadEvents() {
        setLoading(true)
        const result = await getPendingEventsAction()
        if (!result.error) {
            setEvents(result.data as PendingEvent[])
        }
        setLoading(false)
    }

    function openApproveDialog(event: PendingEvent) {
        setSelectedEvent(event)
        setFeeType('fixed')
        setServiceFee('')
        setApproveNotes('')
        setApproveDialogOpen(true)
    }

    function openRejectDialog(event: PendingEvent) {
        setSelectedEvent(event)
        setRejectReason('')
        setRejectDialogOpen(true)
    }

    async function handleApprove() {
        if (!selectedEvent) return

        const feeValue = parseFloat(serviceFee) || 0
        if (feeValue < 0) {
            toast.error('A taxa de serviço não pode ser negativa')
            return
        }

        if (feeType === 'percentage' && feeValue > 100) {
            toast.error('A porcentagem não pode ser maior que 100%')
            return
        }

        // For percentage, we store negative value to identify it
        // Or we can store it with a prefix/metadata
        // For simplicity, we'll store the value and type in notes or use a convention
        // Actually, let's update the backend to support this properly
        // For now, we'll pass the fee with a convention: percentage as negative
        const feeToSave = feeType === 'percentage' ? -feeValue : feeValue

        setProcessingId(selectedEvent.id)
        const result = await approveEventAction(selectedEvent.id, feeToSave, approveNotes)
        setProcessingId(null)

        if (result.error) {
            toast.error(result.error)
            return
        }

        toast.success('Evento aprovado com sucesso!')
        setApproveDialogOpen(false)
        loadEvents()
    }

    async function handleReject() {
        if (!selectedEvent) return

        if (!rejectReason.trim()) {
            toast.error('Por favor, informe o motivo da rejeição')
            return
        }

        setProcessingId(selectedEvent.id)
        const result = await rejectEventAction(selectedEvent.id, rejectReason)
        setProcessingId(null)

        if (result.error) {
            toast.error(result.error)
            return
        }

        toast.success('Evento rejeitado')
        setRejectDialogOpen(false)
        loadEvents()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Tudo em dia!
                </h3>
                <p className="text-neutral-600">
                    Não há eventos pendentes de aprovação no momento.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-4">
                {events.map((event) => (
                    <Card key={event.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{event.title}</CardTitle>
                                    <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {event.profiles?.full_name || event.profiles?.email || 'Organizador'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(event.start_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                        {event.location?.city && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {event.location.city}, {event.location.state}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4" />
                                            {SPORT_TYPE_LABELS[event.sport_type] || event.sport_type}
                                        </span>
                                    </CardDescription>
                                </div>
                                <Badge variant="warning" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    Aguardando Aprovação
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                                {event.description}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => openApproveDialog(event)}
                                    disabled={processingId === event.id}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processingId === event.id ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Aprovar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => openRejectDialog(event)}
                                    disabled={processingId === event.id}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rejeitar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aprovar Evento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                            <p className="text-sm text-neutral-600">
                                Você está aprovando: <strong>{selectedEvent?.title}</strong>
                            </p>
                            {selectedEvent && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    Modalidade: {SPORT_TYPE_LABELS[selectedEvent.sport_type] || selectedEvent.sport_type}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-2 block">
                                Tipo de Taxa
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={feeType === 'fixed' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFeeType('fixed')}
                                    className="flex-1"
                                >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Valor Fixo (R$)
                                </Button>
                                <Button
                                    type="button"
                                    variant={feeType === 'percentage' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFeeType('percentage')}
                                    className="flex-1"
                                >
                                    <Percent className="w-4 h-4 mr-1" />
                                    Porcentagem (%)
                                </Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                                {feeType === 'fixed' ? (
                                    <>
                                        <DollarSign className="w-4 h-4" />
                                        Taxa de Serviço (R$)
                                    </>
                                ) : (
                                    <>
                                        <Percent className="w-4 h-4" />
                                        Taxa de Serviço (%)
                                    </>
                                )}
                            </label>
                            <Input
                                type="number"
                                min="0"
                                max={feeType === 'percentage' ? 100 : undefined}
                                step={feeType === 'percentage' ? '0.1' : '0.01'}
                                placeholder={feeType === 'fixed' ? '0.00' : '0'}
                                value={serviceFee}
                                onChange={(e) => setServiceFee(e.target.value)}
                                className="mt-1"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                {feeType === 'fixed'
                                    ? 'Valor fixo cobrado por inscrição como taxa de serviço'
                                    : 'Porcentagem do valor da inscrição cobrada como taxa de serviço'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700">
                                Notas (opcional)
                            </label>
                            <Textarea
                                placeholder="Observações sobre a aprovação..."
                                value={approveNotes}
                                onChange={(e) => setApproveNotes(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={processingId !== null}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processingId ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirmar Aprovação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Evento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-sm text-neutral-600 mb-4">
                                Você está rejeitando: <strong>{selectedEvent?.title}</strong>
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700">
                                Motivo da Rejeição *
                            </label>
                            <Textarea
                                placeholder="Explique o motivo da rejeição para o organizador..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-1"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processingId !== null || !rejectReason.trim()}
                        >
                            {processingId ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirmar Rejeição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
