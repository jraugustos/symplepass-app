'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { SportTypeRevenueData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface SportTypeChartProps {
    data: SportTypeRevenueData[]
}

const SPORT_LABELS: Record<string, string> = {
    corrida: 'Corrida',
    caminhada: 'Caminhada',
    trail_running: 'Trail Running',
    ciclismo: 'Ciclismo',
    mountain_bike: 'Mountain Bike',
    triatlo: 'Triatlo',
    duatlo: 'Duatlo',
    natacao: 'Natação',
    aguas_abertas: 'Águas Abertas',
    beach_tenis: 'Beach Tênis',
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
    obstaculos: 'Obstáculos',
    outro: 'Outro',
}

const COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7',
]

export function SportTypeChart({ data }: SportTypeChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-neutral-500">
                Nenhum dado disponível
            </div>
        )
    }

    const chartData = data.map(item => ({
        name: SPORT_LABELS[item.sportType] || item.sportType,
        value: item.revenue,
        registrations: item.registrations,
        percentage: item.percentage,
    }))

    return (
        <ResponsiveContainer width="100%" height={360}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => percentage > 5 ? `${name}: ${percentage.toFixed(0)}%` : ''}
                    outerRadius={110}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                >
                    {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                    }}
                    formatter={(value: any, _name: string, props: any) => {
                        return [
                            `${formatCurrency(value)} (${props.payload.registrations} inscrições)`,
                            props.payload.name,
                        ]
                    }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}
