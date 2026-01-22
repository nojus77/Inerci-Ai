'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeRefresh } from '@/hooks/useRealtimeSubscription'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Clock,
  Building,
  AlertCircle,
  Search,
  Filter,
  X,
  CheckCircle2,
  Circle,
  Calendar,
} from 'lucide-react'
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import type { Task } from '@/types/database'
import { AddTaskModal } from '@/components/admin/shared/AddTaskModal'
import { TaskDetailModal } from '@/components/admin/shared/TaskDetailModal'
import { ClientPreviewModal } from '@/components/admin/shared/ClientPreviewModal'

interface Client {
  id: string
  company_name: string
}

interface UserInfo {
  id: string
  name: string
  avatar_url: string | null
}

interface TaskWithClient extends Task {
  client?: Client | null
  assignee?: UserInfo | null
}

export function TaskList() {
  const { t } = useLanguage()
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithClient | null>(null)
  const [previewClientId, setPreviewClientId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .order('name')

    if (data) {
      setUsers(data)
    }
  }, [supabase])

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name')

    if (data) {
      setClients(data)
    }
  }, [supabase])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*, client:clients(id, company_name)')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (clientFilter !== 'all') {
      query = query.eq('client_id', clientFilter)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      // Enrich tasks with assignee info
      const enrichedTasks = (data || []).map((task: Record<string, unknown>) => ({
        ...task,
        assignee: users.find(u => u.id === task.assigned_to) || null
      }))
      setTasks(enrichedTasks as unknown as TaskWithClient[])
    }
    setLoading(false)
  }, [supabase, statusFilter, clientFilter, search, users])

  useEffect(() => {
    fetchUsers()
    fetchClients()
  }, [fetchUsers, fetchClients])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Real-time updates
  useRealtimeRefresh(['tasks'], fetchTasks)

  const handleToggleTask = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      } as never)
      .eq('id', task.id)

    if (error) {
      console.error('Error updating task:', error)
      return
    }

    // Log activity if task has a client
    if (task.client_id && newStatus === 'completed') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('activity_log').insert({
          client_id: task.client_id,
          user_id: user.id,
          action: 'task_completed',
          metadata: { task_title: task.title },
        } as never)
      }
    }

    fetchTasks()
  }

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return { label: t.tasks.noDueDate, color: 'text-muted-foreground', urgent: false }

    const date = new Date(dueDate)

    if (isPast(date) && !isToday(date)) {
      return { label: t.tasks.overdue, color: 'text-red-500', urgent: true }
    }
    if (isToday(date)) {
      return { label: t.tasks.dueToday, color: 'text-amber-500', urgent: true }
    }
    if (isTomorrow(date)) {
      return { label: t.tasks.dueTomorrow, color: 'text-blue-500', urgent: false }
    }
    if (date < addDays(new Date(), 7)) {
      return { label: format(date, 'EEE, MMM d'), color: 'text-muted-foreground', urgent: false }
    }
    return { label: format(date, 'MMM d'), color: 'text-muted-foreground', urgent: false }
  }

  const groupedTasks = {
    overdue: tasks.filter(
      (t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status === 'pending'
    ),
    today: tasks.filter(
      (t) => t.due_date && isToday(new Date(t.due_date)) && t.status === 'pending'
    ),
    upcoming: tasks.filter(
      (t) =>
        t.status === 'pending' &&
        (!t.due_date ||
          (!isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))))
    ),
    completed: tasks.filter((t) => t.status === 'completed'),
  }

  const hasActiveFilters = clientFilter !== 'all' || search !== ''

  const clearFilters = () => {
    setClientFilter('all')
    setSearch('')
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'completed')}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t.tasks.pending}</SelectItem>
                <SelectItem value="completed">{t.tasks.completed}</SelectItem>
                <SelectItem value="all">{t.tasks.allTasks}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showFilters || hasActiveFilters ? "secondary" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              {t.tasks.filters}
              {hasActiveFilters && (
                <Badge variant="default" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {(clientFilter !== 'all' ? 1 : 0) + (search ? 1 : 0)}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                {t.tasks.clear}
              </Button>
            )}
          </div>

          <Button size="sm" className="h-9" onClick={() => setShowAddTask(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t.tasks.addTask}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.tasks.searchTasks}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder={t.tasks.filterByClient} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.tasks.allClients}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Task Timeline */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-4">{t.tasks.loading}</p>
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            {hasActiveFilters ? t.tasks.noTasksFiltered : t.tasks.noTasks}
          </p>
          {hasActiveFilters ? (
            <Button variant="link" size="sm" onClick={clearFilters}>
              {t.tasks.clearFilters}
            </Button>
          ) : (
            <Button variant="link" size="sm" onClick={() => setShowAddTask(true)}>
              {t.tasks.createFirst}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <TaskSection
              title={t.tasks.overdue}
              count={groupedTasks.overdue.length}
              icon={<AlertCircle className="h-4 w-4" />}
              variant="destructive"
              tasks={groupedTasks.overdue}
              onToggle={handleToggleTask}
              onClick={(task) => setSelectedTask(task)}
              onClientClick={(id) => setPreviewClientId(id)}
              getDueDateInfo={getDueDateInfo}
            />
          )}

          {/* Today */}
          {groupedTasks.today.length > 0 && (
            <TaskSection
              title={t.tasks.today}
              count={groupedTasks.today.length}
              icon={<Calendar className="h-4 w-4" />}
              variant="warning"
              tasks={groupedTasks.today}
              onToggle={handleToggleTask}
              onClick={(task) => setSelectedTask(task)}
              onClientClick={(id) => setPreviewClientId(id)}
              getDueDateInfo={getDueDateInfo}
            />
          )}

          {/* Upcoming */}
          {groupedTasks.upcoming.length > 0 && statusFilter !== 'completed' && (
            <TaskSection
              title={t.tasks.upcoming}
              count={groupedTasks.upcoming.length}
              icon={<Clock className="h-4 w-4" />}
              variant="default"
              tasks={groupedTasks.upcoming}
              onToggle={handleToggleTask}
              onClick={(task) => setSelectedTask(task)}
              onClientClick={(id) => setPreviewClientId(id)}
              getDueDateInfo={getDueDateInfo}
            />
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && statusFilter !== 'pending' && (
            <TaskSection
              title={t.tasks.completed}
              count={groupedTasks.completed.length}
              icon={<CheckCircle2 className="h-4 w-4" />}
              variant="success"
              tasks={groupedTasks.completed}
              onToggle={handleToggleTask}
              onClick={(task) => setSelectedTask(task)}
              onClientClick={(id) => setPreviewClientId(id)}
              getDueDateInfo={getDueDateInfo}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSuccess={fetchTasks}
      />

      <TaskDetailModal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onSuccess={fetchTasks}
      />

      <ClientPreviewModal
        open={!!previewClientId}
        onClose={() => setPreviewClientId(null)}
        clientId={previewClientId}
      />
    </div>
  )
}

function TaskSection({
  title,
  count,
  icon,
  variant,
  tasks,
  onToggle,
  onClick,
  onClientClick,
  getDueDateInfo,
}: {
  title: string
  count: number
  icon: React.ReactNode
  variant: 'destructive' | 'warning' | 'default' | 'success'
  tasks: TaskWithClient[]
  onToggle: (e: React.MouseEvent, task: Task) => void
  onClick: (task: TaskWithClient) => void
  onClientClick: (clientId: string) => void
  getDueDateInfo: (dueDate: string | null) => { label: string; color: string; urgent: boolean }
}) {
  const variantStyles = {
    destructive: {
      line: 'bg-red-500',
      dot: 'bg-red-500 ring-red-100',
      text: 'text-red-600',
      bg: 'bg-red-50',
    },
    warning: {
      line: 'bg-amber-500',
      dot: 'bg-amber-500 ring-amber-100',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    default: {
      line: 'bg-primary',
      dot: 'bg-primary ring-primary/20',
      text: 'text-foreground',
      bg: 'bg-muted/50',
    },
    success: {
      line: 'bg-emerald-500',
      dot: 'bg-emerald-500 ring-emerald-100',
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div>
      {/* Section Header */}
      <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${styles.bg}`}>
        <span className={styles.text}>{icon}</span>
        <span className={`text-sm font-semibold ${styles.text}`}>
          {title}
        </span>
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          {count}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative ml-6">
        {/* Vertical Line */}
        <div className={`absolute left-0 top-2 bottom-2 w-0.5 ${styles.line} opacity-30 rounded-full`} />

        {/* Task Items */}
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const dueDateInfo = getDueDateInfo(task.due_date)
            const isCompleted = task.status === 'completed'

            return (
              <div
                key={task.id}
                className="relative flex items-start gap-4 group"
              >
                {/* Timeline Dot */}
                <button
                  onClick={(e) => onToggle(e, task)}
                  className={`
                    relative z-10 flex items-center justify-center w-6 h-6 -ml-3 rounded-full
                    transition-all duration-200 ring-2
                    ${isCompleted
                      ? 'bg-emerald-500 ring-emerald-100 text-white'
                      : `${styles.dot} hover:scale-110`
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3 text-white" />
                  )}
                </button>

                {/* Task Card */}
                <button
                  onClick={() => onClick(task)}
                  className={`
                    flex-1 text-left px-4 py-3 rounded-xl border transition-all duration-200
                    ${isCompleted
                      ? 'bg-muted/30 border-border/30 opacity-60'
                      : 'bg-card border-border/50 hover:border-border hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.client && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              onClientClick(task.client!.id)
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                          >
                            <Building className="h-3 w-3" />
                            {task.client.company_name}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={task.assignee.avatar_url || ''} />
                              <AvatarFallback className="text-[8px]">
                                {task.assignee.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs flex items-center gap-1 ${dueDateInfo.color}`}>
                        <Clock className="h-3 w-3" />
                        {dueDateInfo.label}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
