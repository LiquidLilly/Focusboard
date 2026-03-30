import useStore from '../../store/useStore'

export function Toast() {
  const { toast, dismissToast } = useStore()

  if (!toast) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                    bg-[#1a1a2e] text-[#e0e0e0] px-4 py-2.5 font-mono text-sm
                    border border-[#00fff730] shadow-[0_0_16px_#00fff720]">
      <span>{toast.message}</span>
      {toast.undoFn && (
        <button
          onClick={() => { toast.undoFn(); dismissToast() }}
          className="underline hover:no-underline text-[#00fff7]"
        >
          Undo
        </button>
      )}
      <button onClick={dismissToast} className="text-[#444466] hover:text-[#e0e0e0] ml-1">✕</button>
    </div>
  )
}
