export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-stone-100 text-stone-600 border-stone-300',
    task: 'bg-blue-50 text-blue-700 border-blue-200',
    todo: 'bg-green-50 text-green-700 border-green-200',
    goal: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-stone-50 text-stone-500 border-stone-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    urgent: 'bg-red-50 text-red-700 border-red-200',
    backlog: 'bg-stone-100 text-stone-600 border-stone-300',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    done: 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono border rounded-full ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
