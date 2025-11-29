'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { EventRegulation } from '@/types'

interface EventRegulationsSectionProps {
    regulations: EventRegulation[]
    pdfUrl: string | null
    regulationUpdatedAt: string | null
}

export function EventRegulationsSection({
    regulations,
    pdfUrl,
    regulationUpdatedAt
}: EventRegulationsSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    if (!regulations || (regulations.length === 0 && !pdfUrl)) return null

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <section className="py-12 bg-neutral-50" id="regulations">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2 font-geist">Regulamento</h2>
                    <p className="text-neutral-600">Confira as regras e normas do evento</p>
                </div>

                {/* PDF Download Card */}
                {pdfUrl && (
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Regulamento Completo</h3>
                                    {regulationUpdatedAt && (
                                        <p className="text-sm text-white/80">
                                            Atualizado em {formatDate(regulationUpdatedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                className="bg-white text-primary-600 hover:bg-neutral-100"
                                onClick={() => window.open(pdfUrl, '_blank')}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Baixar PDF
                            </Button>
                        </div>
                    </div>
                )}

                {/* Regulations Accordion */}
                {regulations.length > 0 && (
                    <div className="space-y-4">
                        {regulations.map((regulation, index) => (
                            <div
                                key={regulation.id}
                                className="bg-white border border-neutral-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-neutral-300 shadow-sm"
                            >
                                <button
                                    onClick={() => toggleAccordion(index)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                >
                                    <span className="font-medium text-neutral-900 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        {regulation.title}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "w-5 h-5 text-neutral-400 transition-transform duration-200",
                                            openIndex === index ? "transform rotate-180" : ""
                                        )}
                                    />
                                </button>

                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="p-5 pt-0 text-neutral-600 text-sm leading-relaxed border-t border-neutral-100 whitespace-pre-wrap">
                                        {regulation.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
