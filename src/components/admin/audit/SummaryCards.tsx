'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  RefreshCw,
  ChevronDown,
  FileText,
  Lightbulb,
  Calculator,
  Loader2,
} from 'lucide-react'
import type { AuditSession, AIArtifact } from '@/types/database'

interface SummaryCardsProps {
  sessionId: string
  session: AuditSession
}

interface CardData {
  type: 'summary' | 'analysis' | 'suggestions'
  title: string
  icon: typeof FileText
  analysisType: string
}

const CARDS: CardData[] = [
  { type: 'summary', title: 'Session Summary', icon: FileText, analysisType: 'summary' },
  { type: 'analysis', title: 'Top Processes', icon: Lightbulb, analysisType: 'processes' },
  { type: 'suggestions', title: 'ROI Estimate', icon: Calculator, analysisType: 'roi' },
]

export function SummaryCards({ sessionId, session }: SummaryCardsProps) {
  const [artifacts, setArtifacts] = useState<Record<string, AIArtifact | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    summary: true,
  })
  const supabase = createClient()

  const fetchArtifacts = useCallback(async () => {
    const { data } = await supabase
      .from('ai_artifacts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (data) {
      const artifactsByType: Record<string, AIArtifact> = {}
      const artifacts = data as unknown as AIArtifact[]
      artifacts.forEach((artifact) => {
        if (!artifactsByType[artifact.type]) {
          artifactsByType[artifact.type] = artifact
        }
      })
      setArtifacts(artifactsByType)
    }
  }, [sessionId, supabase])

  useEffect(() => {
    fetchArtifacts()
  }, [fetchArtifacts])

  const handleRefresh = async (analysisType: string, artifactType: string) => {
    if ((session.chat_messages || []).length === 0) return

    setLoading((prev) => ({ ...prev, [artifactType]: true }))

    try {
      const response = await fetch('/admin/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          analysisType,
        }),
      })

      if (response.ok) {
        fetchArtifacts()
      }
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setLoading((prev) => ({ ...prev, [artifactType]: false }))
    }
  }

  const toggleCard = (type: string) => {
    setOpenCards((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const hasMessages = (session.chat_messages || []).length > 0

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          AI Analysis
        </h3>

        {CARDS.map((card) => {
          const artifact = artifacts[card.type]
          const isLoading = loading[card.type]
          const isOpen = openCards[card.type]
          const Icon = card.icon

          return (
            <Collapsible key={card.type} open={isOpen} onOpenChange={() => toggleCard(card.type)}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">{card.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRefresh(card.analysisType, card.type)
                          }}
                          disabled={isLoading || !hasMessages}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 px-4 pb-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : artifact ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {artifact.content}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                          Generated by {artifact.provider} ({artifact.model_id})
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-3">
                          {hasMessages
                            ? 'No analysis yet'
                            : 'Start the conversation to generate analysis'}
                        </p>
                        {hasMessages && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefresh(card.analysisType, card.type)}
                          >
                            Generate
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}

        {/* Create Proposal Button */}
        {session.status === 'complete' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm mb-3">
                Audit complete! Ready to create a proposal?
              </p>
              <Button className="w-full" asChild>
                <a href={`/admin/proposals/new?session=${sessionId}`}>
                  Create Proposal
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
