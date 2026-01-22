'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeRefresh } from '@/hooks/useRealtimeSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Clock, Building, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import type { Task } from '@/types/database'

interface TaskWithClient extends Task {
  client?: { id: string; company_name: string } | null
}

export function TaskList() {
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*, client:clients(id, company_name)')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks((data || []) as unknown as TaskWithClient[])
    }
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Real-time updates
  useRealtimeRefresh(['tasks'], fetchTasks)

  const handleToggleTask = async (task: Task) => {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 justify-between">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'pending' | 'completed')}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
            <SelectItem value="all" className="text-xs">All Tasks</SelectItem>
          </SelectContent>
        </Select>

        <Button asChild size="sm" className="h-8 text-xs">
          <Link href="/admin/tasks/new">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Task
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            No tasks found. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Overdue ({groupedTasks.overdue.length})
              </h3>
              <div className="space-y-1">
                {groupedTasks.overdue.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {groupedTasks.today.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium">Today ({groupedTasks.today.length})</h3>
              <div className="space-y-1">
                {groupedTasks.today.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {groupedTasks.upcoming.length > 0 && filter !== 'completed' && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">
                Upcoming ({groupedTasks.upcoming.length})
              </h3>
              <div className="space-y-1">
                {groupedTasks.upcoming.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && filter !== 'pending' && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">
                Completed ({groupedTasks.completed.length})
              </h3>
              <div className="space-y-1">
                {groupedTasks.completed.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    getDueDateInfo={getDueDateInfo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskItem({
  task,
  onToggle,
  getDueDateInfo,
}: {
  task: TaskWithClient
  onToggle: (task: Task) => void
  getDueDateInfo: (dueDate: string | null) => { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
}) {
  const dueDateInfo = getDueDateInfo(task.due_date)
  const isCompleted = task.status === 'completed'

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-card hover:bg-muted/30 transition-colors ${isCompleted ? 'opacity-50' : ''}`}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(task)}
        className="h-3.5 w-3.5"
      />
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          {task.client && (
            <Link
              href={`/admin/clients/${task.client.id}`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
            >
              <Building className="h-2.5 w-2.5" />
              {task.client.company_name}
            </Link>
          )}
        </div>
        <Badge variant={dueDateInfo.variant} className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          {dueDateInfo.label}
        </Badge>
      </div>
    </div>
  )
}
