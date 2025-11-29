'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PaymentStatusBreakdown } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface PaymentStatusChartProps {
  data: PaymentStatusBreakdown[]
}

const COLORS = {
  paid: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
  refunded: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  failed: 'Falhou',
  refunded: 'Reembolsado',
}

export function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-neutral-500">
        Nenhum dado disponível
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    revenue: item.revenue,
    percentage: item.percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => {
            const colorKey = data[index].status as keyof typeof COLORS
            return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || '#6b7280'} />
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: any, name: string, props: any) => {
            if (name === 'value') {
              return [value, 'Quantidade']
            }
            return [formatCurrency(props.payload.revenue), 'Receita']
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
