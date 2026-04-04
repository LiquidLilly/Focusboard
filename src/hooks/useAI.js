// AI provider abstraction — supports Anthropic and Databricks Model Serving
// All feature code calls callAI() / callAIStream(). Never call provider functions directly.

// ── System prompts ────────────────────────────────────────────────────────────
export const BASE_SYSTEM_PROMPT = `You are an assistant embedded in a personal productivity tool. The user has ADHD and anxiety. They:
- Have thoughts that arrive fast and disappear if not captured immediately
- Struggle to catch implicit expectations and commitments made in meetings
- Experience rejection sensitive dysphoria — criticism can feel like a personal attack even when it isn't
- Work best with clear structure, short lists, and visible progress
- Want to be seen as competent and contributing — this matters to them

Be direct, specific, and calm. Use short bullets over paragraphs. Never be vague.
Surface what they might miss. Never lecture. Never minimize.
The user's name is Wes.`

export const REFLECT_SYSTEM_PROMPT = `The user is processing a difficult work experience. Your role is to help them
see it clearly — not to fix it, not to cheer them up, not to give advice unless
they ask. Follow this structure exactly:
1. One sentence acknowledging what happened, no judgment
2. "What I heard" — separate facts from interpretations neutrally
3. "What might also be true" — one alternative read, offered gently, not insisted on
4. "If anything worth doing" — only if there is a concrete action. If not, omit this section entirely.
Never tell the user how to feel. Never say "but" after acknowledging their experience.
Never minimize. If anything suggests serious distress, gently mention 988.`

// ── Anthropic ─────────────────────────────────────────────────────────────────
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_MODEL   = 'claude-sonnet-4-20250514'

// ── Databricks ────────────────────────────────────────────────────────────────
const DATABRICKS_CONFIG = {
  workspace: 'https://adb-922850896362165.5.azuredatabricks.net',
  models: {
    fast:     'databricks-claude-haiku-4-5',
    default:  'databricks-claude-sonnet-4-6',
    powerful: 'databricks-claude-opus-4-6',
  },
  endpoints: {
    fast:     '/serving-endpoints/databricks-claude-haiku-4-5/invocations',
    default:  '/serving-endpoints/databricks-claude-sonnet-4-6/invocations',
    powerful: '/serving-endpoints/databricks-claude-opus-4-6/invocations',
  },
}

// In-memory token cache — never persisted to localStorage
const _tokenCache = { token: null, expiresAt: 0 }

// ── Settings helpers ──────────────────────────────────────────────────────────

export function getApiKey() {
  try { return JSON.parse(localStorage.getItem('fb_settings') || '{}').apiKey || '' }
  catch { return '' }
}

export function getUserName() {
  try { return JSON.parse(localStorage.getItem('fb_settings') || '{}').userName || 'the user' }
  catch { return 'the user' }
}

function getSettings() {
  try { return JSON.parse(localStorage.getItem('fb_settings') || '{}') }
  catch { return {} }
}

function getProvider() {
  return getSettings().aiProvider || 'anthropic'
}

function getDatabricksSettings() {
  const s = getSettings()
  return s.databricks || {}
}

function systemPrompt() {
  return BASE_SYSTEM_PROMPT
}

// ── Databricks not-configured message ─────────────────────────────────────────
// Returns a structured object the UI renders inline — never throws
const DATABRICKS_NOT_CONFIGURED = {
  _notConfigured: true,
  message: `Databricks AI is not yet configured.

To activate:
• Option A: Add a Personal Access Token in Settings if your account has PATs enabled
• Option B: Request a service principal from your IT/data team and enter the credentials in Settings

Your IT request should ask for: "Service principal with access to Databricks Model Serving endpoints — specifically the Claude Sonnet 4.6, Opus 4.6, and Haiku 4.5 endpoints."`,
}

// ── Databricks OAuth token (service principal) ────────────────────────────────
async function getDatabricksToken() {
  const { clientId, clientSecret, tenantId } = getDatabricksSettings()
  if (!clientId || !clientSecret || !tenantId) return null

  // Return cached token if still valid (with 60s buffer)
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt - 60_000) {
    return _tokenCache.token
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: '2ff814a6-3304-4ab8-85cb-cd0e6f879c1d/.default', // Databricks resource ID
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error_description || `Token error ${res.status}`)
  }

  const data = await res.json()
  _tokenCache.token = data.access_token
  _tokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000
  return _tokenCache.token
}

