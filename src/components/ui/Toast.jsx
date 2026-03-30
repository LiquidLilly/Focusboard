import { useEffect } from 'react'
import useStore from '../../store/useStore'

export function Toast() {
  const { toast, dismissToast } = useStore()

  if (!toast) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-charcoal text-parchment px-4 py-2.5 font-mono text-sm border border-stone-600 shadow-lg">
      <span>{toast.message}</span>
      {toast.undoFn && (
        <button
          onClick={() => { toast.undoFn(); dismissToast() }}
          className="underline hover:no-underline text-amber-300"
        >
          Undo
        </button>
      )}
      <button onClick={dismissToast} className="text-stone-400 hover:text-parchment ml-1">✕</button>
    </div>
  )
}
