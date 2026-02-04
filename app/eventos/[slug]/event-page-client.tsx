'use client'

import { useState, useMemo } from 'react'
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
  EventPhotos,
  CategorySelectionModal,
  StickyCtaBar,
  DEFAULT_EVENT_TABS,
  EventSectionWrapper,
} from '@/components/evento'
import { NavigationHeader } from '@/components/molecules/navigation-header'
import { Footer } from '@/components/layout/footer'
import { signOut } from '@/lib/auth/actions'
import type { EventDetailData, EventCategory, UserRole } from '@/types/database.types'
import type { KitPickupInfo } from '@/types'
import type { EventPhotosData } from '@/lib/data/event-photos'

interface EventPageClientProps {
  event: EventDetailData
  minPrice: number | null
  kitPickupInfo: KitPickupInfo | null
  eventSlug: string
  isAuthenticated?: boolean
  userName?: string
  userEmail?: string
  userRole?: UserRole
  photosData?: EventPhotosData
  faceSearchAvailable?: boolean
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
  photosData = { photos: [], packages: [], pricingTiers: [] },
  faceSearchAvailable = false,
}: EventPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null)

  // Filter tabs based on event status and available content
  const visibleTabs = useMemo(() => {
    return DEFAULT_EVENT_TABS.filter((tab) => {
      if (tab.id === 'fotos') {
        return event.status === 'completed' && photosData.photos.length > 0
      }
      if (tab.id === 'percurso') {
        return event.course_info && (
          (event.course_info.specification_type === 'course' && event.show_course_info) ||
          (event.course_info.specification_type === 'championship_format' && event.show_championship_format)
        )
      }
      if (tab.id === 'organizador') {
        return event.has_organizer && event.organizer
      }
      return true
    })
  }, [event, photosData.photos.length])

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
    await signOut()
    window.location.href = '/'
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
        <StickyTabsNav tabs={visibleTabs} variant="light" />

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
                allowsPairRegistration={event.allows_pair_registration}
                allowsTeamRegistration={event.allows_team_registration}
                allowsIndividualRegistration={event.allows_individual_registration}
                teamSize={event.team_size}
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

            {event.status === 'completed' && (
              <EventSectionWrapper id="fotos" showTitle={false}>
                <EventPhotos
                  eventId={event.id}
                  photos={photosData.photos}
                  packages={photosData.packages}
                  pricingTiers={photosData.pricingTiers}
                  faceSearchAvailable={faceSearchAvailable}
                />
              </EventSectionWrapper>
            )}

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
          allowsPairRegistration={event.allows_pair_registration}
          allowsTeamRegistration={event.allows_team_registration}
          allowsIndividualRegistration={event.allows_individual_registration}
          teamSize={event.team_size}
          onCtaClick={scrollToCategories}
        />
      </div>

      {/* Footer */}
      <Footer variant="light" />
    </>
  )
}
