import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Skeleton */}
      <Skeleton className="min-h-[400px] sm:min-h-[500px] rounded-none" />

      {/* Tabs Skeleton */}
      <div className="sticky top-20 z-30 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-12">
        {/* About Section */}
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Kit Section */}
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="aspect-[16/11] rounded-2xl" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-8 w-56 mb-6" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
