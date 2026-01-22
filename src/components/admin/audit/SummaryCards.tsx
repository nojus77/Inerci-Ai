'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  Calculator,
  Loader2,
  Plus,
  Zap,
  Trash2,
  X,
  HelpCircle,
  StickyNote,
  AlertTriangle,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { AuditSession, AIArtifact } from '@/types/database'

interface SummaryCardsProps {
  sessionId: string
  session: AuditSession
}

// Process opportunity identified during audit
interface ProcessOpportunity {
  id: string
  name: string
  context: string // e.g., "15 žmonių, kasdien"
  status: 'high' | 'medium' | 'low' | 'needs_data'
  details?: string
  expanded?: boolean
}

// Deeper problem that needs more investigation
interface DeeperProblem {
  id: string
  name: string
  context: string
  details?: string
}

interface CardData {
  type: 'summary' | 'roi'
  title: string
  icon: typeof FileText
  analysisType: string
}

const CARDS: CardData[] = [
  { type: 'summary', title: 'Sesijos santrauka', icon: FileText, analysisType: 'summary' },
  { type: 'roi', title: 'ROI įvertinimas', icon: Calculator, analysisType: 'roi' },
]

const STATUS_CONFIG = {
  high: { emoji: '🟢', label: 'didelė vertė' },
  medium: { emoji: '🟡', label: 'vidutinė vertė' },
  low: { emoji: '🔵', label: 'maža vertė' },
  needs_data: { emoji: '🟡', label: 'trūksta duomenų' },
}

