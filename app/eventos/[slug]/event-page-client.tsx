'use client'

import { useState } from 'react'
import {
  EventHero,
  StickyTabsNav,
  EventAbout,
  EventCategories,
  EventKit,
  EventCourse,
  EventRegulations,
  EventFAQ,
  EventOrganizer,
  CategorySelectionModal,
  StickyCtaBar,
  DEFAULT_EVENT_TABS,
  EventSectionWrapper,
} from '@/components/evento'
import { NavigationHeader } from '@/components/molecules/navigation-header'
import { Footer } from '@/components/layout/footer'
import type { EventDetailData, EventCategory, UserRole } from '@/types/database.types'
import type { KitPickupInfo } from '@/types'

interface EventPageClientProps {
  event: EventDetailData
  minPrice: number | null
  kitPickupInfo: KitPickupInfo | null
  eventSlug: string
  isAuthenticated?: boolean
  userName?: string
  userEmail?: string
  userRole?: UserRole
}

export default function EventPageClient({
  event,
  minPrice,
  kitPickupInfo,
  eventSlug,
  isAuthenticated = false,
  userName,
  userEmail,
  userRole = 'user',
}: EventPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null)

  const handleCategorySelect = (category: EventCategory) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
  }

  const scrollToCategories = () => {
    const categoriesSection = document.getElementById('categorias')
    if (categoriesSection) {
      const tabsOffset = 60
      const elementPosition = categoriesSection.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - tabsOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const handleLogin = () => {
    window.location.href = '/login'
  }

  const handleLogout = async () => {
    window.location.href = '/api/auth/signout'
  }

  const handleProfileClick = (destination?: string) => {
    if (destination) {
      window.location.href = destination
    } else {
      window.location.href = '/conta'
    }
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Header + Hero with gradient background */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500">
          <NavigationHeader
            variant="transparent"
            sticky={false}
            isAuthenticated={isAuthenticated}
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
          />
          <div className="border-b border-white/20" />
          <EventHero
            event={event}
            minPrice={minPrice}
            onCtaClick={scrollToCategories}
          />
        </div>

        {/* Sticky Navigation - Outside gradient */}
        <StickyTabsNav tabs={DEFAULT_EVENT_TABS} variant="light" />

        {/* Main Content */}
        <main>
          <div className="pt-6 pb-24">
            <EventSectionWrapper id="sobre" showTitle={false}>
              <EventAbout event={event} minPrice={minPrice} />
            </EventSectionWrapper>

            <EventSectionWrapper id="categorias" showTitle={false}>
              <EventCategories
                categories={event.categories}
                eventType={event.event_type}
                eventStatus={event.status}
                solidarityMessage={event.solidarity_message}
                onCategorySelect={handleCategorySelect}
              />
            </EventSectionWrapper>

            <EventSectionWrapper id="kit" showTitle={false}>
              <EventKit kitItems={event.kit_items} kitPickupInfo={kitPickupInfo} />
            </EventSectionWrapper>

            {event.course_info && (
              (event.course_info.specification_type === 'course' && event.show_course_info) ||
              (event.course_info.specification_type === 'championship_format' && event.show_championship_format)
            ) && (
              <EventSectionWrapper id="percurso" showTitle={false}>
                <EventCourse courseInfo={event.course_info} />
              </EventSectionWrapper>
            )}

            <EventSectionWrapper id="regulamento" showTitle={false}>
              <EventRegulations
                regulations={event.regulations}
                regulationPdfUrl={event.regulation_pdf_url}
                regulationUpdatedAt={event.regulation_updated_at}
              />
            </EventSectionWrapper>

            <EventSectionWrapper id="faq" showTitle={false}>
              <EventFAQ faqs={event.faqs} />
            </EventSectionWrapper>

            {event.has_organizer && event.organizer && (
              <EventSectionWrapper id="organizador" showTitle={false}>
                <EventOrganizer organizer={event.organizer} />
              </EventSectionWrapper>
            )}
          </div>
        </main>

        {/* Category Selection Modal */}
        <CategorySelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          category={selectedCategory}
          event={event}
          eventSlug={eventSlug}
        />

        {/* Sticky CTA Bar */}
        <StickyCtaBar
          minPrice={minPrice}
          eventType={event.event_type}
          eventStatus={event.status}
          solidarityMessage={event.solidarity_message}
          onCtaClick={scrollToCategories}
        />
      </div>

      {/* Footer */}
      <Footer variant="light" />
    </>
  )
}
