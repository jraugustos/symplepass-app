import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Trophy, Users, Zap, Target, Heart, Globe, Shield } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
    title: 'Sobre Nós | SymplePass',
    description: 'Conheça a SymplePass, a plataforma que conecta quem produz experiências esportivas a quem vive o esporte.',
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header variant="transparent" className="absolute top-0 left-0 right-0 z-50 border-b-0" />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-900 pt-20">
                <div className="absolute inset-0 bg-[url('/assets/hero-pattern.svg')] opacity-10"></div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 via-neutral-900/80 to-neutral-900"></div>

                {/* Animated Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>

                <div className="container-custom mx-auto relative z-10 text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Revolucionando o mercado esportivo
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-geist text-white mb-8 tracking-tight leading-tight animate-fade-in-up delay-100">
                        Conectando <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Paixão</span><br />
                        ao Movimento.
                    </h1>

                    <p className="text-xl md:text-2xl text-neutral-300 max-w-3xl mx-auto font-inter leading-relaxed mb-12 animate-fade-in-up delay-200">
                        A SymplePass nasceu com um propósito simples: conectar quem produz experiências esportivas a quem vive o esporte.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300 pb-20">
                        <Link href="/eventos">
                            <Button size="lg" className="h-14 px-8 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 transition-all hover:-translate-y-1">
                                Explorar Eventos
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/criar-evento">
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:text-white rounded-full transition-all hover:-translate-y-1">
                                Sou Organizador
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Mission Section - Redesigned */}
            <section className="py-32 bg-white relative">
                <div className="container-custom mx-auto">
                    <div className="max-w-4xl mx-auto text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold font-geist text-neutral-900 mb-8 leading-tight">
                            Acreditamos que o esporte transforma vidas — e que a tecnologia pode transformar o esporte.
                        </h2>
                        <p className="text-xl text-neutral-600 font-inter leading-relaxed">
                            Somos uma plataforma completa de inscrição e gestão de eventos esportivos, criada para aproximar organizadores e atletas de forma prática, intuitiva e eficiente.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:border-orange-200 transition-colors duration-300">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                                <Target className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold font-geist text-neutral-900 mb-3">Nossa Missão</h3>
                            <p className="text-neutral-600 font-inter leading-relaxed">
                                Simplificar a jornada esportiva, oferecendo ferramentas que eliminam a burocracia e permitem focar no que realmente importa: a superação.
                            </p>
                        </div>

                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:border-blue-200 transition-colors duration-300">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold font-geist text-neutral-900 mb-3">Segurança</h3>
                            <p className="text-neutral-600 font-inter leading-relaxed">
                                Garantimos a proteção de dados e transações seguras para que organizadores e atletas tenham total tranquilidade.
                            </p>
                        </div>

                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:border-green-200 transition-colors duration-300">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold font-geist text-neutral-900 mb-3">Agilidade</h3>
                            <p className="text-neutral-600 font-inter leading-relaxed">
                                Processos otimizados para inscrições rápidas e gestão eficiente, economizando tempo valioso de todos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Grid (Bento Style) */}
            <section className="py-24 bg-neutral-50">
                <div className="container-custom mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold font-geist text-neutral-900 mb-6">Nosso Ecossistema</h2>
                        <p className="text-xl text-neutral-600 font-inter">
                            Mais do que uma plataforma, somos um ecossistema. Trabalhamos para fortalecer a comunidade esportiva.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 - Large */}
                        <div className="md:col-span-2 bg-white p-8 md:p-12 rounded-3xl shadow-custom-sm border border-neutral-200 hover:shadow-custom-lg transition-all duration-300 group">
                            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-8 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold font-geist text-neutral-900 mb-4">Comunidade Vibrante</h3>
                            <p className="text-lg text-neutral-600 font-inter leading-relaxed">
                                Conectamos pessoas através da paixão pelo esporte. Criamos um ambiente onde atletas podem compartilhar conquistas e organizadores podem construir comunidades engajadas em torno de seus eventos.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-neutral-900 p-8 md:p-12 rounded-3xl shadow-custom-sm border border-neutral-800 hover:shadow-custom-lg transition-all duration-300 group text-white">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-orange-400 group-hover:scale-110 transition-transform duration-300">
                                <Trophy className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold font-geist text-white mb-4">Excelência</h3>
                            <p className="text-lg text-neutral-400 font-inter leading-relaxed">
                                Buscamos a excelência em cada detalhe, desde a usabilidade da plataforma até o suporte ao cliente.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-custom-sm border border-neutral-200 hover:shadow-custom-lg transition-all duration-300 group">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <Globe className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold font-geist text-neutral-900 mb-4">Inovação</h3>
                            <p className="text-lg text-neutral-600 font-inter leading-relaxed">
                                Estamos sempre evoluindo, trazendo novas tecnologias para melhorar a experiência de todos.
                            </p>
                        </div>

                        {/* Card 4 - Large */}
                        <div className="md:col-span-2 bg-gradient-to-br from-orange-500 to-orange-600 p-8 md:p-12 rounded-3xl shadow-custom-sm border border-orange-400 hover:shadow-custom-lg transition-all duration-300 group text-white">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform duration-300">
                                <Heart className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold font-geist text-white mb-4">Paixão pelo Esporte</h3>
                            <p className="text-lg text-white/90 font-inter leading-relaxed">
                                Somos movidos pela mesma paixão que leva atletas a acordarem cedo para treinar. Entendemos as dores e as alegrias do esporte porque também somos atletas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white">
                <div className="container-custom mx-auto">
                    <div className="bg-neutral-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/assets/hero-pattern.svg')] opacity-5"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full mix-blend-screen filter blur-[80px]"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[80px]"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-bold font-geist text-white mb-6">
                                Pronto para começar?
                            </h2>
                            <p className="text-xl text-neutral-400 mb-10 font-inter">
                                Junte-se a milhares de atletas e organizadores que já estão transformando o esporte com a SymplePass.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/criar-evento">
                                    <Button size="lg" className="h-14 px-8 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                                        Organizar Evento
                                    </Button>
                                </Link>
                                <Link href="/eventos">
                                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-transparent border-neutral-700 text-white hover:bg-white/10 hover:text-white rounded-full">
                                        Buscar Eventos
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer variant="light" />
        </div>
    )
}
