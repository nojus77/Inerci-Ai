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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Plus, Tag } from 'lucide-react'
import type { Tables } from '@/lib/supabase/types'

type ClientRow = Tables<'clients'>

interface TagsEditModalProps {
  open: boolean
  onClose: () => void
  client: ClientRow | null
  onSuccess?: () => void
}

// Common suggested tags
const SUGGESTED_TAGS = [
  'e-commerce',
  'saas',
  'enterprise',
  'startup',
  'b2b',
  'b2c',
  'tech',
  'finance',
  'healthcare',
  'retail',
  'manufacturing',
  'logistics',
  'education',
  'real-estate',
  'hospitality',
]

export function TagsEditModal({ open, onClose, client, onSuccess }: TagsEditModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (open && client) {
      setTags(client.tags || [])
      setNewTag('')
    }
  }, [open, client])

  if (!client) return null

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('clients')
        .update({ tags: tags.length > 0 ? tags : undefined })
        .eq('id', client.id)

      if (error) throw error

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating tags:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter suggested tags to only show ones not already added
  const availableSuggestions = SUGGESTED_TAGS.filter(tag => !tags.includes(tag))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Edit Tags
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Manage tags for {client.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Current Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Tags</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-muted/50 rounded-lg">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">No tags added yet</span>
              ) : (
                tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1 hover:bg-secondary/80"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Tag */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Tag</label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag and press Enter..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggested Tags */}
          {availableSuggestions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Suggestions</label>
              <div className="flex flex-wrap gap-1.5">
                {availableSuggestions.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddSuggestedTag(tag)}
                    className="text-xs px-2 py-1 rounded-md border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Tags'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
