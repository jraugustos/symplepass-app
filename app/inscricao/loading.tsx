import { Header } from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="gradient" sticky={false} />
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 pb-32 text-white">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto px-4 py-16">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="mt-6 h-12 w-2/3 rounded-full" />
          <Skeleton className="mt-4 h-5 w-1/2 rounded-full" />
        </div>
      </div>

      <div className="-mt-24 pb-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <section className="rounded-3xl border border-white/80 bg-white p-6 shadow-lg shadow-emerald-100/50">
                <div className="space-y-3 border-b border-slate-100 pb-6">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-8 w-2/3 rounded-full" />
                  <Skeleton className="h-4 w-1/2 rounded-full" />
                </div>
                <div className="mt-6 grid gap-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="h-4 w-32 rounded-full" />
                      <Skeleton className="h-12 rounded-2xl" />
                    </div>
                  ))}
                  <Skeleton className="h-16 rounded-2xl" />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="space-y-3 border-b border-slate-100 pb-6">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-8 w-3/4 rounded-full" />
                  <Skeleton className="h-4 w-1/2 rounded-full" />
                </div>
                <Skeleton className="mt-6 h-16 rounded-2xl" />
              </section>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="space-y-3 pb-6">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-8 w-2/3 rounded-full" />
                </div>
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="mt-6 h-20 rounded-2xl" />
              </section>

              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="space-y-3 pb-6">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-8 w-2/3 rounded-full" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-2xl" />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48 rounded-full" />
            <Skeleton className="h-12 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
