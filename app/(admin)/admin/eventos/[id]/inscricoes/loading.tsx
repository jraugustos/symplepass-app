export default function InscricoesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-96 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-neutral-200 rounded-lg animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                <div className="h-8 w-16 bg-neutral-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        {/* Filters Skeleton */}
        <div className="flex gap-3 mb-4">
          <div className="h-10 flex-1 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <div className="bg-neutral-50 border-b border-neutral-200 p-4">
            <div className="flex gap-4">
              <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-white divide-y divide-neutral-200">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-neutral-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
