'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { ClipboardList, FileText, Building, Calendar, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultClientId?: string
}

export function AddTaskModal({ open, onClose, onSuccess, defaultClientId }: AddTaskModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<UserInfo[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: defaultClientId || '_none',
    due_date: '',
    assigned_to: '_none',
  })

  useEffect(() => {
    if (open) {
      fetchClients()
      fetchUsers()
      if (defaultClientId) {
        setFormData(prev => ({ ...prev, client_id: defaultClientId }))
      }
    }
  }, [open, defaultClientId])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name')

    if (data) {
      setClients(data)
    }
  }

  const fetchUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      setFormData(prev => ({ ...prev, assigned_to: user.id }))
    }

    const { data } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .order('name')

    if (data) {
      setUsers(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('tasks').insert({
        title: formData.title,
        description: formData.description || null,
        client_id: formData.client_id === '_none' ? null : formData.client_id || null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to === '_none' ? null : formData.assigned_to || null,
        status: 'pending',
      } as never)

      if (error) throw error

      // Reset form
      setFormData({
        title: '',
        description: '',
        client_id: defaultClientId || '',
        due_date: '',
        assigned_to: currentUserId,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form on close
    setFormData({
      title: '',
      description: '',
      client_id: defaultClientId || '',
      due_date: '',
      assigned_to: currentUserId,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Create Task</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a new task to your workflow
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Task Title *
            </Label>
            <div className="relative">
              <ClipboardList className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="title"
                placeholder="e.g., Follow up with client about proposal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                placeholder="Optional details about the task..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="pl-10 resize-none"
              />
            </div>
          </div>

          {/* Client & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">
                Client
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Link to a client
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="text-sm font-medium">
                Assign to
              </Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member">
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
                  <SelectItem value="_none">Unassigned</SelectItem>
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
              <p className="text-xs text-muted-foreground">
                Assign task to a team member
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium">
              Due Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Set a deadline for this task
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
