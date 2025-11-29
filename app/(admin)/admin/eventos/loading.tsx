import { Skeleton } from '@/components/ui/skeleton'

export default function EventosLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <div className="bg-neutral-50 border-b border-neutral-200 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        </div>
        <div className="bg-white divide-y divide-neutral-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-15 w-20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
