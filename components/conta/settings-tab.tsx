'use client'

import { useState } from 'react'
import { Key, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import type { UserPreferences, UserSession } from '@/types'

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
  onUpdate: (values: Partial<UserPreferences>) => Promise<{ error?: string }> | void
  onDeleteSession: (sessionId: string) => Promise<{ error?: string }> | void
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<{ error?: string }> | void
  onDeleteAccount: (password: string) => Promise<{ error?: string }> | void
}

export function SettingsTab({
  preferences,
  onUpdate,
  onPasswordChange,
  onDeleteAccount,
}: SettingsTabProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [deletePassword, setDeletePassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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
    </div>
  )
}

export default SettingsTab
