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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'pending' | 'completed')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All Tasks</SelectItem>
          </SelectContent>
        </Select>

        <Button asChild>
          <Link href="/admin/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No tasks found. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Overdue ({groupedTasks.overdue.length})
              </h3>
              <div className="space-y-2">
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
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Today ({groupedTasks.today.length})</h3>
              <div className="space-y-2">
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
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Upcoming ({groupedTasks.upcoming.length})
              </h3>
              <div className="space-y-2">
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
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed ({groupedTasks.completed.length})
              </h3>
              <div className="space-y-2">
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
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggle(task)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <Badge variant={dueDateInfo.variant}>
                <Clock className="h-3 w-3 mr-1" />
                {dueDateInfo.label}
              </Badge>
            </div>

            {task.client && (
              <Link
                href={`/admin/clients/${task.client.id}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2"
              >
                <Building className="h-3 w-3" />
                {task.client.company_name}
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
