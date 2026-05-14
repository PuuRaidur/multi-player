export default function Button({ text, hook, variant = 'primary' }) {
  return (
    <button 
      onClick={hook}
      type="button"
      className={`button-${variant}`}
    >
      {text}
    </button>
  )
}