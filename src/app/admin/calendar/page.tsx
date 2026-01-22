'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { useRealtimeRefresh } from '@/hooks/useRealtimeSubscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  ClipboardList,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO
} from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'audit' | 'task'
  clientName?: string
  clientId?: string
  status?: string
}

interface AuditSession {
  id: string
  title: string
  status: string
  structured_data: {
    scheduled_time?: string
  } | null
  client: {
    id: string
    company_name: string
  } | null
}

interface Task {
  id: string
  title: string
  due_date: string | null
  status: string
  client: {
    id: string
    company_name: string
  } | null
}

export default function CalendarPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchEvents = useCallback(async () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Fetch audit sessions with scheduled times
    const { data: sessionsData } = await supabase
      .from('audit_sessions')
      .select('id, title, status, structured_data, client:clients(id, company_name)')
      .not('structured_data', 'is', null)

    // Fetch tasks with due dates in the current month range
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, due_date, status, client:clients(id, company_name)')
      .gte('due_date', monthStart.toISOString())
      .lte('due_date', monthEnd.toISOString())
      .eq('status', 'pending')

    const calendarEvents: CalendarEvent[] = []

    // Process audit sessions
    if (sessionsData) {
      const sessions = sessionsData as unknown as AuditSession[]
      sessions.forEach((session) => {
        const scheduledTime = session.structured_data?.scheduled_time
        if (scheduledTime) {
          try {
            const date = parseISO(scheduledTime)
            calendarEvents.push({
              id: session.id,
              title: session.title,
              date,
              type: 'audit',
              clientName: session.client?.company_name,
              clientId: session.client?.id,
              status: session.status
            })
          } catch {
            // Invalid date, skip
          }
        }
      })
    }

    // Process tasks
    if (tasksData) {
      const tasks = tasksData as unknown as Task[]
      tasks.forEach((task) => {
        if (task.due_date) {
          try {
            const date = parseISO(task.due_date)
            calendarEvents.push({
              id: task.id,
              title: task.title,
              date,
              type: 'task',
              clientName: task.client?.company_name,
              clientId: task.client?.id,
              status: task.status
            })
          } catch {
            // Invalid date, skip
          }
        }
      })
    }

    setEvents(calendarEvents)
    setLoading(false)
  }, [currentDate, supabase])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchEvents()
  }, [fetchEvents])

  // Real-time updates - new bookings appear instantly
  useRealtimeRefresh(['audit_sessions', 'tasks'], fetchEvents)

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day))
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : []

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Calendar" showSearch={false} />
        <div className="flex-1 p-6">
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Calendar" showSearch={false} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Calendar Grid */}
          <Card className="border-border/50 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <CalendarIcon className="h-5 w-5" />
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        min-h-[80px] p-2 rounded-lg text-left transition-colors relative
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
                        ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}
                        ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}
                      `}
                    >
                      <span
                        className={`
                          text-sm font-medium
                          ${isToday(day) ? 'text-primary' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Event indicators */}
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`
                              text-[10px] px-1.5 py-0.5 rounded truncate
                              ${event.type === 'audit'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-amber-500/10 text-amber-600'
                              }
                            `}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card className="border-border/50 shadow-sm rounded-xl h-fit">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {selectedDate
                  ? format(selectedDate, 'EEEE, MMMM d')
                  : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {selectedDate ? (
                selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={
                          event.type === 'audit'
                            ? `/admin/audit/${event.id}`
                            : event.clientId
                            ? `/admin/clients/${event.clientId}`
                            : '/admin/tasks'
                        }
                        className="block p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {event.type === 'audit' ? (
                              <Video className="h-4 w-4 text-primary" />
                            ) : (
                              <ClipboardList className="h-4 w-4 text-amber-500" />
                            )}
                            <Badge
                              variant={event.type === 'audit' ? 'default' : 'secondary'}
                              className="text-[10px]"
                            >
                              {event.type === 'audit' ? 'Audit' : 'Task'}
                            </Badge>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="font-medium text-sm mt-2 line-clamp-2">
                          {event.title}
                        </h4>
                        {event.clientName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.clientName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(event.date, 'h:mm a')}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events scheduled</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click a date to see events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span>Audit Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20" />
            <span>Task</span>
          </div>
        </div>
      </div>
    </div>
  )
}
