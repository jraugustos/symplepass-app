'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Image, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CourseInfoForm } from './course-info-form'
import { FAQsForm } from './faqs-form'
import { RegulationsForm } from './regulations-form'
import { CustomFieldsSection } from './custom-fields-section'
import type { EventCustomField } from '@/types/database.types'
import type {
    EventCourseInfo,
    EventFAQ,
    EventRegulation,
    CourseInfoFormData,
    FAQFormData,
    RegulationFormData,
    EventCustomFieldFormData,
} from '@/types'

type TabId = 'course' | 'regulations' | 'faq' | 'photos' | 'custom-fields'

interface EventDetailsTabsProps {
    eventId: string
    courseInfo: EventCourseInfo | null
    faqs: EventFAQ[]
    regulations: EventRegulation[]
    regulationPdfUrl: string | null
    customFields: EventCustomField[]
    onCourseInfoUpdate: (data: CourseInfoFormData) => Promise<void>
    onFAQCreate: (data: FAQFormData) => Promise<void>
    onFAQUpdate: (id: string, data: FAQFormData) => Promise<void>
    onFAQDelete: (id: string) => Promise<void>
    onFAQsReorder: (items: { id: string; display_order: number }[]) => Promise<void>
    onRegulationCreate: (data: RegulationFormData) => Promise<void>
    onRegulationUpdate: (id: string, data: RegulationFormData) => Promise<void>
    onRegulationDelete: (id: string) => Promise<void>
    onRegulationsReorder: (items: { id: string; display_order: number }[]) => Promise<void>
    onRegulationPdfUpdate: (url: string) => Promise<void>
    onCustomFieldCreate: (data: EventCustomFieldFormData) => Promise<void>
    onCustomFieldUpdate: (id: string, data: EventCustomFieldFormData) => Promise<void>
    onCustomFieldDelete: (id: string) => Promise<void>
}

export function EventDetailsTabs({
    eventId,
    courseInfo,
    faqs,
    regulations,
    regulationPdfUrl,
    customFields,
    onCourseInfoUpdate,
    onFAQCreate,
    onFAQUpdate,
    onFAQDelete,
    onFAQsReorder,
    onRegulationCreate,
    onRegulationUpdate,
    onRegulationDelete,
    onRegulationsReorder,
    onRegulationPdfUpdate,
    onCustomFieldCreate,
    onCustomFieldUpdate,
    onCustomFieldDelete,
}: EventDetailsTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('course')

    const tabs = [
        { id: 'course' as TabId, label: 'Especificações' },
        { id: 'regulations' as TabId, label: 'Regulamento' },
        { id: 'faq' as TabId, label: 'FAQ' },
        { id: 'custom-fields' as TabId, label: 'Campos Personalizados' },
        { id: 'photos' as TabId, label: 'Fotos' },
    ]

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detalhes do Evento</h3>

            {/* Tabs Navigation */}
            <div className="border-b border-neutral-200 mb-6">
                <nav className="flex gap-4 -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">

                {activeTab === 'course' && (
                    <CourseInfoForm
                        eventId={eventId}
                        courseInfo={courseInfo}
                        onUpdate={onCourseInfoUpdate}
                    />
                )}

                {activeTab === 'regulations' && (
                    <RegulationsForm
                        eventId={eventId}
                        regulations={regulations}
                        pdfUrl={regulationPdfUrl}
                        onCreate={onRegulationCreate}
                        onUpdate={onRegulationUpdate}
                        onDelete={onRegulationDelete}
                        onReorder={onRegulationsReorder}
                        onPdfUpdate={onRegulationPdfUpdate}
                    />
                )}

                {activeTab === 'faq' && (
                    <FAQsForm
                        eventId={eventId}
                        faqs={faqs}
                        onCreate={onFAQCreate}
                        onUpdate={onFAQUpdate}
                        onDelete={onFAQDelete}
                        onReorder={onFAQsReorder}
                    />
                )}

                {activeTab === 'custom-fields' && (
                    <CustomFieldsSection
                        eventId={eventId}
                        customFields={customFields}
                        onCreate={onCustomFieldCreate}
                        onUpdate={onCustomFieldUpdate}
                        onDelete={onCustomFieldDelete}
                    />
                )}

                {activeTab === 'photos' && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Fotos do Evento</h4>
                            <p className="text-sm text-neutral-500 mt-1">
                                Gerencie fotos, pacotes de preços e pedidos em uma página dedicada.
                            </p>
                        </div>
                        <Link
                            href={`/admin/eventos/${eventId}/fotos`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                            <Image className="h-4 w-4" />
                            Gerenciar Fotos
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                    </div>
                )}
            </div>
        </Card>
    )
}
