'use client'

import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { TaskForm } from '@/components/admin/tasks/TaskForm'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewTaskPageContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client')

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="New Task" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 max-w-2xl">
        <TaskForm preselectedClientId={clientId} />
      </div>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewTaskPageContent />
    </Suspense>
  )
}
