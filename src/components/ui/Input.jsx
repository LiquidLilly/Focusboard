const inputBase = 'font-mono font-bold text-sm border bg-[#111118] text-[#ffffff] placeholder-[#666688] focus:outline-none focus:border-[#00fff7]'
const inputBorder = 'border-[#444466]'

export function Input({ label, type = 'text', value, onChange, placeholder, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono font-bold text-[#cccccc] uppercase tracking-wide">{label}</label>}
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
      {label && <label className="text-xs font-mono font-bold text-[#cccccc] uppercase tracking-wide">{label}</label>}
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
      {label && <label className="text-xs font-mono font-bold text-[#cccccc] uppercase tracking-wide">{label}</label>}
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
