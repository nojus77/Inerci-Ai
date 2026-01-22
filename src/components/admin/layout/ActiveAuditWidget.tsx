'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, X, ChevronUp, Building, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ActiveAudit {
  id: string
  title: string
  status: string
  client: {
    id: string
    company_name: string
  } | null
  chat_messages: unknown[] | null
  updated_at: string
}

export function ActiveAuditWidget() {
  const [audits, setAudits] = useState<ActiveAudit[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Don't show on audit pages (already there)
  const isOnAuditPage = pathname?.includes('/admin/audit/')

  useEffect(() => {
    const fetchActiveAudits = async () => {
      const { data } = await supabase
        .from('audit_sessions')
        .select('id, title, status, updated_at, chat_messages, client:clients(id, company_name)')
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .limit(5)

      if (data) {
        setAudits(data as unknown as ActiveAudit[])
      }
    }

    fetchActiveAudits()

    // Subscribe to changes
    const channel = supabase
      .channel('active-audits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_sessions' },
        () => {
          fetchActiveAudits()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Don't render if no active audits or on audit page
  if (audits.length === 0 || isOnAuditPage) {
    return null
  }

  const primaryAudit = audits[0]
  const messageCount = primaryAudit.chat_messages?.length || 0

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageSquare className="h-5 w-5" />
          {audits.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center text-white">
              {audits.length}
            </span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-[320px] shadow-xl border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium">
              {audits.length === 1 ? 'Active Audit' : `${audits.length} Active Audits`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronUp className={`h-3.5 w-3.5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Primary Audit */}
        <Link href={`/admin/audit/${primaryAudit.id}`}>
          <div className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{primaryAudit.title}</p>
                {primaryAudit.client && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Building className="h-3 w-3" />
                    <span className="truncate">{primaryAudit.client.company_name}</span>
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                <MessageSquare className="h-3 w-3" />
                {messageCount} messages
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(primaryAudit.updated_at)}
              </span>
            </div>
          </div>
        </Link>

        {/* Other Audits (Expanded) */}
        {isExpanded && audits.length > 1 && (
          <div className="border-t">
            {audits.slice(1).map((audit) => (
              <Link key={audit.id} href={`/admin/audit/${audit.id}`}>
                <div className="px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{audit.title}</p>
                      {audit.client && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {audit.client.company_name}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-2 bg-muted/30 border-t">
          <Button asChild variant="outline" size="sm" className="w-full h-7 text-xs">
            <Link href="/admin/audit/new">
              Start New Audit
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
