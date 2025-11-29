'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { EventPerformanceData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface EventPerformanceChartProps {
  data: EventPerformanceData[]
}

export function EventPerformanceChart({ data }: EventPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-neutral-500">
        Nenhum dado disponível
      </div>
    )
  }

  // Limit to top 10 events
  const topEvents = data.slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={topEvents} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="eventTitle"
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
          formatter={(value: any, name: string) => {
            if (name === 'totalRevenue') {
              return [formatCurrency(value), 'Receita Total']
            }
            return [value, name]
          }}
        />
        <Legend />
        <Bar dataKey="totalRevenue" fill="#10b981" name="Receita Total" />
      </BarChart>
    </ResponsiveContainer>
  )
}
