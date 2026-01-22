import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { TaskList } from '@/components/admin/tasks/TaskList'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function TasksPage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Tasks" />

      <div className="flex-1 p-6">
        <Suspense fallback={<TaskListSkeleton />}>
          <TaskList />
        </Suspense>
      </div>
    </div>
  )
}

function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}
