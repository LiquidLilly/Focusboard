import { useState } from 'react'
import useStore from '../../store/useStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { testApiKey } from '../../hooks/useAI'
import { exportAllData, importAllData, clearAllData } from '../../utils/storage'
import { Eye, EyeOff, Download, Upload, Trash2, Check, X, RefreshCw } from 'lucide-react'

export function SettingsView() {
  const { settings, updateSettings } = useStore()
  const [showKey, setShowKey] = useState(false)
  const [keyInput, setKeyInput] = useState(settings.apiKey || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  function maskKey(key) {
    if (!key) return ''
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)
  }

  async function handleTestConnection() {
    if (!keyInput.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      await testApiKey(keyInput.trim())
      setTestResult({ ok: true, message: 'Connection successful!' })
      updateSettings({ apiKey: keyInput.trim() })
    } catch (err) {
      setTestResult({ ok: false, message: err.message })
    } finally {
      setTesting(false)
    }
  }

  function handleSaveKey() {
    updateSettings({ apiKey: keyInput.trim() })
    setTestResult({ ok: true, message: 'API key saved.' })
  }

  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focusboard-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importAllData(ev.target.result)
        window.location.reload()
      } catch (err) {
        alert('Import failed: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  function handleClearAll() {
    if (confirmClear) {
      clearAllData()
      window.location.reload()
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 5000)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 font-mono">
      <div className="max-w-xl mx-auto">
        <h1 className="text-lg font-semibold text-charcoal mb-6">Settings</h1>

        {/* API Key */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-3 border-b border-warm-gray pb-1">Databricks Access Token</h2>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <label className="text-xs text-stone-500 uppercase tracking-wide block mb-1">Personal Access Token</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={e => { setKeyInput(e.target.value); setTestResult(null) }}
                  placeholder="dapi…"
                  className="flex-1 font-mono text-sm border border-warm-gray bg-parchment px-2.5 py-1.5 text-charcoal focus:outline-none focus:border-charcoal"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="border border-warm-gray px-2.5 bg-parchment hover:bg-stone-100 text-stone-500"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {settings.apiKey && !showKey && (
                <p className="text-xs text-stone-400 mt-1">Current: {maskKey(settings.apiKey)}</p>
              )}
            </div>

            {testResult && (
              <div className={`text-xs px-3 py-2 border flex items-center gap-2 ${testResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {testResult.ok ? <Check size={12} /> : <X size={12} />}
                {testResult.message}
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handleSaveKey} disabled={!keyInput.trim()}>
                Save Key
              </Button>
              <Button size="sm" variant="default" onClick={handleTestConnection} disabled={testing || !keyInput.trim()}>
                <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing…' : 'Test Connection'}
              </Button>
            </div>

            <p className="text-xs text-stone-400">
              Your token is stored only in your browser's localStorage and sent only to your Databricks workspace.
              Generate one at: Databricks workspace → top-right avatar → Settings → Developer → Access tokens.
            </p>
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-3 border-b border-warm-gray pb-1">Preferences</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Your Name"
              value={settings.userName || ''}
              onChange={e => updateSettings({ userName: e.target.value })}
              placeholder="Used to personalize AI responses"
            />

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-charcoal">Focus Mode</div>
                <div className="text-xs text-stone-400">Hides all views except Today</div>
              </div>
              <button
                onClick={() => updateSettings({ focusMode: !settings.focusMode })}
                className={`relative w-10 h-5 border transition-colors ${settings.focusMode ? 'bg-charcoal border-charcoal' : 'bg-stone-200 border-stone-300'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-parchment border transition-all ${settings.focusMode ? 'left-[22px] border-charcoal' : 'left-0.5 border-stone-300'}`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-3 border-b border-warm-gray pb-1">Data</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-charcoal">Export Data</div>
                <div className="text-xs text-stone-400">Download all your data as JSON</div>
              </div>
              <Button size="sm" onClick={handleExport}>
                <Download size={12} />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-charcoal">Import Data</div>
                <div className="text-xs text-stone-400">Restore from a JSON export</div>
              </div>
              <label className="font-mono border border-warm-gray bg-parchment text-charcoal hover:bg-charcoal hover:text-parchment px-2.5 py-1 text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload size={12} />
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-charcoal">Clear All Data</div>
                <div className="text-xs text-stone-400">Permanently delete everything</div>
              </div>
              <Button size="sm" variant="danger" onClick={handleClearAll}>
                <Trash2 size={12} />
                {confirmClear ? 'Click again to confirm' : 'Clear All'}
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-3 border-b border-warm-gray pb-1">About</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            FocusBoard is a personal productivity planner with AI features. All data lives in your browser — no accounts, no servers.
            Built with React, Vite, and Claude via Databricks Foundation Model APIs.
          </p>
        </section>
      </div>
    </div>
  )
}
