'use client'

import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { ClientForm } from '@/components/admin/clients/ClientForm'

export default function NewClientPage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="New Client" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 max-w-2xl">
        <ClientForm />
      </div>
    </div>
  )
}
