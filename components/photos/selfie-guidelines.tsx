'use client'

import { Sun, Eye, Glasses, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelfieGuidelinesProps {
  onContinue: () => void
}

const guidelines = [
  {
    icon: Sun,
    title: 'Boa iluminação',
    description: 'Posicione-se em um local bem iluminado',
  },
  {
    icon: Eye,
    title: 'Olhe para a câmera',
    description: 'Mantenha o rosto de frente e olhe diretamente',
  },
  {
    icon: Glasses,
    title: 'Sem acessórios',
    description: 'Remova óculos escuros, chapéu ou máscara',
  },
  {
    icon: User,
    title: 'Apenas você',
    description: 'Certifique-se de que só você está na foto',
  },
]

export function SelfieGuidelines({ onContinue }: SelfieGuidelinesProps) {
  return (
    <div className="flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Dicas para melhores resultados
        </h3>
        <p className="text-sm text-neutral-500">
          Siga estas orientações para encontrarmos suas fotos com mais precisão
        </p>
      </div>

      {/* Guidelines grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
        {guidelines.map((guideline) => (
          <div
            key={guideline.title}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-neutral-50 border border-neutral-100"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
              <guideline.icon className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-neutral-900 text-sm mb-1">
              {guideline.title}
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {guideline.description}
            </p>
          </div>
        ))}
      </div>

      {/* Visual example */}
      <div className="w-full max-w-md mb-8">
        <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-200 flex items-center justify-center overflow-hidden">
          {/* Simulated face outline */}
          <div className="w-24 h-32 rounded-[50%] border-2 border-dashed border-neutral-400 flex items-center justify-center">
            <User className="w-12 h-12 text-neutral-400" />
          </div>
          {/* Corner guides */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-orange-500 rounded-tl" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-orange-500 rounded-tr" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-orange-500 rounded-bl" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-orange-500 rounded-br" />
        </div>
        <p className="text-xs text-neutral-500 text-center mt-2">
          Centralize seu rosto dentro da área indicada
        </p>
      </div>

      {/* Continue button */}
      <Button
        onClick={onContinue}
        className="w-full max-w-md bg-orange-500 hover:bg-orange-600 text-white"
        size="lg"
      >
        Continuar
      </Button>
    </div>
  )
}
