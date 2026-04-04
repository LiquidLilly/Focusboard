import { useState } from 'react'
import { X, Eye, EyeOff, Download, Upload, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import useStore from '../../store/useStore'
import { testApiKey, testDatabricksConnection } from '../../hooks/useAI'
import { exportAllData, importAllData, clearAllData } from '../../utils/storage'

export default function SettingsPanel() {
  const { settings, updateSettings, setSettingsOpen, showToast } = useStore()

  const [provider, setProvider]   = useState(settings.aiProvider || 'databricks')
  const [userName, setUserName]   = useState(settings.userName || 'Wes')
  const [clearStep, setClearStep] = useState(0)

  // Anthropic
  const [apiKey, setApiKey]     = useState(settings.apiKey || '')
  const [showKey, setShowKey]   = useState(false)
  const [testingAnthropic, setTestingAnthropic] = useState(false)
  const [anthropicResult, setAnthropicResult]   = useState(null)

  // Databricks
  const db = settings.databricks || {}
  const [pat, setPat]                       = useState(db.pat || '')
  const [showPat, setShowPat]               = useState(false)
  const [clientId, setClientId]             = useState(db.clientId || '')
  const [clientSecret, setClientSecret]     = useState(db.clientSecret || '')
  const [showSecret, setShowSecret]         = useState(false)
  const [tenantId, setTenantId]             = useState(db.tenantId || '')
  const [spExpanded, setSpExpanded]         = useState(false)
  const [testingDB, setTestingDB]           = useState(false)
  const [dbResult, setDbResult]             = useState(null)

  function dbStatus() {
    if (dbResult === 'ok') return 'connected'
    const hasCreds = pat || (clientId && clientSecret && tenantId)
    if (hasCreds) return 'configured'
    return 'none'
  }

  function save() {
    updateSettings({
      userName,
      apiKey,
      aiProvider: provider,
      databricks: { pat, clientId, clientSecret, tenantId },
    })
    setSettingsOpen(false)
    showToast('Settings saved')
  }

  async function testAnthropic() {
    setTestingAnthropic(true)
    setAnthropicResult(null)
    try {
      await testApiKey(apiKey)
      setAnthropicResult('ok')
    } catch {
      setAnthropicResult('fail')
    } finally {
      setTestingAnthropic(false)
    }
  }

  async function testDatabricks() {
    setTestingDB(true)
    setDbResult(null)
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
    a.href     = url
    a.download = `focusboard-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Data exported')
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importAllData(ev.target.result)
        showToast('Data imported — refresh to see changes')
      } catch {
        showToast('Import failed — invalid file')
      }
    }
    reader.readAsText(file)
  }

  function handleClear() {
    if (clearStep < 1) { setClearStep(1); return }
    clearAllData()
    window.location.reload()
  }

  const STATUS_COLORS = {
    connected: 'var(--accent-green)',
    configured: 'var(--accent-warm)',
    none: 'var(--text-muted)',
  }

  return (
    // Backdrop
    <div
      onClick={() => setSettingsOpen(false)}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,17,23,0.6)',
        zIndex: 800,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, height: '100vh', overflowY: 'auto',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Settings</span>
          <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* User name */}
          <Section label="Your name">
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Wes"
              style={inputStyle}
            />
          </Section>

          {/* AI Provider */}
          <Section label="AI Provider">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['databricks', 'anthropic'].map(p => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  style={{
                    flex: 1, padding: '7px 14px', borderRadius: 8, fontSize: 13,
                    background: provider === p ? 'rgba(91,156,246,0.15)' : 'var(--bg-raised)',
                    color: provider === p ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${provider === p ? 'rgba(91,156,246,0.35)' : 'var(--border-default)'}`,
                    cursor: 'pointer', fontWeight: provider === p ? 500 : 400,
                    textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Anthropic config */}
            {provider === 'anthropic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    style={{ ...inputStyle, paddingRight: 40 }}
                  />
                  <button onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={testAnthropic} disabled={!apiKey || testingAnthropic} style={testBtnStyle}>
                    {testingAnthropic ? 'Testing…' : 'Test connection'}
                  </button>
                  {anthropicResult === 'ok'   && <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ Connected</span>}
                  {anthropicResult === 'fail' && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>✗ Failed</span>}
                </div>
              </div>
            )}

            {/* Databricks config */}
            {provider === 'databricks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: STATUS_COLORS[dbStatus()] }}>
                    {dbStatus() === 'connected' ? '✓ Connected' : dbStatus() === 'configured' ? '○ Configured' : '— Not configured'}
                  </span>
                </div>

                {/* PAT */}
                <label style={labelStyle}>Personal Access Token</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPat ? 'text' : 'password'}
                    value={pat}
                    onChange={e => setPat(e.target.value)}
                    placeholder="dapi..."
                    style={{ ...inputStyle, paddingRight: 40 }}
                  />
                  <button onClick={() => setShowPat(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                    {showPat ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Service principal (expandable) */}
                <button
                  onClick={() => setSpExpanded(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  {spExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  Service Principal (OAuth)
                </button>

                {spExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16, borderLeft: '2px solid var(--border-default)' }}>
                    <FieldRow label="Client ID">
                      <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxxxx-..." style={inputStyle} />
                    </FieldRow>
                    <FieldRow label="Client Secret">
                      <div style={{ position: 'relative' }}>
                        <input type={showSecret ? 'text' : 'password'} value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="secret" style={{ ...inputStyle, paddingRight: 40 }} />
                        <button onClick={() => setShowSecret(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                          {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </FieldRow>
                    <FieldRow label="Tenant ID">
                      <input value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="xxxxxxxx-..." style={inputStyle} />
                    </FieldRow>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={testDatabricks} disabled={testingDB || (!pat && !clientId)} style={testBtnStyle}>
                    {testingDB ? 'Testing…' : 'Test connection'}
                  </button>
                  {dbResult === 'ok'   && <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ Connected</span>}
                  {dbResult === 'fail' && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>✗ Failed — check credentials</span>}
                </div>
              </div>
            )}
          </Section>

          {/* Data management */}
          <Section label="Data">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Export */}
              <button onClick={handleExport} style={dataBtnStyle}>
                <Download size={13} /> Export all data
              </button>

              {/* Import */}
              <label style={{ ...dataBtnStyle, cursor: 'pointer' }}>
                <Upload size={13} /> Import from file
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>

              {/* Clear */}
              {clearStep === 0 ? (
                <button onClick={handleClear} style={{ ...dataBtnStyle, color: 'var(--accent-red)', borderColor: 'rgba(224,92,92,0.3)' }}>
                  <Trash2 size={13} /> Clear all data
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--accent-red)', margin: 0 }}>This will delete everything. Are you sure?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleClear} style={{ flex: 1, padding: '6px', background: 'var(--accent-red)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Yes, clear everything</button>
                    <button onClick={() => setClearStep(0)} style={{ flex: 1, padding: '6px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </Section>

        </div>

        {/* Footer — Save */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={save}
            style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const testBtnStyle = {
  padding: '5px 12px', fontSize: 12,
  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer',
}

const dataBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 14px', fontSize: 13,
  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer',
}
