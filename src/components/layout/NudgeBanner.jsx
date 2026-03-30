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
  }, [settings.apiKey])

  const visible = nudges.filter(n => !dismissed.includes(n.id))
  if (visible.length === 0) return null

  return (
    <div className="bg-[#ffd00015] border-b border-[#ffd000] px-4 py-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Zap size={12} className="text-[#ffd000] shrink-0" />
        <span className="text-xs font-mono text-[#ffd000] uppercase tracking-wide font-bold">Today's nudges</span>
      </div>
      {visible.map(nudge => (
        <div key={nudge.id} className="flex items-start justify-between gap-2">
          <span className="text-xs font-mono text-[#ffd000] font-bold">→ {nudge.text}</span>
          <button
            onClick={() => setDismissed(d => [...d, nudge.id])}
            className="text-[#ffd000] hover:text-[#ffffff] shrink-0 mt-0.5"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
