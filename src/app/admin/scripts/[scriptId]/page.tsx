'use client'

import { useState, useEffect, use, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  FileUp,
  FileText,
  Check,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import type {
  AuditScript,
  AuditScriptSection,
  AuditScriptQuestion,
} from '@/types/database'

// Parsed section from pasted text
interface ParsedSection {
  headerRaw: string        // Original header text as pasted
  headerNormalized: string // Normalized for matching (lowercase, no punctuation, no parentheses)
  questions: string[]      // List of questions
}

// Normalize a string for matching: lowercase, trim, remove punctuation, collapse spaces, remove parentheses content
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove text in parentheses
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Remove punctuation, keep letters/numbers/spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
}

// Match result for a parsed section
interface SectionMatch {
  parsedSection: ParsedSection
  matchedSectionId: string | null
  matchedSectionTitle: string | null
  matchType: 'exact' | 'alias' | 'fuzzy' | 'none'
  confidence: number       // 0-1
  alternativeMatches?: { id: string; title: string; score: number }[]
}

interface ScriptEditorProps {
  params: Promise<{ scriptId: string }>
}

interface SectionWithQuestions extends AuditScriptSection {
  questions: AuditScriptQuestion[]
}

export default function ScriptEditorPage({ params }: ScriptEditorProps) {
  const { scriptId } = use(params)
  const [script, setScript] = useState<AuditScript | null>(null)
  const [sections, setSections] = useState<SectionWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [bulkImportSection, setBulkImportSection] = useState<string | null>(null)
  const [bulkImportText, setBulkImportText] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)

  // Full script import state
  const [showFullImport, setShowFullImport] = useState(false)
  const [fullImportText, setFullImportText] = useState('')
  const [fullImportReplaceMode, setFullImportReplaceMode] = useState(true)
  const [fullImporting, setFullImporting] = useState(false)
  const [importToast, setImportToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  // Check if a line is a bullet line
  const isBulletLine = (line: string): boolean => {
    const trimmed = line.trim()
    return /^[•\-\*]\s+/.test(trimmed)
  }

  // Extract question text from bullet line
  const extractQuestion = (line: string): string => {
    const trimmed = line.trim()
    const match = trimmed.match(/^[•\-\*]\s+(.+)$/)
    return match ? match[1].trim() : trimmed
  }

  // Parse full script text into sections and questions
  // A section header is any non-empty, non-bullet line followed by at least one bullet line
  const parseFullScript = (text: string): ParsedSection[] => {
    const lines = text.split('\n')
    const result: ParsedSection[] = []

    // First pass: identify potential headers (non-empty, non-bullet lines that have bullets after them)
    const potentialSections: { headerIndex: number; headerText: string }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines and bullet lines
      if (!line || isBulletLine(lines[i])) {
        continue
      }

      // Check if there's at least one bullet line following this line (before next non-bullet, non-empty line)
      let hasBulletsAfter = false
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim()
        if (!nextLine) continue // Skip empty lines

        if (isBulletLine(lines[j])) {
          hasBulletsAfter = true
          break
        } else {
          // Hit another non-bullet line, stop looking
          break
        }
      }

      if (hasBulletsAfter) {
        potentialSections.push({ headerIndex: i, headerText: line })
      }
    }

    // Second pass: collect questions for each section
    for (let s = 0; s < potentialSections.length; s++) {
      const section = potentialSections[s]
      const nextSectionIndex = s + 1 < potentialSections.length
        ? potentialSections[s + 1].headerIndex
        : lines.length

      const questions: string[] = []

      // Collect all bullet lines between this header and the next
      for (let i = section.headerIndex + 1; i < nextSectionIndex; i++) {
        const line = lines[i]
        if (isBulletLine(line)) {
          const questionText = extractQuestion(line)
          if (questionText) {
            questions.push(questionText)
          }
        }
      }

      if (questions.length > 0) {
        result.push({
          headerRaw: section.headerText,
          headerNormalized: normalizeForMatching(section.headerText),
          questions,
        })
      }
    }

    return result
  }

  // Calculate word-based similarity score
  const calculateSimilarity = (a: string, b: string): number => {
    if (a === b) return 1

    // Word overlap score
    const aWords = new Set(a.split(/\s+/).filter(w => w.length > 1))
    const bWords = new Set(b.split(/\s+/).filter(w => w.length > 1))

    if (aWords.size === 0 || bWords.size === 0) return 0

    const intersection = [...aWords].filter(w => bWords.has(w)).length
    const union = new Set([...aWords, ...bWords]).size

    return union > 0 ? intersection / union : 0
  }

  // Match parsed sections to existing sections by normalized title
  const matchSections = (parsedSections: ParsedSection[]): SectionMatch[] => {
    return parsedSections.map(parsed => {
      const parsedNorm = parsed.headerNormalized
      let bestMatch: SectionMatch = {
        parsedSection: parsed,
        matchedSectionId: null,
        matchedSectionTitle: null,
        matchType: 'none',
        confidence: 0,
      }

      const candidates: { id: string; title: string; score: number; type: 'exact' | 'contains' | 'fuzzy' }[] = []

      for (const section of sections) {
        const sectionNorm = normalizeForMatching(section.title)

        // 1. Exact normalized match
        if (sectionNorm === parsedNorm) {
          return {
            parsedSection: parsed,
            matchedSectionId: section.id,
            matchedSectionTitle: section.title,
            matchType: 'exact' as const,
            confidence: 1,
          }
        }

        // 2. Contains match (either direction)
        if (parsedNorm.includes(sectionNorm) || sectionNorm.includes(parsedNorm)) {
          const shorter = Math.min(parsedNorm.length, sectionNorm.length)
          const longer = Math.max(parsedNorm.length, sectionNorm.length)
          const score = shorter / longer
          candidates.push({
            id: section.id,
            title: section.title,
            score: score * 0.95, // Slightly below exact
            type: 'contains',
          })
          continue
        }

        // 3. Word-based similarity
        const similarity = calculateSimilarity(parsedNorm, sectionNorm)
        if (similarity > 0.3) {
          candidates.push({
            id: section.id,
            title: section.title,
            score: similarity,
            type: 'fuzzy',
          })
        }
      }

      // Sort candidates by score
      candidates.sort((a, b) => b.score - a.score)

      // Pick best match if good enough
      if (candidates.length > 0 && candidates[0].score >= 0.5) {
        bestMatch = {
          parsedSection: parsed,
          matchedSectionId: candidates[0].id,
          matchedSectionTitle: candidates[0].title,
          matchType: candidates[0].type === 'contains' ? 'alias' : 'fuzzy',
          confidence: candidates[0].score,
          alternativeMatches: candidates.length > 1
            ? candidates.slice(1).map(c => ({ id: c.id, title: c.title, score: c.score }))
            : undefined,
        }
      } else if (candidates.length > 0) {
        // Low confidence - show as alternatives
        bestMatch.alternativeMatches = candidates.map(c => ({ id: c.id, title: c.title, score: c.score }))
      }

      return bestMatch
    })
  }

  // Memoized parsing and matching
  const importPreview = useMemo(() => {
    if (!fullImportText.trim()) return null
    const parsed = parseFullScript(fullImportText)
    const matches = matchSections(parsed)
    return {
      parsed,
      matches,
      totalQuestions: parsed.reduce((sum, s) => sum + s.questions.length, 0),
      matchedSections: matches.filter(m => m.matchedSectionId).length,
      unmatchedSections: matches.filter(m => !m.matchedSectionId).length,
    }
  }, [fullImportText, sections])

  // Apply the full import
  const handleFullImport = async () => {
    if (!importPreview || importPreview.matchedSections === 0) return

    setFullImporting(true)

    try {
      let totalQuestionsImported = 0
      let sectionsUpdated = 0

      for (const match of importPreview.matches) {
        if (!match.matchedSectionId) continue

        const section = sections.find(s => s.id === match.matchedSectionId)
        if (!section) continue

        // If replace mode, delete existing questions first
        if (fullImportReplaceMode) {
          await supabase
            .from('audit_script_questions')
            .delete()
            .eq('section_id', match.matchedSectionId)
        }

        // Calculate starting order
        const startOrder = fullImportReplaceMode ? 0 : section.questions.length

        // Insert new questions
        const newQuestions: AuditScriptQuestion[] = []
        for (let i = 0; i < match.parsedSection.questions.length; i++) {
          const questionText = match.parsedSection.questions[i]
          if (!questionText.trim()) continue

          const { data } = await supabase
            .from('audit_script_questions')
            .insert({
              section_id: match.matchedSectionId,
              text: questionText.trim(),
              order: startOrder + i,
              tags: [],
            } as never)
            .select()
            .single()

          if (data) {
            newQuestions.push(data as AuditScriptQuestion)
            totalQuestionsImported++
          }
        }

        // Update local state
        setSections(prev => prev.map(s => {
          if (s.id === match.matchedSectionId) {
            return {
              ...s,
              questions: fullImportReplaceMode ? newQuestions : [...s.questions, ...newQuestions],
            }
          }
          return s
        }))

        sectionsUpdated++
      }

      // Show success toast
      setImportToast({
        message: `Importuota ${totalQuestionsImported} klausimų į ${sectionsUpdated} sekcijas`,
        type: 'success',
      })

      // Close dialog and reset
      setShowFullImport(false)
      setFullImportText('')

      // Auto-hide toast after 4 seconds
      setTimeout(() => setImportToast(null), 4000)
    } catch (error) {
      console.error('Import error:', error)
      setImportToast({
        message: 'Klaida importuojant skriptą',
        type: 'error',
      })
      setTimeout(() => setImportToast(null), 4000)
    } finally {
      setFullImporting(false)
    }
  }

  useEffect(() => {
    fetchScript()
  }, [scriptId])

  const fetchScript = async () => {
    // Fetch script
    const { data: scriptData } = await supabase
      .from('audit_scripts')
      .select('*')
      .eq('id', scriptId)
      .single()

    if (scriptData) {
      setScript(scriptData as AuditScript)
    }

    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('audit_script_sections')
      .select('*')
      .eq('script_id', scriptId)
      .order('order')

    if (sectionsData) {
      const sectionsWithQuestions = await Promise.all(
        (sectionsData as AuditScriptSection[]).map(async (section) => {
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
      setSections(sectionsWithQuestions)
      // Expand all sections by default
      setExpandedSections(new Set(sectionsWithQuestions.map((s) => s.id)))
    }

    setLoading(false)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result

    if (!destination) return

    if (type === 'section') {
      // Reorder sections
      const newSections = Array.from(sections)
      const [removed] = newSections.splice(source.index, 1)
      newSections.splice(destination.index, 0, removed)

      // Update order
      const updatedSections = newSections.map((s, i) => ({ ...s, order: i }))
      setSections(updatedSections)

      // Save to DB
      setSaving(true)
      for (const section of updatedSections) {
        await supabase
          .from('audit_script_sections')
          .update({ order: section.order } as never)
          .eq('id', section.id)
      }
      setSaving(false)
    } else if (type === 'question') {
      const sourceSectionId = source.droppableId
      const destSectionId = destination.droppableId

      const newSections = [...sections]
      const sourceSection = newSections.find((s) => s.id === sourceSectionId)
      const destSection = newSections.find((s) => s.id === destSectionId)

      if (!sourceSection || !destSection) return

      // Remove from source
      const [removed] = sourceSection.questions.splice(source.index, 1)

      // Add to destination
      destSection.questions.splice(destination.index, 0, removed)

      // Update section_id if moved to different section
      if (sourceSectionId !== destSectionId) {
        removed.section_id = destSectionId
      }

      // Update orders
      sourceSection.questions = sourceSection.questions.map((q, i) => ({
        ...q,
        order: i,
      }))
      destSection.questions = destSection.questions.map((q, i) => ({
        ...q,
        order: i,
      }))

      setSections(newSections)

      // Save to DB
      setSaving(true)
      for (const q of sourceSection.questions) {
        await supabase
          .from('audit_script_questions')
          .update({ order: q.order } as never)
          .eq('id', q.id)
      }
      if (sourceSectionId !== destSectionId) {
        await supabase
          .from('audit_script_questions')
          .update({ section_id: destSectionId, order: destination.index } as never)
          .eq('id', removed.id)
        for (const q of destSection.questions) {
          await supabase
            .from('audit_script_questions')
            .update({ order: q.order } as never)
            .eq('id', q.id)
        }
      }
      setSaving(false)
    }
  }

  const addSection = async () => {
    if (!newSectionTitle.trim()) return

    const order = sections.length

    const { data } = await supabase
      .from('audit_script_sections')
      .insert({
        script_id: scriptId,
        title: newSectionTitle.trim(),
        order,
      } as never)
      .select()
      .single()

    if (data) {
      setSections([...sections, { ...(data as AuditScriptSection), questions: [] }])
      setExpandedSections(new Set([...expandedSections, (data as AuditScriptSection).id]))
    }

    setNewSectionTitle('')
    setShowAddSection(false)
  }

  const updateSectionTitle = async (sectionId: string, title: string) => {
    await supabase
      .from('audit_script_sections')
      .update({ title } as never)
      .eq('id', sectionId)

    setSections(sections.map((s) => (s.id === sectionId ? { ...s, title } : s)))
    setEditingSection(null)
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Ištrinti sekciją ir visus jos klausimus?')) return

    // Delete questions first
    await supabase.from('audit_script_questions').delete().eq('section_id', sectionId)
    // Delete section
    await supabase.from('audit_script_sections').delete().eq('id', sectionId)

    setSections(sections.filter((s) => s.id !== sectionId))
  }

  const addQuestion = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    const order = section.questions.length

    const { data } = await supabase
      .from('audit_script_questions')
      .insert({
        section_id: sectionId,
        text: 'Naujas klausimas...',
        order,
        tags: [],
      } as never)
      .select()
      .single()

    if (data) {
      setSections(
        sections.map((s) =>
          s.id === sectionId
            ? { ...s, questions: [...s.questions, data as AuditScriptQuestion] }
            : s
        )
      )
      setEditingQuestion((data as AuditScriptQuestion).id)
    }
  }

  const updateQuestion = async (questionId: string, text: string) => {
    await supabase
      .from('audit_script_questions')
      .update({ text } as never)
      .eq('id', questionId)

    setSections(
      sections.map((s) => ({
        ...s,
        questions: s.questions.map((q) => (q.id === questionId ? { ...q, text } : q)),
      }))
    )
    setEditingQuestion(null)
  }

  const deleteQuestion = async (sectionId: string, questionId: string) => {
    await supabase.from('audit_script_questions').delete().eq('id', questionId)

    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      )
    )
  }

  // Bulk import questions
  const handleBulkImport = async () => {
    if (!bulkImportSection || !bulkImportText.trim()) return

    const section = sections.find((s) => s.id === bulkImportSection)
    if (!section) return

    setBulkImporting(true)

    // Parse newline-separated questions (filter empty lines)
    const questions = bulkImportText
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0)

    if (questions.length === 0) {
      setBulkImporting(false)
      return
    }

    const startOrder = section.questions.length
    const newQuestions: AuditScriptQuestion[] = []

    // Insert all questions
    for (let i = 0; i < questions.length; i++) {
      const { data } = await supabase
        .from('audit_script_questions')
        .insert({
          section_id: bulkImportSection,
          text: questions[i],
          order: startOrder + i,
          tags: [],
        } as never)
        .select()
        .single()

      if (data) {
        newQuestions.push(data as AuditScriptQuestion)
      }
    }

    // Update state
    setSections(
      sections.map((s) =>
        s.id === bulkImportSection
          ? { ...s, questions: [...s.questions, ...newQuestions] }
          : s
      )
    )

    // Reset and close
    setBulkImportText('')
    setBulkImportSection(null)
    setBulkImporting(false)
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

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Script'as nerastas</p>
        <Button asChild className="mt-4">
          <Link href="/admin/scripts">Grįžti</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Toast notification */}
      {importToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${
            importToast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-destructive text-destructive-foreground'
          }`}
        >
          {importToast.type === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {importToast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/scripts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{script.name}</h1>
            {script.description && (
              <p className="text-sm text-muted-foreground">{script.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFullImport(true)}
          >
            <FileText className="h-4 w-4" />
            Įkelti visą skriptą
          </Button>
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4 animate-pulse" />
              Saugoma...
            </div>
          )}
        </div>
      </div>

      {/* Drag & Drop Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? 'shadow-lg' : ''}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <button
                            onClick={() => toggleSection(section.id)}
                            className="p-0.5"
                          >
                            {expandedSections.has(section.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          {editingSection === section.id ? (
                            <Input
                              autoFocus
                              defaultValue={section.title}
                              className="h-7 text-sm font-medium"
                              onBlur={(e) => updateSectionTitle(section.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateSectionTitle(section.id, e.currentTarget.value)
                                }
                                if (e.key === 'Escape') {
                                  setEditingSection(null)
                                }
                              }}
                            />
                          ) : (
                            <span
                              className="font-medium text-sm flex-1 cursor-pointer"
                              onClick={() => setEditingSection(section.id)}
                            >
                              {section.title}
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {section.questions.length} kl.
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteSection(section.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardHeader>

                      {expandedSections.has(section.id) && (
                        <CardContent className="pt-0 pb-3 px-4">
                          <Droppable droppableId={section.id} type="question">
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="space-y-1 min-h-[20px]"
                              >
                                {section.questions.map((question, qIndex) => (
                                  <Draggable
                                    key={question.id}
                                    draggableId={question.id}
                                    index={qIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`flex items-start gap-2 p-2 rounded bg-muted/50 ${
                                          snapshot.isDragging ? 'shadow-md bg-muted' : ''
                                        }`}
                                      >
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing mt-0.5"
                                        >
                                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                        </div>

                                        {editingQuestion === question.id ? (
                                          <Input
                                            autoFocus
                                            defaultValue={question.text}
                                            className="h-7 text-xs flex-1"
                                            onBlur={(e) =>
                                              updateQuestion(question.id, e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                updateQuestion(
                                                  question.id,
                                                  e.currentTarget.value
                                                )
                                              }
                                              if (e.key === 'Escape') {
                                                setEditingQuestion(null)
                                              }
                                            }}
                                          />
                                        ) : (
                                          <span
                                            className="text-xs flex-1 cursor-pointer"
                                            onClick={() => setEditingQuestion(question.id)}
                                          >
                                            {question.text}
                                          </span>
                                        )}

                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                          onClick={() =>
                                            deleteQuestion(section.id, question.id)
                                          }
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground"
                              onClick={() => addQuestion(section.id)}
                            >
                              <Plus className="h-3 w-3" />
                              Pridėti klausimą
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground"
                              onClick={() => setBulkImportSection(section.id)}
                            >
                              <FileUp className="h-3 w-3" />
                              Įkelti daug
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section */}
      <div className="mt-4">
        {showAddSection ? (
          <Card className="p-3">
            <div className="flex gap-2">
              <Input
                autoFocus
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Sekcijos pavadinimas..."
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSection()
                  if (e.key === 'Escape') {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }
                }}
              />
              <Button size="sm" className="h-8" onClick={addSection}>
                Pridėti
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setShowAddSection(false)
                  setNewSectionTitle('')
                }}
              >
                Atšaukti
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={() => setShowAddSection(true)}
          >
            <Plus className="h-4 w-4" />
            Pridėti sekciją
          </Button>
        )}
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={!!bulkImportSection} onOpenChange={(open) => !open && setBulkImportSection(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Įkelti daug klausimų
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Įveskite klausimus - kiekvienas klausimas naujoje eilutėje:
              </p>
              <Textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="Kaip vyksta jūsų komunikacija?&#10;Kokie įrankiai naudojami?&#10;Ar yra problemų su informacijos dalijimusi?&#10;Kiek laiko užtrunka sutarčių pasirašymas?"
                className="min-h-[200px] text-sm"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                {bulkImportText.split('\n').filter((l) => l.trim()).length} klausimų bus pridėta
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkImportSection(null)
                  setBulkImportText('')
                }}
              >
                Atšaukti
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={!bulkImportText.trim() || bulkImporting}
              >
                {bulkImporting ? 'Įkeliama...' : 'Įkelti klausimus'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Script Import Dialog */}
      <Dialog open={showFullImport} onOpenChange={setShowFullImport}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Įkelti visą skriptą
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            {/* Instructions */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground mb-1">Formatas:</p>
              <p>Sekcijos pradedamos raide ir tašku (pvz., &quot;A. Warm-up&quot;)</p>
              <p>Klausimai prasideda • arba - arba *</p>
              <p className="mt-1 text-xs">Automatiškai atpažins sekcijas ir priskirs klausimus.</p>
            </div>

            {/* Textarea */}
            <div>
              <Textarea
                value={fullImportText}
                onChange={(e) => setFullImportText(e.target.value)}
                placeholder={`A. Warm-up
• Kaip sekasi šiandien?
• Kiek laiko turime pokalbiui?

B. Įmonės snapshot
• Kuo užsiima jūsų įmonė?
• Kiek darbuotojų turi kompanija?
• Kokie pagrindiniai procesai?

C. Įrankiai ir sistemos
• Kokias sistemas naudojate?
• Ar turite CRM?`}
                className="min-h-[200px] text-sm font-mono"
                autoFocus
              />
            </div>

            {/* Replace vs Append toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="replace-mode" className="text-sm font-medium">
                  Pakeisti esamus klausimus
                </Label>
                <p className="text-xs text-muted-foreground">
                  {fullImportReplaceMode
                    ? 'Esami klausimai bus ištrinti ir pakeisti naujais'
                    : 'Nauji klausimai bus pridėti prie esamų'}
                </p>
              </div>
              <Switch
                id="replace-mode"
                checked={fullImportReplaceMode}
                onCheckedChange={setFullImportReplaceMode}
              />
            </div>

            {/* Preview */}
            {importPreview && importPreview.parsed.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Peržiūra</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {importPreview.totalQuestions} klausimų
                    </span>
                    <span className="text-emerald-600">
                      {importPreview.matchedSections} atpažinta
                    </span>
                    {importPreview.unmatchedSections > 0 && (
                      <span className="text-amber-600">
                        {importPreview.unmatchedSections} neatpažinta
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {importPreview.matches.map((match, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-sm ${
                        match.matchedSectionId
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {match.matchedSectionId ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="font-medium">
                              {match.parsedSection.headerRaw}
                            </span>
                          </div>
                          {match.matchedSectionId && (
                            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                              → {match.matchedSectionTitle}
                              {match.matchType === 'alias' && (
                                <Badge variant="secondary" className="ml-1.5 text-[10px] py-0">
                                  alias
                                </Badge>
                              )}
                              {match.matchType === 'fuzzy' && (
                                <Badge variant="secondary" className="ml-1.5 text-[10px] py-0">
                                  fuzzy ({Math.round(match.confidence * 100)}%)
                                </Badge>
                              )}
                            </p>
                          )}
                          {!match.matchedSectionId && match.alternativeMatches && match.alternativeMatches.length > 0 && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 ml-6">
                              Gali būti: {match.alternativeMatches.map(a => a.title).join(', ')}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {match.parsedSection.questions.length} kl.
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {importPreview.unmatchedSections > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                    ⚠️ Neatpažintos sekcijos nebus importuotos. Patikrinkite ar sekcijų pavadinimai
                    sutampa su esamomis sekcijomis.
                  </p>
                )}
              </div>
            )}

            {fullImportText.trim() && (!importPreview || importPreview.parsed.length === 0) && (
              <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                <p className="font-medium">Nepavyko atpažinti sekcijų</p>
                <p className="text-xs mt-1">
                  Patikrinkite ar tekstas prasideda sekcijos antrašte (pvz., &quot;A. Pavadinimas&quot;)
                  ir ar klausimai prasideda • arba - simboliu.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowFullImport(false)
                setFullImportText('')
              }}
            >
              Atšaukti
            </Button>
            <Button
              onClick={handleFullImport}
              disabled={!importPreview || importPreview.matchedSections === 0 || fullImporting}
            >
              {fullImporting ? 'Importuojama...' : `Importuoti ${importPreview?.matchedSections || 0} sekcijas`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
