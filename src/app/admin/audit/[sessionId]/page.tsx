'use client'

import { useEffect, useState, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuditChat } from '@/components/admin/audit/AuditChat'
import { SummaryCards } from '@/components/admin/audit/SummaryCards'
import { ModeToggle } from '@/components/admin/audit/ModeToggle'
import { LiveScriptPanel } from '@/components/admin/scripts/LiveScriptPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Building, CheckCircle, PanelLeftClose, PanelLeft } from 'lucide-react'
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
  const [showScriptPanel, setShowScriptPanel] = useState(true)
  const chatInputRef = useRef<{ injectQuestion: (text: string) => void } | null>(null)
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

  const handleAskQuestion = (question: string) => {
    chatInputRef.current?.injectQuestion(question)
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
      <div className="fixed inset-0 flex flex-col bg-background">
        <div className="h-11 border-b flex items-center px-4 gap-3 bg-card">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 lg:flex-[7] flex flex-col">
            <Skeleton className="flex-1 m-3" />
          </div>
          <Skeleton className="hidden lg:block lg:flex-[3] min-w-[280px] max-w-[400px] border-l" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Session not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Compact Header */}
      <header className="h-11 shrink-0 border-b flex items-center justify-between px-3 bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href={client ? `/admin/clients/${client.id}` : '/admin/clients'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-1.5 text-sm">
            {client && (
              <>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Building className="h-3.5 w-3.5" />
                  <span className="max-w-[150px] truncate">{client.company_name}</span>
                </Link>
                <span className="text-muted-foreground/50">/</span>
              </>
            )}
            <span className="font-medium max-w-[200px] truncate">{session.title}</span>
            <Badge
              variant={session.status === 'complete' ? 'default' : 'secondary'}
              className="text-[10px] px-1.5 py-0 h-5"
            >
              {session.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowScriptPanel(!showScriptPanel)}
            title={showScriptPanel ? 'Slėpti script\'ą' : 'Rodyti script\'ą'}
          >
            {showScriptPanel ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          {session.status !== 'complete' && (
            <Button onClick={handleCompleteAudit} size="sm" className="gap-1.5 h-7 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
        </div>
      </header>

      {/* Main Content - Full height below header */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Script Panel - Collapsible */}
        {showScriptPanel && (
          <div className="hidden lg:flex w-[280px] min-w-[280px] max-w-[320px] border-r flex-col min-h-0 bg-card">
            <LiveScriptPanel
              sessionId={sessionId}
              session={session}
              onAskQuestion={handleAskQuestion}
              onSessionUpdate={handleSessionUpdate}
            />
          </div>
        )}

        {/* Chat Area - Flexible width */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <AuditChat
            ref={chatInputRef}
            sessionId={sessionId}
            session={session}
            onUpdate={handleSessionUpdate}
            mode={mode}
          />
        </div>

        {/* Right Sidebar - AI Analysis */}
        <div className="hidden lg:flex w-[300px] min-w-[280px] max-w-[360px] border-l flex-col min-h-0 bg-muted/10">
          <SummaryCards sessionId={sessionId} session={session} />
        </div>
      </div>
    </div>
  )
}
