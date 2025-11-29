'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventFAQ } from '@/types'

interface EventFaqsSectionProps {
    faqs: EventFAQ[]
}

export function EventFaqsSection({ faqs }: EventFaqsSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    if (!faqs || faqs.length === 0) return null

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <section className="py-12 bg-white" id="faq">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2 font-geist">Perguntas Frequentes</h2>
                    <p className="text-neutral-600">Tire suas dúvidas sobre o evento</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={faq.id}
                            className="border border-neutral-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-neutral-300"
                        >
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between p-5 bg-white text-left focus:outline-none"
                            >
                                <span className="font-medium text-neutral-900 flex items-center gap-3">
                                    <HelpCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                    {faq.question}
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
                                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="p-5 pt-0 text-neutral-600 text-sm leading-relaxed border-t border-neutral-100 bg-neutral-50/50">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
