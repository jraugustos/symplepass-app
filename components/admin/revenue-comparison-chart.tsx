'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { RevenueComparisonData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface RevenueComparisonChartProps {
    data: RevenueComparisonData[]
}

export function RevenueComparisonChart({ data }: RevenueComparisonChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-neutral-500">
                Nenhum dado disponível
            </div>
        )
    }

    // Take top 10 events by difference
    const topEvents = data.slice(0, 10).map(item => ({
        name: item.eventTitle.length > 25
            ? `${item.eventTitle.substring(0, 23)}…`
            : item.eventTitle,
        esperada: item.expectedRevenue,
        realizada: item.actualRevenue,
        desconto: item.discountPercentage,
    }))

    return (
        <div>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topEvents} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        formatter={(value: any, name: string, props: any) => {
                            if (name === 'esperada') return [formatCurrency(value), 'Receita Esperada']
                            if (name === 'realizada') return [formatCurrency(value), 'Receita Realizada']
                            return [formatCurrency(value), name]
                        }}
                        labelFormatter={(label) => label}
                    />
                    <Legend
                        formatter={(value: string) => {
                            if (value === 'esperada') return 'Receita Esperada'
                            if (value === 'realizada') return 'Receita Realizada'
                            return value
                        }}
                    />
                    <Bar dataKey="esperada" fill="#94a3b8" name="esperada" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizada" fill="#10b981" name="realizada" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center mt-2 gap-6 text-sm text-neutral-600">
                {data.filter(d => d.difference > 0).length > 0 && (
                    <span>
                        Desconto médio: <strong className="text-neutral-900">
                            {(data.reduce((sum, d) => sum + d.discountPercentage, 0) / data.filter(d => d.expectedRevenue > 0).length).toFixed(1)}%
                        </strong>
                    </span>
                )}
            </div>
        </div>
    )
}
