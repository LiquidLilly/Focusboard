export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:      'bg-[#1a1a2e] text-[#444466] border-[#1e1e3a]',
    task:         'bg-[#00fff710] text-[#00fff7] border-[#00fff730]',
    todo:         'bg-[#ff00ff10] text-[#ff00ff] border-[#ff00ff30]',
    goal:         'bg-[#ffb00010] text-[#ffb000] border-[#ffb00030]',
    low:          'bg-[#1a1a2e] text-[#444466] border-[#1e1e3a]',
    medium:       'bg-[#00fff710] text-[#00fff780] border-[#00fff720]',
    high:         'bg-[#ff00ff10] text-[#ff00ff] border-[#ff00ff30]',
    urgent:       'bg-[#ff202015] text-[#ff2020] border-[#ff202030]',
    backlog:      'bg-[#1a1a2e] text-[#444466] border-[#1e1e3a]',
    'in-progress':'bg-[#00fff710] text-[#00fff7] border-[#00fff730]',
    done:         'bg-[#00ff8810] text-[#00ff88] border-[#00ff8830]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
