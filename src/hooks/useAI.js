// Direct Anthropic Claude API via browser fetch + streaming

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-sonnet-4-20250514'

const BUCKET_NAMES = [
  'Site Startup Support', 'MES/Automation', 'Process School',
  'Supply Chain', 'Data Trending/APR', 'Process Cleaning', 'Contamination Control',
]

export function getApiKey() {
  try { return JSON.parse(localStorage.getItem('fb_settings') || '{}').apiKey || '' }
  catch { return '' }
}

export function getUserName() {
  try { return JSON.parse(localStorage.getItem('fb_settings') || '{}').userName || 'the user' }
  catch { return 'the user' }
}

function systemPrompt() {
  return `You are an assistant embedded in a personal productivity tool. The user has ADHD and anxiety. They:
- Struggle to catch implicit expectations, social commitments, or details said between the lines
- Tend to miss follow-up items not explicitly assigned to them
- Can become overwhelmed by long lists or vague direction
- Need proactive, specific, direct help — not generic advice

Be calm, direct, and specific. Use short bullets over paragraphs. Surface what they might miss. Never be vague.

The user's name is: ${getUserName()}
Their work buckets are: ${BUCKET_NAMES.join(', ')}.`
}

// Non-streaming call
export async function callClaude(userMessage, systemOverride = null) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemOverride || systemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// Streaming call — calls onChunk(chunk, fullSoFar), returns full text
export async function callClaudeStream(userMessage, onChunk, systemOverride = null, maxTokens = 2048) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      system: systemOverride || systemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buf  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        // Anthropic streaming event: content_block_delta
        const chunk = parsed.delta?.text
        if (chunk) { full += chunk; onChunk(chunk, full) }
      } catch { /* ignore partial JSON */ }
    }
  }

  return full
}

// Mindspace "Ask Claude" system prompt
// DO NOT alter this without being explicitly asked — defined per CLAUDE.md
export const MINDSPACE_SYSTEM_PROMPT = `You are a calm, grounded support presence embedded in a personal productivity tool. The user has ADHD and anxiety. They struggle with self-criticism, fear of judgment from authority figures, and a strong desire to be liked and seen as competent.

Your role here is not to be a therapist. You are a supportive thinking partner. When the user shares something difficult:
- Acknowledge what they said before offering any reframe
- Do not be falsely positive or dismissive ("that sounds hard, but look on the bright side!")
- Use DBT-informed language where appropriate: validate, then gently challenge distorted thinking if present
- Be direct but warm. Short paragraphs. No bullet points in emotional responses — prose only.
- If they express something that sounds like a crisis or serious distress, gently suggest they speak with a mental health professional and provide the 988 Suicide and Crisis Lifeline as a resource.
- Never tell them what to feel. Never minimize.`

// Test connection with a minimal request
export async function testApiKey(key) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error ${res.status}`)
  }
  return true
}
