import { Metadata } from 'next'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ContactForm } from '@/components/forms/contact-form'

export const metadata: Metadata = {
    title: 'Contato | SymplePass',
    description: 'Entre em contato com a equipe da SymplePass. Estamos prontos para ajudar.',
}

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Header variant="transparent" className="absolute top-0 left-0 right-0 z-50 border-b-0" />

            {/* Hero Section */}
            <section className="bg-neutral-900 pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/assets/hero-pattern.svg')] opacity-5"></div>
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/20 rounded-full mix-blend-screen filter blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] -translate-x-1/2 translate-y-1/2"></div>

                <div className="container-custom mx-auto relative z-10 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-geist text-white mb-6">
                        Como podemos ajudar?
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-inter leading-relaxed">
                        Tem alguma dúvida, sugestão ou precisa de ajuda com seu evento? Nossa equipe especializada está pronta para atender você.
                    </p>
                </div>
            </section>

            <div className="flex-grow container-custom mx-auto py-12 md:py-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Contact Info Cards (Left Side) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Main Contact Card */}
                        <div className="bg-white p-8 rounded-2xl shadow-custom-lg border border-neutral-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full mix-blend-multiply filter blur-2xl opacity-50 -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>

                            <h3 className="text-xl font-bold font-geist text-neutral-900 mb-6 relative z-10">Canais de Atendimento</h3>

                            <div className="space-y-6 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-neutral-500 mb-1">E-mail</p>
                                        <a href="mailto:contato@symplepass.com.br" className="text-neutral-900 font-semibold hover:text-orange-600 transition-colors text-sm sm:text-base break-all">
                                            contato@symplepass.com.br
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500 mb-1">Telefone</p>
                                        <a href="tel:+5511999999999" className="text-neutral-900 font-semibold hover:text-orange-600 transition-colors">
                                            (11) 99999-9999
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500 mb-1">Escritório</p>
                                        <p className="text-neutral-900 font-medium">
                                            Santos, SP - Brasil
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Card */}
                        <div className="bg-neutral-900 p-8 rounded-2xl shadow-custom-lg border border-neutral-800 text-white relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full mix-blend-overlay filter blur-2xl -mr-10 -mb-10"></div>

                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white mb-6">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold font-geist mb-2">Horário de Atendimento</h3>
                                <p className="text-neutral-400 text-sm mb-6">
                                    Nossa equipe está disponível para ajudar você nos seguintes horários:
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-neutral-400">Segunda a Sexta</span>
                                        <span className="font-medium">09:00 - 18:00</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-neutral-400">Sábado</span>
                                        <span className="font-medium">09:00 - 13:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Domingo</span>
                                        <span className="font-medium text-orange-400">Fechado</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form (Right Side) */}
                    <div className="lg:col-span-8">
                        <ContactForm />
                    </div>
                </div>
            </div>

            <Footer variant="light" />
        </div>
    )
}
