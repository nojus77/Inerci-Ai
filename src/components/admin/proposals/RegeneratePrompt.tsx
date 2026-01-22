'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'

interface RegeneratePromptProps {
  open: boolean
  onClose: () => void
  onRegenerate: (instruction: string) => Promise<void>
  sectionTitle: string
}

const SUGGESTIONS = [
  'Make it more concise',
  'Add more technical details',
  'Make it more persuasive',
  'Simplify the language',
  'Add specific metrics and numbers',
  'Focus on cost savings',
]

export function RegeneratePrompt({
  open,
  onClose,
  onRegenerate,
  sectionTitle,
}: RegeneratePromptProps) {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegenerate = async () => {
    if (!instruction.trim()) return

    setLoading(true)
    await onRegenerate(instruction)
    setLoading(false)
    setInstruction('')
    onClose()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInstruction(suggestion)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Regenerate Section
          </DialogTitle>
          <DialogDescription>
            Describe how you want to modify the <strong>{sectionTitle}</strong> section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instruction">Instruction</Label>
            <Textarea
              id="instruction"
              placeholder="e.g., Make it shorter and focus on the ROI benefits..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={loading || !instruction.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
