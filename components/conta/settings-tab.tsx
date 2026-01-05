'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, Trash2, Crown, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, FormField } from '@/components/ui/input'
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { formatDateShort } from '@/lib/utils'
import type { UserPreferences, UserSession, Subscription } from '@/types'

type ToggleProps = {
  checked: boolean
  onToggle: () => void
}

function PreferenceToggle({ checked, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? 'bg-emerald-500' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

type SettingsTabProps = {
  preferences: UserPreferences
  sessions: UserSession[]
  subscription: Subscription | null
  onUpdate: (values: Partial<UserPreferences>) => Promise<{ error?: string }> | void
  onDeleteSession: (sessionId: string) => Promise<{ error?: string }> | void
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<{ error?: string }> | void
  onDeleteAccount: (password: string) => Promise<{ error?: string }> | void
  onSubscriptionUpdate: (subscription: Subscription | null) => void
}

export function SettingsTab({
  preferences,
  subscription,
  onUpdate,
  onPasswordChange,
  onDeleteAccount,
  onSubscriptionUpdate,
}: SettingsTabProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [cancelSubscriptionModalOpen, setCancelSubscriptionModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [deletePassword, setDeletePassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)

  const isActiveMember = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isCanceledButActive = isActiveMember && subscription?.cancel_at_period_end

  const handlePreferencesUpdate = async (values: Partial<UserPreferences>) => {
    const result = await onUpdate(values)
    if (result && 'error' in result && result.error) {
      setStatusMessage(result.error)
    } else {
      setStatusMessage('Preferências salvas!')
    }
  }

  const handleNotificationToggle = async (key: 'notification_events' | 'notification_promotions') => {
    await handlePreferencesUpdate({ [key]: !preferences[key] } as Partial<UserPreferences>)
  }

  const handlePasswordUpdate = async () => {
    if (passwordForm.next !== passwordForm.confirm) {
      setStatusMessage('As senhas não coincidem')
      return
    }
    if (passwordForm.next.length < 6) {
      setStatusMessage('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    setIsProcessing(true)
    const result = await onPasswordChange(passwordForm.current, passwordForm.next)
    if (result && 'error' in result && result.error) {
      setStatusMessage(result.error)
    } else {
      setStatusMessage('Senha atualizada com sucesso!')
      setPasswordModalOpen(false)
      setPasswordForm({ current: '', next: '', confirm: '' })
    }
    setIsProcessing(false)
  }

  const handleAccountDeletion = async () => {
    setIsProcessing(true)
    const result = await onDeleteAccount(deletePassword)
    if (result && 'error' in result && result.error) {
      setStatusMessage(result.error)
    } else {
      setStatusMessage('Conta excluída. Você será desconectado.')
    }
    setIsProcessing(false)
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/profile?download=1')
      if (!response.ok) throw new Error('Não foi possível exportar seus dados')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'symplepass-dados.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setStatusMessage('Dados exportados com sucesso!')
    } catch (error) {
      console.error(error)
      setStatusMessage('Não foi possível exportar seus dados agora.')
    }
  }

  const handleManageSubscription = async () => {
    setIsSubscriptionLoading(true)
    try {
      const response = await fetch('/api/club/customer-portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        setStatusMessage(data.error || 'Erro ao acessar portal')
        return
      }
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      setStatusMessage('Erro ao conectar com o servidor')
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsSubscriptionLoading(true)
    try {
      const response = await fetch('/api/club/cancel-subscription', {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        setStatusMessage(data.error || 'Erro ao cancelar assinatura')
        return
      }
      if (data.subscription) {
        onSubscriptionUpdate(data.subscription)
      }
      setStatusMessage('Assinatura cancelada. Você terá acesso aos benefícios até o fim do período pago.')
      setCancelSubscriptionModalOpen(false)
    } catch (error) {
      setStatusMessage('Erro ao conectar com o servidor')
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setIsSubscriptionLoading(true)
    try {
      const response = await fetch('/api/club/reactivate-subscription', {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        setStatusMessage(data.error || 'Erro ao reativar assinatura')
        return
      }
      if (data.subscription) {
        onSubscriptionUpdate(data.subscription)
      }
      setStatusMessage('Assinatura reativada com sucesso!')
    } catch (error) {
      setStatusMessage('Erro ao conectar com o servidor')
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <h3 className="text-xl font-semibold text-neutral-900">Notificações</h3>
          <p className="text-sm text-neutral-500">
            Escolha como deseja ser avisado sobre eventos, inscrições e novidades
          </p>
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div>
                <p className="font-medium text-neutral-900">Alertas de inscrições e eventos</p>
                <p className="text-sm text-neutral-500">
                  Receba confirmações, lembretes e informações importantes
                </p>
              </div>
              <PreferenceToggle
                checked={preferences.notification_events}
                onToggle={() => handleNotificationToggle('notification_events')}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div>
                <p className="font-medium text-neutral-900">Novidades e promoções</p>
                <p className="text-sm text-neutral-500">
                  Fique sabendo antes de novos eventos e condições especiais
                </p>
              </div>
              <PreferenceToggle
                checked={preferences.notification_promotions}
                onToggle={() => handleNotificationToggle('notification_promotions')}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100">
              <Key className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Alterar senha</h3>
              <p className="text-sm text-neutral-500">Atualize sua senha de acesso</p>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            Por segurança, recomendamos que você altere sua senha periodicamente e use uma combinação de letras, números e caracteres especiais.
          </p>
          <Button variant="secondary" className="rounded-xl" onClick={() => setPasswordModalOpen(true)}>
            Alterar senha
          </Button>
        </section>
      </div>

      {/* Club Benefits Section */}
      <section className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-[0_25px_60px_rgba(249,115,22,0.08)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Clube de Benefícios</h3>
            {isActiveMember ? (
              <Badge variant="success" size="sm">Assinatura Ativa</Badge>
            ) : (
              <p className="text-sm text-neutral-500">Descontos exclusivos em eventos</p>
            )}
          </div>
        </div>

        {isActiveMember && subscription ? (
          <div className="space-y-4">
            {isCanceledButActive ? (
              <div className="flex items-center gap-2 text-warning-600 bg-warning/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Sua assinatura será cancelada em {formatDateShort(subscription.current_period_end)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-neutral-600">
                Renovação automática em {formatDateShort(subscription.current_period_end)}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={handleManageSubscription}
                disabled={isSubscriptionLoading}
              >
                <ExternalLink className="w-4 h-4" />
                {isSubscriptionLoading ? 'Carregando...' : 'Gerenciar Assinatura'}
              </Button>
              {isCanceledButActive ? (
                <Button
                  variant="primary"
                  className="rounded-xl"
                  onClick={handleReactivateSubscription}
                  disabled={isSubscriptionLoading}
                >
                  <Crown className="w-4 h-4" />
                  {isSubscriptionLoading ? 'Carregando...' : 'Reativar Assinatura'}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="rounded-xl text-neutral-500 hover:text-error-600"
                  onClick={() => setCancelSubscriptionModalOpen(true)}
                  disabled={isSubscriptionLoading}
                >
                  Cancelar Assinatura
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Assine o Clube Symplepass por R$ 15/mês e tenha 10% de desconto em todas as inscrições,
              acesso antecipado a eventos e descontos em estabelecimentos parceiros.
            </p>
            <Link href="/clube-beneficios">
              <Button variant="primary" className="rounded-xl">
                <Crown className="w-4 h-4" />
                Assinar por R$ 15/mês
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-[0_25px_60px_rgba(239,68,68,0.18)] space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-red-900">Privacidade e dados</h3>
          <p className="text-sm text-red-800">
            Exporte seus dados ou exclua sua conta permanentemente
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            className="rounded-xl border border-red-200 bg-white text-red-700"
            onClick={handleExportData}
          >
            Exportar meus dados
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir conta
          </Button>
        </div>
      </section>

      {statusMessage && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {statusMessage}
        </div>
      )}

      <Modal open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <ModalHeader onClose={() => setPasswordModalOpen(false)}>
          <ModalTitle>Atualizar senha</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <FormField label="Senha atual">
            <Input
              type="password"
              value={passwordForm.current}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, current: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Nova senha">
            <Input
              type="password"
              value={passwordForm.next}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
            />
          </FormField>
          <FormField label="Confirmar nova senha">
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
            />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>
            Cancelar
          </Button>
          <Button isLoading={isProcessing} onClick={handlePasswordUpdate}>
            Atualizar senha
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalHeader onClose={() => setDeleteModalOpen(false)}>
          <ModalTitle>Excluir conta</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 text-sm text-neutral-700">
          <p>
            Esta ação é permanente e remove seu acesso ao Symplepass. Informe sua senha para confirmar.
          </p>
          <FormField label="Senha">
            <Input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
            />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" isLoading={isProcessing} onClick={handleAccountDeletion}>
            Excluir definitivamente
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal open={cancelSubscriptionModalOpen} onOpenChange={setCancelSubscriptionModalOpen}>
        <ModalHeader onClose={() => setCancelSubscriptionModalOpen(false)}>
          <ModalTitle>Cancelar Assinatura</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 text-sm text-neutral-700">
          <p>
            Tem certeza que deseja cancelar sua assinatura do Clube de Benefícios?
          </p>
          {subscription && (
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <p className="font-medium text-neutral-900 mb-1">O que acontece ao cancelar:</p>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Seus benefícios continuam ativos até {formatDateShort(subscription.current_period_end)}</li>
                <li>• Após essa data, você perderá os descontos em inscrições</li>
                <li>• Você pode reativar a qualquer momento</li>
              </ul>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCancelSubscriptionModalOpen(false)}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            isLoading={isSubscriptionLoading}
            onClick={handleCancelSubscription}
          >
            Confirmar Cancelamento
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default SettingsTab
