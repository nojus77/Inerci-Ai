'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = 'clients' | 'audit_sessions' | 'tasks' | 'activity_log' | 'proposals'

interface UseRealtimeOptions {
  tables: TableName[]
  onInsert?: (table: TableName, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onUpdate?: (table: TableName, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onDelete?: (table: TableName, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onChange?: () => void // Simple callback to refetch all data
}

/**
 * Hook for subscribing to Supabase Realtime changes on multiple tables
 *
 * Usage:
 * ```tsx
 * useRealtimeSubscription({
 *   tables: ['clients', 'tasks'],
 *   onChange: () => refetchData()
 * })
 * ```
 */
export function useRealtimeSubscription({
  tables,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleChange = useCallback(
    (table: TableName, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      // Call specific handlers
      if (payload.eventType === 'INSERT' && onInsert) {
        onInsert(table, payload)
      } else if (payload.eventType === 'UPDATE' && onUpdate) {
        onUpdate(table, payload)
      } else if (payload.eventType === 'DELETE' && onDelete) {
        onDelete(table, payload)
      }

      // Always call onChange for simple refetch pattern
      if (onChange) {
        onChange()
      }
    },
    [onInsert, onUpdate, onDelete, onChange]
  )

  useEffect(() => {
    // Create a unique channel name
    const channelName = `realtime-${tables.join('-')}-${Date.now()}`

    // Build the channel with subscriptions for each table
    let channel = supabase.channel(channelName)

    tables.forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => handleChange(table, payload as RealtimePostgresChangesPayload<Record<string, unknown>>)
      )
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to: ${tables.join(', ')}`)
      }
    })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, tables, handleChange])

  return channelRef.current
}

/**
 * Simple hook that just triggers a refetch when any of the specified tables change
 */
export function useRealtimeRefresh(tables: TableName[], refetch: () => void) {
  // Debounce rapid changes
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedRefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      refetch()
    }, 300) // 300ms debounce
  }, [refetch])

  useRealtimeSubscription({
    tables,
    onChange: debouncedRefetch,
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}
