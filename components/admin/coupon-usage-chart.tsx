'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CouponUsageData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface CouponUsageChartProps {
    data: CouponUsageData[]
}

export function CouponUsageChart({ data }: CouponUsageChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-neutral-500">
                Nenhum cupom utilizado
            </div>
        )
    }

    const chartData = data.slice(0, 10).map(item => ({
        name: item.couponCode,
        usos: item.usageCount,
        desconto: item.totalDiscount,
    }))

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    yAxisId="left"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
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
                    formatter={(value: any, name: string) => {
                        if (name === 'desconto') return [formatCurrency(value), 'Desconto Total']
                        return [value, 'Usos']
                    }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="usos" fill="#8b5cf6" name="Usos" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="desconto" fill="#f59e0b" name="Desconto Total" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
