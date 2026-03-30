const inputBase = 'font-mono text-sm border bg-[#1a1a2e] text-[#e0e0e0] placeholder-[#444466] focus:outline-none focus:border-[#00fff7]'
const inputBorder = 'border-[#1e1e3a]'

export function Input({ label, type = 'text', value, onChange, placeholder, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono text-[#444466] uppercase tracking-wide">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputBase} ${inputBorder} px-2.5 py-1.5`}
        {...props}
      />
    </div>
  )
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono text-[#444466] uppercase tracking-wide">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`${inputBase} ${inputBorder} px-2.5 py-1.5 resize-none`}
        {...props}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono text-[#444466] uppercase tracking-wide">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={`${inputBase} ${inputBorder} px-2.5 py-1.5`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
