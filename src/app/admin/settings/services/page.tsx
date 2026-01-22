'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Building, Edit, Trash2 } from 'lucide-react'
import type { Service } from '@/types/database'

export default function ServicesSettingsPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    deliverables: '',
    prerequisites: '',
    timeline_min: 1,
    timeline_max: 4,
    price_min: 0,
    price_max: 0,
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (data) {
        setServices(data as unknown as Service[])
      }
      setLoading(false)
    }

    fetchServices()
  }, [supabase])

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      deliverables: '',
      prerequisites: '',
      timeline_min: 1,
      timeline_max: 4,
      price_min: 0,
      price_max: 0,
      is_active: true,
    })
    setEditingService(null)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description,
      deliverables: service.deliverables.join('\n'),
      prerequisites: service.prerequisites.join('\n'),
      timeline_min: service.timeline_range.min,
      timeline_max: service.timeline_range.max,
      price_min: service.price_range.min,
      price_max: service.price_range.max,
      is_active: service.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)

    const serviceData = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      deliverables: formData.deliverables.split('\n').filter(Boolean),
      prerequisites: formData.prerequisites.split('\n').filter(Boolean),
      timeline_range: {
        min: formData.timeline_min,
        max: formData.timeline_max,
        unit: 'weeks',
      },
      price_range: {
        min: formData.price_min,
        max: formData.price_max,
      },
      is_active: formData.is_active,
    }

    if (editingService) {
      await supabase
        .from('services')
        .update(serviceData as never)
        .eq('id', editingService.id)
    } else {
      await supabase.from('services').insert(serviceData as never)
    }

    // Refresh list
    const { data } = await supabase.from('services').select('*').order('name')
    if (data) setServices(data as unknown as Service[])

    setSaving(false)
    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    await supabase.from('services').delete().eq('id', id)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  const toggleActive = async (service: Service) => {
    await supabase
      .from('services')
      .update({ is_active: !service.is_active } as never)
      .eq('id', service.id)

    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, is_active: !s.is_active } : s
      )
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Service Catalog" showSearch={false} showQuickActions={false} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Service Catalog" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Services
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage your service offerings for proposals
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Add Service'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingService
                      ? 'Update the service details'
                      : 'Add a new service to your catalog'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="AI Process Automation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="End-to-end automation of business processes..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliverables">Deliverables (one per line)</Label>
                    <Textarea
                      id="deliverables"
                      value={formData.deliverables}
                      onChange={(e) =>
                        setFormData({ ...formData, deliverables: e.target.value })
                      }
                      placeholder="Process documentation&#10;Custom AI solution&#10;Integration setup"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Timeline (weeks)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={formData.timeline_min}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeline_min: Number(e.target.value),
                            })
                          }
                          className="w-20"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="number"
                          value={formData.timeline_max}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeline_max: Number(e.target.value),
                            })
                          }
                          className="w-20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Price Range (EUR)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={formData.price_min}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price_min: Number(e.target.value),
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="number"
                          value={formData.price_max}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price_max: Number(e.target.value),
                            })
                          }
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Active</Label>
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !formData.name}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingService ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Services List */}
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No services yet. Add your first service to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className={!service.is_active ? 'opacity-50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {service.name}
                          {!service.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>
                        {service.timeline_range.min}-{service.timeline_range.max} weeks
                      </span>
                      <span>|</span>
                      <span>
                        {service.price_range.min.toLocaleString()}-
                        {service.price_range.max.toLocaleString()} EUR
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
