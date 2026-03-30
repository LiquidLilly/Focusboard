import useStore from '../../store/useStore'

export function Toast() {
  const { toast, dismissToast } = useStore()

  if (!toast) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                    bg-[#111118] text-[#ffffff] px-4 py-2.5 font-mono text-sm font-bold
                    border border-[#00fff7] shadow-[0_0_16px_#00fff730]">
      <span>{toast.message}</span>
      {toast.undoFn && (
        <button
          onClick={() => { toast.undoFn(); dismissToast() }}
          className="underline hover:no-underline text-[#00fff7]"
        >
          Undo
        </button>
      )}
      <button onClick={dismissToast} className="text-[#cccccc] hover:text-[#ffffff] ml-1">✕</button>
    </div>
  )
}
