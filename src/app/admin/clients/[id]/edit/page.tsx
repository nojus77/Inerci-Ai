'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { ClientForm } from '@/components/admin/clients/ClientForm'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

interface EditClientPageProps {
  params: Promise<{ id: string }>
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const { id } = use(params)
  const [client, setClient] = useState<ClientRow | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
      } else if (data) {
        setClient(data as ClientRow)
      }
      setLoading(false)
    }

    fetchClient()
  }, [id, supabase])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Loading..." showSearch={false} showQuickActions={false} />
        <div className="flex-1 p-6 max-w-2xl">
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Client Not Found" showSearch={false} showQuickActions={false} />
        <div className="flex-1 p-6">
          <p className="text-muted-foreground">The requested client could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title={`Edit ${client.company_name}`} showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
        <ClientForm client={client} />
      </div>
    </div>
  )
}
