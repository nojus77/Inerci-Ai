'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Edit3 } from 'lucide-react'
import type { AuditMode } from '@/types/database'

interface ModeToggleProps {
  mode: AuditMode
  onModeChange: (mode: AuditMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as AuditMode)}
      className="w-auto"
    >
      <TabsList className="h-8">
        <TabsTrigger value="live_capture" className="text-xs gap-1.5 px-3">
          <Mic className="h-3 w-3" />
          Live Capture
        </TabsTrigger>
        <TabsTrigger value="refinement" className="text-xs gap-1.5 px-3">
          <Edit3 className="h-3 w-3" />
          Refinement
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
