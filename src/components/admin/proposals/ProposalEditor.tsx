'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Sparkles,
} from 'lucide-react'
import { RegeneratePrompt } from './RegeneratePrompt'
import type { ProposalLanguage } from '@/types/database'

interface ProposalEditorProps {
  proposalId: string
  content: Record<string, unknown>
  enabledSections: string[]
  language: ProposalLanguage
  onSave: (content: Record<string, unknown>) => void
}

interface Section {
  id: string
  title: string
  placeholder: string
}

const SECTIONS: Section[] = [
  { id: 'executive_summary', title: 'Executive Summary', placeholder: 'Brief overview of the client situation and recommendations...' },
  { id: 'current_state', title: 'Current State Assessment', placeholder: 'Summary of processes reviewed and key pain points...' },
  { id: 'opportunities', title: 'Prioritized Opportunities', placeholder: 'Ranked automation opportunities with ROI analysis...' },
  { id: 'pilot', title: 'Recommended Pilot', placeholder: 'Proposed pilot project with scope and success metrics...' },
  { id: 'timeline', title: 'Timeline & Next Steps', placeholder: 'Implementation timeline and action items...' },
  { id: 'risks', title: 'Risks & Assumptions', placeholder: 'Key risks, assumptions, and mitigation strategies...' },
  { id: 'technical', title: 'Technical Architecture', placeholder: 'Technical implementation details and architecture...' },
  { id: 'pricing', title: 'Pricing Breakdown', placeholder: 'Detailed pricing and cost breakdown...' },
  { id: 'case_studies', title: 'Evidence & Case Studies', placeholder: 'Relevant case studies and success stories...' },
]

export function ProposalEditor({
  proposalId,
  content,
  enabledSections,
  language,
  onSave,
}: ProposalEditorProps) {
  const [activeSection, setActiveSection] = useState(enabledSections[0] || 'executive_summary')
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({})
  const [regenerateOpen, setRegenerateOpen] = useState(false)

  // Initialize section content from proposal content
  useEffect(() => {
    const sections: Record<string, string> = {}
    enabledSections.forEach((sectionId) => {
      sections[sectionId] = (content as Record<string, string>)?.[sectionId] || ''
    })
    setSectionContent(sections)
  }, [content, enabledSections])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: SECTIONS.find((s) => s.id === activeSection)?.placeholder || 'Start writing...',
      }),
    ],
    content: sectionContent[activeSection] || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setSectionContent((prev) => ({ ...prev, [activeSection]: html }))
    },
  })

  // Update editor content when switching sections
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(sectionContent[activeSection] || '')
    }
  }, [activeSection, editor, sectionContent])

  // Debounced save
  const debouncedSave = useCallback(() => {
    const timer = setTimeout(() => {
      onSave(sectionContent)
    }, 1000)
    return () => clearTimeout(timer)
  }, [sectionContent, onSave])

  useEffect(() => {
    return debouncedSave()
  }, [debouncedSave])

  const handleRegenerate = async (instruction: string) => {
    try {
      const response = await fetch('/admin/api/ai/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          sectionId: activeSection,
          instruction,
          currentContent: sectionContent[activeSection],
          language,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (editor) {
          editor.commands.setContent(data.content)
        }
        setSectionContent((prev) => ({ ...prev, [activeSection]: data.content }))
      }
    } catch (error) {
      console.error('Error regenerating section:', error)
    }
  }

  const visibleSections = SECTIONS.filter((s) => enabledSections.includes(s.id))

  if (!editor) {
    return <div className="p-4">Loading editor...</div>
  }

  return (
    <div className="flex h-full">
      {/* Section Sidebar */}
      <div className="w-64 border-r bg-muted/30">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Sections
            </h3>
            {visibleSections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => setActiveSection(section.id)}
              >
                {section.title}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b px-4 py-2 flex items-center gap-1 bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRegenerateOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            AI Regenerate
          </Button>
        </div>

        {/* Editor Content */}
        <ScrollArea className="flex-1 bg-card">
          <div className="max-w-3xl mx-auto py-8">
            <h2 className="text-2xl font-bold mb-4 px-4">
              {SECTIONS.find((s) => s.id === activeSection)?.title}
            </h2>
            <EditorContent editor={editor} />
          </div>
        </ScrollArea>
      </div>

      {/* Regenerate Dialog */}
      <RegeneratePrompt
        open={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        onRegenerate={handleRegenerate}
        sectionTitle={SECTIONS.find((s) => s.id === activeSection)?.title || ''}
      />
    </div>
  )
}
