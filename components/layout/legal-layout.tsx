import React from 'react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { FileText, Shield, RefreshCw } from 'lucide-react'

interface LegalLayoutProps {
    children: React.ReactNode
    title: string
    lastUpdated?: string
    className?: string
}

export function LegalLayout({ children, title, lastUpdated, className }: LegalLayoutProps) {
    // Map titles to paths for active state check
    const currentPath = title.includes('Privacidade') ? '/privacidade' :
        title.includes('Reembolso') ? '/reembolso' :
            '/termos';

    const sidebarLinks = [
        { href: '/termos', label: 'Termos de Uso', icon: FileText },
        { href: '/privacidade', label: 'Política de Privacidade', icon: Shield },
        { href: '/reembolso', label: 'Política de Reembolso', icon: RefreshCw },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header variant="transparent" className="absolute top-0 left-0 right-0 z-50 border-b-0" />

            {/* Page Header */}
            <div className="relative text-white pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF7A00 0%, #FFB347 100%)' }}>
                <div className="absolute inset-0 bg-[url('/assets/hero-pattern.svg')] opacity-10"></div>

                <div className="container-custom mx-auto relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold font-geist mb-6 tracking-tight">{title}</h1>
                    <p className="text-white font-inter text-lg md:text-xl max-w-2xl leading-relaxed">
                        Transparência e segurança para você aproveitar o melhor do esporte.
                    </p>
                </div>
            </div>

            <main className="flex-grow container-custom mx-auto py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    {/* Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 bg-white rounded-xl shadow-custom-sm border border-neutral-200 p-2">
                            <nav className="space-y-1">
                                {sidebarLinks.map((link) => {
                                    const Icon = link.icon
                                    const isActive = currentPath === link.href

                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-orange-50 text-orange-700"
                                                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                            )}
                                        >
                                            <Icon className={cn("h-4 w-4", isActive ? "text-orange-600" : "text-neutral-400")} />
                                            {link.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-2xl shadow-custom-sm p-8 md:p-12 border border-neutral-200">
                            <div className={cn(
                                "prose prose-neutral prose-lg max-w-none font-inter",
                                "prose-headings:font-geist prose-headings:font-bold prose-headings:text-neutral-900",
                                "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4",
                                "prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3",
                                "prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:mb-6",
                                "prose-li:text-neutral-600 prose-li:mb-2",
                                "prose-strong:text-neutral-900",
                                "prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline",
                                "prose-ul:my-6 prose-ul:space-y-2 prose-ol:my-6 prose-ol:space-y-2"
                            )}>
                                {children}
                            </div>

                            {lastUpdated && (
                                <div className="mt-12 pt-8 border-t border-neutral-100">
                                    <p className="text-sm text-neutral-500 font-inter">
                                        Última atualização: <span className="font-medium text-neutral-900">{lastUpdated}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer variant="light" />
        </div>
    )
}
