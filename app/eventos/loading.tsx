import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function EventosLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header variant="light" sticky />

      <main className="flex-1">
        {/* Page Header Skeleton */}
        <section className="bg-white border-b border-neutral-200">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </section>

        {/* Featured Event Banner Skeleton */}
        <section className="container mx-auto px-4 py-8">
          <Card className="overflow-hidden mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <Skeleton className="h-64 md:h-auto min-h-[300px] rounded-none" />
              <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Filters and Events Grid Skeleton */}
        <section className="container mx-auto px-4 py-8">
          {/* Filter Bar Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>

          {/* Events Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-56 rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
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
