'use client'

import { useState } from 'react'
import { Mail, Phone, Calendar, Shield, Edit2, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Profile, UserRole } from '@/types'
import { formatDate } from '@/lib/utils'

interface UserDetailCardProps {
  user: Profile
  onUpdateRole?: (userId: string, newRole: UserRole) => Promise<void>
  canEditRole?: boolean
}

export function UserDetailCard({ user, onUpdateRole, canEditRole = false }: UserDetailCardProps) {
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handleSaveRole = async () => {
    if (!onUpdateRole || selectedRole === user.role) {
      setIsEditingRole(false)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdateRole(user.id, selectedRole)
      setIsEditingRole(false)
    } catch (error) {
      console.error('Error updating role:', error)
      setSelectedRole(user.role) // Reset to original
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setSelectedRole(user.role)
    setIsEditingRole(false)
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-3xl">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{user.full_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              {isEditingRole ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="px-3 py-1 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isUpdating}
                  >
                    <option value="user">Usuário</option>
                    <option value="organizer">Organizador</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveRole}
                    disabled={isUpdating}
                    title="Salvar"
                  >
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    title="Cancelar"
                  >
                    <X className="h-4 w-4 text-error" />
                  </Button>
                </div>
              ) : (
                <>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  {canEditRole && onUpdateRole && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingRole(true)}
                      title="Editar perfil"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-neutral-600">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{user.phone}</span>
              </div>
            )}
            {user.cpf && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Shield className="h-4 w-4" />
                <span className="text-sm">CPF: {user.cpf}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-neutral-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Cadastrado em {formatDate(user.created_at)}
              </span>
            </div>
            {user.date_of_birth && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Nascimento: {formatDate(user.date_of_birth)}
                </span>
              </div>
            )}
            {user.gender && (
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="text-sm">
                  Gênero: {user.gender === 'male' ? 'Masculino' : user.gender === 'female' ? 'Feminino' : 'Outro'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
