export default function RelatoriosLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Overview Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
        <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Charts skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse mb-4" />
          <div className="h-80 bg-neutral-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
