'use client'

import { Badge } from '@/components/ui/badge'
import { Building, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { Client } from '@/types/database'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  client: Client
  isDragging?: boolean
}

export function KanbanCard({ client, isDragging }: KanbanCardProps) {
  return (
    <Link
      href={`/admin/clients/${client.id}`}
      className={cn(
        'block p-3 rounded-lg border bg-card hover:bg-card/80 transition-all cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-lg ring-2 ring-primary/50 rotate-2'
      )}
    >
      <div className="space-y-2">
        {/* Company Name */}
        <div className="flex items-start gap-2">
          <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="font-medium text-sm leading-tight">{client.company_name}</span>
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{client.contact_name}</span>
        </div>

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {client.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {client.tags.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{client.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Updated Time */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  )
}
