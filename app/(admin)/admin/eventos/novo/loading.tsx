export default function NovoEventoLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Form Skeleton */}
      <div className="max-w-4xl space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-neutral-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-neutral-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-neutral-200 rounded animate-pulse" />
                <div className="h-10 bg-neutral-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}

        {/* Actions Skeleton */}
        <div className="flex gap-3 justify-end">
          <div className="h-10 w-24 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-48 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
