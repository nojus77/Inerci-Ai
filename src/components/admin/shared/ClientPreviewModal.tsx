'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  FileText,
  ClipboardList,
  TrendingUp,
  ExternalLink,
  Edit,
  Tag,
  MessageSquare,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import type { ClientStage } from '@/types/database'

interface Client {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  stage: ClientStage
  notes: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  title: string
  status: string
  due_date: string | null
}

interface Activity {
  id: string
  action: string
  created_at: string
  metadata: Record<string, unknown> | null
}

interface AuditSession {
  id: string
  title: string
  status: string
  created_at: string
}

interface Proposal {
  id: string
  title: string
  status: string
  created_at: string
}

interface ClientPreviewModalProps {
  open: boolean
  onClose: () => void
  clientId: string | null
}

const STAGE_CONFIG: Record<ClientStage, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-slate-500' },
  audit_scheduled: { label: 'Audit Scheduled', color: 'bg-blue-500' },
  audit_done: { label: 'Audit Done', color: 'bg-indigo-500' },
  prototype_building: { label: 'Prototype Building', color: 'bg-purple-500' },
  prototype_delivered: { label: 'Prototype Delivered', color: 'bg-violet-500' },
  proposal_draft: { label: 'Proposal Draft', color: 'bg-amber-500' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-yellow-500' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500' },
  won: { label: 'Won', color: 'bg-emerald-500' },
  lost: { label: 'Lost', color: 'bg-red-500' },
  on_hold: { label: 'On Hold', color: 'bg-gray-500' },
}

export function ClientPreviewModal({ open, onClose, clientId }: ClientPreviewModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [sessions, setSessions] = useState<AuditSession[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])

  useEffect(() => {
    if (open && clientId) {
      fetchClientData()
    }
  }, [open, clientId])

  const fetchClientData = async () => {
    if (!clientId) return
    setLoading(true)

    try {
      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientData) {
        setClient(clientData as Client)
      }

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (tasksData) {
        setTasks(tasksData)
      }

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('activity_log')
        .select('id, action, created_at, metadata')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activitiesData) {
        setActivities(activitiesData as Activity[])
      }

      // Fetch audit sessions
      const { data: sessionsData } = await supabase
        .from('audit_sessions')
        .select('id, title, status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (sessionsData) {
        setSessions(sessionsData)
      }

      // Fetch proposals
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('id, title, status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (proposalsData) {
        setProposals(proposalsData)
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!clientId) return null

  const stageInfo = client ? STAGE_CONFIG[client.stage] : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">{client?.company_name || 'Loading...'}</DialogTitle>
                {client && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                    {client.contact_name}
                  </p>
                )}
              </div>
            </div>
            {stageInfo && (
              <Badge className={`${stageInfo.color} text-white`}>
                {stageInfo.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading client data...</p>
          </div>
        ) : client ? (
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                  {client.email}
                </a>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created {format(new Date(client.created_at), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Updated {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
              </div>
            </div>

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <div className="flex items-center gap-2 pb-4">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1.5 flex-wrap">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  {client.notes}
                </p>
              </div>
            )}

            <Separator className="my-2" />

            {/* Tabs for related data */}
            <Tabs defaultValue="activity" className="py-4">
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="activity" className="text-xs">
                  Activity ({activities.length})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="audits" className="text-xs">
                  Audits ({sessions.length})
                </TabsTrigger>
                <TabsTrigger value="proposals" className="text-xs">
                  Proposals ({proposals.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-3 space-y-1">
                {activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm">{activity.action.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-3 space-y-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{task.title}</span>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'secondary' : 'default'} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="audits" className="mt-3 space-y-1">
                {sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No audit sessions</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{session.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="proposals" className="mt-3 space-y-1">
                {proposals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No proposals</p>
                ) : (
                  proposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{proposal.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {proposal.status}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Client not found</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/clients/${clientId}/edit`} onClick={onClose}>
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/admin/clients/${clientId}`} onClick={onClose}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Full Page
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
