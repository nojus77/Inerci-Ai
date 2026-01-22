'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeRefresh } from '@/hooks/useRealtimeSubscription'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { KanbanCard } from './KanbanCard'
import { StageChangeModal } from './StageChangeModal'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Client, ClientStage } from '@/types/database'

interface StageConfig {
  id: ClientStage
  label: string
  color: string
}

const STAGES: StageConfig[] = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'audit_scheduled', label: 'Audit Scheduled', color: 'bg-slate-400' },
  { id: 'audit_done', label: 'Audit Done', color: 'bg-zinc-400' },
  { id: 'prototype_building', label: 'Prototype Building', color: 'bg-neutral-400' },
  { id: 'prototype_delivered', label: 'Prototype Delivered', color: 'bg-stone-400' },
  { id: 'proposal_draft', label: 'Proposal Draft', color: 'bg-amber-600' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-yellow-600' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-600' },
  { id: 'won', label: 'Won', color: 'bg-emerald-600' },
  { id: 'lost', label: 'Lost', color: 'bg-red-600' },
  { id: 'on_hold', label: 'On Hold', color: 'bg-gray-600' },
]

const STAGE_ORDER = STAGES.map((s) => s.id)

function isSequentialMove(from: ClientStage, to: ClientStage): boolean {
  const fromIdx = STAGE_ORDER.indexOf(from)
  const toIdx = STAGE_ORDER.indexOf(to)
  // Allow moving forward by 1 or backward by 1
  return Math.abs(toIdx - fromIdx) === 1
}

export function KanbanBoard() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalData, setModalData] = useState<{
    client: Client
    fromStage: ClientStage
    toStage: ClientStage
  } | null>(null)
  const supabase = createClient()

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients((data || []) as unknown as Client[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Real-time updates
  useRealtimeRefresh(['clients'], fetchClients)

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    // Dropped outside a valid droppable
    if (!destination) return

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const fromStage = source.droppableId as ClientStage
    const toStage = destination.droppableId as ClientStage

    // Same stage - just reorder (not persisted for now)
    if (fromStage === toStage) return

    const client = clients.find((c) => c.id === draggableId)
    if (!client) return

    // Check if it's a non-sequential move
    if (!isSequentialMove(fromStage, toStage)) {
      // Show modal for override reason
      setModalData({ client, fromStage, toStage })
      return
    }

    // Sequential move - update directly
    await updateClientStage(client, toStage)
  }

  const updateClientStage = async (
    client: Client,
    newStage: ClientStage,
    reason?: string
  ) => {
    const { error } = await supabase
      .from('clients')
      .update({ stage: newStage } as never)
      .eq('id', client.id)

    if (error) {
      console.error('Error updating client stage:', error)
      return
    }

    // Log activity
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('activity_log').insert({
        client_id: client.id,
        user_id: user.id,
        action: 'stage_changed',
        metadata: {
          from: client.stage,
          to: newStage,
          reason: reason || undefined,
        },
      } as never)
    }

    // Update local state
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, stage: newStage } : c))
    )
  }

  const handleModalConfirm = async (reason: string) => {
    if (!modalData) return
    await updateClientStage(modalData.client, modalData.toStage, reason)
    setModalData(null)
  }

  const handleModalCancel = () => {
    setModalData(null)
  }

  const getClientsByStage = (stage: ClientStage) => {
    return clients.filter((c) => c.stage === stage)
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading pipeline...</div>
  }

  return (
    <>
      <ScrollArea className="w-full h-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 pb-4 min-h-full">
            {STAGES.map((stage) => {
              const stageClients = getClientsByStage(stage.id)
              return (
                <div
                  key={stage.id}
                  className="w-72 flex-shrink-0 flex flex-col bg-muted/30 rounded-lg"
                >
                  {/* Stage Header */}
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                    <h3 className="font-medium text-sm">{stage.label}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {stageClients.length}
                    </span>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-2 space-y-2 min-h-[200px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-primary/5' : ''
                        }`}
                      >
                        {stageClients.map((client, index) => (
                          <Draggable
                            key={client.id}
                            draggableId={client.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <KanbanCard
                                  client={client}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {stageClients.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No clients
                          </p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Stage Change Override Modal */}
      <StageChangeModal
        open={!!modalData}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        client={modalData?.client}
        fromStage={modalData?.fromStage}
        toStage={modalData?.toStage}
      />
    </>
  )
}
