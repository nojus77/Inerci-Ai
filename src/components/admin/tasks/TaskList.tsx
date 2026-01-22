'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeRefresh } from '@/hooks/useRealtimeSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Clock, Building, AlertCircle, Search, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import type { Task } from '@/types/database'
import { AddTaskModal } from '@/components/admin/shared/AddTaskModal'
import { TaskDetailModal } from '@/components/admin/shared/TaskDetailModal'
import { ClientPreviewModal } from '@/components/admin/shared/ClientPreviewModal'

interface Client {
  id: string
  company_name: string
}

interface TaskWithClient extends Task {
  client?: Client | null
}

export function TaskList() {
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
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
      setTasks((data || []) as unknown as TaskWithClient[])
    }
    setLoading(false)
  }, [supabase, statusFilter, clientFilter, search])

  useEffect(() => {
    fetchClients()
    fetchTasks()
  }, [fetchClients, fetchTasks])

  // Real-time updates
  useRealtimeRefresh(['tasks'], fetchTasks)

  const handleToggleTask = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation() // Prevent opening modal
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
    if (!dueDate) return { label: 'No due date', variant: 'secondary' as const }

    const date = new Date(dueDate)

    if (isPast(date) && !isToday(date)) {
      return { label: 'Overdue', variant: 'destructive' as const }
    }
    if (isToday(date)) {
      return { label: 'Due today', variant: 'default' as const }
    }
    if (isTomorrow(date)) {
      return { label: 'Due tomorrow', variant: 'secondary' as const }
    }
    if (date < addDays(new Date(), 7)) {
      return { label: format(date, 'EEE, MMM d'), variant: 'secondary' as const }
    }
    return { label: format(date, 'MMM d'), variant: 'outline' as const }
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
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'completed')}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All Tasks</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle more filters */}
            <Button
              variant={showFilters || hasActiveFilters ? "secondary" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Filters
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
                Clear
              </Button>
            )}
          </div>

          <Button size="sm" className="h-9" onClick={() => setShowAddTask(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={clientFilter}
              onValueChange={setClientFilter}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
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

      {/* Task List */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            {hasActiveFilters ? 'No tasks match your filters.' : 'No tasks found.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="link" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button variant="link" size="sm" onClick={() => setShowAddTask(true)}>
              Create your first task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Overdue ({groupedTasks.overdue.length})
              </h3>
              <div className="space-y-1.5">
                {groupedTasks.overdue.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onClick={() => setSelectedTask(task)}
                    onClientClick={(clientId) => setPreviewClientId(clientId)}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {groupedTasks.today.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Today ({groupedTasks.today.length})</h3>
              <div className="space-y-1.5">
                {groupedTasks.today.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onClick={() => setSelectedTask(task)}
                    onClientClick={(clientId) => setPreviewClientId(clientId)}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {groupedTasks.upcoming.length > 0 && statusFilter !== 'completed' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Upcoming ({groupedTasks.upcoming.length})
              </h3>
              <div className="space-y-1.5">
                {groupedTasks.upcoming.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onClick={() => setSelectedTask(task)}
                    onClientClick={(clientId) => setPreviewClientId(clientId)}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && statusFilter !== 'pending' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed ({groupedTasks.completed.length})
              </h3>
              <div className="space-y-1.5">
                {groupedTasks.completed.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onClick={() => setSelectedTask(task)}
                    onClientClick={(clientId) => setPreviewClientId(clientId)}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
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

function TaskItem({
  task,
  onToggle,
  onClick,
  onClientClick,
  getDueDateInfo,
}: {
  task: TaskWithClient
  onToggle: (e: React.MouseEvent, task: Task) => void
  onClick: () => void
  onClientClick: (clientId: string) => void
  getDueDateInfo: (dueDate: string | null) => { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
}) {
  const dueDateInfo = getDueDateInfo(task.due_date)
  const isCompleted = task.status === 'completed'

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-border transition-all text-left ${isCompleted ? 'opacity-60' : ''}`}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(e) => onToggle(e as unknown as React.MouseEvent, task)}
          className="h-4 w-4"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
        {task.client && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClientClick(task.client!.id)
            }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            <Building className="h-3 w-3" />
            {task.client.company_name}
          </button>
        )}
      </div>
      <Badge variant={dueDateInfo.variant} className="text-xs px-2 py-0.5 flex-shrink-0">
        <Clock className="h-3 w-3 mr-1" />
        {dueDateInfo.label}
      </Badge>
    </button>
  )
}
