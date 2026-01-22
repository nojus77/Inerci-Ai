'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuditChat } from '@/components/admin/audit/AuditChat'
import { SummaryCards } from '@/components/admin/audit/SummaryCards'
import { SuggestionChips } from '@/components/admin/audit/SuggestionChips'
import { ModeToggle } from '@/components/admin/audit/ModeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Building, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { AuditSession, AuditMode } from '@/types/database'

interface AuditPageProps {
  params: Promise<{ sessionId: string }>
}

export default function AuditPage({ params }: AuditPageProps) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<AuditSession | null>(null)
  const [client, setClient] = useState<{ id: string; company_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<AuditMode>('live_capture')
  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*, client:clients(id, company_name)')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
      } else if (data) {
        const sessionData = data as unknown as AuditSession & { client: { id: string; company_name: string } }
        setSession(sessionData)
        setClient(sessionData.client)
        setMode(sessionData.mode)
      }
      setLoading(false)
    }

    fetchSession()
  }, [sessionId, supabase])

  const handleModeChange = async (newMode: AuditMode) => {
    setMode(newMode)
    await supabase
      .from('audit_sessions')
      .update({ mode: newMode } as never)
      .eq('id', sessionId)
  }

  const handleSessionUpdate = (updatedSession: AuditSession) => {
    setSession(updatedSession)
  }

  const handleCompleteAudit = async () => {
    await supabase
      .from('audit_sessions')
      .update({ status: 'complete' } as never)
      .eq('id', sessionId)

    // Update client stage
    if (client) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('clients')
        .update({ stage: 'audit_done' } as never)
        .eq('id', client.id)

      if (user) {
        await supabase.from('activity_log').insert({
          client_id: client.id,
          user_id: user.id,
          action: 'stage_changed',
          metadata: { from: 'audit_scheduled', to: 'audit_done' },
        } as never)
      }
    }

    setSession((prev) => prev ? { ...prev, status: 'complete' } : null)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="h-14 border-b flex items-center px-4 gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="flex-1" />
          <Skeleton className="w-80" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-muted-foreground">Session not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={client ? `/admin/clients/${client.id}` : '/admin/clients'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            {client && (
              <Link
                href={`/admin/clients/${client.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Building className="h-4 w-4" />
                <span className="text-sm">{client.company_name}</span>
              </Link>
            )}
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{session.title}</span>
            <Badge variant={session.status === 'complete' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          {session.status !== 'complete' && (
            <Button onClick={handleCompleteAudit} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Complete Audit
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <AuditChat
            sessionId={sessionId}
            session={session}
            onUpdate={handleSessionUpdate}
            mode={mode}
          />

          {/* Suggestion Chips */}
          <SuggestionChips sessionId={sessionId} />
        </div>

        {/* Right Sidebar - Summary Cards */}
        <div className="w-96 border-l overflow-y-auto bg-muted/30">
          <SummaryCards sessionId={sessionId} session={session} />
        </div>
      </div>
    </div>
  )
}
