'use client'

import { useEffect, useState, use, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SummaryCards } from '@/components/admin/audit/SummaryCards'
import { ModeToggle } from '@/components/admin/audit/ModeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ArrowLeft,
  Building,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Check,
  SkipForward,
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  StickyNote,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  FileText,
  MessagesSquare,
  PanelRightClose,
  PanelRight,
} from 'lucide-react'
import Link from 'next/link'
import type {
  AuditSession,
  AuditMode,
  AuditScript,
  AuditScriptFull,
  AuditScriptSection,
  AuditScriptQuestion,
  QuestionStatus,
  ScriptQuestionState,
  SessionScriptState,
  SectionCoverageState,
  AdHocQuestion,
  ChatMessage,
} from '@/types/database'

interface AuditPageProps {
  params: Promise<{ sessionId: string }>
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

// Selected question type
interface SelectedQuestion {
  id: string
  text: string
  sectionTitle: string
  sectionId: string
  isAdHoc: boolean
}

// Helper: Get next unanswered question
interface GetNextQuestionParams {
  sections: (AuditScriptSection & { questions: AuditScriptQuestion[] })[]
  questionStates: Record<string, ScriptQuestionState>
  adHocQuestions: AdHocQuestion[]
  currentSectionId?: string
  currentQuestionId?: string
}

interface NextQuestionResult {
  question: SelectedQuestion | null
  isAuditComplete: boolean
}

function getNextQuestion({
  sections,
  questionStates,
  adHocQuestions,
  currentSectionId,
  currentQuestionId,
}: GetNextQuestionParams): NextQuestionResult {
  // Helper to check if question is unanswered
  const isUnanswered = (questionId: string): boolean => {
    const state = questionStates[questionId]
    return !state || (state.status !== 'done' && state.status !== 'skipped')
  }

  // 1. Try to find next unanswered in CURRENT section first
  if (currentSectionId) {
    const currentSection = sections.find((s) => s.id === currentSectionId)
    if (currentSection) {
      const currentQuestionIndex = currentSection.questions.findIndex((q) => q.id === currentQuestionId)
      // Start from current question + 1 (or 0 if not found)
      const startIndex = currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : 0

      for (let i = startIndex; i < currentSection.questions.length; i++) {
        const q = currentSection.questions[i]
        if (isUnanswered(q.id)) {
          return {
            question: {
              id: q.id,
              text: q.text,
              sectionTitle: currentSection.title,
              sectionId: currentSection.id,
              isAdHoc: false,
            },
            isAuditComplete: false,
          }
        }
      }
    }
  }

  // 2. Look in subsequent sections
  const currentSectionIndex = currentSectionId
    ? sections.findIndex((s) => s.id === currentSectionId)
    : -1

  for (let sIdx = currentSectionIndex + 1; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx]
    for (const q of section.questions) {
      if (isUnanswered(q.id)) {
        return {
          question: {
            id: q.id,
            text: q.text,
            sectionTitle: section.title,
            sectionId: section.id,
            isAdHoc: false,
          },
          isAuditComplete: false,
        }
      }
    }
  }

  // 3. Look in sections BEFORE current (wrap around)
  for (let sIdx = 0; sIdx <= currentSectionIndex; sIdx++) {
    const section = sections[sIdx]
    const startQIdx = sIdx === currentSectionIndex ? 0 : 0
    const endQIdx = sIdx === currentSectionIndex
      ? section.questions.findIndex((q) => q.id === currentQuestionId)
      : section.questions.length

    for (let qIdx = startQIdx; qIdx < endQIdx; qIdx++) {
      const q = section.questions[qIdx]
      if (isUnanswered(q.id)) {
        return {
          question: {
            id: q.id,
            text: q.text,
            sectionTitle: section.title,
            sectionId: section.id,
            isAdHoc: false,
          },
          isAuditComplete: false,
        }
      }
    }
  }

  // 4. Check ad-hoc questions
  for (const q of adHocQuestions) {
    if (q.status !== 'done' && q.status !== 'skipped') {
      return {
        question: {
          id: q.id,
          text: q.text,
          sectionTitle: 'Situaciniai klausimai',
          sectionId: 'ad-hoc',
          isAdHoc: true,
        },
        isAuditComplete: false,
      }
    }
  }

