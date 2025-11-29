'use client'

import { useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserRole } from '@/types/database.types'
import { Profile } from '@/types'
import { formatDate } from '@/lib/utils'

interface UsersTableProps {
  users: Profile[]
  onViewUser: (userId: string) => void
  onFilterChange?: (filters: { role?: UserRole; search?: string }) => void
}

export function UsersTable({ users, onViewUser, onFilterChange }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onFilterChange?.({
      search: value,
      role: roleFilter || undefined,
    })
  }

  const handleRoleFilterChange = (role: UserRole | '') => {
    setRoleFilter(role)
    onFilterChange?.({
      search: searchTerm,
      role: role || undefined,
    })
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'organizer':
        return 'info'
      case 'user':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'organizer':
        return 'Organizador'
      case 'user':
        return 'Usuário'
      default:
        return role
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilterChange(e.target.value as UserRole | '')}
          className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os perfis</option>
          <option value="user">Usuário</option>
          <option value="organizer">Organizador</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Perfil
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Cadastrado em
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-neutral-900">{user.full_name}</p>
                      {user.cpf && (
                        <p className="text-sm text-neutral-500">CPF: {user.cpf}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {user.email}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewUser(user.id)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
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
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">{user.full_name}</h3>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
              <p className="text-sm text-neutral-500">
                {formatDate(user.created_at)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewUser(user.id)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
