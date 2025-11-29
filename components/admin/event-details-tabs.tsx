'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { KitItemsForm } from './kit-items-form'
import { CourseInfoForm } from './course-info-form'
import { FAQsForm } from './faqs-form'
import { RegulationsForm } from './regulations-form'
import type {
    EventKitItem,
    EventCourseInfo,
    EventFAQ,
    EventRegulation,
    KitItemFormData,
    CourseInfoFormData,
    FAQFormData,
    RegulationFormData,
} from '@/types'

type TabId = 'kit' | 'course' | 'regulations' | 'faq'

interface EventDetailsTabsProps {
    eventId: string
    kitItems: EventKitItem[]
    courseInfo: EventCourseInfo | null
    faqs: EventFAQ[]
    regulations: EventRegulation[]
    kitPickupInfo: any
    regulationPdfUrl: string | null
    onKitItemCreate: (data: KitItemFormData) => Promise<void>
    onKitItemUpdate: (id: string, data: KitItemFormData) => Promise<void>
    onKitItemDelete: (id: string) => Promise<void>
    onKitItemsReorder: (items: { id: string; display_order: number }[]) => Promise<void>
    onCourseInfoUpdate: (data: CourseInfoFormData) => Promise<void>
    onFAQCreate: (data: FAQFormData) => Promise<void>
    onFAQUpdate: (id: string, data: FAQFormData) => Promise<void>
    onFAQDelete: (id: string) => Promise<void>
    onFAQsReorder: (items: { id: string; display_order: number }[]) => Promise<void>
    onRegulationCreate: (data: RegulationFormData) => Promise<void>
    onRegulationUpdate: (id: string, data: RegulationFormData) => Promise<void>
    onRegulationDelete: (id: string) => Promise<void>
    onRegulationsReorder: (items: { id: string; display_order: number }[]) => Promise<void>
    onKitPickupInfoUpdate: (data: any) => Promise<void>
    onRegulationPdfUpdate: (url: string) => Promise<void>
}

export function EventDetailsTabs({
    eventId,
    kitItems,
    courseInfo,
    faqs,
    regulations,
    kitPickupInfo,
    regulationPdfUrl,
    onKitItemCreate,
    onKitItemUpdate,
    onKitItemDelete,
    onKitItemsReorder,
    onCourseInfoUpdate,
    onFAQCreate,
    onFAQUpdate,
    onFAQDelete,
    onFAQsReorder,
    onRegulationCreate,
    onRegulationUpdate,
    onRegulationDelete,
    onRegulationsReorder,
    onKitPickupInfoUpdate,
    onRegulationPdfUpdate,
}: EventDetailsTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('kit')

    const tabs = [
        { id: 'kit' as TabId, label: 'Kit do Atleta' },
        { id: 'course' as TabId, label: 'Especificações' },
        { id: 'regulations' as TabId, label: 'Regulamento' },
        { id: 'faq' as TabId, label: 'FAQ' },
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

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'kit' && (
                    <KitItemsForm
                        eventId={eventId}
                        items={kitItems}
                        pickupInfo={kitPickupInfo}
                        onCreate={onKitItemCreate}
                        onUpdate={onKitItemUpdate}
                        onDelete={onKitItemDelete}
                        onReorder={onKitItemsReorder}
                        onPickupInfoUpdate={onKitPickupInfoUpdate}
                    />
                )}

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
            </div>
        </Card>
    )
}
