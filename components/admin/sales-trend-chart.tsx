'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SalesTrendData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface SalesTrendChartProps {
  data: SalesTrendData[]
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-neutral-500">
        Nenhum dado disponível
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: any, name: string) => {
            if (name === 'revenue') {
              return [formatCurrency(value), 'Receita']
            }
            return [value, 'Inscrições']
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          name="Receita"
          dot={{ fill: '#10b981' }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="registrations"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Inscrições"
          dot={{ fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
