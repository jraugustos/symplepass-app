import { PhotoOrderWithDetails } from '@/lib/data/photo-orders'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface UserPhotoOrdersAdminProps {
    orders: PhotoOrderWithDetails[]
}

export function UserPhotoOrdersAdmin({ orders }: UserPhotoOrdersAdminProps) {
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-500 text-sm">Nenhum pedido de foto.</p>
            </div>
        )
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'paid':
                return 'success'
            case 'pending':
                return 'warning'
            case 'cancelled':
            case 'failed':
                return 'error'
            default:
                return 'neutral'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'paid':
                return 'Confirmado'
            case 'pending':
                return 'Pendente'
            case 'cancelled':
            case 'failed':
                return 'Cancelado'
            default:
                return status
        }
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                            Data / Evento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                            Qtde. Fotos
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                            Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                    {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-4">
                                <p className="font-medium text-neutral-900">{order.event?.title || 'Evento removido'}</p>
                                <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-neutral-600">
                                {order.items?.length || 0} fotos
                            </td>
                            <td className="px-4 py-4 font-medium text-sm text-neutral-900">
                                {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                    <Badge variant={getStatusBadgeVariant(order.status)}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                    {order.payment_status !== order.status && (
                                        <span className="text-xs text-neutral-500">
                                            Pgto: {getStatusLabel(order.payment_status)}
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
