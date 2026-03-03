'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface RegistrationFunnelChartProps {
    totalRegistrations: number
    pendingRegistrations: number
    confirmedRegistrations: number
    conversionRate: number
}

export function RegistrationFunnelChart({
    totalRegistrations,
    pendingRegistrations,
    confirmedRegistrations,
    conversionRate,
}: RegistrationFunnelChartProps) {
    const cancelledOrFailed = totalRegistrations - pendingRegistrations - confirmedRegistrations

    const data = [
        { name: 'Total', value: totalRegistrations, fill: '#6366f1' },
        { name: 'Pendentes', value: pendingRegistrations, fill: '#f59e0b' },
        { name: 'Confirmados', value: confirmedRegistrations, fill: '#10b981' },
        { name: 'Cancelados/Falhos', value: Math.max(0, cancelledOrFailed), fill: '#ef4444' },
    ]

    if (totalRegistrations === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-neutral-500">
                Nenhum dado disponível
            </div>
        )
    }

    return (
        <div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        formatter={(value: any) => [value, 'Inscrições']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center mt-2 gap-6 text-sm text-neutral-600">
                <span>
                    Taxa de conversão: <strong className="text-neutral-900">{conversionRate.toFixed(1)}%</strong>
                </span>
                <span>
                    Confirmados: <strong className="text-success">{confirmedRegistrations}</strong> de {totalRegistrations}
                </span>
            </div>
        </div>
    )
}
