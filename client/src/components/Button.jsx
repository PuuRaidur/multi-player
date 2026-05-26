import './Button.css'

export default function Button({ variant, className = '', children, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={[variant && `button-${variant}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
