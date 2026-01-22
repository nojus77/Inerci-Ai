import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { KanbanBoard } from '@/components/admin/pipeline/KanbanBoard'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function PipelinePage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Pipeline" />

      <div className="flex-1 p-6 overflow-hidden">
        <Suspense fallback={<KanbanSkeleton />}>
          <KanbanBoard />
        </Suspense>
      </div>
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 h-full">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-72 flex-shrink-0">
          <Skeleton className="h-10 w-full mb-3" />
          <div className="space-y-2">
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
