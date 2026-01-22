'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { useRealtimeRefresh } from '@/hooks/useRealtimeSubscription'
import { AddClientModal } from '@/components/admin/shared/AddClientModal'
import { AddTaskModal } from '@/components/admin/shared/AddTaskModal'
import { ActivityPreviewModal } from '@/components/admin/shared/ActivityPreviewModal'
import { ClientPreviewModal } from '@/components/admin/shared/ClientPreviewModal'
import { TaskDetailModal } from '@/components/admin/shared/TaskDetailModal'
import { StartAuditModal } from '@/components/admin/shared/StartAuditModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Clock,
  Plus,
  Play,
  LayoutGrid,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { TaskStatus } from '@/types/database'

interface DashboardStats {
  activeClients: number
  openProposals: number
  pendingTasks: number
  wonThisMonth: number
}

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  client_id: string | null
  proposal_id: string | null
  assigned_to: string
  reminder_sent_at: string | null
  created_at: string
  completed_at: string | null
  client: { id: string; company_name: string } | null
}

interface Activity {
  id: string
  action: string
  created_at: string
  metadata?: Record<string, unknown>
  client: { id: string; company_name: string } | null
}

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showStartAudit, setShowStartAudit] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      const [clientsRes, proposalsRes, tasksCountRes, wonRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .not('stage', 'in', '(lost,on_hold)'),
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .in('status', ['draft', 'review_requested']),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('stage', 'won')
          .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ])

      setStats({
        activeClients: clientsRes.count || 0,
        openProposals: proposalsRes.count || 0,
        pendingTasks: tasksCountRes.count || 0,
        wonThisMonth: wonRes.count || 0,
      })

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, status, client_id, proposal_id, assigned_to, reminder_sent_at, created_at, completed_at, client:clients(id, company_name)')
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5)

      if (tasksData) {
        setTasks(tasksData as unknown as Task[])
      }

      const { data: activityData } = await supabase
        .from('activity_log')
        .select('id, action, created_at, metadata, client:clients(id, company_name)')
        .order('created_at', { ascending: false })
        .limit(6)

      if (activityData) {
        setActivities(activityData as unknown as Activity[])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useRealtimeRefresh(['clients', 'tasks', 'activity_log', 'proposals'], fetchDashboardData)

  const statsConfig = [
    { name: 'Active Clients', value: stats?.activeClients ?? 0, icon: Users, href: '/admin/clients' },
    { name: 'Open Proposals', value: stats?.openProposals ?? 0, icon: FileText, href: '/admin/proposals/new' },
    { name: 'Pending Tasks', value: stats?.pendingTasks ?? 0, icon: ClipboardList, href: '/admin/tasks' },
    { name: 'Won This Month', value: stats?.wonThisMonth ?? 0, icon: TrendingUp, href: '/admin/pipeline' },
  ]

  const getTaskPriority = (dueDate: string | null): 'high' | 'medium' | 'low' => {
    if (!dueDate) return 'low'
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return 'high'
    if (diffDays <= 3) return 'medium'
    return 'low'
  }

  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return 'No due date'
    return formatDistanceToNow(new Date(dueDate), { addSuffix: true })
  }

  const getActivityType = (action: string): string => {
    if (action.includes('proposal')) return 'proposal'
    if (action.includes('stage')) return 'stage'
    if (action.includes('client') || action.includes('created')) return 'client'
    return 'other'
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Dashboard" />
        <div className="flex-1 p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Dashboard" />

      <div className="flex-1 p-5 space-y-4">
        {/* Stats Row */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card className="border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.name}</p>
                    <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-muted-foreground/50" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions - Using modals */}
        <div className="flex items-center gap-2 py-1">
          <span className="text-xs text-muted-foreground mr-1">Quick:</span>
          <button
            onClick={() => setShowAddClient(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Client
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Task
          </button>
          <button
            onClick={() => setShowStartAudit(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-colors"
          >
            <Play className="h-3 w-3" />
            Start Audit
          </button>
          <Link
            href="/admin/pipeline"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-colors"
          >
            <LayoutGrid className="h-3 w-3" />
            Pipeline
          </Link>
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-colors"
          >
            <Calendar className="h-3 w-3" />
            Calendar
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Upcoming Tasks */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30">
              <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
              <Link
                href="/admin/tasks"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
              >
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs">No pending tasks</p>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Create task
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.client ? (
                          <span className="text-xs text-primary truncate block">
                            {task.client.company_name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground truncate block">No client</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={
                            getTaskPriority(task.due_date) === 'high' ? 'destructive' :
                            getTaskPriority(task.due_date) === 'medium' ? 'default' : 'secondary'
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {getTaskPriority(task.due_date)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDueDate(task.due_date)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <span className="text-xs text-muted-foreground">
                {activities.length} events
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs">No recent activity</p>
                  <button
                    onClick={() => setShowAddClient(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Add client
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {activities.map((activity) => {
                    const activityType = getActivityType(activity.action)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                          activityType === 'proposal' ? 'bg-primary' :
                          activityType === 'stage' ? 'bg-amber-500' :
                          activityType === 'client' ? 'bg-emerald-500' :
                          'bg-muted-foreground/40'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setSelectedActivity(activity)}
                            className="text-sm truncate hover:text-primary transition-colors text-left w-full"
                          >
                            {activity.action.replace(/_/g, ' ')}
                          </button>
                          {activity.client ? (
                            <button
                              onClick={() => setSelectedClientId(activity.client!.id)}
                              className="text-xs text-primary hover:underline truncate"
                            >
                              {activity.client.company_name}
                            </button>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate">System</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onSuccess={fetchDashboardData}
      />
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSuccess={fetchDashboardData}
      />
      <ActivityPreviewModal
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        activity={selectedActivity}
      />
      <ClientPreviewModal
        open={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        clientId={selectedClientId}
      />
      <TaskDetailModal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onSuccess={fetchDashboardData}
      />
      <StartAuditModal
        open={showStartAudit}
        onClose={() => setShowStartAudit(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  )
}
