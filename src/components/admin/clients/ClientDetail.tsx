'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatLithuanianPhone } from '@/lib/utils'
import {
  Building,
  Mail,
  Phone,
  User,
  MoreHorizontal,
  Edit,
  Calendar,
  FileText,
  ClipboardList,
  Plus,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import type { Database, ClientStage } from '@/types/database'
import { ActivityFeed } from './ActivityFeed'

type ClientRow = Database['public']['Tables']['clients']['Row']
type AuditSessionRow = Database['public']['Tables']['audit_sessions']['Row']
type ProposalRow = Database['public']['Tables']['proposals']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']

const STAGE_COLORS: Record<ClientStage, string> = {
  lead: 'bg-slate-500',
  audit_scheduled: 'bg-slate-400',
  audit_done: 'bg-zinc-400',
  prototype_building: 'bg-neutral-400',
  prototype_delivered: 'bg-stone-400',
  proposal_draft: 'bg-amber-600',
  proposal_sent: 'bg-yellow-600',
  negotiation: 'bg-orange-600',
  won: 'bg-emerald-600',
  lost: 'bg-red-600',
  on_hold: 'bg-gray-600',
}

const STAGE_LABELS: Record<ClientStage, string> = {
  lead: 'Lead',
  audit_scheduled: 'Audit Scheduled',
  audit_done: 'Audit Done',
  prototype_building: 'Prototype Building',
  prototype_delivered: 'Prototype Delivered',
  proposal_draft: 'Proposal Draft',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  on_hold: 'On Hold',
}

interface ClientDetailProps {
  client: ClientRow
}

export function ClientDetail({ client }: ClientDetailProps) {
  const [sessions, setSessions] = useState<AuditSessionRow[]>([])
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRelatedData = useCallback(async () => {
    setLoading(true)

    const [sessionsRes, proposalsRes, tasksRes] = await Promise.all([
      supabase
        .from('audit_sessions')
        .select('*')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('proposals')
        .select('*')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*')
        .eq('client_id', client.id)
        .order('due_date', { ascending: true }),
    ])

    if (sessionsRes.data) setSessions(sessionsRes.data as AuditSessionRow[])
    if (proposalsRes.data) setProposals(proposalsRes.data as ProposalRow[])
    if (tasksRes.data) setTasks(tasksRes.data as TaskRow[])

    setLoading(false)
  }, [client.id, supabase])

  useEffect(() => {
    fetchRelatedData()
  }, [fetchRelatedData])

  return (
    <div className="space-y-6">
      {/* Client Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{client.company_name}</h2>
                  <Badge className={`${STAGE_COLORS[client.stage]} text-white mt-1`}>
                    {STAGE_LABELS[client.stage]}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{client.contact_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${client.email}`} className="hover:text-primary">
                    {client.email}
                  </a>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${client.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                      {formatLithuanianPhone(client.phone)}
                    </a>
                  </div>
                )}
              </div>

              {client.tags && client.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/admin/audit/new?client=${client.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Audit
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/clients/${client.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/proposals/new?client=${client.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Proposal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/tasks/new?client=${client.id}`}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Add Task
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {client.notes && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {client.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            Audit Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2">
            <FileText className="h-4 w-4" />
            Proposals ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks ({tasks.filter((t) => t.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Audit Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Sessions</CardTitle>
                <CardDescription>Past and ongoing audit sessions</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/admin/audit/new?client=${client.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No audit sessions yet. Start one to gather insights.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/admin/audit/${session.id}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.created_at), 'PPp')}
                          </p>
                        </div>
                        <Badge
                          variant={session.status === 'complete' ? 'default' : 'secondary'}
                        >
                          {session.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Proposals</CardTitle>
                <CardDescription>Generated proposals for this client</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/admin/proposals/new?client=${client.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : proposals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No proposals yet. Complete an audit to generate one.
                </p>
              ) : (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/admin/clients/${client.id}/proposals/${proposal.id}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{proposal.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Updated {formatDistanceToNow(new Date(proposal.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge
                          variant={proposal.status === 'sent' ? 'default' : 'secondary'}
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Follow-ups and action items</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/admin/tasks/new?client=${client.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tasks yet. Add one to track follow-ups.
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border ${
                        task.status === 'completed' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                            {task.title}
                          </h4>
                          {task.due_date && (
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(task.due_date), 'PPp')}
                            </p>
                          )}
                        </div>
                        <Badge variant={task.status === 'completed' ? 'secondary' : 'outline'}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent activity for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed clientId={client.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
