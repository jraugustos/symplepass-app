'use client'

import { Search, MousePointerClick, Package, Download } from 'lucide-react'

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Encontre seu evento',
    description: 'Navegue pelos eventos encerrados e encontre aquele em que você participou.',
  },
  {
    number: 2,
    icon: MousePointerClick,
    title: 'Selecione suas fotos',
    description: 'Escolha as fotos que mais gostou. Você pode visualizar todas antes de decidir.',
  },
  {
    number: 3,
    icon: Package,
    title: 'Aproveite os pacotes',
    description: 'Quanto mais fotos você escolher, melhor o valor. Confira nossos pacotes promocionais.',
  },
  {
    number: 4,
    icon: Download,
    title: 'Receba em alta qualidade',
    description: 'Após o pagamento, você recebe o link para download das imagens em alta resolução.',
  },
]

export function PhotoPurchaseSteps() {
  return (
    <section className="py-12 bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold font-geist text-neutral-900 mb-3">
            Como funciona
          </h2>
          <p className="text-neutral-600 font-inter max-w-2xl mx-auto">
            Adquirir suas fotos é simples e rápido. Siga os passos abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center p-6"
            >
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-orange-200 to-orange-100" />
              )}

              {/* Step number with icon */}
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                <step.icon className="w-7 h-7 text-white" />
              </div>

              {/* Step number badge */}
              <span className="absolute top-4 right-1/2 translate-x-10 -translate-y-1 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center border-2 border-white shadow-sm">
                {step.number}
              </span>

              {/* Content */}
              <h3 className="text-lg font-semibold font-geist text-neutral-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-neutral-600 font-inter leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
