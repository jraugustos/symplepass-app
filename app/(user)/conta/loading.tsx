import { Skeleton } from '@/components/ui/skeleton'

export default function ContaLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-0">
      <div className="space-y-4 rounded-3xl bg-gradient-to-br from-orange-200 to-orange-300 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" variant="circle" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-3 rounded-2xl border border-neutral-100 p-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <Skeleton className="h-4 w-1/3" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <Skeleton className="h-4 w-1/4" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
