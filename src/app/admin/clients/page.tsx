import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { ClientList } from '@/components/admin/clients/ClientList'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientsPage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Clients" />

      <div className="flex-1 p-6">
        <Suspense fallback={<ClientListSkeleton />}>
          <ClientList />
        </Suspense>
      </div>
    </div>
  )
}

function ClientListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
