export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:      'bg-[#111118] text-[#cccccc] border-[#444466]',
    task:         'bg-[#00fff715] text-[#00fff7] border-[#00fff7]',
    todo:         'bg-[#ff00ff15] text-[#ff00ff] border-[#ff00ff]',
    goal:         'bg-[#ffd00015] text-[#ffd000] border-[#ffd000]',
    low:          'bg-[#111118] text-[#666688] border-[#444466]',
    medium:       'bg-[#00fff715] text-[#00fff7] border-[#00fff7]',
    high:         'bg-[#ffd00015] text-[#ffd000] border-[#ffd000]',
    urgent:       'bg-[#ff333315] text-[#ff3333] border-[#ff3333]',
    backlog:      'bg-[#111118] text-[#cccccc] border-[#444466]',
    'in-progress':'bg-[#00fff715] text-[#00fff7] border-[#00fff7]',
    done:         'bg-[#00ff8815] text-[#00ff88] border-[#00ff88]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold border uppercase ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
