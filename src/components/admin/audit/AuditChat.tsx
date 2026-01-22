'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, User, Bot } from 'lucide-react'
import type { AuditSession, AuditMode, ChatMessage } from '@/types/database'

interface AuditChatProps {
  sessionId: string
  session: AuditSession
  onUpdate: (session: AuditSession) => void
  mode: AuditMode
}

export function AuditChat({ sessionId, session, onUpdate, mode }: AuditChatProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const messages = session.chat_messages || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Initial prompt for empty chat */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">Start the Audit</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {mode === 'live_capture'
                  ? "Describe the client's business and main processes. I'll help identify automation opportunities."
                  : 'Review and refine the captured information. Ask me to clarify or expand on any points.'}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                <p className="whitespace-pre-wrap text-sm">{streamingContent}</p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && !streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 bg-card">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'live_capture'
                ? "Describe the client's processes, pain points, or ask a question..."
                : 'Ask to clarify, expand, or refine any information...'
            }
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={loading || session.status === 'complete'}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading || session.status === 'complete'}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
