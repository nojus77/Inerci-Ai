'use client'

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, User, Bot, Play, Lightbulb, MessageSquare, SkipForward, XCircle, CheckCheck } from 'lucide-react'
import type { AuditSession, AuditMode, ChatMessage } from '@/types/database'
import { AUDIT_FIRST_QUESTION } from '@/lib/ai/prompts'

interface AuditChatProps {
  sessionId: string
  session: AuditSession
  onUpdate: (session: AuditSession) => void
  mode: AuditMode
}

export interface AuditChatRef {
  injectQuestion: (text: string) => void
}

type FollowUpAction = 'answer' | 'skip' | 'not_relevant' | 'already_discussed'

interface AIFollowUp {
  question: string
  visible: boolean
}

interface SkippedQuestion {
  question: string
  reason: 'skip' | 'not_relevant' | 'already_discussed'
  timestamp: string
}

export const AuditChat = forwardRef<AuditChatRef, AuditChatProps>(
  function AuditChat({ sessionId, session, onUpdate, mode }, ref) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [aiFollowUp, setAIFollowUp] = useState<AIFollowUp | null>(null)
  const [autoStarted, setAutoStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Expose injectQuestion method to parent
  useImperativeHandle(ref, () => ({
    injectQuestion: (text: string) => {
      setInput(text)
      textareaRef.current?.focus()
    },
  }))

  const messages = session.chat_messages || []

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages, streamingContent])


  // Auto-start with Q1 when chat is empty
  useEffect(() => {
    if (messages.length === 0 && !autoStarted && mode === 'live_capture') {
      setAutoStarted(true)
      startAuditWithQ1()
    }
  }, [messages.length, autoStarted, mode])

  const startAuditWithQ1 = async () => {
    setLoading(true)

    // Add the first AI message
    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: AUDIT_FIRST_QUESTION,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [aiMessage]
    onUpdate({ ...session, chat_messages: updatedMessages })

    // Save to DB
    await supabase
      .from('audit_sessions')
      .update({ chat_messages: updatedMessages } as never)
      .eq('id', sessionId)

    setLoading(false)
  }

  const handleSend = async (content?: string) => {
    const messageContent = content || input.trim()
    if (!messageContent || loading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    }

    // Update local state immediately
    const updatedMessages = [...messages, userMessage]
    onUpdate({ ...session, chat_messages: updatedMessages })

    // Save user message to DB
    await supabase
      .from('audit_sessions')
      .update({ chat_messages: updatedMessages } as never)
      .eq('id', sessionId)

    setInput('')
    setAIFollowUp(null)
    setLoading(true)
    setStreamingContent('')

    try {
      // Prepare messages for AI
      const aiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Stream response
      const response = await fetch('/admin/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: aiMessages,
          sessionId,
        }),
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
              // Add the complete message
              const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString(),
              }
              const finalMessages = [...updatedMessages, aiMessage]
              onUpdate({ ...session, chat_messages: finalMessages })

              // Extract follow-up question if present
              extractFollowUp(fullContent)
            } else {
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullContent += parsed.content
                  setStreamingContent(fullContent)
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  const extractFollowUp = (content: string) => {
    // Look for questions in the AI response (ends with ?)
    const lines = content.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.endsWith('?') && line.length > 10) {
        setAIFollowUp({ question: line, visible: true })
        return
      }
    }
  }

  const saveSkippedQuestion = async (question: string, reason: SkippedQuestion['reason']) => {
    const skipped: SkippedQuestion = {
      question,
      reason,
      timestamp: new Date().toISOString(),
    }
    const existingSkipped = (session.structured_data?.skipped_questions as SkippedQuestion[]) || []
    const updatedSkipped = [...existingSkipped, skipped]

    await supabase
      .from('audit_sessions')
      .update({
        structured_data: {
          ...session.structured_data,
          skipped_questions: updatedSkipped,
        },
      } as never)
      .eq('id', sessionId)

    // Update local session
    onUpdate({
      ...session,
      structured_data: {
        ...session.structured_data,
        skipped_questions: updatedSkipped,
      },
    })
  }

  const handleFollowUpAction = async (action: FollowUpAction) => {
    if (!aiFollowUp) return

    switch (action) {
      case 'answer':
        // Focus the input so user can type their answer
        textareaRef.current?.focus()
        break
      case 'skip':
        await saveSkippedQuestion(aiFollowUp.question, 'skip')
        handleSend('Praleisiu šį klausimą, tęskime toliau.')
        break
      case 'not_relevant':
        await saveSkippedQuestion(aiFollowUp.question, 'not_relevant')
        handleSend('Šis klausimas neaktualus mūsų situacijai.')
        break
      case 'already_discussed':
        await saveSkippedQuestion(aiFollowUp.question, 'already_discussed')
        handleSend('Tai jau aptarėme anksčiau.')
        break
    }
    if (action !== 'answer') {
      setAIFollowUp(null)
    }
  }

  const handleContinue = async () => {
    // Send a signal to continue the audit
    await handleSend('Tęskime auditą.')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isComplete = session.status === 'complete'
  const showControls = !loading && !isComplete && messages.length > 0

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Messages Area - Scrollable, full width */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="px-4 lg:px-6 py-4 space-y-4">
          {/* Loading state for auto-start */}
          {messages.length === 0 && loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-xl px-4 py-3 bg-muted">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id}>
              <div
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] lg:max-w-[75%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center mt-0.5">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Follow-up action chips - show after last AI message */}
              {message.role === 'assistant' &&
               index === messages.length - 1 &&
               aiFollowUp?.visible &&
               !loading &&
               !isComplete && (
                <div className="ml-11 mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">💡 AI klausia: {aiFollowUp.question.slice(0, 80)}{aiFollowUp.question.length > 80 ? '...' : ''}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground"
                      onClick={() => setAIFollowUp(null)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleFollowUpAction('answer')}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Atsakyti
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-muted-foreground"
                      onClick={() => handleFollowUpAction('skip')}
                    >
                      <SkipForward className="h-3 w-3" />
                      Praleisti
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-muted-foreground"
                      onClick={() => handleFollowUpAction('not_relevant')}
                    >
                      <XCircle className="h-3 w-3" />
                      Neaktualu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-muted-foreground"
                      onClick={() => handleFollowUpAction('already_discussed')}
                    >
                      <CheckCheck className="h-3 w-3" />
                      Jau aptarta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[85%] lg:max-w-[75%] rounded-xl px-4 py-3 bg-muted">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{streamingContent}</p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && !streamingContent && messages.length > 0 && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-xl px-4 py-3 bg-muted">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom, always visible */}
      <div className="shrink-0 border-t bg-card/80 backdrop-blur-sm">
        {!isComplete && (
          <div className="p-3 space-y-2">
            {/* Helper buttons - shortcuts, not gates */}
            {showControls && (
              <div className="flex items-center gap-2 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={handleContinue}
                  disabled={loading}
                >
                  <Play className="h-3 w-3" />
                  Tęsti
                </Button>
                {aiFollowUp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-7 text-xs text-primary"
                    onClick={() => {
                      textareaRef.current?.focus()
                    }}
                    disabled={loading}
                  >
                    <Lightbulb className="h-3 w-3" />
                    💡 AI klausimas
                  </Button>
                )}
              </div>
            )}

            {/* Always visible input */}
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'live_capture'
                    ? 'Rašykite atsakymą, klausimą ar komentarą...'
                    : 'Prašykite patikslinti, išplėsti arba pertvarkyti informaciją...'
                }
                className="min-h-[60px] max-h-[150px] resize-none text-sm py-3"
                disabled={loading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-[60px] w-[48px] shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Complete state */}
        {isComplete && (
          <div className="px-4 lg:px-6 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              ✅ Auditas baigtas. Peržiūrėkite rezultatus dešinėje.
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
