import { useState } from 'react'
import { X, Eye, EyeOff, Download, Upload, Trash2, CheckCircle } from 'lucide-react'
import useStore from '../../store/useStore'
import { testApiKey } from '../../hooks/useAI'
import { exportAllData, importAllData, clearAllData } from '../../utils/storage'

export default function SettingsPanel() {
  const { settings, updateSettings, setSettingsOpen, showToast } = useStore()
  const [apiKey, setApiKey]       = useState(settings.apiKey || '')
  const [userName, setUserName]   = useState(settings.userName || '')
  const [showKey, setShowKey]     = useState(false)
  const [testing, setTesting]     = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'ok' | 'fail'
  const [clearStep, setClearStep]   = useState(0)

  function save() {
    updateSettings({ apiKey, userName })
    setSettingsOpen(false)
    showToast('Settings saved')
  }

  async function handleTest() {
    if (!apiKey) return
    setTesting(true); setTestResult(null)
    try {
      await testApiKey(apiKey)
      setTestResult('ok')
    } catch {
      setTestResult('fail')
    } finally {
      setTesting(false)
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && setSettingsOpen(false)}
    >
      <div
        className="relative w-full max-w-md p-6 flex flex-col gap-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16 }}
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

        {/* API key */}
        <Field label="Anthropic API key">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setTestResult(null) }}
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
            <button onClick={handleTest} disabled={!apiKey || testing} style={ghostBtnStyle}>
              {testing ? '…' : 'Test'}
            </button>
          </div>
          {testResult === 'ok'   && <p style={{ fontSize: 12, color: 'var(--accent-green)', marginTop: 4 }}>✓ Connected</p>}
          {testResult === 'fail' && <p style={{ fontSize: 12, color: 'var(--accent-red)',   marginTop: 4 }}>✗ Connection failed — check key</p>}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Key is stored in localStorage only. Never sent anywhere except api.anthropic.com.
          </p>
        </Field>

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

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

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
