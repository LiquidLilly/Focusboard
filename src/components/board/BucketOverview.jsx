import useStore from '../../store/useStore'
import { isOverdue } from '../../utils/dates'
import { format, parseISO, differenceInDays } from 'date-fns'

// Derive status from project activity
function deriveStatus(project) {
  const allItems = project.buckets.flatMap(b => b.items)
  if (allItems.length === 0) return 'quiet'

  // BLOCKED: any overdue item not done
  const hasOverdue = allItems.some(i => i.status !== 'done' && isOverdue(i.dueDate))
  if (hasOverdue) return 'blocked'

  // ACTIVE: any item updated in last 7 days
  const recentCutoff = new Date(); recentCutoff.setDate(recentCutoff.getDate() - 7)
  const hasRecent = allItems.some(i => {
    try { return new Date(i.updatedAt) > recentCutoff } catch { return false }
  })
  if (hasRecent) return 'active'

  return 'quiet'
}

function statusConfig(status) {
  switch (status) {
    case 'active':  return { label: 'ACTIVE',   border: 'border-l-[#00fff7]', text: 'text-[#00fff7]',  dot: 'bg-[#00fff7]'  }
    case 'blocked': return { label: 'BLOCKED',  border: 'border-l-[#ffd000]', text: 'text-[#ffd000]',  dot: 'bg-[#ffd000]'  }
    default:        return { label: 'QUIET',    border: 'border-l-[#444466]', text: 'text-[#666688]',  dot: 'bg-[#666688]'  }
  }
}

function getNextSteps(project) {
  // top 3 non-done items from "Next Up" or "In Progress" buckets, else first non-done
  const priority = ['next up', 'in progress', 'to do', 'todo', 'backlog']
  const sorted = [...project.buckets].sort((a, b) => {
    const ai = priority.indexOf(a.name.toLowerCase())
    const bi = priority.indexOf(b.name.toLowerCase())
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  const items = sorted.flatMap(b => b.items.filter(i => i.status !== 'done'))
  return items.slice(0, 3)
}

function getRecentAsks(project) {
  // Most recently created non-done items
  const allItems = project.buckets.flatMap(b => b.items.filter(i => i.status !== 'done'))
  return allItems
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)
}

function lastUpdated(project) {
  const allItems = project.buckets.flatMap(b => b.items)
  if (allItems.length === 0) return null
  const latest = allItems.reduce((max, i) => {
    const d = new Date(i.updatedAt || i.createdAt)
    return d > max ? d : max
  }, new Date(0))
  const days = differenceInDays(new Date(), latest)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function totalItems(project) {
  return project.buckets.reduce((n, b) => n + b.items.length, 0)
}

export function BucketOverview({ onDrillIn }) {
  const { projects } = useStore()

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#cccccc] font-mono text-sm">
        No projects yet. Add one in the sidebar.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#080808] px-6 py-5">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-[#cccccc] uppercase tracking-widest">NEXUS</span>
          <span className="text-[#cccccc]">/</span>
          <span className="text-sm font-bold text-[#ffffff] uppercase tracking-widest">Ops Center</span>
          <span className="text-xs text-[#cccccc] ml-2">Tab or B to return to Brain Dump · Enter to drill in</span>
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {projects.map((project, idx) => {
            const status = deriveStatus(project)
            const sc     = statusConfig(status)
            const next   = getNextSteps(project)
            const recent = getRecentAsks(project)
            const lu     = lastUpdated(project)
            const total  = totalItems(project)

            return (
              <button
                key={project.id}
                onClick={() => onDrillIn(project.id)}
                className={`text-left border-l-4 border border-[#444466] bg-[#111118]
                  hover:border-[#00fff7] hover:shadow-[0_0_12px_#00fff720]
                  transition-all p-0 ${sc.border}
                  focus:outline-none focus:border-[#00fff7]`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-[#444466]">
                  <div>
                    <div className="font-bold text-sm text-[#ffffff] tracking-wide uppercase">{project.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        <span className={`text-xs font-bold ${sc.text}`}>{sc.label}</span>
                      </div>
                      {lu && <span className="text-xs text-[#cccccc]">updated {lu}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-[#cccccc] border border-[#444466] px-2 py-0.5 shrink-0 ml-2">
                    {total} items
                  </span>
                </div>

                {/* NEXT STEPS */}
                <div className="px-4 py-2 border-b border-[#444466]">
                  <div className="text-xs text-[#cccccc] uppercase tracking-wider mb-1.5 font-bold">Next Steps</div>
                  {next.length === 0 ? (
                    <p className="text-xs text-[#cccccc] italic">— no open items</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {next.map(item => (
                        <div key={item.id} className="flex items-start gap-2">
                          <span className="text-[#00fff7] text-xs shrink-0 mt-0.5">›</span>
                          <span className="text-xs text-[#ffffff] font-bold leading-snug truncate">{item.title}</span>
                          {item.priority === 'urgent' && (
                            <span className="text-xs text-[#ff3333] shrink-0 font-bold">!</span>
                          )}
                          {item.priority === 'high' && (
                            <span className="text-xs text-[#ffd000] shrink-0 font-bold">↑</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RECENT ASKS */}
                <div className="px-4 py-2">
                  <div className="text-xs text-[#cccccc] uppercase tracking-wider mb-1.5 font-bold">Recent Asks</div>
                  {recent.length === 0 ? (
                    <p className="text-xs text-[#cccccc] italic">— nothing recent</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {recent.map(item => {
                        const days = differenceInDays(new Date(), new Date(item.createdAt))
                        return (
                          <div key={item.id} className="flex items-start gap-2">
                            <span className="text-[#cccccc] text-xs shrink-0 mt-0.5">·</span>
                            <span className="text-xs text-[#cccccc] leading-snug truncate flex-1">{item.title}</span>
                            <span className="text-xs text-[#cccccc] shrink-0">
                              {days === 0 ? 'today' : days === 1 ? '1d' : `${days}d`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
