'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AdminDashboardStats } from '@/lib/data/admin-dashboard'

interface DashboardFunnelChartProps {
    stats: AdminDashboardStats
}

export function DashboardFunnelChart({ stats }: DashboardFunnelChartProps) {
    const { totalUsers, totalRegistrations, confirmedRegistrations } = stats

    const data = [
        { name: 'Usuários Cadastrados', value: totalUsers, fill: '#3b82f6' }, // blue-500
        { name: 'Inscrições Iniciadas', value: totalRegistrations, fill: '#f59e0b' }, // amber-500
        { name: 'Insc. Confirmadas', value: confirmedRegistrations, fill: '#10b981' }, // emerald-500
    ]

    // Calculate generic conversion rate platform-wide
    const conversionRate = totalUsers > 0 ? (confirmedRegistrations / totalUsers) * 100 : 0

    if (totalUsers === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-neutral-500">
                Nenhum dado disponível
            </div>
        )
    }

    return (
        <div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        width={140}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        formatter={(value: any) => [value, 'Usuários/Inscrições']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center mt-4 gap-6 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <span className="flex flex-col items-center">
                    <span className="text-xs text-neutral-500 uppercase font-semibold">Conversão Geral</span>
                    <strong className="text-xl text-neutral-900">{conversionRate.toFixed(1)}%</strong>
                </span>
            </div>
        </div>
    )
}
