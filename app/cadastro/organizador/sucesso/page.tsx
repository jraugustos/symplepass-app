'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Settings, ArrowRight } from 'lucide-react'

export default function OrganizerSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <img
                            src="/assets/symplepass-color.svg"
                            alt="SymplePass"
                            className="h-10 w-auto mx-auto"
                        />
                    </Link>
                </div>

                {/* Success Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                        Bem-vindo ao SymplePass!
                    </h1>
                    <p className="text-neutral-600 mb-8">
                        Sua conta de organizador foi criada com sucesso. Agora você pode começar a criar eventos incríveis.
                    </p>

                    {/* Next Steps */}
                    <div className="bg-neutral-50 rounded-xl p-6 mb-8 text-left">
                        <h2 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">
                            Próximos passos
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">Crie seu primeiro evento</p>
                                    <p className="text-sm text-neutral-600">Defina as categorias, preços e detalhes do seu evento</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Settings className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">Aguarde aprovação</p>
                                    <p className="text-sm text-neutral-600">Nossa equipe irá revisar e aprovar seu evento em até 24h</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* CTA Button */}
                    <Button asChild className="w-full">
                        <Link href="/admin/dashboard">
                            Acessar meu painel
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>

                    <p className="text-sm text-neutral-500 mt-4">
                        Precisa de ajuda?{' '}
                        <a href="mailto:suporte@symplepass.com" className="text-orange-600 hover:underline">
                            Entre em contato
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
