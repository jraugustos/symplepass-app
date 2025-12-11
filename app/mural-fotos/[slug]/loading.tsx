import { Header } from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'

export default function MuralEventLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header + Hero with gradient background - same as event page */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500">
        <Header variant="transparent" className="border-b-0" sticky={false} />
        <div className="border-b border-white/20" />

        {/* Hero content skeleton */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex-1">
            {/* Title */}
            <Skeleton className="h-10 sm:h-12 w-3/4 max-w-xl mb-4 bg-white/20" />

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Skeleton className="h-8 w-32 rounded-full bg-white/20" />
              <Skeleton className="h-8 w-40 rounded-full bg-white/20" />
              <Skeleton className="h-8 w-28 rounded-full bg-white/20" />
              <Skeleton className="h-8 w-36 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Event banner skeleton */}
        <section className="pt-6 pb-6">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Skeleton className="w-full aspect-[16/9] rounded-2xl" />
          </div>
        </section>

        {/* Photos Section Skeleton */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            {/* Section header */}
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Photos grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
