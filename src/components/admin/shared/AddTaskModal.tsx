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

interface Client {
  id: string
  company_name: string
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: defaultClientId || '',
    due_date: '',
  })

  useEffect(() => {
    if (open) {
      fetchClients()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('tasks').insert({
        title: formData.title,
        description: formData.description || null,
        client_id: formData.client_id || null,
        due_date: formData.due_date || null,
        assigned_to: user?.id,
        status: 'pending',
      } as never)

      if (error) throw error

      // Reset form
      setFormData({
        title: '',
        description: '',
        client_id: defaultClientId || '',
        due_date: '',
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Follow up with client"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Optional details..."
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-xs">Client (optional)</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-sm">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="text-sm">
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-xs">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
