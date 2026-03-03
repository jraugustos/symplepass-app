'use client'

import { useState, useEffect } from 'react'
import { Eye, Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserRole } from '@/types/database.types'
import { Profile } from '@/types'
import { formatDate } from '@/lib/utils'
import { getAllSports } from '@/lib/constants/sports'

interface UsersTableProps {
  users: Profile[]
  total: number
  currentPage: number
  pageSize: number
  initialFilters: {
    role?: UserRole | ''
    search?: string
    city?: string
    preferred_sport?: string
    event_sport?: string
    is_benefits_club_member?: boolean
  }
  availableCities?: { value: string; label: string }[]
  onViewUser: (userId: string) => void
  onFilterChange?: (filters: any) => void
}

export function UsersTable({ users, total, currentPage, pageSize, initialFilters, availableCities = [], onViewUser, onFilterChange }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState(initialFilters?.search || '')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>(initialFilters?.role || '')
  const [cityFilter, setCityFilter] = useState(initialFilters?.city || '')
  const [sportFilter, setSportFilter] = useState(initialFilters?.preferred_sport || '')
  const [eventSportFilter, setEventSportFilter] = useState(initialFilters?.event_sport || '')
  const [clubFilter, setClubFilter] = useState<'all' | 'true' | 'false'>(
    initialFilters?.is_benefits_club_member === true ? 'true' :
      initialFilters?.is_benefits_club_member === false ? 'false' : 'all'
  )
  const [showFilters, setShowFilters] = useState(false)

  const sportsList = getAllSports().sort((a, b) => a.label.localeCompare(b.label))

  const handleApplyFilters = () => {
    onFilterChange?.({
      search: searchTerm,
      role: roleFilter || undefined,
      city: cityFilter || undefined,
      preferred_sport: sportFilter || undefined,
      event_sport: eventSportFilter || undefined,
      is_benefits_club_member: clubFilter === 'all' ? undefined : clubFilter === 'true',
      page: 1
    })
  }

  const handlePageChange = (newPage: number) => {
    onFilterChange?.({
      search: searchTerm,
      role: roleFilter || undefined,
      city: cityFilter || undefined,
      preferred_sport: sportFilter || undefined,
      event_sport: eventSportFilter || undefined,
      is_benefits_club_member: clubFilter === 'all' ? undefined : clubFilter === 'true',
      page: newPage
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters()
    }
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

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (roleFilter) params.append('role', roleFilter)
    if (cityFilter) params.append('city', cityFilter)
    if (sportFilter) params.append('preferred_sport', sportFilter)
    if (eventSportFilter) params.append('event_sport', eventSportFilter)
    if (clubFilter !== 'all') params.append('is_benefits_club_member', clubFilter === 'true' ? 'true' : 'false')

    window.open(`/api/admin/users/export?${params.toString()}`, '_blank')
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
        </Button>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 border-r pr-1 mr-2" />
          Exportar CSV
        </Button>
        <Button onClick={handleApplyFilters}>Buscar</Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Perfil</label>
            <SearchableSelect
              options={[
                { value: 'user', label: 'Usuário' },
                { value: 'organizer', label: 'Organizador' },
                { value: 'admin', label: 'Admin' },
              ]}
              value={roleFilter}
              onChange={(val) => setRoleFilter((val as UserRole) || '')}
              placeholder="Todos os perfis"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Cidade</label>
            <SearchableSelect
              options={availableCities}
              value={cityFilter}
              onChange={(val) => setCityFilter(val || '')}
              placeholder="Todas as cidades"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Preferência de esporte</label>
            <SearchableSelect
              options={sportsList}
              value={sportFilter}
              onChange={(val) => setSportFilter(val || '')}
              placeholder="Todos os Esportes"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Tipo de evento que já participou</label>
            <SearchableSelect
              options={sportsList}
              value={eventSportFilter}
              onChange={(val) => setEventSportFilter(val || '')}
              placeholder="Todos os Esportes"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Clube de Benefício</label>
            <SearchableSelect
              options={[
                { value: 'true', label: 'Membro Ativo' },
                { value: 'false', label: 'Não Membro' },
              ]}
              value={clubFilter === 'all' ? '' : clubFilter}
              onChange={(val) => setClubFilter((val as 'true' | 'false') || 'all')}
              placeholder="Todos"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-10 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-neutral-500">Nenhum usuário encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Desktop Table */}
      {users.length > 0 && (
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
      )}

      {/* Mobile Cards */}
      {users.length > 0 && (
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
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-neutral-200 rounded-lg sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, total)}
                </span>{' '}
                de <span className="font-medium">{total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="flex items-center gap-2" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  iconOnly
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium text-neutral-700 px-2">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  iconOnly
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>

          {/* Mobile pagination */}
          <div className="flex flex-1 items-center justify-between sm:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-neutral-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
