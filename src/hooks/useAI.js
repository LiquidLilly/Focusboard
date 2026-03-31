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