export function SummaryCards({ sessionId, session }: SummaryCardsProps) {
  const [artifacts, setArtifacts] = useState<Record<string, AIArtifact | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    summary: false,
    roi: false,
  })
  const [processes, setProcesses] = useState<ProcessOpportunity[]>([])
  const [newProcessName, setNewProcessName] = useState('')
  const [showAddProcess, setShowAddProcess] = useState(false)
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null)
  const [deeperProblems, setDeeperProblems] = useState<DeeperProblem[]>([])
  const [newProblemName, setNewProblemName] = useState('')
  const [showAddProblem, setShowAddProblem] = useState(false)
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null)
  const [nextQuestions, setNextQuestions] = useState<string[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [notes, setNotes] = useState('')
  const supabase = createClient()

  // Load processes, problems, and notes from session structured_data
  useEffect(() => {
    const stored = session.structured_data?.processes as ProcessOpportunity[] | undefined
    if (stored && Array.isArray(stored)) {
      setProcesses(stored)
    }
    const storedProblems = session.structured_data?.deeper_problems as DeeperProblem[] | undefined
    if (storedProblems && Array.isArray(storedProblems)) {
      setDeeperProblems(storedProblems)
    }
    const storedNotes = session.structured_data?.notes as string | undefined
    if (storedNotes) {
      setNotes(storedNotes)
    }
  }, [session.structured_data])

  // Save processes to database
  const saveProcesses = useCallback(async (updatedProcesses: ProcessOpportunity[]) => {
    await supabase
      .from('audit_sessions')
      .update({
        structured_data: {
          ...session.structured_data,
          processes: updatedProcesses,
        },
      } as never)
      .eq('id', sessionId)
  }, [sessionId, session.structured_data, supabase])

  // Save notes to database (debounced via onBlur)
  const saveNotes = useCallback(async (updatedNotes: string) => {
    await supabase
      .from('audit_sessions')
      .update({
        structured_data: {
          ...session.structured_data,
          notes: updatedNotes,
        },
      } as never)
      .eq('id', sessionId)
  }, [sessionId, session.structured_data, supabase])

  // Save deeper problems to database
  const saveDeeperProblems = useCallback(async (updatedProblems: DeeperProblem[]) => {
    await supabase
      .from('audit_sessions')
      .update({
        structured_data: {
          ...session.structured_data,
          deeper_problems: updatedProblems,
        },
      } as never)
      .eq('id', sessionId)
  }, [sessionId, session.structured_data, supabase])

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

  const addProcess = () => {
    if (!newProcessName.trim()) return
    const newProcess: ProcessOpportunity = {
      id: crypto.randomUUID(),
      name: newProcessName.trim(),
      context: '',
      status: 'needs_data',
    }
    const updated = [...processes, newProcess]
    setProcesses(updated)
    setNewProcessName('')
    setShowAddProcess(false)
    saveProcesses(updated)
  }

  const updateProcess = (id: string, updates: Partial<ProcessOpportunity>) => {
    const updated = processes.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    )
    setProcesses(updated)
    saveProcesses(updated)
  }

  const deleteProcess = (id: string) => {
    const updated = processes.filter((p) => p.id !== id)
    setProcesses(updated)
    saveProcesses(updated)
    if (expandedProcess === id) setExpandedProcess(null)
  }

  const cycleStatus = (id: string) => {
    const process = processes.find((p) => p.id === id)
    if (!process) return

    const statusOrder: ProcessOpportunity['status'][] = ['high', 'medium', 'low', 'needs_data']
    const currentIndex = statusOrder.indexOf(process.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
    updateProcess(id, { status: nextStatus })
  }

  const addDeeperProblem = () => {
    if (!newProblemName.trim()) return
    const newProblem: DeeperProblem = {
      id: crypto.randomUUID(),
      name: newProblemName.trim(),
      context: '',
    }
    const updated = [...deeperProblems, newProblem]
    setDeeperProblems(updated)
    setNewProblemName('')
    setShowAddProblem(false)
    saveDeeperProblems(updated)
  }

  const updateDeeperProblem = (id: string, updates: Partial<DeeperProblem>) => {
    const updated = deeperProblems.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    )
    setDeeperProblems(updated)
    saveDeeperProblems(updated)
  }

  const deleteDeeperProblem = (id: string) => {
    const updated = deeperProblems.filter((p) => p.id !== id)
    setDeeperProblems(updated)
    saveDeeperProblems(updated)
    if (expandedProblem === id) setExpandedProblem(null)
  }

  const fetchNextQuestions = async () => {
    if ((session.chat_messages || []).length === 0) return

    setLoadingQuestions(true)
    try {
      const response = await fetch('/admin/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          analysisType: 'next_questions',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Parse numbered list from response
        const questions = data.content
          .split('\n')
          .filter((line: string) => line.match(/^\d+\./))
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 3)
        setNextQuestions(questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const hasMessages = (session.chat_messages || []).length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Potencialios optimizacijos - Live priorities at top */}
      <div className="shrink-0 p-3 border-b bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Potencialios optimizacijos</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowAddProcess(!showAddProcess)}
          >
            {showAddProcess ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Add new process */}
        {showAddProcess && (
          <div className="flex gap-2 mb-2">
            <Input
              value={newProcessName}
              onChange={(e) => setNewProcessName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProcess()}
              placeholder="Proceso pavadinimas..."
              className="h-7 text-xs"
              autoFocus
            />
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={addProcess}
              disabled={!newProcessName.trim()}
            >
              Pridėti
            </Button>
          </div>
        )}

        {/* Process list */}
        <div className="space-y-1">
          {processes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Procesai bus rodomi čia pokalbio metu
            </p>
          ) : (
            processes.map((process) => (
              <div key={process.id}>
                {/* Main row - always visible */}
                <div
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer group"
                  onClick={() => setExpandedProcess(expandedProcess === process.id ? null : process.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      cycleStatus(process.id)
                    }}
                    className="text-sm shrink-0"
                    title="Keisti prioritetą"
                  >
                    {STATUS_CONFIG[process.status].emoji}
                  </button>

                  <span className="text-xs font-medium truncate flex-1">
                    {process.name}
                    {process.context && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({process.context})
                      </span>
                    )}
                  </span>

                  <span className="text-[10px] text-muted-foreground hidden group-hover:inline">
                    {STATUS_CONFIG[process.status].label}
                  </span>

                  <ChevronRight
                    className={`h-3 w-3 text-muted-foreground transition-transform ${
                      expandedProcess === process.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {/* Expanded details */}
                {expandedProcess === process.id && (
                  <div className="ml-6 pl-2 border-l border-muted py-2 space-y-2">
                    <Input
                      value={process.context}
                      onChange={(e) => updateProcess(process.id, { context: e.target.value })}
                      placeholder="Kontekstas (pvz., 15 žmonių, kasdien)"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={process.details || ''}
                      onChange={(e) => updateProcess(process.id, { details: e.target.value })}
                      placeholder="Papildomi detalės..."
                      className="h-7 text-xs"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(['high', 'medium', 'low', 'needs_data'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateProcess(process.id, { status })}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              process.status === status
                                ? 'bg-muted'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            {STATUS_CONFIG[status].emoji}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteProcess(process.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deeper Problems Section */}
      <div className="shrink-0 p-3 border-b bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-sm">Gilesnės problemos</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowAddProblem(!showAddProblem)}
          >
            {showAddProblem ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Add new problem */}
        {showAddProblem && (
          <div className="flex gap-2 mb-2">
            <Input
              value={newProblemName}
              onChange={(e) => setNewProblemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDeeperProblem()}
              placeholder="Problemos pavadinimas..."
              className="h-7 text-xs"
              autoFocus
            />
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={addDeeperProblem}
              disabled={!newProblemName.trim()}
            >
              Pridėti
            </Button>
          </div>
        )}

        {/* Problem list */}
        <div className="space-y-1">
          {deeperProblems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Problemos, kurias reikės spręsti vėliau
            </p>
          ) : (
            deeperProblems.map((problem) => (
              <div key={problem.id}>
                <div
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer group"
                  onClick={() => setExpandedProblem(expandedProblem === problem.id ? null : problem.id)}
                >
                  <span className="text-sm shrink-0">🔴</span>
                  <span className="text-xs font-medium truncate flex-1">
                    {problem.name}
                    {problem.context && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({problem.context})
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className={`h-3 w-3 text-muted-foreground transition-transform ${
                      expandedProblem === problem.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {/* Expanded details */}
                {expandedProblem === problem.id && (
                  <div className="ml-6 pl-2 border-l border-muted py-2 space-y-2">
                    <Input
                      value={problem.context}
                      onChange={(e) => updateDeeperProblem(problem.id, { context: e.target.value })}
                      placeholder="Kontekstas..."
                      className="h-7 text-xs"
                    />
                    <Input
                      value={problem.details || ''}
                      onChange={(e) => updateDeeperProblem(problem.id, { details: e.target.value })}
                      placeholder="Papildomos detalės..."
                      className="h-7 text-xs"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteDeeperProblem(problem.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Next Questions Box */}
      {hasMessages && (
        <div className="shrink-0 p-3 border-b bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm">Ką klausti toliau</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchNextQuestions}
              disabled={loadingQuestions}
            >
              {loadingQuestions ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="space-y-1">
            {nextQuestions.length > 0 ? (
              nextQuestions.map((q, i) => (
                <p key={i} className="text-xs text-muted-foreground py-1">
                  {i + 1}. {q}
                </p>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-1 text-center">
                {loadingQuestions ? 'Generuojama...' : 'Spauskite ↻ sugeneruoti'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="shrink-0 p-3 border-b bg-card">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold text-sm">Komentarai</h3>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => saveNotes(notes)}
          placeholder="Rašykite pastabas čia..."
          className="min-h-[80px] max-h-[150px] text-xs resize-none"
        />
      </div>

      {/* AI Analysis Cards - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
          AI Analizė
        </h3>

        {CARDS.map((card) => {
          const artifact = artifacts[card.type]
          const isLoading = loading[card.type]
          const isOpen = openCards[card.type]
          const Icon = card.icon

          return (
            <Collapsible key={card.type} open={isOpen} onOpenChange={() => toggleCard(card.type)}>
              <Card className="border-muted">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
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
                  <CardContent className="pt-0 px-3 pb-3">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : artifact ? (
                      <div className="space-y-2">
                        <div className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
                          {artifact.content}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 pt-2 border-t border-muted">
                          {artifact.provider} • {artifact.model_id}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          {hasMessages
                            ? 'Analizė dar nesugeneruota'
                            : 'Pradėkite pokalbį, kad sugeneruoti analizę'}
                        </p>
                        {hasMessages && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleRefresh(card.analysisType, card.type)}
                          >
                            Generuoti
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
            <CardContent className="p-3">
              <p className="text-xs mb-2">
                Auditas baigtas! Paruošti pasiūlymą?
              </p>
              <Button className="w-full h-8 text-sm" asChild>
                <a href={`/admin/proposals/new?session=${sessionId}`}>
                  Kurti pasiūlymą
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
