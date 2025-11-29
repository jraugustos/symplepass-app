'use client'

import { useState } from 'react'
import { Eye, Edit, Trash2, Search, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CouponWithDetails } from '@/types'
import { formatDate } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/modal'

interface CouponsTableProps {
  coupons: CouponWithDetails[]
  onViewCoupon?: (couponId: string) => void
  onEditCoupon: (couponId: string) => void
  onDeleteCoupon: (couponId: string) => Promise<void>
  onCreateCoupon: () => void
  onFilterChange?: (filters: { status?: string; search?: string }) => void
}

export function CouponsTable({
  coupons,
  onViewCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onCreateCoupon,
  onFilterChange,
}: CouponsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null)
  const [loadingCouponId, setLoadingCouponId] = useState<string | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onFilterChange?.({
      search: value,
      status: statusFilter || undefined,
    })
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    onFilterChange?.({
      search: searchTerm,
      status: status || undefined,
    })
  }

  const handleDelete = async () => {
    if (!couponToDelete) return

    setLoadingCouponId(couponToDelete)
    try {
      await onDeleteCoupon(couponToDelete)
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
    } catch (error) {
      console.error('Error deleting coupon:', error)
    } finally {
      setLoadingCouponId(null)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'expired':
        return 'neutral'
      case 'disabled':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'expired':
        return 'Expirado'
      case 'disabled':
        return 'Desabilitado'
      default:
        return status
    }
  }

  const getDiscountTypeLabel = (type: string) => {
    return type === 'percentage' ? 'Porcentagem' : 'Valor Fixo'
  }

  return (
    <div className="space-y-4">
      {/* Filters and Create Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por código..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="expired">Expirado</option>
          <option value="disabled">Desabilitado</option>
        </select>
        <Button onClick={onCreateCoupon}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Desconto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Validade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Usos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-medium text-neutral-900 font-mono">{coupon.code}</p>
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}%`
                    : `R$ ${coupon.discount_value.toFixed(2)}`}
                  <p className="text-xs text-neutral-500">
                    {getDiscountTypeLabel(coupon.discount_type)}
                  </p>
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {coupon.events?.title || 'Todos os eventos'}
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_until)}
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {coupon.current_uses} / {coupon.max_uses || '∞'}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getStatusBadgeVariant(coupon.status)}>
                    {getStatusLabel(coupon.status)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditCoupon(coupon.id)}
                      disabled={loadingCouponId === coupon.id}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCouponToDelete(coupon.id)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={loadingCouponId === coupon.id}
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-neutral-900 font-mono text-lg">
                {coupon.code}
              </p>
              <Badge variant={getStatusBadgeVariant(coupon.status)}>
                {getStatusLabel(coupon.status)}
              </Badge>
            </div>
            <div className="space-y-2 mb-3 text-sm">
              <p className="text-neutral-600">
                <span className="font-medium">Desconto:</span>{' '}
                {coupon.discount_type === 'percentage'
                  ? `${coupon.discount_value}%`
                  : `R$ ${coupon.discount_value.toFixed(2)}`}
              </p>
              <p className="text-neutral-600">
                <span className="font-medium">Evento:</span>{' '}
                {coupon.events?.title || 'Todos os eventos'}
              </p>
              <p className="text-neutral-600">
                <span className="font-medium">Usos:</span> {coupon.current_uses} /{' '}
                {coupon.max_uses || '∞'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditCoupon(coupon.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCouponToDelete(coupon.id)
                  setDeleteDialogOpen(true)
                }}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1 text-red-600" />
                Deletar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Deletar Cupom"
        description="Tem certeza que deseja deletar este cupom? Se o cupom já foi usado, ele será desabilitado em vez de deletado."
        confirmText="Deletar"
        cancelText="Cancelar"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
