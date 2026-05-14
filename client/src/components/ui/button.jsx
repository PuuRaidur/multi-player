export default function Button({ text, onClick, disabled = false, variant = 'primary' }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      type="button"
      className={`button button-${variant}`}
    >
      {text}
    </button>
  )
}