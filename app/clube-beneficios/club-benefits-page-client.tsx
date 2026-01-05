'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Tag,
  Clock,
  Crown,
  Users,
  Sparkles,
  Check,
  Plus,
  Shield,
  Percent,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateShort } from '@/lib/utils'
import type { Subscription } from '@/types/database.types'

interface ClubBenefitsPageClientProps {
  isAuthenticated: boolean
  subscription: Subscription | null
}

export function ClubBenefitsPageClient({
  isAuthenticated,
  subscription,
}: ClubBenefitsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showCanceledToast, setShowCanceledToast] = useState(false)

  const isActiveMember = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isCanceledButActive = isActiveMember && subscription?.cancel_at_period_end

  // Handle success/canceled query params
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      setShowSuccessToast(true)
      // Clean URL
      router.replace('/clube-beneficios', { scroll: false })
      setTimeout(() => setShowSuccessToast(false), 5000)
    }

    if (canceled === 'true') {
      setShowCanceledToast(true)
      router.replace('/clube-beneficios', { scroll: false })
      setTimeout(() => setShowCanceledToast(false), 5000)
    }
  }, [searchParams, router])

  async function handleSubscribe() {
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/clube-beneficios')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/club/create-subscription', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao iniciar assinatura')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManageSubscription() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/club/customer-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao acessar portal')
        return
      }

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReactivateSubscription() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/club/reactivate-subscription', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao reativar assinatura')
        return
      }

      // Reload to get updated subscription status
      window.location.reload()
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    {
      icon: Tag,
      title: 'Desconto em estabelecimentos',
      description: 'Parceiros exclusivos com descontos especiais em produtos e serviços esportivos.',
    },
    {
      icon: Clock,
      title: 'Inscrições antecipadas',
      description: 'Acesso prioritário às inscrições dos eventos mais concorridos.',
    },
    {
      icon: Crown,
      title: 'Inscrições mais baratas',
      description: 'Descontos exclusivos em todas as inscrições de eventos da plataforma.',
    },
    {
      icon: Users,
      title: 'Suporte profissional',
      description: 'Atendimento dedicado e suporte técnico especializado para membros.',
    },
    {
      icon: Percent,
      title: 'Descontos progressivos',
      description: 'Quanto mais eventos você participa, maiores os descontos acumulados.',
    },
    {
      icon: Calendar,
      title: 'Eventos exclusivos',
      description: 'Acesso a eventos e treinos exclusivos para membros do clube.',
    },
  ]

  const planFeatures = [
    'Desconto de 10% em todas as inscrições',
    'Acesso antecipado a novos eventos',
    'Descontos em estabelecimentos parceiros',
    'Suporte prioritário via WhatsApp',
    'Acesso a eventos exclusivos do clube',
    'Cancele quando quiser, sem multa',
  ]

  const regulations = [
    {
      title: '1. Adesão ao Clube',
      content: `O Clube de Benefícios Symplepass é um programa de assinatura mensal que oferece vantagens exclusivas aos seus membros. A adesão é feita através da plataforma Symplepass mediante pagamento da mensalidade de R$ 15,00. Ao aderir, o membro concorda com todas as condições estabelecidas neste regulamento. A assinatura é individual e intransferível, vinculada ao CPF do titular cadastrado na plataforma.`,
    },
    {
      title: '2. Benefícios do Clube',
      content: `Os membros do clube têm direito a: (a) Desconto de 10% em todas as inscrições de eventos realizados na plataforma Symplepass; (b) Período de inscrição antecipada em eventos selecionados; (c) Descontos especiais em estabelecimentos parceiros mediante apresentação de comprovante de membro; (d) Atendimento prioritário pelo suporte da plataforma; (e) Acesso a eventos e atividades exclusivas do clube quando disponíveis. Os benefícios podem ser alterados mediante comunicação prévia aos membros.`,
    },
    {
      title: '3. Regras de Uso dos Descontos',
      content: `Os descontos em inscrições de eventos são aplicados automaticamente no momento do checkout para membros com assinatura ativa. O desconto de 10% incide sobre o valor da inscrição, não sendo cumulativo com cupons promocionais ou outras promoções do evento, salvo quando expressamente indicado. Os descontos em estabelecimentos parceiros devem ser solicitados no momento da compra/contratação, mediante apresentação do comprovante de membro ativo disponível no painel do usuário. Cada estabelecimento parceiro pode definir condições específicas de uso.`,
    },
    {
      title: '4. Vigência e Cancelamento',
      content: `A assinatura tem renovação automática mensal na data de adesão. O membro pode cancelar a qualquer momento através do painel do usuário ou portal de pagamentos, sem multa ou taxa de cancelamento. Ao cancelar, os benefícios permanecem ativos até o final do período já pago. Não há reembolso proporcional de mensalidades. Após o cancelamento, o membro pode reativar a assinatura a qualquer momento, sem necessidade de novo cadastro.`,
    },
    {
      title: '5. Condições Gerais',
      content: `A Symplepass reserva-se o direito de: (a) Modificar os benefícios oferecidos mediante comunicação prévia de 30 dias; (b) Suspender ou cancelar a assinatura em caso de fraude ou uso indevido; (c) Alterar o valor da mensalidade mediante comunicação prévia de 60 dias, permitindo ao membro cancelar sem ônus. O descumprimento das regras de uso pode resultar em suspensão dos benefícios. Dúvidas e solicitações devem ser encaminhadas através dos canais oficiais de atendimento.`,
    },
    {
      title: '6. Privacidade e Dados',
      content: `Os dados pessoais dos membros são tratados conforme a Política de Privacidade da Symplepass, em conformidade com a Lei Geral de Proteção de Dados (LGPD). As informações de pagamento são processadas de forma segura através do Stripe, não sendo armazenadas nos servidores da Symplepass. O membro pode solicitar a exclusão de seus dados a qualquer momento, respeitando as obrigações legais de guarda de informações.`,
    },
  ]

  const faqs = [
    {
      question: 'Como funciona a assinatura?',
      answer: 'A assinatura é mensal e custa R$ 15,00. O pagamento é processado automaticamente todo mês na data de adesão. Você pode cancelar a qualquer momento pelo painel do usuário, sem multa.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim! Não existe fidelidade ou multa. Ao cancelar, seus benefícios continuam ativos até o final do período já pago. Você pode reativar quando quiser.',
    },
    {
      question: 'Os descontos são cumulativos com cupons?',
      answer: 'Não, o desconto de membro (10%) não é cumulativo com cupons promocionais. Será aplicado o maior desconto entre as opções disponíveis, garantindo sempre a melhor oferta.',
    },
    {
      question: 'Como uso meus benefícios em parceiros?',
      answer: 'Acesse seu painel de usuário em /conta e baixe seu comprovante de membro. Apresente no estabelecimento parceiro antes de fechar a compra para garantir o desconto.',
    },
    {
      question: 'O que acontece se eu cancelar?',
      answer: 'Ao cancelar, você continua com acesso aos benefícios até o fim do período pago. Após isso, sua conta volta ao status normal, sem os benefícios do clube. Você pode reativar a qualquer momento.',
    },
    {
      question: 'O desconto já é aplicado automaticamente?',
      answer: 'Sim! Ao fazer uma inscrição em qualquer evento da plataforma, o desconto de 10% é aplicado automaticamente no checkout se você for membro ativo do clube.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className="bg-success text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">Assinatura realizada com sucesso!</span>
          </div>
        </div>
      )}

      {/* Canceled Toast */}
      {showCanceledToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className="bg-neutral-800 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Checkout cancelado</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-12 pb-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Clube de Benefícios</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                Vantagens exclusivas
              </span>
              <br />
              para quem vive o esporte
            </h1>

            {/* Description */}
            <p className="text-lg text-neutral-600 leading-relaxed mb-8">
              Assine o Clube Symplepass e tenha descontos em inscrições, acesso antecipado a eventos
              e benefícios exclusivos em estabelecimentos parceiros.
            </p>

            {/* Member Status or CTA */}
            {isActiveMember ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Você é Membro Ativo</span>
                </div>
                {isCanceledButActive ? (
                  <p className="text-warning-600 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Sua assinatura expira em {formatDateShort(subscription!.current_period_end)}
                  </p>
                ) : (
                  <p className="text-neutral-500">
                    Renovação automática em {formatDateShort(subscription!.current_period_end)}
                  </p>
                )}
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                  >
                    Gerenciar Assinatura
                  </Button>
                  {isCanceledButActive ? (
                    <Button
                      variant="primary"
                      onClick={handleReactivateSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Carregando...' : 'Reativar Assinatura'}
                    </Button>
                  ) : (
                    <Link href="/conta#config">
                      <Button variant="secondary">Meu Painel</Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="shadow-lg"
                >
                  {isLoading ? 'Carregando...' : 'Assinar por R$ 15/mês'}
                </Button>
                {!isAuthenticated && (
                  <p className="text-sm text-neutral-500">
                    Você será redirecionado para fazer login
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="mt-4 text-error-600 text-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Benefícios do Clube
            </h2>
            <p className="text-lg text-neutral-600">
              Tudo o que você ganha ao se tornar membro
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={benefit.title}
                    className="flex gap-4 p-6 rounded-2xl border border-transparent hover:border-neutral-200 hover:bg-neutral-50 transition-all duration-300"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Plan Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Plano Mensal
            </h2>
            <p className="text-lg text-neutral-600">
              Simples, sem fidelidade e com cancelamento fácil
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-3xl border-2 border-orange-200 shadow-[0_25px_60px_rgba(15,23,42,0.08)] overflow-hidden">
              {/* Plan Header */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-center text-white">
                <Crown className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Clube Symplepass</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">R$ 15</span>
                  <span className="text-lg opacity-80">/mês</span>
                </div>
              </div>

              {/* Plan Features */}
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {planFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Plan CTA */}
                {isActiveMember ? (
                  <div className="text-center">
                    <Badge variant="success" size="lg" className="mb-3">
                      <Check className="w-4 h-4" />
                      Você já é membro
                    </Badge>
                    <p className="text-sm text-neutral-500">
                      Gerencie sua assinatura no painel do usuário
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleSubscribe}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Carregando...' : 'Assinar Agora'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulation Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full mb-4">
              <Shield className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-600">Regulamento</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Termos e Condições
            </h2>
            <p className="text-lg text-neutral-600">
              Leia atentamente as regras do Clube de Benefícios
            </p>
          </div>

          <div className="space-y-3">
            {regulations.map((reg) => (
              <details
                key={reg.title}
                className="group rounded-xl border border-neutral-200 bg-white p-4 open:shadow-sm transition-shadow"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium text-neutral-900 list-none">
                  <span>{reg.title}</span>
                  <Plus className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-45" />
                </summary>
                <div className="mt-3 text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {reg.content}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-neutral-600">
              Tire suas dúvidas sobre o Clube de Benefícios
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-neutral-200 bg-white p-4 open:shadow-sm transition-shadow"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium text-neutral-900 list-none">
                  <span>{faq.question}</span>
                  <Plus className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-45" />
                </summary>
                <div className="mt-3 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      {!isActiveMember && (
        <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Crown className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Comece a economizar hoje
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Junte-se a milhares de atletas que já aproveitam os benefícios do clube
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSubscribe}
              disabled={isLoading}
              className="bg-white text-orange-600 hover:bg-neutral-100"
            >
              {isLoading ? 'Carregando...' : 'Assinar por R$ 15/mês'}
            </Button>
          </div>
        </section>
      )}
    </main>
  )
}
