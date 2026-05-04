// src/components/Button.jsx
export default function Button({
  children,
  variant = 'gradient',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseClasses = 'inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'

  const variants = {
    gradient: 'bg-gradient-to-r from-da-cyan to-da-gold text-da-dark hover:opacity-95 hover:shadow-xl hover:shadow-da-cyan/20',
    primary: 'bg-da-cyan text-da-dark hover:opacity-90',
    secondary: 'bg-da-gold text-da-dark hover:opacity-90',
    outline: 'border-2 border-da-cyan/40 text-da-cyan hover:bg-da-cyan hover:text-da-dark hover:border-da-cyan',
    dark: 'bg-da-darker text-white border border-white/20 hover:border-da-cyan',
  }

  const sizes = {
    sm: 'px-5 py-2.5 text-xs',
    md: 'px-7 py-3.5 text-sm',
    lg: 'px-10 py-4 text-base',
    xl: 'px-12 py-5 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
