'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

interface SuggestionChipsProps {
  sessionId: string
}

export function SuggestionChips({ sessionId }: SuggestionChipsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/admin/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          analysisType: 'follow_up',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Parse numbered list from response
        const questions = data.content
          .split('\n')
          .filter((line: string) => line.match(/^\d+\./))
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 4)

        setSuggestions(questions)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Find the textarea and set its value
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.value = suggestion
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.focus()
    }
  }

  return (
    <div className="shrink-0 border-t bg-muted/20 px-4 lg:px-6 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          💡 AI siūlomi klausimai
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 px-2 text-xs"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Atnaujinti'
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-3 bg-background/50 hover:bg-background"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.length > 60 ? `${suggestion.slice(0, 60)}...` : suggestion}
            </Button>
          ))
        ) : (
          <span className="text-xs text-muted-foreground py-0.5">
            {loading ? 'Generuojama...' : 'Spauskite Atnaujinti, kad sugeneruoti pasiūlymus'}
          </span>
        )}
      </div>
    </div>
  )
}
