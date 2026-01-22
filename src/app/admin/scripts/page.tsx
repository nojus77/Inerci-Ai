'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  FileText,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Download,
  Upload,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import type { AuditScript } from '@/types/database'

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<AuditScript[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newScriptName, setNewScriptName] = useState('')
  const [newScriptDesc, setNewScriptDesc] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    const { data } = await supabase
      .from('audit_scripts')
      .select('*')
      .order('updated_at', { ascending: false })

    if (data) {
      setScripts(data as AuditScript[])
    }
    setLoading(false)
  }

  const createScript = async () => {
    if (!newScriptName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('audit_scripts')
      .insert({
        name: newScriptName.trim(),
        description: newScriptDesc.trim() || null,
        created_by: user.id,
        is_template: true,
      } as never)
      .select()
      .single()

    if (data) {
      // Create default sections
      const defaultSections = [
        'Įvadas ir kontekstas',
        'Procesai ir darbo eiga',
        'Technologijos ir įrankiai',
        'Skausmo taškai',
        'Apibendrinimas',
      ]

      for (let i = 0; i < defaultSections.length; i++) {
        await supabase.from('audit_script_sections').insert({
          script_id: (data as AuditScript).id,
          title: defaultSections[i],
          order: i,
        } as never)
      }

      setNewScriptName('')
      setNewScriptDesc('')
      setShowCreate(false)
      fetchScripts()
    }
  }

  const duplicateScript = async (script: AuditScript) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create new script
    const { data: newScript } = await supabase
      .from('audit_scripts')
      .insert({
        name: `${script.name} (kopija)`,
        description: script.description,
        created_by: user.id,
        is_template: true,
      } as never)
      .select()
      .single()

    if (!newScript) return

    // Get sections
    const { data: sections } = await supabase
      .from('audit_script_sections')
      .select('*')
      .eq('script_id', script.id)
      .order('order')

    if (sections) {
      for (const section of sections as Array<{ id: string; title: string; order: number }>) {
        // Create new section
        const { data: newSection } = await supabase
          .from('audit_script_sections')
          .insert({
            script_id: (newScript as AuditScript).id,
            title: section.title,
            order: section.order,
          } as never)
          .select()
          .single()

        if (newSection) {
          // Get questions
          const { data: questions } = await supabase
            .from('audit_script_questions')
            .select('*')
            .eq('section_id', section.id)
            .order('order')

          if (questions) {
            for (const question of questions as Array<{ text: string; order: number; tags: string[] }>) {
              await supabase.from('audit_script_questions').insert({
                section_id: (newSection as { id: string }).id,
                text: question.text,
                order: question.order,
                tags: question.tags || [],
              } as never)
            }
          }
        }
      }
    }

    fetchScripts()
  }

  const deleteScript = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį script\'ą?')) return

    // Delete questions first (cascade would be better in DB)
    const { data: sections } = await supabase
      .from('audit_script_sections')
      .select('id')
      .eq('script_id', id)

    if (sections) {
      for (const section of sections as Array<{ id: string }>) {
        await supabase
          .from('audit_script_questions')
          .delete()
          .eq('section_id', section.id)
      }
    }

    // Delete sections
    await supabase.from('audit_script_sections').delete().eq('script_id', id)

    // Delete script
    await supabase.from('audit_scripts').delete().eq('id', id)

    fetchScripts()
  }

  const exportScript = async (script: AuditScript) => {
    // Fetch full script data
    const { data: sections } = await supabase
      .from('audit_script_sections')
      .select('*')
      .eq('script_id', script.id)
      .order('order')

    const sectionsWithQuestions = await Promise.all(
      ((sections || []) as Array<{ id: string; title: string; order: number }>).map(async (section) => {
        const { data: questions } = await supabase
          .from('audit_script_questions')
          .select('*')
          .eq('section_id', section.id)
          .order('order')

        return {
          title: section.title,
          order: section.order,
          questions: ((questions || []) as Array<{ text: string; order: number; tags: string[] }>).map((q) => ({
            text: q.text,
            order: q.order,
            tags: q.tags,
          })),
        }
      })
    )

    const exportData = {
      name: script.name,
      description: script.description,
      sections: sectionsWithQuestions,
      exported_at: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${script.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importScript = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Create script
        const { data: newScript } = await supabase
          .from('audit_scripts')
          .insert({
            name: data.name + ' (importuotas)',
            description: data.description,
            created_by: user.id,
            is_template: true,
          } as never)
          .select()
          .single()

        if (!newScript) return

        // Create sections and questions
        for (const section of data.sections || []) {
          const { data: newSection } = await supabase
            .from('audit_script_sections')
            .insert({
              script_id: (newScript as AuditScript).id,
              title: section.title,
              order: section.order,
            } as never)
            .select()
            .single()

          if (newSection) {
            for (const question of section.questions || []) {
              await supabase.from('audit_script_questions').insert({
                section_id: (newSection as { id: string }).id,
                text: question.text,
                order: question.order,
                tags: question.tags || [],
              } as never)
            }
          }
        }

        fetchScripts()
      } catch (error) {
        console.error('Import error:', error)
        alert('Nepavyko importuoti script\'o')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Script'ai</h1>
          <p className="text-sm text-muted-foreground">
            Sukurkite ir tvarkykite audito script'us
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={importScript}
            />
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Importuoti
              </span>
            </Button>
          </label>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Naujas script'as
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sukurti naują script'ą</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Pavadinimas</label>
                  <Input
                    value={newScriptName}
                    onChange={(e) => setNewScriptName(e.target.value)}
                    placeholder="pvz., Standartinis auditas"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Aprašymas (neprivaloma)</label>
                  <Input
                    value={newScriptDesc}
                    onChange={(e) => setNewScriptDesc(e.target.value)}
                    placeholder="Trumpas aprašymas..."
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    Atšaukti
                  </Button>
                  <Button onClick={createScript} disabled={!newScriptName.trim()}>
                    Sukurti
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scripts List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nėra sukurtų script'ų</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Sukurti pirmą script'ą
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scripts.map((script) => (
            <Card key={script.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {script.name}
                  </CardTitle>
                  {script.description && (
                    <p className="text-sm text-muted-foreground mt-1">{script.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/scripts/${script.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Redaguoti
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateScript(script)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Kopijuoti
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportScript(script)}>
                      <Download className="h-4 w-4 mr-2" />
                      Eksportuoti JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteScript(script.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Ištrinti
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Atnaujinta:{' '}
                    {new Date(script.updated_at).toLocaleDateString('lt-LT')}
                  </span>
                  <Button variant="outline" size="sm" className="h-7" asChild>
                    <Link href={`/admin/scripts/${script.id}`}>Atidaryti</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
