'use client'

import { Tag, Clock, Crown, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ClubBenefits() {
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
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16" data-animate style={{ animation: 'fadeSlideIn 1.0s ease-out 0.2s both' }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Clube de Benefícios</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              Vantagens exclusivas
            </span>
            <br />
            para membros
          </h2>

          {/* Description */}
          <p className="text-lg text-neutral-600 leading-relaxed">
            Faça parte do Clube Symplepass e aproveite benefícios únicos para aprimorar sua experiência esportiva
          </p>
        </div>

        {/* Benefits Grid */}
        <div
          className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 mb-12"
          data-animate
          style={{ animation: 'fadeSlideIn 1.0s ease-out 0.3s both' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              const delay = 0.4 + index * 0.1
              return (
                <div
                  key={benefit.title}
                  data-animate
                  style={{ animation: `fadeSlideIn 1.0s ease-out ${delay}s both` }}
                  className="flex gap-4 p-6 rounded-2xl border border-transparent hover:border-neutral-200 hover:bg-neutral-50 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 font-geist">
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

        {/* CTA Button */}
        <div className="text-center" data-animate style={{ animation: 'fadeSlideIn 1.0s ease-out 0.8s both' }}>
          <Button
            variant="primary"
            size="lg"
            disabled
            className="bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-lg"
          >
            Em breve
          </Button>
        </div>
      </div>
    </section>
  )
}
