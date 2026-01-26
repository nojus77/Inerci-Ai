'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import type {
  AuditScript,
  AuditScriptFull,
  AuditScriptSection,
  AuditScriptQuestion,
  QuestionStatus,
  ScriptQuestionState,
  SessionScriptState,
  SectionCoverageState,
  AdHocQuestion,
  AuditSession,
} from '@/types/database'

interface LiveScriptPanelProps {
  sessionId: string
  session: AuditSession
  onAskQuestion: (question: string) => void
  onSessionUpdate: (session: AuditSession) => void
}

// Generate UUID for ad-hoc questions
function generateId(): string {
  return crypto.randomUUID()
}

// Default script state
function getDefaultScriptState(): SessionScriptState {
  return {
    active_script_id: null,
    question_states: {},
    ad_hoc_questions: [],
    quick_notes: '',
    section_overrides: {},
  }
}

export function LiveScriptPanel({
  sessionId,
  session,
  onAskQuestion,
  onSessionUpdate,
}: LiveScriptPanelProps) {
  const [scripts, setScripts] = useState<AuditScript[]>([])
  const [activeScript, setActiveScript] = useState<AuditScriptFull | null>(null)
  const [scriptState, setScriptState] = useState<SessionScriptState>(getDefaultScriptState())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [showAddAdHoc, setShowAddAdHoc] = useState(false)
  const [newAdHocText, setNewAdHocText] = useState('')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [showQuickNotes, setShowQuickNotes] = useState(false)
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
      // Ensure all new fields have defaults
      setScriptState({
        ...getDefaultScriptState(),
        ...stored,
      })
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

  // Calculate section coverage
  const getSectionCoverage = useCallback(
    (section: AuditScriptSection & { questions: AuditScriptQuestion[] }): SectionCoverageState => {
      // Check manual override first
      if (scriptState.section_overrides[section.id]) {
        return 'covered'
      }

      if (section.questions.length === 0) {
        return 'empty'
      }

      const answered = section.questions.filter((q) => {
        const state = getQuestionState(q.id)
        return state.status === 'done' || state.status === 'skipped'
      }).length

      const ratio = answered / section.questions.length

      if (ratio === 0) return 'empty'
      if (ratio >= 0.5) return 'covered' // 50% threshold
      return 'partial'
    },
    [scriptState.question_states, scriptState.section_overrides]
  )

  // Coverage hint data
  const coverageHint = useMemo(() => {
    if (!activeScript) return { covered: [], partial: [], empty: [] }

    const covered: string[] = []
    const partial: string[] = []
    const empty: string[] = []

    activeScript.sections.forEach((section) => {
      const coverage = getSectionCoverage(section)
      if (coverage === 'covered') covered.push(section.title)
      else if (coverage === 'partial') partial.push(section.title)
      else empty.push(section.title)
    })

    return { covered, partial, empty }
  }, [activeScript, getSectionCoverage])

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

  // Toggle section coverage override
  const toggleSectionOverride = async (sectionId: string) => {
    const newOverrides = {
      ...scriptState.section_overrides,
      [sectionId]: !scriptState.section_overrides[sectionId],
    }
    await saveScriptState({
      ...scriptState,
      section_overrides: newOverrides,
    })
  }

  // Ad-hoc questions handlers
  const handleAddAdHoc = async () => {
    if (!newAdHocText.trim()) return

    const newQuestion: AdHocQuestion = {
      id: generateId(),
      text: newAdHocText.trim(),
      status: 'pending',
    }

    const newAdHocQuestions = [...(scriptState.ad_hoc_questions || []), newQuestion]
    await saveScriptState({
      ...scriptState,
      ad_hoc_questions: newAdHocQuestions,
    })

    setNewAdHocText('')
    setShowAddAdHoc(false)
  }

  const handleAskAdHoc = async (question: AdHocQuestion) => {
    onAskQuestion(question.text)
    const updatedQuestions = scriptState.ad_hoc_questions.map((q) =>
      q.id === question.id ? { ...q, status: 'asked' as QuestionStatus, asked_at: new Date().toISOString() } : q
    )
    await saveScriptState({
      ...scriptState,
      ad_hoc_questions: updatedQuestions,
    })
  }

  const handleAdHocDone = async (questionId: string) => {
    const updatedQuestions = scriptState.ad_hoc_questions.map((q) =>
      q.id === questionId ? { ...q, status: 'done' as QuestionStatus, completed_at: new Date().toISOString() } : q
    )
    await saveScriptState({
      ...scriptState,
      ad_hoc_questions: updatedQuestions,
    })
    setExpandedQuestion(null)
  }

  const handleAdHocSkip = async (questionId: string, reason: string) => {
    const updatedQuestions = scriptState.ad_hoc_questions.map((q) =>
      q.id === questionId
        ? { ...q, status: 'skipped' as QuestionStatus, skip_reason: reason, completed_at: new Date().toISOString() }
        : q
    )
    await saveScriptState({
      ...scriptState,
      ad_hoc_questions: updatedQuestions,
    })
    setExpandedQuestion(null)
    setSkipReason('')
  }

  const handleDeleteAdHoc = async (questionId: string) => {
    const updatedQuestions = scriptState.ad_hoc_questions.filter((q) => q.id !== questionId)
    await saveScriptState({
      ...scriptState,
      ad_hoc_questions: updatedQuestions,
    })
  }

  // Quick notes handler
  const handleQuickNotesChange = async (value: string) => {
    await saveScriptState({
      ...scriptState,
      quick_notes: value,
    })
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

  // Calculate overall progress
  const getProgress = () => {
    if (!activeScript) return { done: 0, total: 0 }
    const allQuestions = activeScript.sections.flatMap((s) => s.questions)
    const doneOrSkipped = allQuestions.filter((q) => {
      const state = getQuestionState(q.id)
      return state.status === 'done' || state.status === 'skipped'
    })
    // Include ad-hoc questions
    const adHocDone = (scriptState.ad_hoc_questions || []).filter(
      (q) => q.status === 'done' || q.status === 'skipped'
    )
    return {
      done: doneOrSkipped.length + adHocDone.length,
      total: allQuestions.length + (scriptState.ad_hoc_questions || []).length,
    }
  }

  const progress = getProgress()

  const getCoverageIcon = (coverage: SectionCoverageState) => {
    switch (coverage) {
      case 'covered':
        return <span className="text-green-500">🟩</span>
      case 'partial':
        return <span className="text-yellow-500">🟨</span>
      default:
        return <span className="text-muted-foreground">⬜</span>
    }
  }

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

  // Ad-hoc section coverage
  const adHocCoverage = useMemo((): SectionCoverageState => {
    const questions = scriptState.ad_hoc_questions || []
    if (questions.length === 0) return 'empty'
    const done = questions.filter((q) => q.status === 'done' || q.status === 'skipped').length
    if (done === 0) return 'empty'
    if (done / questions.length >= 0.5) return 'covered'
    return 'partial'
  }, [scriptState.ad_hoc_questions])

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
            <span className="font-semibold text-sm">Audito Lenta</span>
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

        {/* Coverage Awareness Hint */}
        {activeScript && (
          <div className="bg-muted/50 rounded-lg p-2 text-xs space-y-1">
            {coverageHint.covered.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span>🟩</span>
                <span className="text-muted-foreground">Padengta:</span>
                <span className="font-medium truncate">{coverageHint.covered.join(', ')}</span>
              </div>
            )}
            {coverageHint.partial.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span>🟨</span>
                <span className="text-muted-foreground">Dalinai:</span>
                <span className="font-medium truncate">{coverageHint.partial.join(', ')}</span>
              </div>
            )}
            {coverageHint.empty.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span>⬜</span>
                <span className="text-muted-foreground">Neliesta:</span>
                <span className="font-medium truncate">{coverageHint.empty.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Overall Progress (secondary) */}
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
          {/* Regular Sections */}
          {activeScript.sections.map((section) => {
            const coverage = getSectionCoverage(section)
            const isOverridden = scriptState.section_overrides[section.id]
            const sectionDone = section.questions.filter((q) => {
              const s = getQuestionState(q.id)
              return s.status === 'done' || s.status === 'skipped'
            }).length

            return (
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
                    {getCoverageIcon(coverage)}
                    <span className="font-medium text-sm flex-1 text-left">{section.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {sectionDone}/{section.questions.length}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="py-1">
                    {/* Pakankama (Sufficient) toggle */}
                    <div className="px-3 py-1.5 border-b border-muted/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSectionOverride(section.id)
                        }}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                          isOverridden
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        {isOverridden ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border" />
                        )}
                        {isOverridden ? 'Pakankama ✓' : 'Pažymėti kaip pakankama'}
                      </button>
                    </div>

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
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}

          {/* Ad-Hoc Questions Section */}
          <Collapsible
            open={expandedSections.has('ad-hoc')}
            onOpenChange={() => toggleSection('ad-hoc')}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 p-3 hover:bg-muted/50 border-b bg-muted/20">
                {expandedSections.has('ad-hoc') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {getCoverageIcon(adHocCoverage)}
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm flex-1 text-left">Situaciniai klausimai</span>
                <span className="text-xs text-muted-foreground">
                  ({scriptState.ad_hoc_questions?.length || 0})
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="py-1">
                {(scriptState.ad_hoc_questions || []).map((question) => {
                  const isExpanded = expandedQuestion === `adhoc-${question.id}`

                  return (
                    <div key={question.id} className="border-b border-muted/50 last:border-0">
                      <div
                        className={`flex items-start gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer ${
                          question.status === 'done' || question.status === 'skipped'
                            ? 'opacity-60'
                            : ''
                        }`}
                        onClick={() =>
                          setExpandedQuestion(isExpanded ? null : `adhoc-${question.id}`)
                        }
                      >
                        <div className="mt-0.5">{getStatusIcon(question.status)}</div>
                        <p
                          className={`text-xs flex-1 ${
                            question.status === 'done' ? 'line-through' : ''
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
                              onClick={() => handleAskAdHoc(question)}
                            >
                              <MessageSquare className="h-3 w-3" />
                              Klausti
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleAdHocDone(question.id)}
                            >
                              <Check className="h-3 w-3" />
                              Done
                            </Button>
                            {editMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-destructive"
                                onClick={() => handleDeleteAdHoc(question.id)}
                              >
                                <X className="h-3 w-3" />
                                Ištrinti
                              </Button>
                            )}
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
                              onClick={() => handleAdHocSkip(question.id, skipReason)}
                            >
                              <SkipForward className="h-3 w-3" />
                              Skip
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add Ad-Hoc Question */}
                <div className="px-3 py-2">
                  {showAddAdHoc ? (
                    <div className="flex gap-1.5">
                      <Input
                        value={newAdHocText}
                        onChange={(e) => setNewAdHocText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAdHoc()}
                        placeholder="Naujas klausimas..."
                        className="h-7 text-xs flex-1"
                        autoFocus
                      />
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleAddAdHoc}
                        disabled={!newAdHocText.trim()}
                      >
                        Pridėti
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setShowAddAdHoc(false)
                          setNewAdHocText('')
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
                      onClick={() => setShowAddAdHoc(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Pridėti situacinį klausimą
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Quick Notes Section */}
          <Collapsible open={showQuickNotes} onOpenChange={setShowQuickNotes}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 p-3 hover:bg-muted/50 border-b bg-amber-50/50 dark:bg-amber-950/20">
                {showQuickNotes ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <StickyNote className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-sm flex-1 text-left">Greitos pastabos</span>
                {scriptState.quick_notes && (
                  <span className="text-xs text-muted-foreground">
                    {scriptState.quick_notes.length > 0 ? '📝' : ''}
                  </span>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3">
                <Textarea
                  value={scriptState.quick_notes || ''}
                  onChange={(e) => handleQuickNotesChange(e.target.value)}
                  placeholder="Mintys, rizikos, idėjos, emocijos...&#10;&#10;#risk - mažas biudžetas&#10;#idea - invoicing automatizacija&#10;#followup - paklauskti apie HR procesus"
                  className="min-h-[120px] text-xs resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Šios pastabos bus matomos kuriant pasiūlymą
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  )
}
