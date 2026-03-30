import useStore from '../store/useStore'

const DATABRICKS_WORKSPACE = 'https://adb-922850896362165.5.azuredatabricks.net'
const MODEL_ENDPOINT = 'databricks-claude-sonnet-4-6'
const API_URL = `${DATABRICKS_WORKSPACE}/serving-endpoints/${MODEL_ENDPOINT}/invocations`

const SYSTEM_PROMPT = `You are a focused productivity assistant for a user who has ADHD and anxiety. They struggle with:
- Missing implicit expectations and social commitments
- Following through on detail-level tasks
- Getting overwhelmed by long lists or vague instructions
- Catching things said between the lines in meetings

Your communication style:
- Direct, calm, and specific — never vague or generic
- Proactive about flagging risks, missing info, and implicit commitments
- Short and structured — use bullets and headers, not walls of text
- Non-judgmental and encouraging — act like a trusted colleague, not a task manager
- When you see potential issues, name them clearly and specifically`

export function getApiKey() {
  try {
    const settings = JSON.parse(localStorage.getItem('focusboard_settings') || '{}')
    return settings.apiKey || ''
  } catch {
    return ''
  }
}

export function getUserName() {
  try {
    const settings = JSON.parse(localStorage.getItem('focusboard_settings') || '{}')
    return settings.userName || 'there'
  } catch {
    return 'there'
  }
}

// Build messages array in OpenAI format (system prompt as first message)
function buildMessages(userMessage, systemOverride) {
  return [
    { role: 'system', content: systemOverride || SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]
}

// Non-streaming call
export async function callClaude(userMessage, systemOverride = null) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: buildMessages(userMessage, systemOverride),
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// Streaming call — calls onChunk with each text delta, returns full text
export async function callClaudeStream(userMessage, onChunk, systemOverride = null, maxTokens = 2048) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: buildMessages(userMessage, systemOverride),
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.message || `API error ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const chunk = parsed.choices?.[0]?.delta?.content
          if (chunk) {
            fullText += chunk
            onChunk(chunk, fullText)
          }
        } catch {
          // ignore parse errors on partial data
        }
      }
    }
  }

  return fullText
}

// Test connection using a minimal request
export async function testApiKey(apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.message || `Error ${response.status}`)
  }
  return true
}
