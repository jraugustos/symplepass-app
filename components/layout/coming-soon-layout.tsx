import React from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Mail, Phone } from 'lucide-react'

interface ComingSoonLayoutProps {
    title: string
    description: string
    showContact?: boolean
}

export function ComingSoonLayout({ title, description, showContact = false }: ComingSoonLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header variant="transparent" className="absolute top-0 left-0 right-0 z-50 border-b-0" />

            {/* Hero Section with Gradient */}
            <div className="relative text-white pt-32 pb-32 md:pt-48 md:pb-48 overflow-hidden min-h-[80vh] flex items-center" style={{ background: 'linear-gradient(135deg, #FF7A00 0%, #FFB347 100%)' }}>
                <div className="absolute inset-0 bg-[url('/assets/hero-pattern.svg')] opacity-10"></div>

                <div className="container-custom mx-auto relative z-10 text-center">
                    <div className="max-w-3xl mx-auto">
                        {/* Coming Soon Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium text-white">Em breve</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-geist mb-6 tracking-tight">
                            {title}
                        </h1>

                        {/* Description */}
                        <p className="text-white/90 font-inter text-lg md:text-xl lg:text-2xl leading-relaxed mb-12">
                            {description}
                        </p>

                        {/* Contact Section */}
                        {showContact && (
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-10 mt-12">
                                <h2 className="text-2xl font-bold font-geist mb-6">Entre em contato</h2>
                                <p className="text-white/90 mb-8">
                                    Enquanto isso, nossa equipe está à disposição para atendê-lo.
                                </p>

                                <div className="flex flex-col md:flex-row gap-4 justify-center">
                                    <a
                                        href="mailto:contato@symplepass.com.br"
                                        className="inline-flex items-center justify-center gap-3 bg-white text-orange-600 hover:bg-white/90 px-6 py-4 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Mail className="h-5 w-5" />
                                        contato@symplepass.com.br
                                    </a>

                                    <a
                                        href="https://wa.me/5513000000000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 px-6 py-4 rounded-full font-medium transition-all duration-200"
                                    >
                                        <Phone className="h-5 w-5" />
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer variant="light" />
        </div>
    )
}
