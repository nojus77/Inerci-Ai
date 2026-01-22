'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Check,
  SkipForward,
  Plus,
  Edit3,
  X,
  FileText,
  StickyNote,
} from 'lucide-react'
import type {
  AuditScript,
  AuditScriptFull,
  AuditScriptSection,
  AuditScriptQuestion,
  QuestionStatus,
  ScriptQuestionState,
  SessionScriptState,
  AuditSession,
} from '@/types/database'

interface LiveScriptPanelProps {
  sessionId: string
  session: AuditSession
  onAskQuestion: (question: string) => void
  onSessionUpdate: (session: AuditSession) => void
}

export function LiveScriptPanel({
  sessionId,
  session,
  onAskQuestion,
  onSessionUpdate,
}: LiveScriptPanelProps) {
  const [scripts, setScripts] = useState<AuditScript[]>([])
  const [activeScript, setActiveScript] = useState<AuditScriptFull | null>(null)
  const [scriptState, setScriptState] = useState<SessionScriptState>({
    active_script_id: null,
    question_states: {},
  })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const supabase = createClient()

  // Load scripts list
  useEffect(() => {
    const fetchScripts = async () => {
      const { data } = await supabase
        .from('audit_scripts')
        .select('*')
        .order('name')

      if (data) {
        setScripts(data as AuditScript[])
      }
    }
    fetchScripts()
  }, [supabase])

  // Load script state from session
  useEffect(() => {
    const stored = session.structured_data?.script_state as SessionScriptState | undefined
    if (stored) {
      setScriptState(stored)
      if (stored.active_script_id) {
        loadFullScript(stored.active_script_id)
      }
    }
  }, [session.structured_data])

  const loadFullScript = async (scriptId: string) => {
    const { data: scriptData } = await supabase
      .from('audit_scripts')
      .select('*')
      .eq('id', scriptId)
      .single()

    if (!scriptData) return

    const { data: sectionsData } = await supabase
      .from('audit_script_sections')
      .select('*')
      .eq('script_id', scriptId)
      .order('order')

    const sections = (sectionsData || []) as AuditScriptSection[]

    // Load questions for each section
    const sectionsWithQuestions = await Promise.all(
      sections.map(async (section) => {
        const { data: questionsData } = await supabase
          .from('audit_script_questions')
          .select('*')
          .eq('section_id', section.id)
          .order('order')

        return {
          ...section,
          questions: (questionsData || []) as AuditScriptQuestion[],
        }
      })
    )

    setActiveScript({
      ...(scriptData as AuditScript),
      sections: sectionsWithQuestions,
    })

    // Expand first section by default
    if (sectionsWithQuestions.length > 0) {
      setExpandedSections(new Set([sectionsWithQuestions[0].id]))
    }
  }

  const saveScriptState = useCallback(
    async (newState: SessionScriptState) => {
      setScriptState(newState)
      await supabase
        .from('audit_sessions')
        .update({
          structured_data: {
            ...session.structured_data,
            script_state: newState,
          },
        } as never)
        .eq('id', sessionId)

      onSessionUpdate({
        ...session,
        structured_data: {
          ...session.structured_data,
          script_state: newState,
        },
      })
    },
    [sessionId, session, supabase, onSessionUpdate]
  )

  const handleScriptChange = async (scriptId: string) => {
    await loadFullScript(scriptId)
    const newState: SessionScriptState = {
      ...scriptState,
      active_script_id: scriptId,
    }
    await saveScriptState(newState)
  }

  const getQuestionState = (questionId: string): ScriptQuestionState => {
    return (
      scriptState.question_states[questionId] || {
        question_id: questionId,
        status: 'pending' as QuestionStatus,
      }
    )
  }

  const updateQuestionState = async (
    questionId: string,
    updates: Partial<ScriptQuestionState>
  ) => {
    const currentState = getQuestionState(questionId)
    const newQuestionStates = {
      ...scriptState.question_states,
      [questionId]: {
        ...currentState,
        ...updates,
      },
    }
    await saveScriptState({
      ...scriptState,
      question_states: newQuestionStates,
    })
  }

  const handleAskQuestion = async (question: AuditScriptQuestion) => {
    onAskQuestion(question.text)
    await updateQuestionState(question.id, {
      status: 'asked',
      asked_at: new Date().toISOString(),
    })
  }

  const handleMarkDone = async (questionId: string) => {
    await updateQuestionState(questionId, {
      status: 'done',
      completed_at: new Date().toISOString(),
    })
    setExpandedQuestion(null)
  }

  const handleSkip = async (questionId: string, reason: string) => {
    await updateQuestionState(questionId, {
      status: 'skipped',
      skip_reason: reason,
      completed_at: new Date().toISOString(),
    })
    setExpandedQuestion(null)
    setSkipReason('')
  }

  const handleAddQuestion = async (sectionId: string) => {
    if (!newQuestionText.trim() || !activeScript) return

    const section = activeScript.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newOrder = section.questions.length

    const { data } = await supabase
      .from('audit_script_questions')
      .insert({
        section_id: sectionId,
        text: newQuestionText.trim(),
        order: newOrder,
        tags: [],
      } as never)
      .select()
      .single()

    if (data) {
      // Reload script
      await loadFullScript(activeScript.id)
    }

    setNewQuestionText('')
    setShowAddQuestion(null)
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Calculate progress
  const getProgress = () => {
    if (!activeScript) return { done: 0, total: 0 }
    const allQuestions = activeScript.sections.flatMap((s) => s.questions)
    const doneOrSkipped = allQuestions.filter((q) => {
      const state = getQuestionState(q.id)
      return state.status === 'done' || state.status === 'skipped'
    })
    return { done: doneOrSkipped.length, total: allQuestions.length }
  }

  const progress = getProgress()

  const getStatusIcon = (status: QuestionStatus) => {
    switch (status) {
      case 'done':
        return <Check className="h-3.5 w-3.5 text-green-500" />
      case 'skipped':
        return <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
      case 'asked':
        return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
      default:
        return <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
    }
  }

  if (scripts.length === 0 && !activeScript) {
    return (
      <div className="p-4 text-center">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-3">Nėra sukurtų script'ų</p>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/scripts">Sukurti script'ą</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-3 border-b bg-card space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Script'as</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? <X className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Script Selector */}
        <Select
          value={scriptState.active_script_id || ''}
          onValueChange={handleScriptChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Pasirinkti script'ą..." />
          </SelectTrigger>
          <SelectContent>
            {scripts.map((script) => (
              <SelectItem key={script.id} value={script.id}>
                {script.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Progress */}
        {activeScript && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%',
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.done}/{progress.total}
            </span>
          </div>
        )}
      </div>

      {/* Script Content */}
      {activeScript && (
        <div className="flex-1 overflow-y-auto">
          {activeScript.sections.map((section) => (
            <Collapsible
              key={section.id}
              open={expandedSections.has(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 p-3 hover:bg-muted/50 border-b">
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm flex-1 text-left">{section.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {section.questions.filter((q) => {
                      const s = getQuestionState(q.id)
                      return s.status === 'done' || s.status === 'skipped'
                    }).length}
                    /{section.questions.length}
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="py-1">
                  {section.questions.map((question) => {
                    const qState = getQuestionState(question.id)
                    const isExpanded = expandedQuestion === question.id

                    return (
                      <div key={question.id} className="border-b border-muted/50 last:border-0">
                        <div
                          className={`flex items-start gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer ${
                            qState.status === 'done' || qState.status === 'skipped'
                              ? 'opacity-60'
                              : ''
                          }`}
                          onClick={() =>
                            setExpandedQuestion(isExpanded ? null : question.id)
                          }
                        >
                          <div className="mt-0.5">{getStatusIcon(qState.status)}</div>
                          <p
                            className={`text-xs flex-1 ${
                              qState.status === 'done' ? 'line-through' : ''
                            }`}
                          >
                            {question.text}
                          </p>
                          <ChevronRight
                            className={`h-3 w-3 text-muted-foreground transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>

                        {/* Expanded Actions */}
                        {isExpanded && (
                          <div className="px-3 pb-2 ml-5 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleAskQuestion(question)}
                              >
                                <MessageSquare className="h-3 w-3" />
                                Klausti
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleMarkDone(question.id)}
                              >
                                <Check className="h-3 w-3" />
                                Done
                              </Button>
                            </div>

                            {/* Skip with reason */}
                            <div className="flex gap-1.5">
                              <Input
                                value={skipReason}
                                onChange={(e) => setSkipReason(e.target.value)}
                                placeholder="Priežastis (neprivaloma)..."
                                className="h-7 text-xs flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleSkip(question.id, skipReason)}
                              >
                                <SkipForward className="h-3 w-3" />
                                Skip
                              </Button>
                            </div>

                            {/* Notes */}
                            {qState.notes && (
                              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                <StickyNote className="h-3 w-3 mt-0.5" />
                                <span>{qState.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add Question (Edit Mode) */}
                  {editMode && (
                    <div className="px-3 py-2">
                      {showAddQuestion === section.id ? (
                        <div className="flex gap-1.5">
                          <Input
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleAddQuestion(section.id)
                            }
                            placeholder="Naujas klausimas..."
                            className="h-7 text-xs flex-1"
                            autoFocus
                          />
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAddQuestion(section.id)}
                            disabled={!newQuestionText.trim()}
                          >
                            Pridėti
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setShowAddQuestion(null)
                              setNewQuestionText('')
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 w-full justify-start text-muted-foreground"
                          onClick={() => setShowAddQuestion(section.id)}
                        >
                          <Plus className="h-3 w-3" />
                          Pridėti klausimą
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}
