import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export type TaskType =
  | 'live_summary'
  | 'top_processes'
  | 'pilot_ideas'
  | 'roi_estimate'
  | 'deep_analysis'
  | 'technical_plan'
  | 'proposal_draft'
  | 'section_regen'
  | 'follow_up_questions'

export type Provider = 'openai' | 'claude'

const TASK_ROUTING: Record<TaskType, Provider> = {
  live_summary: 'openai',
  top_processes: 'openai',
  pilot_ideas: 'openai',
  roi_estimate: 'openai',
  follow_up_questions: 'openai',
  deep_analysis: 'claude',
  technical_plan: 'claude',
  proposal_draft: 'claude',
  section_regen: 'claude',
}

const OPENAI_MODEL = 'gpt-4o'
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

let openaiClient: OpenAI | null = null
let claudeClient: Anthropic | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

function getClaude(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return claudeClient
}

export interface AIRequest {
  taskType: TaskType
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  systemPrompt?: string
}

export interface AIResponse {
  content: string
  provider: Provider
  model: string
}

export async function routeAIRequest(request: AIRequest): Promise<AIResponse> {
  const provider = TASK_ROUTING[request.taskType]

  try {
    if (provider === 'openai') {
      return await callOpenAI(request)
    } else {
      return await callClaude(request)
    }
  } catch (error) {
    console.error(`Primary provider ${provider} failed, trying fallback:`, error)

    // Fallback to the other provider
    const fallbackProvider = provider === 'openai' ? 'claude' : 'openai'

    if (fallbackProvider === 'openai') {
      return await callOpenAI(request)
    } else {
      return await callClaude(request)
    }
  }
}

async function callOpenAI(request: AIRequest): Promise<AIResponse> {
  const openai = getOpenAI()

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt })
  }

  for (const msg of request.messages) {
    if (msg.role === 'system') {
      messages.push({ role: 'system', content: msg.content })
    } else if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content })
    } else {
      messages.push({ role: 'assistant', content: msg.content })
    }
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  })

  return {
    content: response.choices[0]?.message?.content || '',
    provider: 'openai',
    model: OPENAI_MODEL,
  }
}

async function callClaude(request: AIRequest): Promise<AIResponse> {
  const claude = getClaude()

  const messages: Anthropic.MessageParam[] = request.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const systemPrompt =
    request.systemPrompt ||
    request.messages.find((m) => m.role === 'system')?.content

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  const content = textBlock && textBlock.type === 'text' ? textBlock.text : ''

  return {
    content,
    provider: 'claude',
    model: CLAUDE_MODEL,
  }
}

// Streaming version for chat
export async function* streamAIResponse(
  request: AIRequest
): AsyncGenerator<string, void, unknown> {
  const provider = TASK_ROUTING[request.taskType]

  if (provider === 'openai') {
    yield* streamOpenAI(request)
  } else {
    yield* streamClaude(request)
  }
}

async function* streamOpenAI(
  request: AIRequest
): AsyncGenerator<string, void, unknown> {
  const openai = getOpenAI()

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt })
  }

  for (const msg of request.messages) {
    if (msg.role === 'system') {
      messages.push({ role: 'system', content: msg.content })
    } else if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content })
    } else {
      messages.push({ role: 'assistant', content: msg.content })
    }
  }

  const stream = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

async function* streamClaude(
  request: AIRequest
): AsyncGenerator<string, void, unknown> {
  const claude = getClaude()

  const messages: Anthropic.MessageParam[] = request.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const systemPrompt =
    request.systemPrompt ||
    request.messages.find((m) => m.role === 'system')?.content

  const stream = claude.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}