// Returns the Authorization header value for Databricks, or null if not configured
async function getDatabricksAuthHeader() {
  const { pat } = getDatabricksSettings()

  // PAT takes priority
  if (pat) return `Bearer ${pat}`

  // Try service principal OAuth
  const token = await getDatabricksToken()
  if (token) return `Bearer ${token}`

  return null
}

// ── Databricks non-streaming call ─────────────────────────────────────────────
async function callDatabricks(userMessage, systemOverride = null, model = 'default', maxTokens = 1024) {
  const auth = await getDatabricksAuthHeader()
  if (!auth) return DATABRICKS_NOT_CONFIGURED

  const endpoint = DATABRICKS_CONFIG.workspace + DATABRICKS_CONFIG.endpoints[model]

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemOverride || systemPrompt() },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Databricks error ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Databricks streaming call ─────────────────────────────────────────────────
async function callDatabricksStream(userMessage, onChunk, systemOverride = null, maxTokens = 2048, model = 'default') {
  const auth = await getDatabricksAuthHeader()
  if (!auth) {
    // Simulate a "streamed" not-configured message so callers behave uniformly
    onChunk(DATABRICKS_NOT_CONFIGURED.message, DATABRICKS_NOT_CONFIGURED.message)
    return DATABRICKS_NOT_CONFIGURED.message
  }

  const endpoint = DATABRICKS_CONFIG.workspace + DATABRICKS_CONFIG.endpoints[model]

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemOverride || systemPrompt() },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Databricks error ${res.status}`)
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
      const raw = line.slice(6)
      if (raw === '[DONE]') continue
      try {
        const parsed = JSON.parse(raw)
        const chunk = parsed.choices?.[0]?.delta?.content
        if (chunk) { full += chunk; onChunk(chunk, full) }
      } catch { /* ignore partial JSON */ }
    }
  }

  return full
}

// ── Anthropic non-streaming call ──────────────────────────────────────────────
export async function callClaude(userMessage, systemOverride = null) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
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

// ── Anthropic streaming call ───────────────────────────────────────────────────
export async function callClaudeStream(userMessage, onChunk, systemOverride = null, maxTokens = 2048) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
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
        const chunk = parsed.delta?.text
        if (chunk) { full += chunk; onChunk(chunk, full) }
      } catch { /* ignore partial JSON */ }
    }
  }

  return full
}

// ── Unified callAI() — route to the active provider ──────────────────────────
// All feature code should call this instead of provider functions directly.
export async function callAI(userMessage, systemOverride = null, maxTokens = 1024) {
  const provider = getProvider()

  if (provider === 'databricks') {
    const result = await callDatabricks(userMessage, systemOverride, 'default', maxTokens)
    // Pass through the not-configured sentinel so callers can handle it
    if (result?._notConfigured) return result
    return result
  }

  // Default: Anthropic
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')
  return callClaude(userMessage, systemOverride)
}

// ── Unified callAIStream() — route to the active provider ────────────────────
export async function callAIStream(userMessage, onChunk, systemOverride = null, maxTokens = 2048) {
  const provider = getProvider()

  if (provider === 'databricks') {
    return callDatabricksStream(userMessage, onChunk, systemOverride, maxTokens)
  }

  // Default: Anthropic
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')
  return callClaudeStream(userMessage, onChunk, systemOverride, maxTokens)
}

// ── Test connection ───────────────────────────────────────────────────────────
export async function testApiKey(key) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
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

export async function testDatabricksConnection(overrideSettings = null) {
  // Allow passing in-progress form values before they're saved
  const original = getDatabricksSettings
  if (overrideSettings) {
    // Temporarily use the provided settings for this call
    const auth = await (async () => {
      const { pat, clientId, clientSecret, tenantId } = overrideSettings
      if (pat) return `Bearer ${pat}`
      if (clientId && clientSecret && tenantId) {
        const res = await fetch(
          `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: clientId,
              client_secret: clientSecret,
              scope: '2ff814a6-3304-4ab8-85cb-cd0e6f879c1d/.default',
            }),
          }
        )
        if (!res.ok) throw new Error(`Token error ${res.status}`)
        const data = await res.json()
        return `Bearer ${data.access_token}`
      }
      throw new Error('NO_CREDENTIALS')
    })()

    const endpoint = DATABRICKS_CONFIG.workspace + DATABRICKS_CONFIG.endpoints.default
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message || `Error ${res.status}`)
    }
    return true
  }

  // Use saved settings
  const auth = await getDatabricksAuthHeader()
  if (!auth) throw new Error('NO_CREDENTIALS')

  const endpoint = DATABRICKS_CONFIG.workspace + DATABRICKS_CONFIG.endpoints.default
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': auth },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Error ${res.status}`)
  }
  return true
}

