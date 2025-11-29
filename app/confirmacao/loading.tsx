import { Header } from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="gradient" sticky />
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 py-16 text-white">
        <div className="container mx-auto px-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="mt-4 h-12 w-2/3 rounded-full" />
          <Skeleton className="mt-3 h-5 w-1/2 rounded-full" />
        </div>
      </div>

      <div className="-mt-20 pb-16">
        <div className="container mx-auto max-w-3xl space-y-6 px-4">
          <div className="rounded-2xl border border-white/60 bg-white p-10 text-center shadow-lg">
            <Skeleton className="mx-auto h-20 w-20 rounded-full" variant="circle" />
            <Skeleton className="mx-auto mt-4 h-6 w-1/2 rounded-full" />
            <Skeleton className="mx-auto mt-2 h-4 w-2/3 rounded-full" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <Skeleton className="mx-auto h-8 w-40 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-48 w-48 rounded-2xl" />
            <Skeleton className="mx-auto mt-4 h-4 w-24 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-12 w-2/3 rounded-2xl" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <Skeleton className="h-10 w-3/4 rounded-full" />
            <Skeleton className="mt-4 h-4 w-1/2 rounded-full" />
            <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
            <Skeleton className="mt-6 h-4 w-1/3 rounded-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <Skeleton className="h-4 w-24 rounded-full" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" variant="circle" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-full" />
                    <Skeleton className="h-3 w-1/2 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center">
            <Skeleton className="mx-auto h-12 w-3/4 rounded-full" />
            <Skeleton className="mx-auto mt-3 h-3 w-1/2 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
