export default function UsuarioDetalheLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* User Detail Card skeleton */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-neutral-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards skeleton */}
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

      {/* Tables skeleton */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
