'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CategoryDistributionData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface CategoryDistributionChartProps {
    data: CategoryDistributionData[]
}

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-neutral-500">
                Nenhum dado disponível
            </div>
        )
    }

    // Take top 15 categories
    const topCategories = data.slice(0, 15).map(item => ({
        ...item,
        label: item.eventTitle.length > 20
            ? `${item.eventTitle.substring(0, 18)}… — ${item.categoryName}`
            : `${item.eventTitle} — ${item.categoryName}`,
    }))

    return (
        <ResponsiveContainer width="100%" height={Math.max(320, topCategories.length * 40)}>
            <BarChart
                data={topCategories}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis
                    dataKey="label"
                    type="category"
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                    width={200}
                    tick={{ fill: '#374151' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                    }}
                    formatter={(value: any, name: string) => {
                        if (name === 'registrations') return [value, 'Total Inscrições']
                        if (name === 'confirmedRegistrations') return [value, 'Confirmadas']
                        if (name === 'revenue') return [formatCurrency(value), 'Receita']
                        return [value, name]
                    }}
                />
                <Legend />
                <Bar dataKey="registrations" fill="#3b82f6" name="Total Inscrições" radius={[0, 4, 4, 0]} />
                <Bar dataKey="confirmedRegistrations" fill="#10b981" name="Confirmadas" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
