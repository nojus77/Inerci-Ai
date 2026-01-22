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
import { ProposalPreviewModal } from '@/components/admin/shared/ProposalPreviewModal'
import { TaskDetailModal } from '@/components/admin/shared/TaskDetailModal'
import { AddTaskModal } from '@/components/admin/shared/AddTaskModal'
import { StartAuditModal } from '@/components/admin/shared/StartAuditModal'
import { AddProposalModal } from '@/components/admin/shared/AddProposalModal'
import { EditClientModal } from '@/components/admin/shared/EditClientModal'

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

  // Modal states
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showStartAudit, setShowStartAudit] = useState(false)
  const [showAddProposal, setShowAddProposal] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [currentClient, setCurrentClient] = useState(client)

  const fetchRelatedData = useCallback(async () => {
    setLoading(true)

    const [sessionsRes, proposalsRes, tasksRes] = await Promise.all([
      supabase
        .from('audit_sessions')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('proposals')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('due_date', { ascending: true }),
    ])

    if (sessionsRes.data) setSessions(sessionsRes.data as AuditSessionRow[])
    if (proposalsRes.data) setProposals(proposalsRes.data as ProposalRow[])
    if (tasksRes.data) setTasks(tasksRes.data as TaskRow[])

    setLoading(false)
  }, [currentClient.id, supabase])

  const fetchClientData = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', currentClient.id)
      .single()

    if (data) {
      setCurrentClient(data as ClientRow)
    }
  }, [currentClient.id, supabase])

  const handleClientUpdated = () => {
    fetchClientData()
    fetchRelatedData()
  }

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
                  <h2 className="text-xl font-semibold">{currentClient.company_name}</h2>
                  <Badge className={`${STAGE_COLORS[currentClient.stage]} text-white mt-1`}>
                    {STAGE_LABELS[currentClient.stage]}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{currentClient.contact_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${currentClient.email}`} className="hover:text-primary">
                    {currentClient.email}
                  </a>
                </div>
                {currentClient.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${currentClient.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                      {formatLithuanianPhone(currentClient.phone)}
                    </a>
                  </div>
                )}
              </div>

              {currentClient.tags && currentClient.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {currentClient.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowStartAudit(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Start Audit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditClient(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddProposal(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Proposal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddTask(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Add Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {currentClient.notes && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {currentClient.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Audit Sessions & Proposals */}
        <Card className="lg:col-span-1">
          <Tabs defaultValue="sessions" className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="sessions" className="text-xs gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Sessions ({sessions.length})
                </TabsTrigger>
                <TabsTrigger value="proposals" className="text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Proposals ({proposals.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <TabsContent value="sessions" className="mt-0 h-full">
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        No audit sessions yet
                      </p>
                      <Button size="sm" onClick={() => setShowStartAudit(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Start Session
                      </Button>
                    </div>
                  ) : (
                    <>
                      {sessions.slice(0, 4).map((session) => (
                        <Link
                          key={session.id}
                          href={`/admin/audit/${session.id}`}
                          className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm truncate">{session.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(session.created_at), 'PP')}
                              </p>
                            </div>
                            <Badge
                              variant={session.status === 'complete' ? 'default' : 'secondary'}
                              className="text-[10px] px-1.5 shrink-0"
                            >
                              {session.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                      {sessions.length > 4 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{sessions.length - 4} more
                        </p>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="proposals" className="mt-0 h-full">
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : proposals.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        No proposals yet
                      </p>
                      <Button size="sm" onClick={() => setShowAddProposal(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create Proposal
                      </Button>
                    </div>
                  ) : (
                    <>
                      {proposals.slice(0, 4).map((proposal) => (
                        <button
                          key={proposal.id}
                          onClick={() => setSelectedProposalId(proposal.id)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm truncate">{proposal.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(proposal.updated_at), { addSuffix: true })}
                              </p>
                            </div>
                            <Badge
                              variant={proposal.status === 'sent' ? 'default' : 'secondary'}
                              className="text-[10px] px-1.5 shrink-0"
                            >
                              {proposal.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                      {proposals.length > 4 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{proposals.length - 4} more
                        </p>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Middle Column: Tasks & Activity */}
        <Card className="lg:col-span-1">
          <Tabs defaultValue="tasks" className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="tasks" className="text-xs gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Tasks ({tasks.filter((t) => t.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <TabsContent value="tasks" className="mt-0 h-full">
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        No tasks yet
                      </p>
                      <Button size="sm" onClick={() => setShowAddTask(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Task
                      </Button>
                    </div>
                  ) : (
                    <>
                      {tasks.slice(0, 4).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                            task.status === 'completed' ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                                {task.title}
                              </h4>
                              {task.due_date && (
                                <p className="text-xs text-muted-foreground">
                                  Due: {format(new Date(task.due_date), 'PP')}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={task.status === 'completed' ? 'secondary' : 'outline'}
                              className="text-[10px] px-1.5 shrink-0"
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                      {tasks.length > 4 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{tasks.length - 4} more
                        </p>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="activity" className="mt-0 h-full">
                <div className="max-h-[240px] overflow-y-auto">
                  <ActivityFeed clientId={currentClient.id} compact />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Right Column: Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" onClick={() => setShowStartAudit(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Start New Audit
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setShowAddProposal(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setShowAddTask(true)}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Add Task
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setShowEditClient(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ProposalPreviewModal
        open={!!selectedProposalId}
        onClose={() => setSelectedProposalId(null)}
        proposalId={selectedProposalId}
      />
      <TaskDetailModal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onSuccess={fetchRelatedData}
      />
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        defaultClientId={currentClient.id}
        onSuccess={fetchRelatedData}
      />
      <StartAuditModal
        open={showStartAudit}
        onClose={() => setShowStartAudit(false)}
        defaultClientId={currentClient.id}
        onSuccess={fetchRelatedData}
      />
      <AddProposalModal
        open={showAddProposal}
        onClose={() => setShowAddProposal(false)}
        defaultClientId={currentClient.id}
        onSuccess={fetchRelatedData}
      />
      <EditClientModal
        open={showEditClient}
        onClose={() => setShowEditClient(false)}
        client={currentClient}
        onSuccess={handleClientUpdated}
      />
    </div>
  )
}