  // 5. All questions answered - audit complete!
  return {
    question: null,
    isAuditComplete: true,
  }
}

export default function AuditPage({ params }: AuditPageProps) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<AuditSession | null>(null)
  const [client, setClient] = useState<{ id: string; company_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<AuditMode>('live_capture')

  // Audit Board state
  const [scripts, setScripts] = useState<AuditScript[]>([])
  const [activeScript, setActiveScript] = useState<AuditScriptFull | null>(null)
  const [scriptState, setScriptState] = useState<SessionScriptState>(getDefaultScriptState())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Selected question state
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestion | null>(null)
  const [answerInput, setAnswerInput] = useState('')
  const [skipReason, setSkipReason] = useState('')

  // Ad-hoc questions
  const [showAddAdHoc, setShowAddAdHoc] = useState(false)
  const [newAdHocText, setNewAdHocText] = useState('')

  // Quick notes
  const [showQuickNotes, setShowQuickNotes] = useState(false)

  // Chat state - default to visible
  const [showChat, setShowChat] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  // Audit complete state
  const [isAuditComplete, setIsAuditComplete] = useState(false)

  // Right panel visibility
  const [showRightPanel, setShowRightPanel] = useState(true)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*, client:clients(id, company_name)')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
      } else if (data) {
        const sessionData = data as unknown as AuditSession & { client: { id: string; company_name: string } }
        setSession(sessionData)
        setClient(sessionData.client)
        setMode(sessionData.mode)

        // Load script state
        const stored = sessionData.structured_data?.script_state as SessionScriptState | undefined
        if (stored) {
          setScriptState({ ...getDefaultScriptState(), ...stored })
          if (stored.active_script_id) {
            loadFullScript(stored.active_script_id)
          }
        }
      }
      setLoading(false)
    }

    fetchSession()
  }, [sessionId, supabase])

  // Fetch scripts list
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

    // Expand all sections by default
    setExpandedSections(new Set(sectionsWithQuestions.map((s) => s.id)))
  }

  const saveScriptState = useCallback(
    async (newState: SessionScriptState) => {
      if (!session) return
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

      setSession({
        ...session,
        structured_data: {
          ...session.structured_data,
          script_state: newState,
        },
      })
    },
    [sessionId, session, supabase]
  )

  const handleScriptChange = async (scriptId: string) => {
    await loadFullScript(scriptId)
    const newState: SessionScriptState = {
      ...scriptState,
      active_script_id: scriptId,
    }
    await saveScriptState(newState)
  }

  // Auto-select first unanswered question when script loads or changes
  useEffect(() => {
    if (!activeScript || selectedQuestion) return

    const { question: firstUnanswered, isAuditComplete: allDone } = getNextQuestion({
      sections: activeScript.sections,
      questionStates: scriptState.question_states,
      adHocQuestions: scriptState.ad_hoc_questions || [],
    })

    if (allDone) {
      setIsAuditComplete(true)
    } else if (firstUnanswered) {
      setSelectedQuestion(firstUnanswered)
      setExpandedSections((prev) => new Set([...prev, firstUnanswered.sectionId]))
      // Mark as asked
      if (!firstUnanswered.isAdHoc) {
        updateQuestionState(firstUnanswered.id, { status: 'asked', asked_at: new Date().toISOString() })
      }
    }
  }, [activeScript?.id]) // Only run when script changes

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

  // Section coverage calculation
  const getSectionCoverage = useCallback(
    (section: AuditScriptSection & { questions: AuditScriptQuestion[] }): SectionCoverageState => {
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
      if (ratio >= 0.5) return 'covered'
      return 'partial'
    },
    [scriptState.question_states, scriptState.section_overrides]
  )

  // Coverage hint
  const coverageHint = {
    covered: activeScript?.sections.filter((s) => getSectionCoverage(s) === 'covered').map((s) => s.title) || [],
    partial: activeScript?.sections.filter((s) => getSectionCoverage(s) === 'partial').map((s) => s.title) || [],
    empty: activeScript?.sections.filter((s) => getSectionCoverage(s) === 'empty').map((s) => s.title) || [],
  }

  const getCoverageIcon = (coverage: SectionCoverageState) => {
    switch (coverage) {
      case 'covered': return <span className="text-green-500">🟩</span>
      case 'partial': return <span className="text-yellow-500">🟨</span>
      default: return <span className="text-muted-foreground">⬜</span>
    }
  }

  const getStatusIcon = (status: QuestionStatus) => {
    switch (status) {
      case 'done': return <Check className="h-3.5 w-3.5 text-green-500" />
      case 'skipped': return <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
      case 'asked': return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
      default: return <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
    }
  }

  // Select a question
  const handleSelectQuestion = (question: AuditScriptQuestion, sectionTitle: string, sectionId: string) => {
    setSelectedQuestion({
      id: question.id,
      text: question.text,
      sectionTitle,
      sectionId,
      isAdHoc: false,
    })
    setAnswerInput('')
    setSkipReason('')
    setIsAuditComplete(false)
    // Mark as asked
    updateQuestionState(question.id, { status: 'asked', asked_at: new Date().toISOString() })
    // Ensure section is expanded
    setExpandedSections((prev) => new Set([...prev, sectionId]))
  }

  const handleSelectAdHocQuestion = (question: AdHocQuestion) => {
    setSelectedQuestion({
      id: question.id,
      text: question.text,
      sectionTitle: 'Situaciniai klausimai',
      sectionId: 'ad-hoc',
      isAdHoc: true,
    })
    setAnswerInput('')
    setSkipReason('')
    setIsAuditComplete(false)
    // Mark as asked
    const updatedQuestions = scriptState.ad_hoc_questions.map((q) =>
      q.id === question.id ? { ...q, status: 'asked' as QuestionStatus, asked_at: new Date().toISOString() } : q
    )
    saveScriptState({ ...scriptState, ad_hoc_questions: updatedQuestions })
    // Ensure ad-hoc section is expanded
    setExpandedSections((prev) => new Set([...prev, 'ad-hoc']))
  }

  // Submit answer with auto-advance
  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answerInput.trim() || !activeScript) return

    const currentQuestionId = selectedQuestion.id
    const currentSectionId = selectedQuestion.sectionId

    // 1. Create structured chat message for AI Pokalbis
    const qaLogMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: `📝 **${selectedQuestion.sectionTitle}**\n\n**Klausimas:** ${selectedQuestion.text}\n\n**Atsakymas:** ${answerInput.trim()}`,
      timestamp: new Date().toISOString(),
    }

    const messages = session?.chat_messages || []
    const updatedMessages = [...messages, qaLogMessage]

    // 2. Save chat message to DB
    if (session) {
      await supabase
        .from('audit_sessions')
        .update({ chat_messages: updatedMessages } as never)
        .eq('id', sessionId)

      setSession({ ...session, chat_messages: updatedMessages })
    }

    // 3. Mark question as done
    let updatedQuestionStates = { ...scriptState.question_states }
    let updatedAdHocQuestions = [...(scriptState.ad_hoc_questions || [])]

    if (selectedQuestion.isAdHoc) {
      updatedAdHocQuestions = updatedAdHocQuestions.map((q) =>
        q.id === selectedQuestion.id
          ? { ...q, status: 'done' as QuestionStatus, completed_at: new Date().toISOString() }
          : q
      )
      await saveScriptState({ ...scriptState, ad_hoc_questions: updatedAdHocQuestions })
    } else {
      updatedQuestionStates = {
        ...updatedQuestionStates,
        [selectedQuestion.id]: {
          question_id: selectedQuestion.id,
          status: 'done',
          completed_at: new Date().toISOString(),
        },
      }
      await saveScriptState({ ...scriptState, question_states: updatedQuestionStates })
    }

    // 4. Clear input
    setAnswerInput('')

    // 5. Auto-advance to next unanswered question
    const { question: nextQuestion, isAuditComplete: allDone } = getNextQuestion({
      sections: activeScript.sections,
      questionStates: updatedQuestionStates,
      adHocQuestions: updatedAdHocQuestions,
      currentSectionId,
      currentQuestionId,
    })

    if (allDone) {
      setSelectedQuestion(null)
      setIsAuditComplete(true)
    } else if (nextQuestion) {
      setSelectedQuestion(nextQuestion)
      setIsAuditComplete(false)
      // Ensure the section is expanded
      setExpandedSections((prev) => new Set([...prev, nextQuestion.sectionId]))
      // Mark as asked
      if (nextQuestion.isAdHoc) {
        const updatedQ = updatedAdHocQuestions.map((q) =>
          q.id === nextQuestion.id ? { ...q, status: 'asked' as QuestionStatus, asked_at: new Date().toISOString() } : q
        )
        await saveScriptState({ ...scriptState, question_states: updatedQuestionStates, ad_hoc_questions: updatedQ })
      } else {
        await updateQuestionState(nextQuestion.id, { status: 'asked', asked_at: new Date().toISOString() })
      }
    }
  }

  // Skip question with auto-advance
  const handleSkipQuestion = async () => {
    if (!selectedQuestion || !activeScript) return

    const currentQuestionId = selectedQuestion.id
    const currentSectionId = selectedQuestion.sectionId

    // 1. Mark question as skipped
    let updatedQuestionStates = { ...scriptState.question_states }
    let updatedAdHocQuestions = [...(scriptState.ad_hoc_questions || [])]

    if (selectedQuestion.isAdHoc) {
      updatedAdHocQuestions = updatedAdHocQuestions.map((q) =>
        q.id === selectedQuestion.id
          ? { ...q, status: 'skipped' as QuestionStatus, skip_reason: skipReason, completed_at: new Date().toISOString() }
          : q
      )
      await saveScriptState({ ...scriptState, ad_hoc_questions: updatedAdHocQuestions })
    } else {
      updatedQuestionStates = {
        ...updatedQuestionStates,
        [selectedQuestion.id]: {
          question_id: selectedQuestion.id,
          status: 'skipped',
          skip_reason: skipReason,
          completed_at: new Date().toISOString(),
        },
      }
      await saveScriptState({ ...scriptState, question_states: updatedQuestionStates })
    }

    // 2. Clear inputs
    setSkipReason('')

    // 3. Auto-advance to next unanswered question
    const { question: nextQuestion, isAuditComplete: allDone } = getNextQuestion({
      sections: activeScript.sections,
      questionStates: updatedQuestionStates,
      adHocQuestions: updatedAdHocQuestions,
      currentSectionId,
      currentQuestionId,
    })

    if (allDone) {
      setSelectedQuestion(null)
      setIsAuditComplete(true)
    } else if (nextQuestion) {
      setSelectedQuestion(nextQuestion)
      setIsAuditComplete(false)
      // Ensure the section is expanded
      setExpandedSections((prev) => new Set([...prev, nextQuestion.sectionId]))
      // Mark as asked
      if (nextQuestion.isAdHoc) {
        const updatedQ = updatedAdHocQuestions.map((q) =>
          q.id === nextQuestion.id ? { ...q, status: 'asked' as QuestionStatus, asked_at: new Date().toISOString() } : q
        )
        await saveScriptState({ ...scriptState, question_states: updatedQuestionStates, ad_hoc_questions: updatedQ })
      } else {
        await updateQuestionState(nextQuestion.id, { status: 'asked', asked_at: new Date().toISOString() })
      }
    }
  }

  // Add ad-hoc question
  const handleAddAdHoc = async () => {
    if (!newAdHocText.trim()) return

    const newQuestion: AdHocQuestion = {
      id: generateId(),
      text: newAdHocText.trim(),
      status: 'pending',
    }

    const newAdHocQuestions = [...(scriptState.ad_hoc_questions || []), newQuestion]
    await saveScriptState({ ...scriptState, ad_hoc_questions: newAdHocQuestions })

    setNewAdHocText('')
    setShowAddAdHoc(false)
  }

  // Toggle section coverage override
  const toggleSectionOverride = async (sectionId: string) => {
    const newOverrides = {
      ...scriptState.section_overrides,
      [sectionId]: !scriptState.section_overrides[sectionId],
    }
    await saveScriptState({ ...scriptState, section_overrides: newOverrides })
  }

  // Quick notes
  const handleQuickNotesChange = async (value: string) => {
    await saveScriptState({ ...scriptState, quick_notes: value })
  }

  // Section toggle
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Mode change
  const handleModeChange = async (newMode: AuditMode) => {
    setMode(newMode)
    await supabase
      .from('audit_sessions')
      .update({ mode: newMode } as never)
      .eq('id', sessionId)
  }

  // Complete audit
  const handleCompleteAudit = async () => {
    await supabase
      .from('audit_sessions')
      .update({ status: 'complete' } as never)
      .eq('id', sessionId)

    if (client) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('clients')
        .update({ stage: 'audit_done' } as never)
        .eq('id', client.id)

      if (user) {
        await supabase.from('activity_log').insert({
          client_id: client.id,
          user_id: user.id,
          action: 'stage_changed',
          metadata: { from: 'audit_scheduled', to: 'audit_done' },
        } as never)
      }
    }

    setSession((prev) => prev ? { ...prev, status: 'complete' } : null)
  }

  // Send chat message (for AI assistance)
  const handleSendChat = async () => {
    if (!chatInput.trim() || aiLoading || !session) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    }

    const messages = session.chat_messages || []
    const updatedMessages = [...messages, userMessage]
    setSession({ ...session, chat_messages: updatedMessages })

    await supabase
      .from('audit_sessions')
      .update({ chat_messages: updatedMessages } as never)
      .eq('id', sessionId)

    setChatInput('')
    setAiLoading(true)
    setStreamingContent('')

    try {
      const aiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }))

      const response = await fetch('/admin/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: aiMessages, sessionId }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              const aiMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString(),
              }
              const finalMessages = [...updatedMessages, aiMessage]
              setSession({ ...session, chat_messages: finalMessages })
              await supabase
                .from('audit_sessions')
                .update({ chat_messages: finalMessages } as never)
                .eq('id', sessionId)
            } else {
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullContent += parsed.content
                  setStreamingContent(fullContent)
                }
              } catch {
                // Ignore
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setAiLoading(false)
      setStreamingContent('')
    }
  }

  // Progress calculation
  const progress = (() => {
    if (!activeScript) return { done: 0, total: 0 }
    const allQuestions = activeScript.sections.flatMap((s) => s.questions)
    const doneOrSkipped = allQuestions.filter((q) => {
      const state = getQuestionState(q.id)
      return state.status === 'done' || state.status === 'skipped'
    })
    const adHocDone = (scriptState.ad_hoc_questions || []).filter(
      (q) => q.status === 'done' || q.status === 'skipped'
    )
    return {
      done: doneOrSkipped.length + adHocDone.length,
      total: allQuestions.length + (scriptState.ad_hoc_questions || []).length,
    }
  })()

  // Ad-hoc coverage
  const adHocCoverage = ((): SectionCoverageState => {
    const questions = scriptState.ad_hoc_questions || []
    if (questions.length === 0) return 'empty'
    const done = questions.filter((q) => q.status === 'done' || q.status === 'skipped').length
    if (done === 0) return 'empty'
    if (done / questions.length >= 0.5) return 'covered'
    return 'partial'
  })()

  const messages = session?.chat_messages || []
  const isComplete = session?.status === 'complete'

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <div className="h-12 border-b flex items-center px-4 gap-3 bg-card">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="w-[380px] border-r" />
          <Skeleton className="flex-1" />
          <Skeleton className="w-[300px] border-l" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Session not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 shrink-0 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={client ? `/admin/clients/${client.id}` : '/admin/clients'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-sm">
            {client && (
              <>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Building className="h-4 w-4" />
                  <span className="max-w-[150px] truncate font-medium">{client.company_name}</span>
                </Link>
                <span className="text-muted-foreground/50">/</span>
              </>
            )}
            <span className="font-semibold max-w-[200px] truncate">{session.title}</span>
            <Badge
              variant={isComplete ? 'default' : 'secondary'}
              className="text-[10px] px-1.5 py-0 h-5"
            >
              {session.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowRightPanel(!showRightPanel)}
          >
            {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>

          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          {!isComplete && (
            <Button onClick={handleCompleteAudit} size="sm" className="gap-1.5 h-8">
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: Audit Board - PRIMARY */}
        <div className="w-[380px] min-w-[340px] max-w-[420px] border-r flex flex-col bg-card">
          {/* Audit Board Header */}
          <div className="shrink-0 p-3 border-b space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Audito Lenta</span>
            </div>

            {/* Script Selector */}
            <Select
              value={scriptState.active_script_id || ''}
              onValueChange={handleScriptChange}
            >
              <SelectTrigger className="h-9">
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

            {/* Coverage Hint */}
            {activeScript && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-xs space-y-1">
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

            {/* Progress Bar */}
            {activeScript && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {progress.done}/{progress.total}
                </span>
              </div>
            )}
          </div>

          {/* Sections & Questions - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {activeScript ? (
              <>
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
                        <div className={`flex items-center gap-2 p-3 hover:bg-muted/50 border-b ${
                          selectedQuestion && !selectedQuestion.isAdHoc &&
                          section.questions.some((q) => q.id === selectedQuestion.id)
                            ? 'bg-primary/5'
                            : ''
                        }`}>
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
                          {/* Pakankama toggle */}
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
                              {isOverridden ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                              {isOverridden ? 'Pakankama ✓' : 'Pažymėti kaip pakankama'}
                            </button>
                          </div>

                          {/* Questions */}
                          {section.questions.map((question) => {
                            const qState = getQuestionState(question.id)
                            const isSelected = selectedQuestion?.id === question.id && !selectedQuestion?.isAdHoc

                            return (
                              <div
                                key={question.id}
                                className={`flex items-start gap-2 px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-muted/30 last:border-0 ${
                                  isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                                } ${qState.status === 'done' || qState.status === 'skipped' ? 'opacity-60' : ''}`}
                                onClick={() => handleSelectQuestion(question, section.title, section.id)}
                              >
                                <div className="mt-0.5">{getStatusIcon(qState.status)}</div>
                                <p className={`text-sm flex-1 ${qState.status === 'done' ? 'line-through' : ''}`}>
                                  {question.text}
                                </p>
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
                        const isSelected = selectedQuestion?.id === question.id && selectedQuestion?.isAdHoc

                        return (
                          <div
                            key={question.id}
                            className={`flex items-start gap-2 px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-muted/30 last:border-0 ${
                              isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                            } ${question.status === 'done' || question.status === 'skipped' ? 'opacity-60' : ''}`}
                            onClick={() => handleSelectAdHocQuestion(question)}
                          >
                            <div className="mt-0.5">{getStatusIcon(question.status)}</div>
                            <p className={`text-sm flex-1 ${question.status === 'done' ? 'line-through' : ''}`}>
                              {question.text}
                            </p>
                          </div>
                        )
                      })}

                      {/* Add Ad-Hoc */}
                      <div className="px-3 py-2">
                        {showAddAdHoc ? (
                          <div className="flex gap-1.5">
                            <Input
                              value={newAdHocText}
                              onChange={(e) => setNewAdHocText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddAdHoc()}
                              placeholder="Naujas klausimas..."
                              className="h-8 text-sm flex-1"
                              autoFocus
                            />
                            <Button size="sm" className="h-8" onClick={handleAddAdHoc} disabled={!newAdHocText.trim()}>
                              Pridėti
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setShowAddAdHoc(false)
                                setNewAdHocText('')
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 w-full justify-start text-muted-foreground"
                            onClick={() => setShowAddAdHoc(true)}
                          >
                            <Plus className="h-4 w-4" />
                            Pridėti situacinį klausimą
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Quick Notes */}
                <Collapsible open={showQuickNotes} onOpenChange={setShowQuickNotes}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-3 hover:bg-muted/50 border-b bg-amber-50/50 dark:bg-amber-950/20">
                      {showQuickNotes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <StickyNote className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-sm flex-1 text-left">Greitos pastabos</span>
                      {scriptState.quick_notes && scriptState.quick_notes.length > 0 && (
                        <span className="text-xs">📝</span>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3">
                      <Textarea
                        value={scriptState.quick_notes || ''}
                        onChange={(e) => handleQuickNotesChange(e.target.value)}
                        placeholder="Mintys, rizikos, idėjos..."
                        className="min-h-[100px] text-sm resize-none"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            ) : (
              <div className="p-6 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Pasirinkite script'ą viršuje, kad pradėtumėte auditą
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/scripts">Sukurti script'ą</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Question Focus + Chat */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Question Focus Area */}
          {selectedQuestion ? (
            <div className="shrink-0 border-b bg-card p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{selectedQuestion.sectionTitle}</p>
                    <p className="text-lg font-medium">{selectedQuestion.text}</p>
                  </div>
                </div>

                {/* Answer Input */}
                <div className="space-y-3">
                  <Textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Įveskite atsakymą arba pastabas..."
                    className="min-h-[120px] text-sm"
                    autoFocus
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={skipReason}
                        onChange={(e) => setSkipReason(e.target.value)}
                        placeholder="Praleisti priežastis..."
                        className="h-9 w-48 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={handleSkipQuestion}
                      >
                        <SkipForward className="h-4 w-4" />
                        Praleisti
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => setSelectedQuestion(null)}
                      >
                        Atšaukti
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={handleSubmitAnswer}
                        disabled={!answerInput.trim()}
                      >
                        <Check className="h-4 w-4" />
                        Išsaugoti atsakymą
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isAuditComplete ? (
            <div className="shrink-0 border-b bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-medium mb-2 text-emerald-800 dark:text-emerald-200">Auditas baigtas! 🎉</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                  Visi klausimai atsakyti. Galite peržiūrėti rezultatus arba sukurti pasiūlymą.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    // Find any question to continue reviewing
                    if (activeScript && activeScript.sections.length > 0) {
                      const firstSection = activeScript.sections[0]
                      if (firstSection.questions.length > 0) {
                        handleSelectQuestion(firstSection.questions[0], firstSection.title, firstSection.id)
                      }
                    }
                  }}>
                    Peržiūrėti atsakymus
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/admin/proposals/new?session=${sessionId}`}>
                      Kurti pasiūlymą
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-b bg-muted/30 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Pasirinkite klausimą</h3>
                <p className="text-sm text-muted-foreground">
                  Kairėje pasirinkite sekciją ir klausimą, kurį norite užduoti.
                  Galite laisvai šokinėti tarp skirtingų temų.
                </p>
              </div>
            </div>
          )}

          {/* Chat Area (Secondary) */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Toggle */}
            <div className="shrink-0 border-b bg-card px-4 py-2">
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {showChat ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <MessagesSquare className="h-4 w-4" />
                <span>AI Pokalbis</span>
                <span className="text-xs">({messages.length} žinutės)</span>
              </button>
            </div>

            {/* Chat Messages */}
            {showChat && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Pokalbio istorija tuščia. Parašykite žinutę, jei norite AI pagalbos.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Streaming */}
                {streamingContent && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted">
                      <p className="whitespace-pre-wrap">{streamingContent}</p>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {aiLoading && !streamingContent && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}

            {/* Chat Input */}
            {showChat && !isComplete && (
              <div className="shrink-0 border-t bg-card p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChat()
                      }
                    }}
                    placeholder="Klauskite AI pagalbos..."
                    className="min-h-[60px] max-h-[120px] resize-none text-sm"
                    disabled={aiLoading}
                  />
                  <Button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || aiLoading}
                    size="icon"
                    className="h-[60px] w-12 shrink-0"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: AI Summary (Supporting) */}
        {showRightPanel && (
          <div className="w-[300px] min-w-[280px] max-w-[340px] border-l flex flex-col bg-muted/10">
            <SummaryCards sessionId={sessionId} session={session} />
          </div>
        )}
      </div>
    </div>
  )
}
