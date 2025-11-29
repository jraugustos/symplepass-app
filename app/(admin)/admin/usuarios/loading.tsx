export default function UsuariosLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 h-10 bg-neutral-200 rounded animate-pulse" />
          <div className="w-40 h-10 bg-neutral-200 rounded animate-pulse" />
        </div>

        {/* Table rows */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg">
              <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-neutral-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-neutral-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
