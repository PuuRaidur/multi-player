import './Button.css'

export default function Button({ text, hook, variant, className = '', children, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={[variant && `button-${variant}`, className].filter(Boolean).join(' ')}
      {...rest}
      onClick={hook}
    >
      {children || text}
    </button>
  )
}
