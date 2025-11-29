'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { CustomSelect } from '@/components/ui/select'
import { formatPhoneNumber } from '@/lib/utils'
import type { Profile } from '@/types'

type PersonalDataForm = {
  full_name: string
  email: string
  cpf?: string | null
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
}

type PersonalDataTabProps = {
  profile: Profile
  onUpdate: (data: Partial<PersonalDataForm>) => Promise<{ error?: string }> | void
}

const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
  { value: 'outro', label: 'Outro' },
]

export function PersonalDataTab({ profile, onUpdate }: PersonalDataTabProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PersonalDataForm>({
    defaultValues: {
      full_name: profile.full_name,
      email: profile.email,
      cpf: profile.cpf,
      phone: profile.phone ?? '',
      date_of_birth: profile.date_of_birth ?? '',
      gender: profile.gender ?? undefined,
    },
  })

  const onSubmit = async (values: PersonalDataForm) => {
    setFeedback(null)

    const payload = {
      full_name: values.full_name?.trim(),
      phone: values.phone?.replace(/\D/g, '').length ? values.phone : null,
      date_of_birth: values.date_of_birth || null,
      gender: values.gender || null,
    }

    const result = await onUpdate(payload)

    if (result && 'error' in result && result.error) {
      setFeedback(result.error)
    } else {
      setFeedback('Dados atualizados com sucesso!')
    }
  }

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setValue('phone', formatPhoneNumber(value))
  }

  const handleDownloadDocument = async () => {
    try {
      const response = await fetch('/api/user/profile?download=1')
      if (!response.ok) throw new Error('Erro ao gerar documento')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'comprovante-cadastro.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      setFeedback('Não foi possível gerar o documento agora.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Dados pessoais
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900">Mantenha seu perfil atualizado</h2>
        <p className="text-sm text-neutral-500">
          Suas informações ajudam os organizadores a oferecer experiências personalizadas e seguras.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="Nome completo" required>
            <Input placeholder="Seu nome" {...register('full_name', { required: 'Campo obrigatório' })} />
            {errors.full_name && (
              <p className="text-xs text-error-500">{errors.full_name.message}</p>
            )}
          </FormField>

          <FormField label="Email" helperText="Seu email não pode ser alterado">
            <Input disabled value={profile.email} readOnly />
          </FormField>

          <FormField
            label="CPF"
            helperText={profile.cpf ? 'Documento validado' : 'Informe seu CPF para notas fiscais'}
          >
            <Input
              placeholder="000.000.000-00"
              disabled={!!profile.cpf}
              {...register('cpf')}
            />
          </FormField>

          <FormField label="Telefone" helperText="Usado para notificações importantes">
            <Input
              placeholder="(11) 97777-0000"
              {...register('phone')}
              onChange={handlePhoneChange}
              value={watch('phone') || ''}
            />
          </FormField>

          <FormField label="Data de nascimento">
            <Input type="date" {...register('date_of_birth')} />
          </FormField>

          <FormField label="Gênero">
            <CustomSelect
              options={genderOptions}
              value={watch('gender') || ''}
              onChange={(value) => setValue('gender', value)}
              placeholder="Selecione"
            />
          </FormField>
        </div>

        {feedback && (
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {feedback}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" isLoading={isSubmitting} className="rounded-xl px-6 py-3 text-base">
            Salvar alterações
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"
            onClick={() => handleSubmit(onSubmit)()}
          >
            Revisar antes
          </Button>
        </div>
      </form>

      <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Documentos</p>
            <h3 className="text-xl font-semibold text-neutral-900">Comprovante de cadastro</h3>
            <p className="text-sm text-neutral-500">
              Baixe um resumo do seu perfil com dados atualizados
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl bg-white text-neutral-900"
            onClick={handleDownloadDocument}
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
          <FileText className="h-5 w-5 text-neutral-400" />
          Documento atualizado automaticamente após cada alteração aprovada.
        </div>
      </section>
    </div>
  )
}

export default PersonalDataTab
