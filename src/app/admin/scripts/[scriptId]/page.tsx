'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  const supabase = createClient()

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
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Save className="h-4 w-4 animate-pulse" />
            Saugoma...
          </div>
        )}
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
    </div>
  )
}
