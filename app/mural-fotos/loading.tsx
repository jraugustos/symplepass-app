import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MuralFotosLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header variant="transparent" className="absolute top-0 left-0 right-0 z-50 border-b-0" />

      {/* Hero Section Skeleton */}
      <section
        className="relative text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF7A00 0%, #FFB347 100%)' }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            {/* Badge */}
            <Skeleton className="h-9 w-40 rounded-full mb-6 bg-white/20" />

            {/* Title */}
            <Skeleton className="h-12 md:h-14 w-80 mb-4 bg-white/20" />

            {/* Description */}
            <Skeleton className="h-6 w-full max-w-xl mb-8 bg-white/20" />

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 w-32 rounded-full bg-white/20" />
              <Skeleton className="h-10 w-28 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section Skeleton */}
      <section className="py-12 bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6">
                <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-8">
          {/* Events Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                {/* Preview thumbnails grid */}
                <div className="grid grid-cols-2 gap-1 p-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="aspect-square" />
                  ))}
                </div>
                {/* Event info */}
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
