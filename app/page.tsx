import { getFeaturedEvents, getUpcomingEvents, getActiveEventsCount, getSportTypesWithActiveEvents } from '@/lib/data/events'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedEvents } from '@/components/home/featured-events'
import { UpcomingEvents } from '@/components/home/upcoming-events'
import { ClubBenefits } from '@/components/home/club-benefits'
import { ScrollAnimationWrapper } from '@/components/home/scroll-animation-wrapper'

// Revalidate every hour (3600 seconds)
export const revalidate = 3600

export default async function Home() {
  // Fetch data from Supabase
  const [featuredEvents, upcomingEvents, activeEventsCount, activeSportTypes] = await Promise.all([
    getFeaturedEvents(),
    getUpcomingEvents(5),
    getActiveEventsCount(),
    getSportTypesWithActiveEvents(),
  ])

  // Calculate event statistics
  const eventStats = {
    totalEvents: activeEventsCount,
    totalParticipants: 12500, // Placeholder - could be calculated from registrations
    totalCities: 45, // Placeholder - could be calculated from unique event locations
  }

  return (
    <>
      {/* Header with transparent variant overlaying the hero background */}
      <Header variant="transparent" sticky={false} className="absolute inset-x-0 top-0 z-40" />

      {/* Main Content with Scroll Animations */}
      <ScrollAnimationWrapper>
        <main className="min-h-screen">
          {/* Hero Section with Search and Stats */}
          <HeroSection eventStats={eventStats} activeSportTypes={activeSportTypes} />

          {/* Featured Events Section */}
          <FeaturedEvents events={featuredEvents} />

          {/* Upcoming Events Section */}
          <UpcomingEvents events={upcomingEvents} />

          {/* Club Benefits Section */}
          <ClubBenefits />
        </main>
      </ScrollAnimationWrapper>

      {/* Footer */}
      <Footer variant="light" />
    </>
  )
}
