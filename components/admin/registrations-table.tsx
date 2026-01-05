'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Search, Trash2, ExternalLink, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RegistrationWithDetails, EventCategory } from '@/types/database.types'
import { RegistrationFilters } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface RegistrationsTableProps {
  registrations: any[]
  categories: EventCategory[]
  onFilterChange: (filters: RegistrationFilters) => void
  onExport: () => Promise<void>
  onDelete?: (registrationId: string) => Promise<void>
  onEdit?: (registration: any) => void
}

export function RegistrationsTable({
  registrations,
  categories,
  onFilterChange,
  onExport,
  onDelete,
  onEdit,
}: RegistrationsTableProps) {
  const [filters, setFilters] = useState<RegistrationFilters>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (registrationId: string, participantName: string) => {
    if (!onDelete) return

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a inscrição de "${participantName}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    setDeletingId(registrationId)
    try {
      await onDelete(registrationId)
    } finally {
      setDeletingId(null)
    }
  }

  const handleFilterChange = (key: keyof RegistrationFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
      case 'refunded':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'refunded':
        return 'Reembolsado'
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.payment_status || ''}
            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
          >
            <option value="">Todos os pagamentos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhou</option>
            <option value="refunded">Reembolsado</option>
          </Select>

          <Select
            value={filters.category_id || ''}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Button variant="ghost" onClick={handleClearFilters} size="sm">
            Limpar
          </Button>
        </div>

        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Participante 1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Participante 2
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {registrations.map((registration: any) => {
              // Extract just the ID part from ticket_code (last 8 chars after the dash)
              const shortCode = registration.id?.slice(0, 8).toUpperCase() || null

              return (
                <tr key={registration.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      {registration.profiles?.id ? (
                        <Link
                          href={`/admin/usuarios/${registration.profiles.id}`}
                          className="font-medium text-neutral-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1 group"
                        >
                          {registration.profiles?.full_name || 'N/A'}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : (
                        <p className="font-medium text-neutral-900">
                          {registration.profiles?.full_name || 'N/A'}
                        </p>
                      )}
                      <p className="text-sm text-neutral-500">
                        {registration.profiles?.email || 'N/A'}
                      </p>
                      {registration.profiles?.cpf && (
                        <p className="text-xs text-neutral-400">
                          CPF: {registration.profiles.cpf}
                        </p>
                      )}
                      {registration.profiles?.phone && (
                        <p className="text-xs text-neutral-400">
                          Tel: {registration.profiles.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {registration.registration_data?.team_members && registration.registration_data.team_members.length > 0 ? (
                      <div>
                        <Badge variant="neutral" className="mb-1">Equipe ({registration.registration_data.team_members.length + 1})</Badge>
                        <ul className="text-xs text-neutral-600 space-y-0.5">
                          {registration.registration_data.team_members.slice(0, 2).map((member: any, idx: number) => (
                            <li key={idx}>{member.name || `Membro ${idx + 2}`}</li>
                          ))}
                          {registration.registration_data.team_members.length > 2 && (
                            <li className="text-neutral-400">+{registration.registration_data.team_members.length - 2} mais</li>
                          )}
                        </ul>
                      </div>
                    ) : registration.registration_data?.partner ? (
                      <div>
                        <p className="font-medium text-neutral-900">
                          {registration.registration_data.partner.name || registration.partner_name || 'N/A'}
                        </p>
                        {registration.registration_data.partner.email && (
                          <p className="text-sm text-neutral-500">
                            {registration.registration_data.partner.email}
                          </p>
                        )}
                        {registration.registration_data.partner.cpf && (
                          <p className="text-xs text-neutral-400">
                            CPF: {registration.registration_data.partner.cpf}
                          </p>
                        )}
                        {registration.registration_data.partner.phone && (
                          <p className="text-xs text-neutral-400">
                            Tel: {registration.registration_data.partner.phone}
                          </p>
                        )}
                      </div>
                    ) : registration.partner_name ? (
                      <p className="font-medium text-neutral-900">{registration.partner_name}</p>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {registration.event_categories?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={getPaymentStatusVariant(registration.payment_status)}>
                      {getPaymentStatusLabel(registration.payment_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    {shortCode ? (
                      <span className="font-mono text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-1 rounded">
                        {shortCode}
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                    {formatCurrency(registration.amount_paid || 0)}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {formatDate(registration.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(registration)}
                          className="text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(registration.id, registration.profiles?.full_name || 'Participante')}
                          disabled={deletingId === registration.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {registrations.map((registration: any) => {
          const shortCode = registration.id?.slice(0, 8).toUpperCase() || null

          return (
            <div
              key={registration.id}
              className="bg-white rounded-lg border border-neutral-200 p-4"
            >
              <div className="flex justify-between items-start mb-2">
              <div>
                {(registration.registration_data?.partner || registration.partner_name) && (
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Participante 1</p>
                )}
                {registration.profiles?.id ? (
                  <Link
                    href={`/admin/usuarios/${registration.profiles.id}`}
                    className="font-medium text-neutral-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
                  >
                    {registration.profiles?.full_name || 'N/A'}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="font-medium text-neutral-900">
                    {registration.profiles?.full_name || 'N/A'}
                  </p>
                )}
                <p className="text-sm text-neutral-500">
                  {registration.profiles?.email || 'N/A'}
                </p>
                {registration.profiles?.cpf && (
                  <p className="text-xs text-neutral-400">
                    CPF: {registration.profiles.cpf}
                  </p>
                )}
                {registration.profiles?.phone && (
                  <p className="text-xs text-neutral-400">
                    Tel: {registration.profiles.phone}
                  </p>
                )}
              </div>
              <Badge variant={getPaymentStatusVariant(registration.payment_status)}>
                {getPaymentStatusLabel(registration.payment_status)}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-neutral-600">
                <span className="font-medium">Categoria:</span>{' '}
                {registration.event_categories?.name || 'N/A'}
              </p>
              {registration.registration_data?.team_members && registration.registration_data.team_members.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="neutral">Equipe ({registration.registration_data.team_members.length + 1})</Badge>
                  </div>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    {registration.registration_data.team_members.map((member: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-medium">{member.name || `Membro ${idx + 2}`}</span>
                        {member.email && <span className="text-neutral-400"> - {member.email}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!registration.registration_data?.team_members && (registration.registration_data?.partner || registration.partner_name) && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Participante 2</p>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {registration.registration_data?.partner?.name || registration.partner_name || 'N/A'}
                    </p>
                    {registration.registration_data?.partner?.email && (
                      <p className="text-sm text-neutral-500">
                        {registration.registration_data.partner.email}
                      </p>
                    )}
                    {registration.registration_data?.partner?.cpf && (
                      <p className="text-xs text-neutral-400">
                        CPF: {registration.registration_data.partner.cpf}
                      </p>
                    )}
                    {registration.registration_data?.partner?.phone && (
                      <p className="text-xs text-neutral-400">
                        Tel: {registration.registration_data.partner.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {shortCode && (
                <p className="text-neutral-600">
                  <span className="font-medium">Código:</span>{' '}
                  <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{shortCode}</span>
                </p>
              )}
              <p className="text-neutral-600">
                <span className="font-medium">Valor:</span>{' '}
                {formatCurrency(registration.amount_paid || 0)}
              </p>
              <p className="text-neutral-600">
                <span className="font-medium">Data:</span>{' '}
                {formatDate(registration.created_at)}
              </p>
            </div>
            {(onEdit || onDelete) && (
              <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(registration)}
                    className="text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(registration.id, registration.profiles?.full_name || 'Participante')}
                    disabled={deletingId === registration.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>
            )}
            </div>
          )
        })}
      </div>

      {registrations.length === 0 && (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
          <p className="text-neutral-600">Nenhuma inscrição encontrada</p>
        </div>
      )}
    </div>
  )
}
