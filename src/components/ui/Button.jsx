export function Button({ children, onClick, variant = 'default', size = 'md', disabled = false, className = '', type = 'button', ...props }) {
  const base = 'font-mono border inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    default: 'bg-parchment text-charcoal border-warm-gray hover:bg-charcoal hover:text-parchment',
    primary: 'bg-charcoal text-parchment border-charcoal hover:bg-stone-700',
    danger: 'bg-parchment text-red-700 border-red-300 hover:bg-red-700 hover:text-white',
    ghost: 'bg-transparent text-stone-600 border-transparent hover:border-warm-gray hover:bg-parchment',
    amber: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-800 hover:text-white',
  }

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
