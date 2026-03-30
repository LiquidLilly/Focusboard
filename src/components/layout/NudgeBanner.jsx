import { useEffect, useState } from 'react'
import useStore from '../../store/useStore'
import { generateNudges } from '../../hooks/useNudges'
import { X, Zap } from 'lucide-react'

export function NudgeBanner() {
  const { projects, settings } = useStore()
  const [nudges, setNudges] = useState([])
  const [dismissed, setDismissed] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!settings.apiKey) return
    setLoading(true)
    generateNudges(projects)
      .then(n => setNudges(n))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [settings.apiKey]) // Only on mount / key change

  const visible = nudges.filter(n => !dismissed.includes(n.id))

  if (visible.length === 0) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Zap size={12} className="text-amber-600 shrink-0" />
        <span className="text-xs font-mono text-amber-700 uppercase tracking-wide font-semibold">Today's nudges</span>
      </div>
      {visible.map(nudge => (
        <div key={nudge.id} className="flex items-start justify-between gap-2">
          <span className="text-xs font-mono text-amber-800">→ {nudge.text}</span>
          <button
            onClick={() => setDismissed(d => [...d, nudge.id])}
            className="text-amber-400 hover:text-amber-700 shrink-0 mt-0.5"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
