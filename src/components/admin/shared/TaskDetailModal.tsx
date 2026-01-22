'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClipboardList,
  Calendar,
  Building,
  Clock,
  Trash2,
  Save,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import type { Task } from '@/types/database'

interface Client {
  id: string
  company_name: string
}

interface UserInfo {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface TaskWithClient extends Task {
  client?: Client | null
}

interface TaskDetailModalProps {
  open: boolean
  onClose: () => void
  task: TaskWithClient | null
  onSuccess?: () => void
}

export function TaskDetailModal({ open, onClose, task, onSuccess }: TaskDetailModalProps) {
  const { t } = useLanguage()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<UserInfo[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '_none',
    due_date: '',
    assigned_to: '_none',
    status: 'pending' as 'pending' | 'completed',
  })
  const [hasChanges, setHasChanges] = useState(false)

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name')

    if (data) {
      setClients(data)
    }
  }, [supabase])

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .order('name')

    if (data) {
      setUsers(data)
    }
  }, [supabase])

  useEffect(() => {
    if (open) {
      fetchClients()
      fetchUsers()
      if (task) {
        let formattedDueDate = ''
        try {
          if (task.due_date) {
            formattedDueDate = format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm")
          }
        } catch (e) {
          console.error('Error formatting due date:', e)
        }

        setFormData({
          title: task.title || '',
          description: task.description || '',
          client_id: task.client_id || '_none',
          due_date: formattedDueDate,
          assigned_to: task.assigned_to || '_none',
          status: (task.status as 'pending' | 'completed') || 'pending',
        })
        setHasChanges(false)
      }
    }
  }, [open, task, fetchClients, fetchUsers])

  if (!task) return null

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleStatusToggle = async () => {
    const newStatus = formData.status === 'pending' ? 'completed' : 'pending'
    setFormData(prev => ({ ...prev, status: newStatus }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title,
          description: formData.description || null,
          client_id: formData.client_id === '_none' ? null : formData.client_id || null,
          due_date: formData.due_date || null,
          assigned_to: formData.assigned_to === '_none' ? null : formData.assigned_to || null,
          status: formData.status,
          completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
        } as never)
        .eq('id', task.id)

      if (error) throw error

      // Log activity if task has a client and status changed
      if (task.client_id && formData.status !== task.status) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('activity_log').insert({
            client_id: task.client_id,
            user_id: user.id,
            action: formData.status === 'completed' ? 'task_completed' : 'task_reopened',
            metadata: { task_title: formData.title },
          } as never)
        }
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) {
      return
    }

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {t.modals.taskDetails}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStatusToggle}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  formData.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                }`}
              >
                {formData.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.tasks.completed}
                  </>
                ) : (
                  <>
                    <Circle className="h-3.5 w-3.5" />
                    {t.tasks.pending}
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {t.modals.taskTitle} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="..."
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t.modals.descriptionNotes}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t.modals.descriptionPlaceholder}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t.modals.descriptionHint}
            </p>
          </div>

          {/* Client & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">
                {t.modals.linkedClient}
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleChange('client_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.modals.selectClient} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t.modals.noClient}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {task.client && (
                <Link
                  href={`/admin/clients/${task.client.id}`}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  onClick={onClose}
                >
                  <Building className="h-3 w-3" />
                  {t.modals.view} {task.client.company_name}
                </Link>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-medium">
                {t.modals.dueDate}
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-sm font-medium">
              {t.common.assignTo}
            </Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => handleChange('assigned_to', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.common.selectTeamMember}>
                  {formData.assigned_to && users.find(u => u.id === formData.assigned_to) && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={users.find(u => u.id === formData.assigned_to)?.avatar_url || ''} />
                        <AvatarFallback className="text-[10px]">
                          {users.find(u => u.id === formData.assigned_to)?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{users.find(u => u.id === formData.assigned_to)?.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t.common.unassigned}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="text-[10px]">
                          {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {task.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t.common.created} {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </span>
            )}
            {task.completed_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {t.tasks.completed} {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {deleting ? t.modals.deleting : t.modals.delete}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t.modals.cancel}
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.title.trim()}>
              <Save className="h-4 w-4 mr-1.5" />
              {loading ? t.modals.saving : t.modals.saveChanges}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
