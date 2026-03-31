import { useState } from 'react'
import { X, Eye, EyeOff, Download, Upload, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import useStore from '../../store/useStore'
import { testApiKey, testDatabricksConnection } from '../../hooks/useAI'
import { exportAllData, importAllData, clearAllData } from '../../utils/storage'

export default function SettingsPanel() {
  const { settings, updateSettings, setSettingsOpen, showToast } = useStore()

  // Shared
  const [provider, setProvider] = useState(settings.aiProvider || 'anthropic')
  const [userName, setUserName] = useState(settings.userName || '')
  const [clearStep, setClearStep] = useState(0)

  // Anthropic
  const [apiKey, setApiKey]   = useState(settings.apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [testingAnthropic, setTestingAnthropic] = useState(false)
  const [anthropicResult, setAnthropicResult]   = useState(null) // null | 'ok' | 'fail'

  // Databricks
  const db = settings.databricks || {}
  const [pat, setPat]             = useState(db.pat || '')
  const [showPat, setShowPat]     = useState(false)
  const [clientId, setClientId]   = useState(db.clientId || '')
  const [clientSecret, setClientSecret] = useState(db.clientSecret || '')
  const [showSecret, setShowSecret]     = useState(false)
  const [tenantId, setTenantId]   = useState(db.tenantId || '')
  const [pendingIT, setPendingIT] = useState(db.pendingIT || false)
  const [spExpanded, setSpExpanded] = useState(false)
  const [testingDB, setTestingDB] = useState(false)
  const [dbResult, setDbResult]   = useState(null) // null | 'ok' | 'fail' | 'no-creds'

  // Derived status badge for Databricks
  function dbStatus() {
    if (dbResult === 'ok') return 'connected'
    if (pendingIT) return 'pending'
    const hasCreds = pat || (clientId && clientSecret && tenantId)
    if (hasCreds) return 'configured'
    return 'none'
  }

  function save() {
    updateSettings({
      userName,
      apiKey,
      aiProvider: provider,
      databricks: { pat, clientId, clientSecret, tenantId, pendingIT },
    })
    setSettingsOpen(false)
    showToast('Settings saved')
  }

  async function handleTestAnthropic() {
    if (!apiKey) return
    setTestingAnthropic(true); setAnthropicResult(null)
    try {
      await testApiKey(apiKey)
      setAnthropicResult('ok')
    } catch {
      setAnthropicResult('fail')
    } finally {
      setTestingAnthropic(false)
    }
  }

  async function handleTestDatabricks() {
    const hasCreds = pat || (clientId && clientSecret && tenantId)
    if (!hasCreds) { setDbResult('no-creds'); return }
    setTestingDB(true); setDbResult(null)
    try {
      await testDatabricksConnection({ pat, clientId, clientSecret, tenantId })
      setDbResult('ok')
    } catch {
      setDbResult('fail')
    } finally {
      setTestingDB(false)
    }
  }

  function handleExport() {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `focusboard-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importAllData(ev.target.result)
        showToast('Data imported — reload the page')
      } catch {
        showToast('Import failed — invalid file')
      }
    }
    reader.readAsText(file)
  }

  function handleClear() {
    if (clearStep === 0) { setClearStep(1); return }
    clearAllData()
    window.location.reload()
  }

  const status = dbStatus()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && setSettingsOpen(false)}
    >
      <div
        className="relative w-full max-w-lg flex flex-col gap-5 overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: 24,
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Settings</h2>
          <button onClick={() => setSettingsOpen(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Your name */}
        <Field label="Your name">
          <input
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Used to personalise AI prompts"
            style={inputStyle}
          />
        </Field>

        {/* Provider selector */}
        <Field label="AI Provider">
          <div className="flex gap-2">
            <ProviderButton
              active={provider === 'anthropic'}
              onClick={() => setProvider('anthropic')}
              label="Anthropic (personal)"
            />
            <ProviderButton
              active={provider === 'databricks'}
              onClick={() => setProvider('databricks')}
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Databricks (Lilly internal)
                  {provider === 'databricks' && <StatusBadge status={status} />}
                </span>
              }
            />
          </div>
        </Field>

        {/* ── Anthropic section ─────────────────────────────────────────────── */}
        {provider === 'anthropic' && (
          <Field label="Anthropic API Key">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setAnthropicResult(null) }}
                  placeholder="sk-ant-..."
                  style={{ ...inputStyle, paddingRight: 36 }}
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none' }}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={handleTestAnthropic} disabled={!apiKey || testingAnthropic} style={ghostBtnStyle}>
                {testingAnthropic ? '…' : 'Test'}
              </button>
            </div>
            {anthropicResult === 'ok'   && <p style={{ fontSize: 12, color: 'var(--accent-green)', marginTop: 4 }}>✓ Connected</p>}
            {anthropicResult === 'fail' && <p style={{ fontSize: 12, color: 'var(--accent-red)',   marginTop: 4 }}>✗ Connection failed — check key</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Get a key at console.anthropic.com · Stored in localStorage only.
            </p>
          </Field>
        )}

        {/* ── Databricks section ────────────────────────────────────────────── */}
        {provider === 'databricks' && (
          <div className="flex flex-col gap-4">

            {/* Info card */}
            <div style={{
              border: '1px solid var(--accent-orange)',
              borderRadius: 10,
              padding: '14px 16px',
              background: 'rgba(233,168,76,0.06)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Databricks (Lilly Internal)</p>
              <p style={{ marginBottom: 4 }}>
                Workspace: <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>adb-922850896362165.5.azuredatabricks.net</span>
              </p>
              <p style={{ marginBottom: 8 }}>Authentication requires IT approval. Two options:</p>

              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Option A — Personal Access Token</p>
              <p style={{ marginBottom: 8 }}>
                Paste your PAT below if enabled for your account. Generate at:<br />
                Databricks → profile icon → Settings → Developer → Access Tokens
              </p>

              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Option B — Service Principal (recommended)</p>
              <p>
                Request a client ID + secret from your IT/data team.<br />
                Ask for: <em>"Service principal access to Databricks Model Serving endpoints for an internal browser-based tool."</em>
              </p>
            </div>

            {/* Status badge row */}
            <div className="flex items-center gap-3">
              <StatusBadge status={status} large />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pendingIT}
                  onChange={e => setPendingIT(e.target.checked)}
                  style={{ accentColor: 'var(--accent-orange)' }}
                />
                I've submitted an IT request — mark as pending
              </label>
            </div>

            {/* PAT field */}
            <Field label="Personal Access Token (if available)">
              <div className="relative">
                <input
                  type={showPat ? 'text' : 'password'}
                  value={pat}
                  onChange={e => { setPat(e.target.value); setDbResult(null) }}
                  placeholder="dapi..."
                  style={{ ...inputStyle, paddingRight: 36 }}
                />
                <button
                  onClick={() => setShowPat(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none' }}
                >
                  {showPat ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>

            {/* Service principal toggle */}
            <button
              onClick={() => setSpExpanded(v => !v)}
              style={{ ...ghostBtnStyle, justifyContent: 'space-between', width: '100%' }}
            >
              <span>Use Service Principal instead</span>
              {spExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {spExpanded && (
              <div className="flex flex-col gap-3" style={{ paddingLeft: 4 }}>
                <Field label="Client ID">
                  <input
                    value={clientId}
                    onChange={e => { setClientId(e.target.value); setDbResult(null) }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Client Secret">
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={clientSecret}
                      onChange={e => { setClientSecret(e.target.value); setDbResult(null) }}
                      placeholder="your-client-secret"
                      style={{ ...inputStyle, paddingRight: 36 }}
                    />
                    <button
                      onClick={() => setShowSecret(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none' }}
                    >
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>
                <Field label="Tenant ID (Azure)">
                  <input
                    value={tenantId}
                    onChange={e => { setTenantId(e.target.value); setDbResult(null) }}
                    placeholder="your-azure-tenant-id"
                    style={inputStyle}
                  />
                </Field>
              </div>
            )}

            {/* Test connection */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestDatabricks}
                disabled={testingDB}
                style={ghostBtnStyle}
              >
                {testingDB ? '…' : 'Test Connection'}
              </button>
              {dbResult === 'ok'       && <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ Connected</span>}
              {dbResult === 'fail'     && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>✗ Connection failed — check credentials</span>}
              {dbResult === 'no-creds' && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter a PAT or service principal credentials first</span>}
            </div>

          </div>
        )}

        {/* Save */}
        <button onClick={save} style={primaryBtnStyle}>Save settings</button>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

        {/* Data ops */}
        <div className="flex flex-col gap-3">
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>Data</p>
          <div className="flex gap-2">
            <button onClick={handleExport} style={{ ...ghostBtnStyle, flex: 1, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={14} /> Export JSON
            </button>
            <label style={{ ...ghostBtnStyle, flex: 1, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={14} /> Import JSON
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
          <button
            onClick={handleClear}
            onMouseLeave={() => setClearStep(0)}
            style={{ ...ghostBtnStyle, color: clearStep ? 'var(--accent-red)' : undefined, borderColor: clearStep ? 'var(--accent-red)' : undefined }}
          >
            <Trash2 size={14} /> {clearStep ? 'Are you sure? Click again to confirm' : 'Clear all data'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

function ProviderButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '7px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        background: active ? 'rgba(72,185,199,0.1)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {label}
    </button>
  )
}

function StatusBadge({ status, large }) {
  const map = {
    connected:  { label: 'Connected',         color: 'var(--accent-green)',  bg: 'rgba(76,175,130,0.12)' },
    pending:    { label: 'Pending IT approval', color: 'var(--accent-orange)', bg: 'rgba(233,168,76,0.12)' },
    configured: { label: 'Configured',          color: 'var(--accent-primary)', bg: 'rgba(72,185,199,0.10)' },
    none:       { label: 'Not configured',      color: 'var(--text-muted)',    bg: 'rgba(72,79,88,0.2)' },
  }
  const { label, color, bg } = map[status] || map.none
  return (
    <span style={{
      fontSize: large ? 12 : 10,
      fontWeight: 500,
      padding: large ? '3px 8px' : '2px 6px',
      borderRadius: 20,
      color,
      background: bg,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
}

const primaryBtnStyle = {
  padding: '8px 16px', borderRadius: 8, fontWeight: 500, fontSize: 13,
  background: 'var(--accent-primary)', color: '#0d1117',
  border: 'none', cursor: 'pointer',
}

const ghostBtnStyle = {
  padding: '6px 12px', borderRadius: 8, fontWeight: 500, fontSize: 13,
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border-default)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 4,
}
